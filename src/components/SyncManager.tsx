import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '~/lib/supabase';
import { syncAllEntries, upsertEntry, pullRemoteEntries } from '~/util/diarySync';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { mergeRemoteEntries, selectEntries, type DiaryEntry } from '~/store/slices/diarySlice';
import { selectSettings, setCloudSync, setLastSyncedAt } from '~/store/slices/settingsSlice';

/**
 * SyncManager — rendered once inside the Redux Provider.
 *
 * Behavior contract (matching the user's spec):
 *   • Local data is ALWAYS the source of truth.
 *   • On login / first mount with sync enabled: pull every remote
 *     entry the user owns, merge into local using local-wins rules
 *     (so we only ADD entries that exist online but not on this
 *     device — we never overwrite anything local). Then push every
 *     local entry up so the cloud reflects the device.
 *   • Whenever a local entry changes: upsert just that entry (per-day,
 *     never the whole pile) so different days never get mixed up
 *     server-side. Pushes are debounced to avoid hammering the API
 *     during typing.
 *   • On app foreground: re-run the same reconcile so we catch any
 *     remote changes from another device.
 *   • Offline-first: while there is no network, all writes stay in
 *     Redux/AsyncStorage and dirty entries pile up locally. As soon as
 *     connectivity returns we flush every dirty entry to Supabase and
 *     run a reconcile so the cloud catches up cleanly.
 */

const isStateOnline = (s: NetInfoState | null): boolean => {
  if (!s) return false;
  if (s.isConnected === false) return false;
  // isInternetReachable can be null on some platforms before the first
  // probe completes — treat null as "probably online" so we don't sit
  // idle forever if the probe never resolves.
  return s.isInternetReachable !== false;
};
export default function SyncManager() {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectEntries);
  const { cloudSyncEnabled } = useAppSelector(selectSettings);

  const sessionRef = useRef<Session | null>(null);
  const isReconcilingRef = useRef(false);
  // Track last-pushed updatedAt per entry id so we only push when
  // something actually changed.
  const lastPushedRef = useRef<Record<string, string>>({});
  // Debounce timer for per-entry pushes.
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest snapshot of entries — kept in a ref so async handlers (NetInfo
  // online transition, AppState foreground) always read the freshest list
  // without us having to put `entries` in their dep arrays.
  const entriesRef = useRef<DiaryEntry[]>(entries ?? []);
  useEffect(() => {
    entriesRef.current = entries ?? [];
  }, [entries]);
  // Network connectivity tracking. We assume online at boot to avoid
  // false negatives, then NetInfo corrects us on its first event.
  const isOnlineRef = useRef<boolean>(true);

  // Keep sessionRef up to date so handlers always see the latest user.
  useEffect(() => {
    const initSession = async () => {
      try {
        const online = await isStateOnline(await NetInfo.fetch());
        if (!online) return;

        const {
          data: { session },
        } = await supabase.auth.getSession();
        sessionRef.current = session;
        if (session?.user?.id && cloudSyncEnabled) {
          runReconcile();
        }
      } catch {
        // Ignore transient network/auth errors while offline or during startup
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const wasLoggedIn = !!sessionRef.current?.user?.id;
      sessionRef.current = session;
      const isLoggedIn = !!session?.user?.id;
      if (!wasLoggedIn && isLoggedIn && cloudSyncEnabled) {
        runReconcile();
      }
      if (!isLoggedIn) {
        lastPushedRef.current = {};
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Full reconcile: pull remote, merge into local (local wins), then
   * push every local entry up. Used on login, mount, app foreground,
   * and when connectivity returns after an offline stretch.
   */
  const runReconcile = useCallback(async () => {
    if (isReconcilingRef.current) return;
    if (!cloudSyncEnabled) return;
    if (!isOnlineRef.current) return; // skip silently while offline
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;

    isReconcilingRef.current = true;
    try {
      let remote: DiaryEntry[] = [];
      try {
        remote = await pullRemoteEntries(userId);
      } catch (err) {
        console.warn('SyncManager: pull failed', err);
      }

      // Merge into local. The reducer skips any remote entry that
      // collides (by id OR by date) with something already local —
      // local always wins.
      if (remote.length > 0) {
        dispatch(mergeRemoteEntries(remote));
      }

      // Push every local entry so the cloud is up-to-date with the
      // device. Each entry is its own upsert so days stay isolated.
      const local = entriesRef.current;
      if (local.length > 0) {
        const { synced, failed } = await syncAllEntries(local, userId);
        for (const e of local) {
          if (e.updatedAt) lastPushedRef.current[e.id] = e.updatedAt;
        }
        if (synced > 0) {
          dispatch(setLastSyncedAt(new Date().toISOString()));
        }
        if (failed > 0) {
          console.warn(`SyncManager: ${failed} entries failed to sync.`);
        }
      }
    } catch (err) {
      console.warn('SyncManager: reconcile error', err);
    } finally {
      isReconcilingRef.current = false;
    }
  }, [cloudSyncEnabled, dispatch]);

  /**
   * Push only the entries whose `updatedAt` is ahead of what we last
   * pushed. Used by both the per-entry debounce and the on-reconnect
   * flush so they share the exact same "what's dirty?" definition.
   */
  const flushDirtyEntries = useCallback(async () => {
    if (!cloudSyncEnabled) return;
    if (!isOnlineRef.current) return;
    const userId = sessionRef.current?.user?.id;
    if (!userId) return;

    const local = entriesRef.current;
    const dirty = local.filter((e) => e.updatedAt && lastPushedRef.current[e.id] !== e.updatedAt);
    if (dirty.length === 0) return;

    let anySynced = false;
    for (const e of dirty) {
      try {
        await upsertEntry(e, userId);
        if (e.updatedAt) lastPushedRef.current[e.id] = e.updatedAt;
        anySynced = true;
      } catch (err) {
        // Network may have dropped mid-flush; bail and let the next
        // online/foreground tick retry the rest.
        console.warn('SyncManager: per-entry push failed', err);
        break;
      }
    }
    if (anySynced) {
      dispatch(setLastSyncedAt(new Date().toISOString()));
    }
  }, [cloudSyncEnabled, dispatch]);

  // First-mount reconcile (after the saved session is read above).
  useEffect(() => {
    if (cloudSyncEnabled && sessionRef.current?.user?.id) {
      runReconcile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudSyncEnabled]);

  // Per-entry push: whenever the local `entries` list changes, debounce
  // briefly then flush whatever is dirty. While offline this is a no-op
  // (flushDirtyEntries early-returns) so the data just sits safely in
  // Redux/AsyncStorage until connectivity returns.
  useEffect(() => {
    if (!cloudSyncEnabled) return;
    if (!entries || entries.length === 0) return;

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      flushDirtyEntries();
    }, 1500);

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [entries, cloudSyncEnabled, flushDirtyEntries]);

  // Foreground reconcile: pull-merge-push when the app becomes active.
  useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        runReconcile();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [runReconcile]);

  // Network connectivity: keep `isOnlineRef` accurate and, on every
  // offline -> online transition, flush any locally pending edits and
  // run a reconcile so we catch up with anything that happened while
  // we were dark.
  useEffect(() => {
    NetInfo.fetch().then((state) => {
      const nextOnline = isStateOnline(state);
      isOnlineRef.current = nextOnline;

      if (!nextOnline && cloudSyncEnabled) {
        dispatch(setCloudSync(false));
      }
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const nextOnline = isStateOnline(state);
      const wasOnline = isOnlineRef.current;
      isOnlineRef.current = nextOnline;

      if (!nextOnline && cloudSyncEnabled) {
        dispatch(setCloudSync(false));
        return;
      }

      if (!wasOnline && nextOnline) {
        // Just came back online — drain pending writes first so the
        // cloud reflects local edits, then pull anything new.
        (async () => {
          await flushDirtyEntries();
          await runReconcile();
        })();
      }
    });

    return () => unsubscribe();
  }, [cloudSyncEnabled, dispatch, flushDirtyEntries, runReconcile]);

  return null;
}
