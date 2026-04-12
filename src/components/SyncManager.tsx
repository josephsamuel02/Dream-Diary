import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '~/lib/supabase';
import { syncAllEntries } from '~/util/diarySync';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { selectEntries } from '~/store/slices/diarySlice';
import { selectSettings, setLastSyncedAt } from '~/store/slices/settingsSlice';

/**
 * SyncManager — rendered once inside the Redux Provider.
 *
 * Responsibilities:
 *  1. Listen to AppState: whenever the app comes to the foreground,
 *     attempt to flush any unsynced entries to Supabase.
 *  2. Run the same sync on first mount (handles entries written offline
 *     before the user opened the app).
 *
 * This component renders nothing — it is purely a side-effect manager.
 */
export default function SyncManager() {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectEntries);
  const { cloudSyncEnabled } = useAppSelector(selectSettings);

  const sessionRef = useRef<Session | null>(null);
  const isSyncingRef = useRef(false);

  // Keep sessionRef up to date so the AppState handler always has the latest session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      sessionRef.current = session;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      sessionRef.current = session;
    });

    return () => subscription.unsubscribe();
  }, []);

  const runSync = async () => {
    if (isSyncingRef.current) return;
    if (!cloudSyncEnabled) return;
    if (!sessionRef.current?.user?.id) return;
    if (!entries || entries.length === 0) return;

    isSyncingRef.current = true;
    try {
      const { synced, failed } = await syncAllEntries(entries, sessionRef.current.user.id);
      if (synced > 0) {
        dispatch(setLastSyncedAt(new Date().toISOString()));
      }
      if (failed > 0) {
        console.warn(`SyncManager: ${failed} entries failed to sync.`);
      }
    } catch (err) {
      console.warn('SyncManager: sync error', err);
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Sync on mount
  useEffect(() => {
    runSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudSyncEnabled]);

  // Sync whenever app comes back to the foreground
  useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        runSync();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, cloudSyncEnabled]);

  return null;
}
