import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { selectEntries } from '~/store/slices/diarySlice';
import { moodScore, MOODS, getMoodMeta } from '~/util/moods';
import AdBanner from '~/components/AdBanner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRAPH_HEIGHT = 220;
const PADDING = 20;
const Y_AXIS_WIDTH = 60;
const GRAPH_WIDTH = SCREEN_WIDTH - (PADDING * 2) - (16 * 2) - Y_AXIS_WIDTH;

type TimePeriod = '7d' | '1m' | '2m';

interface MoodTrendPoint {
  date: string;
  day: number;
  score: number;
  hasData: boolean;
  moodCount: number;
  dominantMood?: string;
}

interface TrendAnalysis {
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  streakDays: number;
  averageScore: number;
  moodDistribution: Record<string, number>;
  insights: string[];
}

const InsightsScreen = () => {
  const themeColors = useAppSelector(selectThemeColors);
  const entries = useAppSelector(selectEntries);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1m');

  const timeRanges = {
    '7d': { days: 7, label: '7 Days' },
    '1m': { days: 30, label: '1 Month' },
    '2m': { days: 60, label: '2 Months' }
  };

  const moodData = useMemo(() => {
    const periodDays = timeRanges[selectedPeriod].days;
    const dataPoints: MoodTrendPoint[] = [];
    const now = new Date();
    
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const entry = entries.find((e) => e.date === dateString);
      let avgScore = 0;
      let hasData = false;
      let moodCount = 0;
      let dominantMood: string | undefined;
      
      if (entry && entry.moods && entry.moods.length > 0) {
        // Calculate average score (invert for better visualization)
        const scores = entry.moods.map((m) => 6 - moodScore(m.mood));
        avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        hasData = true;
        moodCount = entry.moods.length;
        
        // Find dominant mood
        const moodCounts = entry.moods.reduce((acc, m) => {
          acc[m.mood] = (acc[m.mood] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        dominantMood = Object.keys(moodCounts).reduce((a, b) => 
          moodCounts[a] > moodCounts[b] ? a : b
        );
      }
      
      dataPoints.push({
        date: dateString,
        day: date.getDate(),
        score: avgScore,
        hasData,
        moodCount,
        dominantMood
      });
    }
    return dataPoints;
  }, [entries, selectedPeriod]);

  const trendAnalysis = useMemo((): TrendAnalysis => {
    const validPoints = moodData.filter(d => d.hasData);
    if (validPoints.length < 3) {
      return {
        trend: 'stable',
        streakDays: 0,
        averageScore: 0,
        moodDistribution: {},
        insights: ['Start tracking more consistently to see meaningful trends!']
      };
    }

    // Calculate trend direction
    const recentScores = validPoints.slice(-7).map(p => p.score);
    const olderScores = validPoints.slice(0, Math.min(7, validPoints.length - 7)).map(p => p.score);
    
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.length > 0 
      ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length 
      : recentAvg;
    
    const difference = recentAvg - olderAvg;
    const volatility = calculateVolatility(validPoints.map(p => p.score));
    
    let trend: 'improving' | 'declining' | 'stable' | 'volatile';
    if (volatility > 1.2) {
      trend = 'volatile';
    } else if (difference > 0.3) {
      trend = 'improving';
    } else if (difference < -0.3) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    // Calculate mood distribution
    const allMoods = entries
      .filter(e => e.moods && e.moods.length > 0)
      .flatMap(e => e.moods!)
      .map(m => m.mood);
    
    const moodDistribution = allMoods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate streak
    const streakDays = calculateCurrentStreak(moodData);
    const averageScore = validPoints.reduce((sum, p) => sum + p.score, 0) / validPoints.length;

    // Generate insights
    const insights = generateInsights(trend, streakDays, averageScore, moodDistribution, validPoints);

    return {
      trend,
      streakDays,
      averageScore,
      moodDistribution,
      insights
    };
  }, [moodData, entries]);

  const calculateVolatility = (scores: number[]): number => {
    if (scores.length < 2) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  };

  const calculateCurrentStreak = (data: MoodTrendPoint[]): number => {
    let streak = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].hasData) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const generateInsights = (
    trend: string, 
    streak: number, 
    avgScore: number, 
    moodDist: Record<string, number>,
    validPoints: MoodTrendPoint[]
  ): string[] => {
    const insights: string[] = [];
    
    // Trend insights
    switch (trend) {
      case 'improving':
        insights.push('Your mood has been trending upward lately! Keep up the positive momentum.');
        break;
      case 'declining':
        insights.push('You\'ve been experiencing some challenging times recently. Consider what might be contributing to this pattern.');
        break;
      case 'volatile':
        insights.push('Your mood has been quite variable. This is normal, but tracking patterns might help you understand triggers.');
        break;
      case 'stable':
        insights.push('Your mood has been relatively consistent, which shows good emotional stability.');
        break;
    }

    // Streak insights
    if (streak >= 7) {
      insights.push(`Excellent! You've been consistently tracking for ${streak} days. This commitment helps build self-awareness.`);
    } else if (streak >= 3) {
      insights.push(`Great progress with ${streak} consecutive days of tracking! Try to keep the momentum going.`);
    }

    // Mood distribution insights
    const totalMoods = Object.values(moodDist).reduce((a, b) => a + b, 0);
    const dominantMood = Object.keys(moodDist).reduce((a, b) => 
      moodDist[a] > moodDist[b] ? a : b, 'happy'
    );
    
    if (totalMoods > 0) {
      const dominantPercentage = (moodDist[dominantMood] / totalMoods) * 100;
      const moodMeta = getMoodMeta(dominantMood as any);
      
      if (dominantPercentage > 40) {
        insights.push(`Your most frequent mood has been "${moodMeta?.label}" (${Math.round(dominantPercentage)}%). This might reflect your current life circumstances.`);
      }
    }

    // Weekly patterns
    const recentWeek = validPoints.slice(-7);
    if (recentWeek.length >= 5) {
      const weekAvg = recentWeek.reduce((sum, p) => sum + p.score, 0) / recentWeek.length;
      if (weekAvg > 4) {
        insights.push('This past week has been particularly positive for you. What\'s been going well?');
      } else if (weekAvg < 2.5) {
        insights.push('This past week seems to have been challenging. Remember that difficult periods are temporary.');
      }
    }

    // Activity insights
    const daysWithMultipleMoods = validPoints.filter(p => p.moodCount > 1).length;
    if (daysWithMultipleMoods > validPoints.length * 0.3) {
      insights.push('You often experience multiple moods per day, which is completely natural and shows emotional depth.');
    }

    return insights.slice(0, 3); // Limit to 3 insights
  };

  const renderTimePeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(Object.keys(timeRanges) as TimePeriod[]).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            {
              backgroundColor: selectedPeriod === period 
                ? themeColors.accent 
                : themeColors.surface,
              borderColor: themeColors.accent + '30',
            }
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            { 
              color: selectedPeriod === period 
                ? '#fff' 
                : themeColors.text 
            }
          ]}>
            {timeRanges[period].label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTrendIndicator = () => {
    const { trend } = trendAnalysis;
    const icons = {
      improving: 'trending-up',
      declining: 'trending-down', 
      stable: 'remove',
      volatile: 'pulse'
    };
    
    const colors = {
      improving: '#10B981',
      declining: '#EF4444',
      stable: '#6B7280',
      volatile: '#F59E0B'
    };

    return (
      <View style={styles.trendIndicator}>
        <Ionicons 
          name={icons[trend] as any} 
          size={20} 
          color={colors[trend]} 
        />
        <Text style={[
          styles.trendText, 
          { color: colors[trend] }
        ]}>
          {trend.charAt(0).toUpperCase() + trend.slice(1)}
        </Text>
      </View>
    );
  };

  const renderGraph = () => {
    const points = moodData.map((d, i) => {
      const x = (i / Math.max(moodData.length - 1, 1)) * GRAPH_WIDTH;
      // score is 0 to 5. 0 means no data.
      const y = !d.hasData 
        ? GRAPH_HEIGHT 
        : GRAPH_HEIGHT - ((d.score - 1) / 4) * GRAPH_HEIGHT;
      return { x, y, score: d.score, hasData: d.hasData, dominantMood: d.dominantMood };
    });

    // Create smooth curve segments
    const validPoints = points.filter(p => p.hasData);
    
    return (
      <View style={[styles.graphContainer, { height: GRAPH_HEIGHT + 40 }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={[styles.axisLabel, { color: themeColors.text }]}>Great</Text>
          <Text style={[styles.axisLabel, { color: themeColors.text }]}>Good</Text>
          <Text style={[styles.axisLabel, { color: themeColors.text }]}>Okay</Text>
          <Text style={[styles.axisLabel, { color: themeColors.text }]}>Low</Text>
          <Text style={[styles.axisLabel, { color: themeColors.text }]}>Stressed</Text>
        </View>

        <View style={styles.graphWrapper}>
          {/* Grid lines */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => (
            <View
              key={p}
              style={[
                styles.gridLine,
                { top: p * GRAPH_HEIGHT, backgroundColor: themeColors.text + '08' },
              ]}
            />
          ))}

          {/* Trend area fill */}
          {validPoints.length > 1 && (
            <View style={styles.trendArea}>
              {validPoints.map((point, i) => {
                if (i === 0) return null;
                const prev = validPoints[i - 1];
                const areaHeight = Math.max(point.y, prev.y);
                
                return (
                  <View
                    key={`area-${i}`}
                    style={[
                      styles.areaSegment,
                      {
                        left: prev.x,
                        top: areaHeight,
                        width: point.x - prev.x,
                        height: GRAPH_HEIGHT - areaHeight,
                        backgroundColor: themeColors.accent + '15',
                      }
                    ]}
                  />
                );
              })}
            </View>
          )}

          {/* The line graph */}
          <View style={styles.lineWrapper}>
            {validPoints.map((p, i) => {
              if (i === 0) return null;
              const prev = validPoints[i - 1];

              const dx = p.x - prev.x;
              const dy = p.y - prev.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx);

              return (
                <View
                  key={i}
                  style={[
                    styles.lineSegment,
                    {
                      width: distance,
                      left: prev.x,
                      top: prev.y,
                      transform: [{ rotate: `${angle}rad` }],
                      backgroundColor: themeColors.accent,
                    },
                  ]}
                />
              );
            })}

            {/* Data points with mood indicators */}
            {points.map((p, i) => {
              if (!p.hasData) return null;
              
              const moodMeta = p.dominantMood ? getMoodMeta(p.dominantMood as any) : null;
              
              return (
                <View key={`dot-${i}`} style={{ position: 'absolute', left: p.x - 8, top: p.y - 8 }}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: moodMeta?.color || themeColors.accent,
                        borderColor: themeColors.background,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.dotInner,
                      { backgroundColor: themeColors.background }
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* X-axis labels */}
          <View style={styles.xAxis}>
            {moodData.map((d, i) => {
              const showLabel = selectedPeriod === '7d' 
                ? (i % 1 === 0)
                : selectedPeriod === '1m' 
                  ? (i % 5 === 0 || i === moodData.length - 1)
                  : (i % 10 === 0 || i === moodData.length - 1);
              
              return showLabel && (
                <Text
                  key={i}
                  style={[
                    styles.xAxisLabel,
                    { 
                      left: (i / Math.max(moodData.length - 1, 1)) * GRAPH_WIDTH - 10, 
                      color: themeColors.text + '60'
                    },
                  ]}>
                  {d.day}
                </Text>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Time Period Selector */}
        {renderTimePeriodSelector()}

        {/* Main Mood Trends Card */}
        <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>Mood Trends</Text>
              <Text style={[styles.cardSubtitle, { color: themeColors.text, opacity: 0.6 }]}>
                Tracking your emotional patterns over {timeRanges[selectedPeriod].label.toLowerCase()}
              </Text>
            </View>
            {renderTrendIndicator()}
          </View>
          
          {renderGraph()}
          
          {/* Mood Legend */}
          <View style={styles.legend}>
            {MOODS.slice(0, 5).map((m) => (
              <View key={m.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                <Text style={[styles.legendLabel, { color: themeColors.text }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.statValue, { color: themeColors.accent }]}>
              {trendAnalysis.streakDays}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.text }]}>Day Streak</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.statValue, { color: themeColors.accent }]}>
              {trendAnalysis.averageScore > 0 ? trendAnalysis.averageScore.toFixed(1) : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.text }]}>Avg. Mood</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.statValue, { color: themeColors.accent }]}>
              {Object.keys(trendAnalysis.moodDistribution).length}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.text }]}>Mood Types</Text>
          </View>
        </View>

        {/* Insights Summary */}
        <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Personal Insights</Text>
          {trendAnalysis.insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <View style={[styles.insightBullet, { backgroundColor: themeColors.accent }]} />
              <Text style={[styles.insightText, { color: themeColors.text }]}>
                {insight}
              </Text>
            </View>
          ))}
        </View>

        {/* Mood Distribution */}
        {Object.keys(trendAnalysis.moodDistribution).length > 0 && (
          <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Mood Distribution</Text>
            <View style={styles.distributionList}>
              {Object.entries(trendAnalysis.moodDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([mood, count]) => {
                  const moodMeta = getMoodMeta(mood as any);
                  const total = Object.values(trendAnalysis.moodDistribution).reduce((a, b) => a + b, 0);
                  const percentage = (count / total) * 100;
                  
                  return (
                    <View key={mood} style={styles.distributionItem}>
                      <View style={styles.distributionLeft}>
                        <View style={[styles.distributionDot, { backgroundColor: moodMeta?.color }]} />
                        <Text style={[styles.distributionLabel, { color: themeColors.text }]}>
                          {moodMeta?.label}
                        </Text>
                      </View>
                      <View style={styles.distributionRight}>
                        <Text style={[styles.distributionCount, { color: themeColors.text }]}>
                          {Math.round(percentage)}%
                        </Text>
                        <View style={[styles.distributionBar, { backgroundColor: themeColors.accent + '20' }]}>
                          <View 
                            style={[
                              styles.distributionProgress,
                              { 
                                width: `${percentage}%`,
                                backgroundColor: moodMeta?.color || themeColors.accent 
                              }
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        <AdBanner />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 12,
    fontFamily: 'RobotoMedium',
    fontWeight: '600',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'RobotoRegular',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  trendText: {
    fontSize: 12,
    fontFamily: 'RobotoMedium',
    fontWeight: '600',
  },
  graphContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  yAxis: {
    width: Y_AXIS_WIDTH,
    height: GRAPH_HEIGHT,
    justifyContent: 'space-between',
    paddingVertical: 0,
  },
  axisLabel: {
    fontSize: 10,
    fontFamily: 'RobotoMedium',
    opacity: 0.5,
  },
  graphWrapper: {
    flex: 1,
    height: GRAPH_HEIGHT + 30,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  trendArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 30,
  },
  areaSegment: {
    position: 'absolute',
  },
  lineWrapper: {
    height: GRAPH_HEIGHT,
    width: GRAPH_WIDTH,
  },
  lineSegment: {
    position: 'absolute',
    height: 3,
    borderRadius: 1.5,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    position: 'absolute',
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 5,
    left: 5,
  },
  xAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    fontFamily: 'RobotoMedium',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 30,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: 'RobotoRegular',
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'PoppinsBold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'RobotoMedium',
    opacity: 0.7,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'RobotoRegular',
    lineHeight: 20,
    opacity: 0.8,
  },
  distributionList: {
    marginTop: 16,
    gap: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  distributionLabel: {
    fontSize: 14,
    fontFamily: 'RobotoMedium',
  },
  distributionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 20,
  },
  distributionCount: {
    fontSize: 12,
    fontFamily: 'RobotoMedium',
    minWidth: 30,
    textAlign: 'right',
  },
  distributionBar: {
    height: 4,
    borderRadius: 2,
    flex: 1,
    overflow: 'hidden',
  },
  distributionProgress: {
    height: '100%',
    borderRadius: 2,
  },
});

export default InsightsScreen;
