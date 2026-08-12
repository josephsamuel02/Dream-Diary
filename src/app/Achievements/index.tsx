import { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSelector } from '~/store/hooks';
import { selectCurrentTheme, selectThemeColors } from '~/store/slices/themeSlice';
import { useAchievements } from '~/hooks/useAchievements';
import { BADGES, REQUIRED_ENTRIES_PER_DAY } from '~/constants/badges';
import type { Badge } from '~/constants/badges';
import MainTab from '~/components/mainTab';

// ─── Motivational text per progress tier ─────────────────────────────────────
function getMotivation(completedDays: number): string {
  if (completedDays === 0)
    return 'Write 3 entries in a single day to earn your first achievement day!';
  if (completedDays < 3) return 'Great start! Keep showing up every day.';
  if (completedDays < 10) return "You're building a powerful journaling habit.";
  if (completedDays < 30) return 'Your consistency is truly inspiring. Keep going!';
  if (completedDays < 75) return 'Few people reach this level. You are exceptional.';
  return 'You are a journaling legend. Nothing can stop you.';
}

// ─── Single badge card ────────────────────────────────────────────────────────
const BadgeCard = ({
  badge,
  unlocked,
  themeColors,
}: {
  badge: Badge;
  unlocked: boolean;
  themeColors: ReturnType<typeof selectThemeColors>;
}) => {
  const scaleAnim = useRef(new Animated.Value(unlocked ? 1 : 0.97)).current;

  useEffect(() => {
    if (unlocked) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [unlocked]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View
        style={[
          styles.badgeCard,
          {
            backgroundColor: themeColors.surface,
            borderColor: unlocked ? badge.color + '40' : themeColors.text + '10',
          },
        ]}>
        {/* Left: icon */}
        <View
          style={[
            styles.badgeIconWrap,
            {
              backgroundColor: unlocked ? badge.color + '20' : themeColors.text + '08',
            },
          ]}>
          {unlocked ? (
            <Text style={styles.badgeEmojiLg}>{badge.icon}</Text>
          ) : (
            <Ionicons name="lock-closed" size={22} color={themeColors.text + '30'} />
          )}
        </View>

        {/* Center: title + description */}
        <View style={styles.badgeInfo}>
          <Text
            style={[
              styles.badgeTitle,
              {
                color: unlocked ? themeColors.text : themeColors.text + '40',
              },
            ]}>
            {badge.title}
          </Text>
          <Text
            style={[
              styles.badgeDesc,
              { color: unlocked ? themeColors.text + '70' : themeColors.text + '25' },
            ]}
            numberOfLines={2}>
            {badge.description}
          </Text>
        </View>

        {/* Right: checkmark or lock */}
        {unlocked && (
          <View style={[styles.checkCircle, { backgroundColor: badge.color + '20' }]}>
            <Ionicons name="checkmark" size={16} color={badge.color} />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({
  percent,
  color,
  themeColors,
}: {
  percent: number;
  color: string;
  themeColors: ReturnType<typeof selectThemeColors>;
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percent,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  return (
    <View style={[styles.progressTrack, { backgroundColor: themeColors.text + '12' }]}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────
const AchievementsScreen = () => {
  const themeColors = useAppSelector(selectThemeColors);
  const currentTheme = useAppSelector(selectCurrentTheme);
  const isDarkTheme = currentTheme === 'dark' || currentTheme === 'midnight';
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  const {
    todayCount,
    completedDays,
    unlockedBadges,
    hasCompletedToday,
    nextBadge,
    progressPercent,
    totalCompletedDays,
  } = useAchievements();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const todayProgress = Math.min(todayCount, REQUIRED_ENTRIES_PER_DAY);
  const todayPercent = Math.round((todayProgress / REQUIRED_ENTRIES_PER_DAY) * 100);
  const nextBadgeColor = nextBadge?.color ?? themeColors.accent;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}>
          {/* ── Summary hero card ───────────────────────────── */}
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <LinearGradient
              colors={[themeColors.surface, themeColors.background, themeColors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroCard, { borderColor: themeColors.accent + '25' }]}>
              {/* Total days badge */}
              <View style={[styles.totalBadge, { backgroundColor: themeColors.accent + '18' }]}>
                <Text style={styles.totalBadgeEmoji}>🏅</Text>
                <View>
                  <Text style={[styles.totalCount, { color: themeColors.accent }]}>
                    {totalCompletedDays}
                  </Text>
                  <Text style={[styles.totalLabel, { color: themeColors.text }]}>
                    Achievement {totalCompletedDays === 1 ? 'Day' : 'Days'}
                  </Text>
                </View>
              </View>

              {/* Motivation */}
              <Text style={[styles.motivationText, { color: themeColors.text }]}>
                {getMotivation(totalCompletedDays)}
              </Text>

              {/* Badges earned */}
              <View style={styles.earnedRow}>
                <Ionicons name="ribbon" size={13} color={themeColors.accent} />
                <Text style={[styles.earnedText, { color: themeColors.accent }]}>
                  {unlockedBadges.length}/{BADGES.length} badges earned
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* ── Today's progress card ───────────────────────── */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: hasCompletedToday ? '#10B981' + '40' : themeColors.accent + '20',
                },
              ]}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={hasCompletedToday ? 'checkmark-circle' : 'today-outline'}
                    size={16}
                    color={hasCompletedToday ? '#10B981' : themeColors.accent}
                  />
                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                    Today's Progress
                  </Text>
                </View>
                <Text
                  style={[
                    styles.cardBadge,
                    {
                      backgroundColor: hasCompletedToday
                        ? '#10B981' + '20'
                        : themeColors.accent + '15',
                      color: hasCompletedToday ? '#10B981' : themeColors.accent,
                    },
                  ]}>
                  {hasCompletedToday ? '✓ Complete!' : 'In progress'}
                </Text>
              </View>

              {!hasCompletedToday && (
                <ProgressBar
                  percent={todayPercent}
                  color={themeColors.accent}
                  themeColors={themeColors}
                />
              )}

              {hasCompletedToday && (
                <Text style={[styles.progressHint, { color: '#10B981' }]}>
                  You completed today's achievement! Come back tomorrow to keep the streak going.
                </Text>
              )}

              <TouchableOpacity
                onPress={() => router.push('/')}
                activeOpacity={0.85}
                style={{ alignSelf: 'flex-start', marginTop: 12 }}>
                <LinearGradient
                  colors={[themeColors.accent, themeColors.accent + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.writeButton}>
                  <Ionicons name="create-outline" size={14} color="#000" />
                  <Text style={styles.writeButtonText}>Write in Diary</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Next badge progress ─────────────────────────── */}
          {nextBadge && (
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: themeColors.surface, borderColor: nextBadgeColor + '25' },
                ]}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16 }}>{nextBadge.icon}</Text>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                      Next: {nextBadge.title}
                    </Text>
                  </View>
                  <Text style={[styles.progressPercent, { color: nextBadgeColor }]}>
                    {progressPercent}%
                  </Text>
                </View>

                <ProgressBar
                  percent={progressPercent}
                  color={nextBadgeColor}
                  themeColors={themeColors}
                />
              </View>
            </View>
          )}

          {/* ── Badge list ──────────────────────────────────── */}
          <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy-outline" size={14} color={themeColors.accent} />
              <Text style={[styles.sectionTitle, { color: themeColors.accent }]}>ALL BADGES</Text>
            </View>

            <View style={{ gap: 10 }}>
              {BADGES.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  unlocked={unlockedBadges.includes(badge.id)}
                  themeColors={themeColors}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      <MainTab />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  heroCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  totalBadgeEmoji: {
    fontSize: 32,
  },
  totalCount: {
    fontFamily: 'PoppinsBold',
    fontSize: 28,
    lineHeight: 32,
  },
  totalLabel: {
    fontFamily: 'RobotoRegular',
    fontSize: 12,
    opacity: 0.7,
  },
  motivationText: {
    fontFamily: 'RobotoRegular',
    fontSize: 13,
    opacity: 0.75,
    lineHeight: 20,
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  earnedText: {
    fontFamily: 'RobotoMedium',
    fontSize: 12,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'RobotoMedium',
    fontSize: 14,
  },
  cardBadge: {
    fontFamily: 'RobotoMedium',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  progressPercent: {
    fontFamily: 'PoppinsBold',
    fontSize: 14,
  },
  progressHint: {
    fontFamily: 'RobotoRegular',
    fontSize: 12,
    opacity: 0.65,
    marginTop: 8,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
  },
  writeButtonText: {
    color: '#000',
    fontFamily: 'PoppinsBold',
    fontSize: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'RobotoMedium',
    fontSize: 11,
    letterSpacing: 1.2,
  },

  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeEmojiLg: {
    fontSize: 28,
  },
  badgeInfo: {
    flex: 1,
    gap: 3,
  },
  badgeTitle: {
    fontFamily: 'RobotoMedium',
    fontSize: 14,
  },
  badgeDesc: {
    fontFamily: 'RobotoRegular',
    fontSize: 11,
    lineHeight: 16,
  },
  badgeReq: {
    fontFamily: 'RobotoMedium',
    fontSize: 11,
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default AchievementsScreen;
