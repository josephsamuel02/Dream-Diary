/**
 * Date helpers used across the app.
 *
 * All "today" references MUST go through these helpers so that
 * local time is used consistently everywhere (and never UTC).
 * Mixing UTC with local time was causing entries to be attributed
 * to the wrong day near midnight.
 */

/**
 * Returns the given date (default: now) as 'YYYY-MM-DD' using the
 * device's LOCAL timezone. This is the canonical date-key format
 * for diary entries.
 */
export const getLocalDateYYYYMMDD = (d: Date = new Date()): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Milliseconds between now and the next local midnight (+ a small
 * buffer so we cross cleanly into the new day).
 */
export const msUntilNextMidnight = (): number => {
  const now = new Date();
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    1,
    0
  );
  return Math.max(1000, next.getTime() - now.getTime());
};
