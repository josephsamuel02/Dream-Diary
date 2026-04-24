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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { selectEntries, setEntryMood } from '~/store/slices/diarySlice';
import type { Mood } from '~/store/slices/diarySlice';
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
import { getDailyPrompt, getRandomIdea } from '~/util/prompts';
import { MOODS, averageMoodLabel } from '~/util/moods';

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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Sorted (newest-first) entries — used everywhere on the home screen.
  const entries = useMemo(() => {
    return [...(entriesRaw ?? [])].sort((a, b) => {
      const ta = a?.date ? new Date(a.date).getTime() : 0;
      const tb = b?.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });
  }, [entriesRaw]);

  const todayEntry = useMemo(
    () => entries.find((e) => e.date === todayIso),
    [entries, todayIso]
  );

  // Day-period greeting drives the hero card icon + label.
  const hour = new Date().getHours();
  const period: 'morning' | 'afternoon' | 'evening' =
    hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';
  const greetingLabel =
    period === 'morning' ? 'Good morning!' : period === 'afternoon' ? 'Good afternoon!' : 'Good evening!';
  const greetingIcon = period === 'morning' ? 'sunny' : period === 'afternoon' ? 'partly-sunny' : 'moon';

  // Stats
  const totalEntries = entries.length;

  const thisWeekEntries = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entries.filter((e) => new Date(e.date) >= weekAgo).length;
  }, [entries]);

  const lastWeekEntries = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 14);
    const end = new Date();
    end.setDate(end.getDate() - 7);
    return entries.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d < end;
    }).length;
  }, [entries]);

  const weekDelta = thisWeekEntries - lastWeekEntries;

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

  const weekMoods = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entries
      .filter((e) => new Date(e.date) >= weekAgo)
      .map((e) => e.mood)
      .filter((m): m is Mood => Boolean(m));
  }, [entries]);

  const avgMood = averageMoodLabel(weekMoods);

  // Daily prompt — rotates with the day-of-year.
  const dailyPrompt = useMemo(() => getDailyPrompt(new Date()), [todayIso]);

  // Selected mood mirrors the today-entry mood so the active emoji
  // ring stays in sync after a refresh.
  const selectedMood: Mood | undefined = todayEntry?.mood;

  const handleSelectMood = useCallback(
    (mood: Mood) => {
      const entryId = ensureTodayEntry(store.getState, dispatch);
      dispatch(setEntryMood({ entryId, mood }));
    },
    [dispatch]
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

  const showIdea = useCallback(() => {
    Alert.alert('Need ideas?', getRandomIdea(), [{ text: 'OK' }]);
  }, []);

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
                <Ionicons name="sparkles" size={14} color={themeColors.accent} style={{ position: 'absolute', top: 6, left: 4, opacity: 0.9 }} />
                <Ionicons name="sparkles-outline" size={10} color={themeColors.accent} style={{ position: 'absolute', top: 30, left: 30, opacity: 0.7 }} />
                <Ionicons name="sparkles" size={8} color={themeColors.accent} style={{ position: 'absolute', bottom: 12, right: 4, opacity: 0.6 }} />
                <View style={[indexStyles.bookShadow, { backgroundColor: themeColors.accent + '20' }]} />
                <View style={[indexStyles.bookCover, { backgroundColor: '#5C2B0D', borderColor: themeColors.accent + '60' }]}>
                  <View style={[indexStyles.bookSpine, { backgroundColor: '#3B1A08' }]} />
                  <Ionicons name="leaf" size={20} color={themeColors.accent} style={{ opacity: 0.7 }} />
                  <View style={[indexStyles.bookStrap, { backgroundColor: '#3B1A08' }]} />
                </View>
              </View>

              <View style={{ flex: 1, paddingRight: 90 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name={greetingIcon as any} size={14} color={themeColors.accent} />
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

                <TouchableOpacity activeOpacity={0.85} onPress={openTodayEntry} style={{ alignSelf: 'flex-start', marginTop: 14 }}>
                  <LinearGradient
                    colors={[themeColors.accent, themeColors.accent + 'CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={indexStyles.heroButton}>
                    <Ionicons name="create-outline" size={15} color="#fff" />
                    <Text style={indexStyles.heroButtonText}>Write in Diary</Text>
                    <Ionicons name="chevron-forward" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* ---------- STATS ROW ---------- */}
          <View style={{ marginTop: 12 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
              <StatCard
                icon="flame"
                iconColor="#E07A4A"
                value={String(dayStreak)}
                label="Day Streak"
                hint={dayStreak > 0 ? 'Keep it up! 🔥' : 'Start today!'}
                themeColors={themeColors}
              />
              <StatCard
                icon="book"
                iconColor="#5FB344"
                value={String(totalEntries)}
                label="Entries"
                hint="Total"
                themeColors={themeColors}
              />
              <StatCard
                icon="trending-up"
                iconColor="#A78BFA"
                value={String(thisWeekEntries)}
                label="This Week"
                hint={
                  weekDelta > 0
                    ? `+${weekDelta} from last week`
                    : weekDelta < 0
                      ? `${weekDelta} from last week`
                      : 'Same as last week'
                }
                hintColor={weekDelta > 0 ? '#5FB344' : weekDelta < 0 ? themeColors.error : undefined}
                themeColors={themeColors}
              />
              <StatCard
                icon="happy"
                iconColor="#E48BB8"
                value={avgMood.label}
                label="Avg Mood"
                hint={`This Week ${avgMood.emoji}`}
                themeColors={themeColors}
                valueIsText
              />
            </ScrollView>
          </View>

          {/* ---------- DAILY REFLECTION PROMPT ---------- */}
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <View
              style={[
                indexStyles.promptCard,
                { backgroundColor: themeColors.surface, borderColor: themeColors.accent + '25' },
              ]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="sparkles" size={12} color={themeColors.accent} />
                  <Text style={[indexStyles.promptEyebrow, { color: themeColors.accent }]}>
                    DAILY REFLECTION PROMPT
                  </Text>
                </View>
                <Text style={[indexStyles.promptMeta, { color: themeColors.text, opacity: 0.5 }]}>
                  New prompt every day
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <Text style={[indexStyles.promptQuoteMark, { color: themeColors.accent }]}>“</Text>
                <Text style={[indexStyles.promptText, { color: themeColors.text }]}>
                  {dailyPrompt}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <TouchableOpacity
                  onPress={openTodayEntry}
                  activeOpacity={0.8}
                  style={[indexStyles.promptButton, { backgroundColor: themeColors.accent + '20', borderColor: themeColors.accent + '40' }]}>
                  <Ionicons name="create-outline" size={13} color={themeColors.accent} />
                  <Text style={[indexStyles.promptButtonText, { color: themeColors.accent }]}>
                    Use This Prompt
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={showIdea} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="bulb-outline" size={13} color={themeColors.accent} />
                  <Text style={[indexStyles.needIdeasText, { color: themeColors.accent }]}>Need ideas?</Text>
                </TouchableOpacity>
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
              <Text style={[indexStyles.moodTitle, { color: themeColors.text }]}>
                How are you feeling right now?
              </Text>
              <View style={indexStyles.moodRow}>
                {MOODS.map((m) => {
                  const active = selectedMood === m.key;
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => handleSelectMood(m.key)}
                      style={indexStyles.moodItem}>
                      <View
                        style={[
                          indexStyles.moodCircle,
                          { backgroundColor: m.color },
                          active && {
                            borderColor: themeColors.accent,
                            borderWidth: 2.5,
                            transform: [{ scale: 1.05 }],
                          },
                        ]}>
                        <Text style={indexStyles.moodEmoji}>{m.emoji}</Text>
                      </View>
                      <Text
                        style={[
                          indexStyles.moodLabel,
                          { color: themeColors.text, opacity: active ? 1 : 0.7 },
                        ]}>
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
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
                <Text style={[indexStyles.viewAllText, { color: themeColors.accent }]}>View All</Text>
                <Ionicons name="chevron-forward" size={14} color={themeColors.accent} />
              </Pressable>
            </View>

            {recentEntries.length === 0 ? (
              <View
                style={{ backgroundColor: themeColors.surface, borderRadius: 16, padding: 24, alignItems: 'center' }}>
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
                <Text style={{ color: themeColors.text, fontFamily: 'PoppinsBold', fontSize: 16, marginBottom: 4 }}>
                  Start Your Journey
                </Text>
                <Text style={{ color: themeColors.text, opacity: 0.6, fontFamily: 'RobotoRegular', fontSize: 12, textAlign: 'center' }}>
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
  icon,
  iconColor,
  value,
  label,
  hint,
  hintColor,
  themeColors,
  valueIsText = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
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
      <View style={[indexStyles.statIconCircle, { backgroundColor: iconColor + '25' }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            indexStyles.statValue,
            { color: themeColors.text, fontSize: valueIsText ? 14 : 18 },
          ]}
          numberOfLines={1}>
          {value}
        </Text>
        <Text style={[indexStyles.statLabel, { color: themeColors.text }]} numberOfLines={1}>
          {label}
        </Text>
        <Text
          style={[
            indexStyles.statHint,
            { color: hintColor ?? themeColors.text + '99' },
          ]}
          numberOfLines={1}>
          {hint}
        </Text>
      </View>
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
    borderRadius: 20,
    padding: 18,
    paddingRight: 20,
    minHeight: 170,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  heroIllustration: {
    position: 'absolute',
    right: 14,
    top: 18,
    width: 90,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookShadow: {
    position: 'absolute',
    width: 70,
    height: 80,
    borderRadius: 8,
    transform: [{ translateX: 4 }, { translateY: 6 }],
  },
  bookCover: {
    width: 60,
    height: 76,
    borderRadius: 6,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  bookSpine: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    width: 4,
    borderRadius: 2,
  },
  bookStrap: {
    position: 'absolute',
    right: -3,
    top: 28,
    width: 8,
    height: 18,
    borderRadius: 2,
  },
  heroEyebrow: {
    fontFamily: 'RobotoMedium',
    fontSize: 12,
    marginLeft: 6,
  },
  heroTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 20,
    lineHeight: 26,
    marginTop: 2,
  },
  heroSubtitle: {
    fontFamily: 'RobotoRegular',
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  heroButtonText: {
    color: '#fff',
    fontFamily: 'PoppinsBold',
    fontSize: 13,
  },

  // Stats
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 168,
    borderWidth: 1,
    gap: 10,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'PoppinsBold',
    lineHeight: 22,
  },
  statLabel: {
    fontFamily: 'RobotoMedium',
    fontSize: 11,
  },
  statHint: {
    fontFamily: 'RobotoRegular',
    fontSize: 9,
    marginTop: 1,
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
    flex: 1,
    fontFamily: 'PoppinsRegular',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  promptButtonText: {
    fontFamily: 'PoppinsBold',
    fontSize: 11,
  },
  needIdeasText: {
    fontFamily: 'RobotoMedium',
    fontSize: 11,
    marginLeft: 4,
  },

  // Mood selector
  moodCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  moodTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 13,
    marginBottom: 12,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontFamily: 'RobotoMedium',
    fontSize: 10,
    marginTop: 6,
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
