import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useAppDispatch } from '~/store/hooks';
import { store } from '~/store/store';
import { ensureTodayEntry } from '~/util/ensureTodayEntry';
import { msUntilNextMidnight } from '~/util/dateUtils';

/**
 * DailyEntryManager — invisible side-effect component.
 *
 * Guarantees that there is always exactly one entry for "today" in
 * the local store, by:
 *   1. Ensuring it on mount (covers cold starts).
 *   2. Ensuring it whenever the app comes back to the foreground
 *      (covers the user returning to the app on a new day after the
 *      app was suspended).
 *   3. Scheduling a timer that fires shortly after local midnight
 *      and creates the new day's entry automatically. The timer
 *      reschedules itself for the following midnight after firing.
 *
 * This is what makes "every day at 12am a fresh, separate entry is
 * created" actually happen — instead of relying on the user tapping
 * the FAB.
 */
export default function DailyEntryManager() {
  const dispatch = useAppDispatch();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 1. Make sure today's entry exists right now.
    ensureTodayEntry(store.getState, dispatch);

    // 2. Schedule the midnight rollover. After it fires we reschedule
    //    so the chain continues for as long as the app stays alive.
    const scheduleMidnight = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        ensureTodayEntry(store.getState, dispatch);
        scheduleMidnight();
      }, msUntilNextMidnight());
    };
    scheduleMidnight();

    // 3. Catch the case where the OS suspended the app across
    //    midnight (so the setTimeout never fired) — the next time
    //    the app becomes active, double-check today's entry exists
    //    and reset the midnight timer.
    const handleAppState = (status: AppStateStatus) => {
      if (status !== 'active') return;
      ensureTodayEntry(store.getState, dispatch);
      scheduleMidnight();
    };
    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      sub.remove();
    };
  }, [dispatch]);

  return null;
}
