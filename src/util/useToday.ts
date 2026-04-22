import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getLocalDateYYYYMMDD, msUntilNextMidnight } from './dateUtils';

/**
 * React hook that always returns the current LOCAL date as 'YYYY-MM-DD'.
 *
 * Unlike `getLocalDateYYYYMMDD()` (which is a snapshot), this hook
 * re-renders the consumer at local midnight AND whenever the app
 * returns to the foreground — so components never hold onto a
 * stale "today" value when the user keeps the app open overnight.
 */
export function useToday(): string {
  const [today, setToday] = useState<string>(() => getLocalDateYYYYMMDD());

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleMidnightTick = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setToday(getLocalDateYYYYMMDD());
        scheduleMidnightTick();
      }, msUntilNextMidnight());
    };

    scheduleMidnightTick();

    const handleAppState = (status: AppStateStatus) => {
      if (status !== 'active') return;
      const current = getLocalDateYYYYMMDD();
      setToday((prev) => (prev === current ? prev : current));
      scheduleMidnightTick();
    };

    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      sub.remove();
    };
  }, []);

  return today;
}
