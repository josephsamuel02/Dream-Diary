import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { selectEntries } from '~/store/slices/diarySlice';
import { moodScore, MOODS } from '~/util/moods';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRAPH_HEIGHT = 200;
const PADDING = 20;
const Y_AXIS_WIDTH = 60;
// Subtract card padding (20+20), outer screen padding (16+16), and Y-axis
const GRAPH_WIDTH = SCREEN_WIDTH - (PADDING * 2) - (16 * 2) - Y_AXIS_WIDTH;

const InsightsScreen = () => {
  const themeColors = useAppSelector(selectThemeColors);
  const entries = useAppSelector(selectEntries);

  const moodData = useMemo(() => {
    const last30Days = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const entry = entries.find((e) => e.date === dateString);
      let avgScore = 0;
      
      if (entry && entry.moods && entry.moods.length > 0) {
        // moodScore returns 1 for Great, 5 for Stressed.
        // We want 5 for Great, 1 for Stressed for the graph.
        const scores = entry.moods.map((m) => 6 - moodScore(m.mood));
        avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      } else if (entry && entry.mood) {
        avgScore = 6 - moodScore(entry.mood);
      }
      
      last30Days.push({
        date: dateString,
        day: date.getDate(),
        score: avgScore, // 0 if no data
      });
    }
    return last30Days;
  }, [entries]);

  const renderGraph = () => {
    const points = moodData.map((d, i) => {
      const x = (i / (moodData.length - 1)) * GRAPH_WIDTH;
      // score is 0 to 5. 0 means no data.
      // We'll map 1-5 to the graph height.
      const y = d.score === 0 
        ? GRAPH_HEIGHT 
        : GRAPH_HEIGHT - ((d.score - 1) / 4) * GRAPH_HEIGHT;
      return { x, y, score: d.score };
    });

    return (
      <View style={[styles.graphContainer, { height: GRAPH_HEIGHT + 40 }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={[styles.axisLabel, { color: themeColors.text }]}>Great</Text>
          <Text style={[styles.axisLabel, { color: themeColors.text }]}>Okay</Text>
          <Text style={[styles.axisLabel, { color: themeColors.text }]}>Stressed</Text>
        </View>

        <View style={styles.graphWrapper}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <View
              key={p}
              style={[
                styles.gridLine,
                { top: p * GRAPH_HEIGHT, backgroundColor: themeColors.text + '10' },
              ]}
            />
          ))}

          {/* The line graph */}
          <View style={styles.lineWrapper}>
            {points.map((p, i) => {
              if (i === 0) return null;
              const prev = points[i - 1];
              if (p.score === 0 || prev.score === 0) return null;

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

            {/* Data points */}
            {points.map((p, i) => (
              p.score > 0 && (
                <View
                  key={`dot-${i}`}
                  style={[
                    styles.dot,
                    {
                      left: p.x - 3,
                      top: p.y - 3,
                      backgroundColor: themeColors.accent,
                      borderColor: themeColors.background,
                    },
                  ]}
                />
              )
            ))}
          </View>

          {/* X-axis labels (selected days) */}
          <View style={styles.xAxis}>
            {moodData.map((d, i) => (
              (i % 5 === 0 || i === moodData.length - 1) && (
                <Text
                  key={i}
                  style={[
                    styles.xAxisLabel,
                    { left: (i / (moodData.length - 1)) * GRAPH_WIDTH - 10, color: themeColors.text },
                  ]}>
                  {d.day}
                </Text>
              )
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Mood Trends</Text>
          <Text style={[styles.cardSubtitle, { color: themeColors.text, opacity: 0.6 }]}>
            Average mood movement over the last 30 days
          </Text>
          
          {renderGraph()}
          
          <View style={styles.legend}>
            {MOODS.map((m) => (
              <View key={m.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                <Text style={[styles.legendLabel, { color: themeColors.text }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: themeColors.surface, marginTop: 16 }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Insights Summary</Text>
          <Text style={[styles.cardText, { color: themeColors.text, opacity: 0.8 }]}>
            {entries.length > 0 
              ? "Your mood has been relatively stable. Keep tracking to see more patterns!"
              : "Start writing in your diary to see your mood trends here."}
          </Text>
        </View>
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
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'RobotoRegular',
    marginBottom: 24,
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
  lineWrapper: {
    height: GRAPH_HEIGHT,
    width: GRAPH_WIDTH,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
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
    opacity: 0.5,
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
  cardText: {
    fontSize: 14,
    fontFamily: 'RobotoRegular',
    lineHeight: 20,
  },
});

export default InsightsScreen;
