import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dream_diary_achievements_v1';

export interface AchievementData {
  /** Local YYYY-MM-DD dates on which the user completed 3+ diary sessions. */
  completedDays: string[];
  /** IDs of badges that have been celebrated (to avoid re-triggering modals). */
  celebratedBadges: string[];
  /** The local date of the current tracking session. */
  todayDate: string;
  /** Number of diary save sessions the user has had today. */
  todayCount: number;
}

export function getLocalDateString(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function makeDefault(): AchievementData {
  return {
    completedDays: [],
    celebratedBadges: [],
    todayDate: getLocalDateString(),
    todayCount: 0,
  };
}

export async function loadAchievements(): Promise<AchievementData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefault();

    const parsed: AchievementData = JSON.parse(raw);
    const today = getLocalDateString();

    // Reset daily count when the calendar day changes.
    if (parsed.todayDate !== today) {
      return { ...parsed, todayDate: today, todayCount: 0 };
    }

    return parsed;
  } catch {
    return makeDefault();
  }
}

export async function saveAchievements(data: AchievementData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[Achievements] Failed to persist data:', e);
  }
}

/**
 * Records one diary-save session for today.
 * Returns the updated data and whether today was just marked as a
 * completed achievement day (i.e. the count crossed the threshold).
 */
export async function recordDiarySession(
  current: AchievementData,
  requiredPerDay: number
): Promise<{ data: AchievementData; justCompletedToday: boolean }> {
  const today = getLocalDateString();

  // Normalise if the stored day is stale.
  const base: AchievementData =
    current.todayDate !== today
      ? { ...current, todayDate: today, todayCount: 0 }
      : { ...current };

  const alreadyCompleted = base.completedDays.includes(today);
  const newCount = base.todayCount + 1;
  let justCompletedToday = false;

  const updated: AchievementData = { ...base, todayCount: newCount };

  if (!alreadyCompleted && newCount >= requiredPerDay) {
    justCompletedToday = true;
    updated.completedDays = [...base.completedDays, today];
  }

  await saveAchievements(updated);
  return { data: updated, justCompletedToday };
}

/** Marks a badge as celebrated so the modal won't reappear. */
export async function markBadgeCelebrated(
  current: AchievementData,
  badgeId: string
): Promise<AchievementData> {
  if (current.celebratedBadges.includes(badgeId)) return current;
  const updated: AchievementData = {
    ...current,
    celebratedBadges: [...current.celebratedBadges, badgeId],
  };
  await saveAchievements(updated);
  return updated;
}
