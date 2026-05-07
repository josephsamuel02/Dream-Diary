import { useState, useEffect, useCallback, useRef } from 'react';
import { BADGES, REQUIRED_ENTRIES_PER_DAY } from '~/constants/badges';
import type { Badge } from '~/constants/badges';
import { useAppDispatch } from '~/store/hooks';
import { addNotification } from '~/store/slices/notificationSlice';
import {
  AchievementData,
  loadAchievements,
  recordDiarySession,
  markBadgeCelebrated,
  getLocalDateString,
} from '~/util/achievementStorage';

export interface AchievementsHookReturn {
  /** How many diary sessions the user has had today. */
  todayCount: number;
  /** All local dates the user completed an achievement day on. */
  completedDays: string[];
  /** IDs of badges the user has earned (derived from completedDays). */
  unlockedBadges: string[];
  /** Whether the user has already completed today's achievement. */
  hasCompletedToday: boolean;
  /** The next badge the user is working toward (null if all unlocked). */
  nextBadge: Badge | null;
  /** Progress toward the next badge, 0–100. */
  progressPercent: number;
  /** Total number of completed achievement days. */
  totalCompletedDays: number;
  /**
   * Call after every diary save to record a session.
   * Returns the badge that was just unlocked, or null.
   */
  addDiaryEntryProgress: () => Promise<{ justUnlockedBadge: Badge | null }>;
  /** Whether the initial AsyncStorage load has finished. */
  isLoaded: boolean;
}

export function useAchievements(): AchievementsHookReturn {
  const dispatch = useAppDispatch();
  const [data, setData] = useState<AchievementData>({
    completedDays: [],
    celebratedBadges: [],
    todayDate: getLocalDateString(),
    todayCount: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Guard against calling setState after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load persisted data once on mount.
  useEffect(() => {
    loadAchievements().then((d) => {
      if (mountedRef.current) {
        setData(d);
        setIsLoaded(true);
      }
    });
  }, []);

  const today = getLocalDateString();
  const hasCompletedToday = data.completedDays.includes(today);
  const totalCompletedDays = data.completedDays.length;

  // Unlocked badges are derived from completedDays count — no separate list needed.
  const unlockedBadges = BADGES
    .filter((b) => totalCompletedDays >= b.requiredDays)
    .map((b) => b.id);

  const nextBadge = BADGES.find((b) => totalCompletedDays < b.requiredDays) ?? null;

  const progressPercent = nextBadge
    ? Math.min(100, Math.round((totalCompletedDays / nextBadge.requiredDays) * 100))
    : 100;

  const addDiaryEntryProgress = useCallback(async (): Promise<{
    justUnlockedBadge: Badge | null;
  }> => {
    const prevCompletedCount = data.completedDays.length;
    const { data: newData, justCompletedToday } = await recordDiarySession(
      data,
      REQUIRED_ENTRIES_PER_DAY
    );

    let justUnlockedBadge: Badge | null = null;

    if (justCompletedToday) {
      const newCompletedCount = newData.completedDays.length;

      // Find the highest badge that was just crossed.
      const newlyEarned = BADGES.filter(
        (b) =>
          b.requiredDays > prevCompletedCount &&
          b.requiredDays <= newCompletedCount &&
          !newData.celebratedBadges.includes(b.id)
      );

      if (newlyEarned.length > 0) {
        justUnlockedBadge = newlyEarned[newlyEarned.length - 1];
        
        // Add notification for the new badge
        dispatch(addNotification({
          title: 'Achievement Unlocked! 🏆',
          message: `Congratulations! You've earned the "${justUnlockedBadge.title}" badge.`,
          type: 'achievement',
        }));

        const updatedData = await markBadgeCelebrated(newData, justUnlockedBadge.id);
        if (mountedRef.current) setData(updatedData);
        return { justUnlockedBadge };
      }
    }

    if (mountedRef.current) setData(newData);
    return { justUnlockedBadge };
  }, [data]);

  return {
    todayCount: data.todayCount,
    completedDays: data.completedDays,
    unlockedBadges,
    hasCompletedToday,
    nextBadge,
    progressPercent,
    totalCompletedDays,
    addDiaryEntryProgress,
    isLoaded,
  };
}
