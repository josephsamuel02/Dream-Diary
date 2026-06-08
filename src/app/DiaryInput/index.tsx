// app/DiaryInput.tsx
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Entypo, Ionicons } from '@expo/vector-icons';
import DiaryInputBody from '~/components/diaryInputBody';
import AchievementUnlockedModal from '~/components/AchievementUnlockedModal';
import type { Badge } from '~/constants/badges';

// redux
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import {
  selectEntries,
  addMoodToEntry,
  selectCanAddMood,
  MAX_MOODS_PER_DAY,
} from '~/store/slices/diarySlice';
import type { Mood, MoodEntry } from '~/store/slices/diarySlice';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { selectSettings } from '~/store/slices/settingsSlice';
import { store } from '~/store/store';
import { ensureEntryForDate, ensureTodayEntry } from '~/util/ensureTodayEntry';
import { useAchievements } from '~/hooks/useAchievements';
import { MOODS, formatMoodTime, getMoodMeta } from '~/util/moods';

// One hour in milliseconds
const ONE_HOUR_MS = 60 * 60 * 1000;

// Check if the mood was selected within the last hour
const isWithinLastHour = (timestamp: string): boolean => {
  const moodTime = new Date(timestamp).getTime();
  const now = Date.now();
  return now - moodTime < ONE_HOUR_MS;
};

// Get remaining minutes until mood can be changed
const getRemainingMinutes = (timestamp: string): number => {
  const moodTime = new Date(timestamp).getTime();
  const unlockTime = moodTime + ONE_HOUR_MS;
  const remaining = unlockTime - Date.now();
  return Math.max(0, Math.ceil(remaining / (60 * 1000)));
};

export default function DiaryInput() {
  const { entryId: paramEntryIdRaw } = useLocalSearchParams<{ entryId?: string | string[] }>();
  const paramEntryId = Array.isArray(paramEntryIdRaw) ? paramEntryIdRaw[0] : paramEntryIdRaw;
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectEntries);
  const themeColors = useAppSelector(selectThemeColors);
  const { diaryFont, diaryFontSize } = useAppSelector(selectSettings);

  const [entryId, setEntryId] = useState<string | null>(null);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [showCooldownWarning, setShowCooldownWarning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Achievement tracking
  const { addDiaryEntryProgress } = useAchievements();
  const hasCountedThisSessionRef = useRef(false);
  const prevUpdatedAtRef = useRef<string | undefined>(undefined);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  // Get current entry data
  const currentEntry = entryId ? entries.find((e) => e.id === entryId) : null;
  const currentMoods: MoodEntry[] = currentEntry?.moods ?? [];
  const canAddMood = currentMoods.length < MAX_MOODS_PER_DAY;

  // Get the latest mood
  const latestMood = currentMoods.length > 0 ? currentMoods[currentMoods.length - 1] : null;
  const latestMoodMeta = latestMood ? getMoodMeta(latestMood.mood) : null;

  // Check if mood is locked (within last hour)
  const isMoodLocked = useMemo(() => {
    if (!latestMood) return false;
    return isWithinLastHour(latestMood.timestamp);
  }, [latestMood]);

  // Remaining minutes display
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  // Update remaining minutes every minute
  useEffect(() => {
    if (!latestMood || !isMoodLocked) {
      setRemainingMinutes(0);
      return;
    }

    const updateRemaining = () => {
      const mins = getRemainingMinutes(latestMood.timestamp);
      setRemainingMinutes(mins);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [latestMood, isMoodLocked]);

  // Resolve which entry this screen edits
  useEffect(() => {
    const state = store.getState();
    const all = state.diary.entries ?? [];

    if (paramEntryId) {
      const existing = all.find((e) => e.id === paramEntryId);
      if (existing) {
        setEntryId(existing.id);
        return;
      }

      const todayId = ensureTodayEntry(store.getState, dispatch);
      setEntryId(todayId);
      return;
    }

    const todayId = ensureTodayEntry(store.getState, dispatch);
    setEntryId(todayId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramEntryId]);

  // Watch the entry's updatedAt for achievement tracking
  useEffect(() => {
    if (!entryId) return;
    const entry = entries.find((e) => e.id === entryId);
    if (!entry?.updatedAt) return;

    const currentUpdatedAt = entry.updatedAt;

    if (
      !hasCountedThisSessionRef.current &&
      prevUpdatedAtRef.current !== undefined &&
      currentUpdatedAt !== prevUpdatedAtRef.current
    ) {
      hasCountedThisSessionRef.current = true;
      addDiaryEntryProgress().then(({ justUnlockedBadge }) => {
        if (justUnlockedBadge) {
          setUnlockedBadge(justUnlockedBadge);
          setShowAchievementModal(true);
        }
      });
    }

    prevUpdatedAtRef.current = currentUpdatedAt;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, entryId]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    // If mood is locked, show cooldown warning
    if (isMoodLocked) {
      setShowCooldownWarning(true);
      setTimeout(() => setShowCooldownWarning(false), 3000);
      return;
    }

    // If limit reached, show warning
    if (!canAddMood) {
      setShowLimitWarning(true);
      setTimeout(() => setShowLimitWarning(false), 3000);
      return;
    }

    const toValue = isExpanded ? 0 : 1;
    Animated.spring(expandAnim, {
      toValue,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();
    setIsExpanded(!isExpanded);
  }, [isExpanded, expandAnim, isMoodLocked, canAddMood]);

  // Handle mood selection
  const handleSelectMood = useCallback(
    (mood: Mood) => {
      if (!entryId) return;

      // Check cooldown
      if (isMoodLocked) {
        setShowCooldownWarning(true);
        setTimeout(() => setShowCooldownWarning(false), 3000);
        return;
      }

      // Check if we can add more moods
      const state = store.getState();
      const canAdd = selectCanAddMood(state, entryId);

      if (!canAdd) {
        setShowLimitWarning(true);
        setTimeout(() => setShowLimitWarning(false), 3000);
        return;
      }

      dispatch(addMoodToEntry({ entryId, mood }));

      // Collapse the selector
      Animated.spring(expandAnim, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: false,
      }).start();
      setIsExpanded(false);
    },
    [entryId, dispatch, expandAnim, isMoodLocked]
  );

  // Animated height for expanded selector
  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 56],
  });

  if (!entryId) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
          <Text style={[styles.loadingText, { color: themeColors.text + '80' }]}>
            Loading your entry...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          {/* Mood Section */}
          <View style={[styles.moodSection, { borderBottomColor: themeColors.text + '15' }]}>
            {/* No mood selected yet - show initial selector */}
            {!latestMood && (
              <>
                <Text style={[styles.moodPrompt, { color: themeColors.text }]}>
                  How are you feeling?
                </Text>
                <View style={styles.moodRow}>
                  {MOODS.map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => handleSelectMood(m.key)}
                      style={styles.moodItem}
                      activeOpacity={0.7}>
                      <View style={[styles.moodCircle, { borderColor: themeColors.accent + '30' }]}>
                        <Entypo name={m.icon as any} size={20} color={m.color} />
                      </View>
                      <Text style={[styles.moodLabel, { color: themeColors.text }]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Mood selected - show current mood display */}
            {latestMood && latestMoodMeta && (
              <>
                {/* Current moods row */}
                <View style={styles.currentMoodsRow}>
                  {currentMoods.map((moodEntry, index) => {
                    const meta = getMoodMeta(moodEntry.mood);
                    const time = formatMoodTime(moodEntry.timestamp);
                    const isLast = index === currentMoods.length - 1;

                    return (
                      <TouchableOpacity
                        key={`${moodEntry.timestamp}-${index}`}
                        onPress={isLast ? toggleExpanded : undefined}
                        activeOpacity={isLast ? 0.7 : 1}
                        style={[
                          styles.currentMoodChip,
                          { backgroundColor: themeColors.surface },
                          isLast &&
                            isExpanded && { borderColor: themeColors.accent, borderWidth: 1 },
                        ]}>
                        <Entypo
                          name={meta?.icon as any}
                          size={18}
                          color={meta?.color ?? themeColors.text}
                        />
                        <View style={styles.moodChipText}>
                          <Text
                            style={[
                              styles.moodChipLabel,
                              { color: meta?.color ?? themeColors.text },
                            ]}>
                            {meta?.label}
                          </Text>
                          <Text style={[styles.moodChipTime, { color: themeColors.text + '60' }]}>
                            {time}
                          </Text>
                        </View>
                        {isLast && isMoodLocked && (
                          <Ionicons name="lock-closed" size={12} color={themeColors.text + '50'} />
                        )}
                        {isLast && !isMoodLocked && canAddMood && (
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color={themeColors.accent}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Status text */}
                <Text style={[styles.statusText, { color: themeColors.text + '50' }]}>
                  {isMoodLocked
                    ? `Change mood in ${remainingMinutes} min`
                    : canAddMood
                      ? 'Tap to change mood'
                      : 'Daily limit reached'}
                </Text>

                {/* Expandable mood selector */}
                <Animated.View
                  style={[styles.expandedSelector, { height: expandedHeight, overflow: 'hidden' }]}>
                  <View style={styles.moodRow}>
                    {MOODS.map((m) => (
                      <TouchableOpacity
                        key={m.key}
                        onPress={() => handleSelectMood(m.key)}
                        style={styles.moodItem}
                        activeOpacity={0.7}>
                        <View
                          style={[styles.moodCircle, { borderColor: themeColors.accent + '30' }]}>
                          <Entypo name={m.icon as any} size={20} color={m.color} />
                        </View>
                        <Text style={[styles.moodLabel, { color: themeColors.text }]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              </>
            )}

            {/* Warning messages */}
            {showLimitWarning && (
              <View style={[styles.warningBanner, { backgroundColor: themeColors.error + '20' }]}>
                <Ionicons name="warning" size={14} color={themeColors.error} />
                <Text style={[styles.warningText, { color: themeColors.error }]}>
                  You can only update your mood {MAX_MOODS_PER_DAY} times per day
                </Text>
              </View>
            )}

            {showCooldownWarning && (
              <View style={[styles.warningBanner, { backgroundColor: themeColors.accent + '20' }]}>
                <Ionicons name="time" size={14} color={themeColors.accent} />
                <Text style={[styles.warningText, { color: themeColors.accent }]}>
                  Wait {remainingMinutes} more minutes before changing mood
                </Text>
              </View>
            )}
          </View>

          {/* Diary Body */}
          <DiaryInputBody
            entryId={entryId}
            diaryFont={diaryFont}
            diaryFontSize={diaryFontSize ?? 16}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Achievement celebration modal */}
      <AchievementUnlockedModal
        badge={unlockedBadge}
        visible={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
      />
    </View>
  );
}

// Suppress unused import linter warning
void ensureEntryForDate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'RobotoRegular',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  // Mood section
  moodSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  moodPrompt: {
    fontFamily: 'PoppinsBold',
    fontSize: 12,
    marginBottom: 4,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  moodItem: {
    alignItems: 'center',
    flex: 1,
  },
  moodCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  moodLabel: {
    fontFamily: 'RobotoMedium',
    fontSize: 8,
    marginTop: 2,
    textAlign: 'center',
  },
  // Current mood display
  currentMoodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  currentMoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  moodChipText: {
    gap: 0,
  },
  moodChipLabel: {
    fontFamily: 'RobotoMedium',
    fontSize: 11,
  },
  moodChipTime: {
    fontFamily: 'RobotoRegular',
    fontSize: 9,
  },
  statusText: {
    fontFamily: 'RobotoRegular',
    fontSize: 9,
    marginTop: 4,
  },
  expandedSelector: {
    marginTop: 4,
  },
  // Warning banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  warningText: {
    fontFamily: 'RobotoMedium',
    fontSize: 10,
    flex: 1,
  },
});
