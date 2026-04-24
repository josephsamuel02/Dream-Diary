import type { AppDispatch, RootState } from '~/store/store';
import { addEntry } from '~/store/slices/diarySlice';
import { getLocalDateYYYYMMDD } from './dateUtils';

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Guarantees that an entry exists for the given date (default: today).
 *
 * - If an entry already exists for that date, returns its id.
 * - Otherwise creates a new empty entry for that date and returns
 *   the new id.
 *
 * This is the single source of truth for "get or create the entry
 * for this day". Every caller that used to check/create a
 * per-day entry should go through this helper so we never end up
 * with two entries for the same date OR edits pointing at a ghost
 * id.
 */
export function ensureEntryForDate(
  getState: () => RootState,
  dispatch: AppDispatch,
  date: string = getLocalDateYYYYMMDD()
): string {
  const existing = getState().diary.entries?.find((e) => e.date === date);
  if (existing) return existing.id;

  const id = genId();
  dispatch(addEntry({ id, date, title: '' }));
  return id;
}

/**
 * Convenience wrapper that always resolves "today" at call time so
 * the date is never stale.
 */
export function ensureTodayEntry(
  getState: () => RootState,
  dispatch: AppDispatch
): string {
  return ensureEntryForDate(getState, dispatch, getLocalDateYYYYMMDD());
}
