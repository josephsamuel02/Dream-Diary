import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Entypo } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '~/store/hooks';
import {
  selectEntries,
  addMoodToEntry,
  selectCanAddMood,
  MAX_MOODS_PER_DAY,
} from '~/store/slices/diarySlice';
import type { Mood, MoodEntry } from '~/store/slices/diarySlice';
import {
  selectThemeColors,
  selectBackgroundImage,
  selectBackgroundOpacity,
} from '~/store/slices/themeSlice';
import { store } from '~/store/store';

import MainTab from '~/components/mainTab';
import HistoryItem from '~/components/historyItem';
import { ensureTodayEntry } from '~/util/ensureTodayEntry';
import { useToday } from '~/util/useToday';
import { MOODS, formatMoodTime, getMoodMeta } from '~/util/moods';
import { getTimeGreeting, getSingleDailyQuote } from '~/util/greetings';
import { useAchievements } from '~/hooks/useAchievements';
import { BADGES } from '~/constants/badges';

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

const Index = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const themeColors = useAppSelector(selectThemeColors);
  const backgroundImage = useAppSelector(selectBackgroundImage);
  const backgroundOpacity = useAppSelector(selectBackgroundOpacity);
  const entriesRaw = useAppSelector(selectEntries);
  const todayIso = useToday();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    // Wiggle every 4 seconds
    const startWiggle = () => {
      Animated.sequence([
        Animated.delay(4000),
        Animated.timing(wiggleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(wiggleAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(wiggleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(wiggleAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(wiggleAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start(() => startWiggle());
    };
    startWiggle();
  }, [fadeAnim, slideAnim, wiggleAnim]);

  const bookRotation = wiggleAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-22deg', '-8deg', '6deg'],
  });

  const bookScale = wiggleAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.2, 1, 1.2],
  });

  // Sorted (newest-first) entries — used everywhere on the home screen.
  const entries = useMemo(() => {
    return [...(entriesRaw ?? [])].sort((a, b) => {
      const ta = a?.date ? new Date(a.date).getTime() : 0;
      const tb = b?.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });
  }, [entriesRaw]);

  const todayEntry = useMemo(() => entries.find((e) => e.date === todayIso), [entries, todayIso]);

  // Greeting — randomly picked from the time-of-day pool on each mount.
  const [greeting] = useState(() => getTimeGreeting());
  const greetingLabel = greeting.text;
  const greetingIcon = greeting.icon;

  // Stats
  const totalEntries = entries.length;

  // Current badge level from the achievements system.
  const { totalCompletedDays, unlockedBadges } = useAchievements();
  const currentBadge = useMemo(() => {
    const earned = BADGES.filter((b) => unlockedBadges.includes(b.id));
    return earned.length > 0 ? earned[earned.length - 1] : null;
  }, [unlockedBadges]);

  // Day streak — count back consecutive days that have an entry.
  const dayStreak = useMemo(() => {
    const dates = new Set(entries.map((e) => e.date));
    let streak = 0;
    const cursor = new Date();
    // If there's no entry today the streak still counts yesterday's
    // chain so the user doesn't lose visible progress before they
    // open the diary.
    while (true) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      if (dates.has(key)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [entries]);

  // Single quote that changes after 3 PM.
  const dailyQuote = useMemo(() => getSingleDailyQuote(new Date()), [todayIso]);

  // Today's moods array
  const todayMoods: MoodEntry[] = todayEntry?.moods ?? [];
  const canAddMood = todayMoods.length < MAX_MOODS_PER_DAY;
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [showCooldownWarning, setShowCooldownWarning] = useState(false);

  // Get the latest mood for cooldown check
  const latestMood = todayMoods.length > 0 ? todayMoods[todayMoods.length - 1] : null;

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

  const handleSelectMood = useCallback(
    (mood: Mood) => {
      // Check cooldown first
      if (isMoodLocked) {
        setShowCooldownWarning(true);
        setTimeout(() => setShowCooldownWarning(false), 3000);
        return;
      }

      const entryId = ensureTodayEntry(store.getState, dispatch);
      
      // Check if we can add more moods
      const state = store.getState();
      const canAdd = selectCanAddMood(state, entryId);
      
      if (!canAdd) {
        setShowLimitWarning(true);
        setTimeout(() => setShowLimitWarning(false), 3000);
        return;
      }
      
      dispatch(addMoodToEntry({ entryId, mood }));
    },
    [dispatch, isMoodLocked]
  );

  const openTodayEntry = useCallback(() => {
    const entryId = ensureTodayEntry(store.getState, dispatch);
    router.push(`/DiaryInput?entryId=${encodeURIComponent(entryId)}`);
  }, [dispatch, router]);

  const openEntryForEditing = useCallback(
    (entryId: string) => {
      router.push(`/DiaryInput?entryId=${encodeURIComponent(entryId)}`);
    },
    [router]
  );

  const recentEntries = entries.slice(0, 2);

  return (
    <View style={[indexStyles.container, { backgroundColor: themeColors.background }]}>
      {backgroundImage && (
        <Image
          source={{ uri: backgroundImage }}
          style={[indexStyles.backgroundImage, { opacity: backgroundOpacity }]}
          resizeMode="cover"
        />
      )}

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}>
          {/* ---------- HERO CARD ---------- */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <LinearGradient
              colors={[themeColors.surface, themeColors.background, themeColors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[indexStyles.heroCard, { borderColor: themeColors.accent + '25' }]}>
              {/* Decorative book illustration */}
              <View style={indexStyles.heroIllustration} pointerEvents="none">
                <Ionicons
                  name="sparkles"
                  size={12}
                  color={themeColors.accent}
                  style={{ position: 'absolute', top: 4, left: 3, opacity: 0.9 }}
                />
                <Ionicons
                  name="sparkles-outline"
                  size={8}
                  color={themeColors.accent}
                  style={{ position: 'absolute', top: 24, left: 24, opacity: 0.7 }}
                />
                <Ionicons
                  name="sparkles"
                  size={7}
                  color={themeColors.accent}
                  style={{ position: 'absolute', bottom: 10, right: 3, opacity: 0.6 }}
                />
                <View
                  style={[indexStyles.bookShadow, { backgroundColor: themeColors.accent + '20' }]}
                />
                <Animated.View
                  style={[
                    indexStyles.bookCover,
                    {
                      backgroundColor: '#5C2B0D',
                      borderColor: themeColors.accent + '60',
                      transform: [{ rotate: bookRotation }, { scale: bookScale }],
                    },
                  ]}>
                  <View style={[indexStyles.bookSpine, { backgroundColor: '#3B1A08' }]} />
                  <Ionicons
                    name="leaf"
                    size={16}
                    color={themeColors.accent}
                    style={{ opacity: 0.7 }}
                  />
                  <View style={[indexStyles.bookStrap, { backgroundColor: '#3B1A08' }]} />
                </Animated.View>
              </View>

              <View style={{ flex: 1, paddingRight: 82 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                  <Ionicons name={greetingIcon as any} size={13} color={themeColors.accent} />
                  <Text style={[indexStyles.heroEyebrow, { color: themeColors.accent }]}>
                    {greetingLabel}
                  </Text>
                </View>
                <Text style={[indexStyles.heroTitle, { color: themeColors.text }]}>
                  How are you feeling today?
                </Text>
                <Text style={[indexStyles.heroSubtitle, { color: themeColors.text }]}>
                  Start writing and clear your mind.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={openTodayEntry}
                  style={{ alignSelf: 'flex-start', marginTop: 10 }}>
                  <LinearGradient
                    colors={[themeColors.accent, themeColors.accent + 'CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={indexStyles.heroButton}>
                    <Ionicons name="create-outline" size={15} color="#000" />
                    <Text style={indexStyles.heroButtonText}>Write in Diary</Text>
                    <Ionicons name="chevron-forward" size={14} color="#000" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* ---------- STATS ROW ---------- */}
          <View style={{ marginTop: 12, paddingHorizontal: 16, flexDirection: 'row', gap: 10 }}>
            <StatCard
              value={String(dayStreak)}
              label="Day Streak"
              hint={dayStreak > 0 ? 'Keep it up! 🔥' : 'Start today!'}
              themeColors={themeColors}
            />
            <StatCard
              value={currentBadge ? currentBadge.icon : '—'}
              label="Badge Level"
              hint={currentBadge ? currentBadge.title : 'Keep writing!'}
              themeColors={themeColors}
              valueIsText
            />
            <StatCard
              value={String(totalEntries)}
              label="Entries"
              hint="Total written"
              themeColors={themeColors}
            />
          </View>

          {/* ---------- DAILY QUOTE ---------- */}
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <View style={[indexStyles.promptCard, { backgroundColor: themeColors.surface, borderColor: themeColors.accent + '25' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="sparkles" size={12} color={themeColors.accent} />
                  <Text style={[indexStyles.promptEyebrow, { color: themeColors.accent }]}>DAILY QUOTE</Text>
                </View>
                <Text style={[indexStyles.promptMeta, { color: themeColors.text, opacity: 0.5 }]}>New quote every afternoon</Text>
              </View>
              <View style={indexStyles.quoteBlock}>
                <Text style={[indexStyles.promptQuoteMark, { color: themeColors.accent }]}>"</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[indexStyles.promptText, { color: themeColors.text }]}>{dailyQuote.text}</Text>
                  <Text style={[indexStyles.quoteAuthor, { color: themeColors.accent }]}>— {dailyQuote.author}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ---------- MOOD SELECTOR ---------- */}
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <View
              style={[
                indexStyles.moodCard,
                { backgroundColor: themeColors.surface, borderColor: themeColors.accent + '25' },
              ]}>
              <View style={indexStyles.moodHeader}>
                <Text style={[indexStyles.moodTitle, { color: themeColors.text }]}>
                  How are you feeling right now?
                </Text>
                <Text style={[indexStyles.moodSubtitle, { color: themeColors.text + '60' }]}>
                  {isMoodLocked
                    ? `Locked for ${remainingMinutes} min`
                    : canAddMood
                    ? `${MAX_MOODS_PER_DAY - todayMoods.length} left today`
                    : 'Limit reached'}
                </Text>
              </View>
              
              <View style={indexStyles.moodRow}>
                {MOODS.map((m) => {
                  const isDisabled = !canAddMood || isMoodLocked;
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => handleSelectMood(m.key)}
                      disabled={isDisabled}
                      style={[indexStyles.moodItem, isDisabled && { opacity: 0.4 }]}>
                      <View style={indexStyles.moodCircle}>
                        <Entypo name={m.icon as any} size={22} color={m.color} />
                      </View>
                      <Text
                        style={[
                          indexStyles.moodLabel,
                          { color: themeColors.text, opacity: 0.7 },
                        ]}>
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Warning messages */}
              {showLimitWarning && (
                <View style={[indexStyles.warningBanner, { backgroundColor: themeColors.error + '20' }]}>
                  <Ionicons name="warning" size={14} color={themeColors.error} />
                  <Text style={[indexStyles.warningText, { color: themeColors.error }]}>
                    You can only update your mood {MAX_MOODS_PER_DAY} times per day
                  </Text>
                </View>
              )}

              {showCooldownWarning && (
                <View style={[indexStyles.warningBanner, { backgroundColor: themeColors.accent + '20' }]}>
                  <Ionicons name="time" size={14} color={themeColors.accent} />
                  <Text style={[indexStyles.warningText, { color: themeColors.accent }]}>
                    Wait {remainingMinutes} more minutes before changing mood
                  </Text>
                </View>
              )}

              {/* Today's moods timeline */}
              {todayMoods.length > 0 && (
                <View style={indexStyles.moodTimeline}>
                  <Text style={[indexStyles.timelineTitle, { color: themeColors.text + '70' }]}>
                    Today's Moods
                  </Text>
                  <View style={indexStyles.timelineRow}>
                    {todayMoods.map((moodEntry, index) => {
                      const meta = getMoodMeta(moodEntry.mood);
                      const time = formatMoodTime(moodEntry.timestamp);
                      const isLast = index === todayMoods.length - 1;
                      return (
                        <View
                          key={`${moodEntry.timestamp}-${index}`}
                          style={[
                            indexStyles.timelineItem,
                            { backgroundColor: themeColors.background },
                          ]}>
                          <Entypo
                            name={meta?.icon as any}
                            size={16}
                            color={meta?.color ?? themeColors.text}
                          />
                          <Text style={[indexStyles.timelineTime, { color: themeColors.text + '80' }]}>
                            {time}
                          </Text>
                          {isLast && isMoodLocked && (
                            <Ionicons name="lock-closed" size={10} color={themeColors.text + '50'} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* ---------- RECENT ENTRIES ---------- */}
          <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
            <View style={indexStyles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="add" size={14} color={themeColors.accent} />
                <Text style={[indexStyles.sectionTitle, { color: themeColors.accent }]}>
                  RECENT ENTRIES
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/AllEntries')}
                style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[indexStyles.viewAllText, { color: themeColors.accent }]}>
                  View All
                </Text>
                <Ionicons name="chevron-forward" size={14} color={themeColors.accent} />
              </Pressable>
            </View>

            {recentEntries.length === 0 ? (
              <View
                style={{
                  backgroundColor: themeColors.surface,
                  borderRadius: 16,
                  padding: 24,
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: themeColors.accent + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                  <Ionicons name="journal-outline" size={26} color={themeColors.accent} />
                </View>
                <Text
                  style={{
                    color: themeColors.text,
                    fontFamily: 'PoppinsBold',
                    fontSize: 16,
                    marginBottom: 4,
                  }}>
                  Start Your Journey
                </Text>
                <Text
                  style={{
                    color: themeColors.text,
                    opacity: 0.6,
                    fontFamily: 'RobotoRegular',
                    fontSize: 12,
                    textAlign: 'center',
                  }}>
                  Tap the + button to create your first entry.
                </Text>
              </View>
            ) : (
              recentEntries.map((entry, idx) => (
                <HistoryItem
                  key={entry.id}
                  entry={entry}
                  onOpen={openEntryForEditing}
                  isFirst={idx === 0}
                />
              ))
            )}
          </View>
        </ScrollView>
      </Animated.View>

      <MainTab />
    </View>
  );
};

// Compact stat card used in the horizontal scroll row.
const StatCard = ({
  value,
  label,
  hint,
  hintColor,
  themeColors,
  valueIsText = false,
}: {
  value: string;
  label: string;
  hint: string;
  hintColor?: string;
  themeColors: { text: string; surface: string; accent: string };
  valueIsText?: boolean;
}) => {
  return (
    <View
      style={[
        indexStyles.statCard,
        { backgroundColor: themeColors.surface, borderColor: themeColors.accent + '20' },
      ]}>
      <Text
        style={[
          indexStyles.statValue,
          { color: themeColors.text, fontSize: valueIsText ? 22 : 20 },
        ]}
        numberOfLines={1}>
        {value}
      </Text>
      <Text style={[indexStyles.statLabel, { color: themeColors.text }]} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[indexStyles.statHint, { color: hintColor ?? themeColors.text + '99' }]}
        numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
};

const indexStyles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  // Hero
  heroCard: {
    borderRadius: 16,
    padding: 12,
    paddingRight: 14,
    minHeight: 110,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  heroIllustration: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 70,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookShadow: {
    position: 'absolute',
    width: 54,
    height: 62,
    borderRadius: 6,
    transform: [{ translateX: 3 }, { translateY: 5 }],
  },
  bookCover: {
    width: 46,
    height: 58,
    borderRadius: 5,
    borderWidth: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  bookSpine: {
    position: 'absolute',
    left: 3,
    top: 3,
    bottom: 3,
    width: 3,
    borderRadius: 1.5,
  },
  bookStrap: {
    position: 'absolute',
    right: -2,
    top: 22,
    width: 6,
    height: 14,
    borderRadius: 1.5,
  },
  heroEyebrow: {
    fontFamily: 'RobotoMedium',
    fontSize: 10,
    marginLeft: 5,
  },
  heroTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 1,
  },
  heroSubtitle: {
    fontFamily: 'RobotoRegular',
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroButtonText: {
    color: '#000',
    fontFamily: 'PoppinsBold',
    fontSize: 11,
  },

  // Stats
  statCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  statValue: {
    fontFamily: 'PoppinsBold',
    lineHeight: 20,
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: 'RobotoMedium',
    fontSize: 9,
    opacity: 0.8,
    textAlign: 'center',
  },
  statHint: {
    fontFamily: 'RobotoRegular',
    fontSize: 8,
    opacity: 0.55,
    marginTop: 0,
    textAlign: 'center',
  },

  // Daily prompt
  promptCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  promptEyebrow: {
    fontFamily: 'RobotoMedium',
    fontSize: 10,
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  promptMeta: {
    fontFamily: 'RobotoRegular',
    fontSize: 10,
  },
  promptQuoteMark: {
    fontSize: 30,
    fontFamily: 'PoppinsBold',
    lineHeight: 30,
    marginRight: 6,
    marginTop: -4,
  },
  promptText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  quoteBlock: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'flex-start',
  },
  quoteAuthor: {
    fontFamily: 'RobotoMedium',
    fontSize: 11,
    marginTop: 6,
    opacity: 0.85,
  },
  quoteDivider: {
    height: 1,
    marginTop: 14,
    borderRadius: 1,
  },

  // Mood selector
  moodCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  moodHeader: {
    marginBottom: 12,
  },
  moodTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 11,
  },
  moodSubtitle: {
    fontFamily: 'RobotoRegular',
    fontSize: 9,
    marginTop: 2,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  moodItem: {
    alignItems: 'center',
    flex: 1,
  },
  moodCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  moodLabel: {
    fontFamily: 'RobotoMedium',
    fontSize: 9,
    marginTop: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
  },
  warningText: {
    fontFamily: 'RobotoMedium',
    fontSize: 10,
    flex: 1,
  },
  moodTimeline: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  timelineTitle: {
    fontFamily: 'RobotoMedium',
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timelineTime: {
    fontFamily: 'RobotoRegular',
    fontSize: 10,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'RobotoMedium',
    fontSize: 11,
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  viewAllText: {
    fontFamily: 'RobotoMedium',
    fontSize: 12,
    marginRight: 2,
  },
});

export default Index;
