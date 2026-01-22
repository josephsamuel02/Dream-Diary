/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { greetingsByTime, QUOTE_API_URL } from '../util/greetings';
import { useAppSelector } from '~/store/hooks';
import { selectEntries } from '~/store/slices/diarySlice';
import {
  selectThemeColors,
  selectBackgroundImage,
  selectBackgroundOpacity,
} from '~/store/slices/themeSlice';
import MainTab from '~/components/mainTab';
import HistoryItem from '~/components/historyItem';

const { width, height } = Dimensions.get('window');

const Index = () => {
  const router = useRouter();
  const quotesRef = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [quotes, setQuotes] = useState<{ text: string; author: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Theme
  const themeColors = useAppSelector(selectThemeColors);
  const backgroundImage = useAppSelector(selectBackgroundImage);
  const backgroundOpacity = useAppSelector(selectBackgroundOpacity);
  const [greeting, setGreeting] = useState('');
  const entriesRaw = useAppSelector(selectEntries);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    let group: keyof typeof greetingsByTime;

    if (hour >= 5 && hour < 12) group = 'morning';
    else if (hour >= 12 && hour < 18) group = 'afternoon';
    else group = 'evening';

    const greetings = [...greetingsByTime[group], ...greetingsByTime.anytime];
    const randomIndex = Math.floor(Math.random() * greetings.length);
    setGreeting(greetings[randomIndex]);
  }, []);

  // Fetch multiple quotes from ZenQuotes
  useEffect(() => {
    fetch(QUOTE_API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map((q: any) => ({
            text: q.q,
            author: q.a,
          }));
          setQuotes(formatted.slice(0, 15));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Auto scroll through quotes
  useEffect(() => {
    if (!quotes.length) return;
    const id = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % quotes.length;
      setCurrentQuoteIndex(indexRef.current);
      try {
        quotesRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
      } catch (e) {
        // ignore
      }
    }, 18000);
    return () => clearInterval(id);
  }, [quotes]);

  // Sorted diary entries
  const entries = useMemo(() => {
    return [...(entriesRaw ?? [])].sort((a, b) => {
      const ta = a?.date ? new Date(a.date).getTime() : 0;
      const tb = b?.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });
  }, [entriesRaw]);

  const openEntryForEditing = useCallback(
    (entryId: string) => {
      router.push(`/DiaryInput?entryId=${encodeURIComponent(entryId)}`);
    },
    [router]
  );

  // Get current date info
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Stats
  const totalEntries = entries.length;
  const thisWeekEntries = entries.filter((e) => {
    const entryDate = new Date(e.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  }).length;

  // Render each quote - now uses theme colors
  const renderQuote = useCallback(
    ({ item, index }: { item: { text: string; author: string }; index: number }) => {
      // Create variations based on the current theme
      const baseAccent = themeColors.accent;
      const baseText = themeColors.text;
      
      // Generate theme-based gradient variations
      const getThemeVariation = (idx: number) => {
        const variations = [
          { 
            colors: [themeColors.headerGradient[0], themeColors.headerGradient[1], themeColors.headerGradient[0] + 'E0'],
            accent: '#fff',
            textColor: '#fff',
          },
          { 
            colors: [themeColors.surface, themeColors.background, themeColors.surface],
            accent: themeColors.accent,
            textColor: themeColors.text,
          },
          { 
            colors: [themeColors.accent + '20', themeColors.accent + '10', themeColors.surface],
            accent: themeColors.accent,
            textColor: themeColors.text,
          },
        ];
        return variations[idx % variations.length];
      };
      
      const variation = getThemeVariation(index);

      return (
        <View style={{ width: width - 40 }} className="mx-1">
          <LinearGradient
            colors={variation.colors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              minHeight: 110,
              borderRadius: 18,
              padding: 16,
              position: 'relative',
              overflow: 'hidden',
              shadowColor: themeColors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
              borderWidth: index % 3 === 1 ? 1 : 0,
              borderColor: themeColors.accent + '20',
            }}>
            {/* Decorative elements */}
            <View
              style={{
                position: 'absolute',
                top: -25,
                right: -25,
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: variation.accent,
                opacity: 0.1,
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: -15,
                left: -15,
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: variation.accent,
                opacity: 0.06,
              }}
            />
            
            {/* Quote icon */}
            <View style={{ position: 'absolute', top: 12, left: 14, opacity: 0.15 }}>
              <Ionicons name="chatbubble-ellipses" size={20} color={variation.accent} />
            </View>

            {/* Quote content */}
            <View style={{ flex: 1, justifyContent: 'center', paddingTop: 4 }}>
              <Text
                style={{
                  fontFamily: 'PoppinsRegular',
                  fontSize: 13,
                  lineHeight: 21,
                  color: variation.textColor,
                  fontStyle: 'italic',
                }}
                numberOfLines={3}>
                "{item.text}"
              </Text>
            </View>

            {/* Author section */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                marginTop: 10,
              }}>
              <View
                style={{
                  width: 20,
                  height: 2,
                  backgroundColor: variation.accent,
                  marginRight: 10,
                  borderRadius: 1,
                  opacity: 0.6,
                }}
              />
              <Text
                style={{
                  fontFamily: 'RobotoMedium',
                  fontSize: 11,
                  color: variation.accent,
                  letterSpacing: 0.5,
                  opacity: index % 3 === 0 ? 0.9 : 1,
                }}>
                {item.author && item.author !== 'Unknown' ? item.author : 'Anonymous'}
              </Text>
            </View>
          </LinearGradient>
        </View>
      );
    },
    [themeColors]
  );

  // Quote pagination dots - now uses theme colors
  const renderDots = () => (
    <View className="mt-3 flex-row items-center justify-center">
      {quotes.slice(0, 5).map((_, i) => {
        const isActive = i === currentQuoteIndex % 5;
        return (
          <View
            key={i}
            style={{
              width: isActive ? 18 : 6,
              height: 6,
              borderRadius: 3,
              marginHorizontal: 3,
              backgroundColor: isActive ? themeColors.accent : themeColors.accent + '30',
            }}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[indexStyles.container, { backgroundColor: themeColors.background }]}>
      {/* Background Image */}
      {backgroundImage && (
        <Image
          source={{ uri: backgroundImage }}
          style={[indexStyles.backgroundImage, { opacity: backgroundOpacity }]}
          resizeMode="cover"
        />
      )}

      {/* Decorative background elements */}
      <View
        style={[
          indexStyles.decorCircle1,
          { backgroundColor: themeColors.accent + '08' },
        ]}
      />
      <View
        style={[
          indexStyles.decorCircle2,
          { backgroundColor: themeColors.accent + '05' },
        ]}
      />

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        {/* Header Section */}
        <View className="px-5 pt-4">
          {/* Date & Greeting */}
          <View className="mb-1">
            <Text
              style={{ color: themeColors.accent }}
              className="font-roboto text-xs uppercase tracking-widest">
              {dayName}
            </Text>
            <Text style={{ color: themeColors.text }} className="font-poppins-bold text-2xl">
              {monthDay}
            </Text>
          </View>

          <Text style={{ color: themeColors.text, opacity: 0.7 }} className="mb-4 font-poppins text-base">
            {greeting}
          </Text>

          {/* Stats Cards */}
          <View className="mb-4 flex-row gap-2">
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: themeColors.surface,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: themeColors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                <Ionicons name="journal" size={16} color="#fff" />
              </View>
              <View>
                <Text style={{ color: themeColors.text }} className="font-poppins-bold text-lg leading-5">
                  {totalEntries}
                </Text>
                <Text style={{ color: themeColors.text, opacity: 0.6 }} className="font-roboto text-[10px]">
                  Entries
                </Text>
              </View>
            </View>

            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#D1FAE5',
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: '#10B981',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                <Ionicons name="trending-up" size={16} color="#fff" />
              </View>
              <View>
                <Text className="font-poppins-bold text-lg leading-5 text-nature_text">
                  {thisWeekEntries}
                </Text>
                <Text className="font-roboto text-[10px] text-nature_text/60">This Week</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quotes Section */}
        <View className="mb-4">
          {/* Section header */}
          <View className="mb-2 flex-row items-center px-5">
            <Ionicons name="sparkles-outline" size={14} color={themeColors.accent} />
            <Text style={{ color: themeColors.accent }} className="ml-2 font-roboto-medium text-[10px] uppercase tracking-widest">
              Daily Inspiration
            </Text>
          </View>

          {loading ? (
            <View className="h-[110px] items-center justify-center">
              <ActivityIndicator size="small" color={themeColors.accent} />
            </View>
          ) : (
            <>
              <FlatList
                ref={quotesRef}
                data={quotes}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderQuote}
                onMomentumScrollEnd={(e) => {
                  const newIndex = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
                  setCurrentQuoteIndex(newIndex);
                  indexRef.current = newIndex;
                }}
                snapToInterval={width - 40}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 20 }}
              />
              {renderDots()}
            </>
          )}
        </View>

        {/* History Section */}
        <View className="flex-1 px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View style={{ backgroundColor: themeColors.accent }} className="mr-2 h-5 w-1 rounded-full" />
              <Text style={{ color: themeColors.text }} className="font-poppins-bold text-lg">
                Your Journey
              </Text>
            </View>
            <Pressable
              className="flex-row items-center"
              onPress={() => router.push('/AllEntries')}>
              <Text style={{ color: themeColors.accent }} className="mr-1 font-roboto text-sm">
                View All
              </Text>
              <Ionicons name="chevron-forward" size={14} color={themeColors.accent} />
            </Pressable>
          </View>

          {/* Entries list */}
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <HistoryItem
                entry={item}
                onOpen={(id: string) => openEntryForEditing(id)}
                isFirst={index === 0}
              />
            )}
            contentContainerStyle={{ paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View
                style={{ backgroundColor: themeColors.surface }}
                className="items-center rounded-2xl p-8">
                <View
                  style={{ backgroundColor: themeColors.accent + '15' }}
                  className="mb-4 h-16 w-16 items-center justify-center rounded-full">
                  <Ionicons name="journal-outline" size={32} color={themeColors.accent} />
                </View>
                <Text style={{ color: themeColors.text }} className="mb-2 text-center font-poppins-bold text-lg">
                  Start Your Journey
                </Text>
                <Text style={{ color: themeColors.text, opacity: 0.6 }} className="text-center font-roboto text-sm leading-5">
                  Your dreams are waiting to be captured.{'\n'}Tap the + button to create your first
                  entry.
                </Text>
              </View>
            }
          />
        </View>
      </Animated.View>

      <MainTab />
    </View>
  );
};

const indexStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  decorCircle1: {
    position: 'absolute',
    right: -80,
    top: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    transform: [{ scale: 2 }],
  },
  decorCircle2: {
    position: 'absolute',
    left: -40,
    top: 160,
    width: 96,
    height: 96,
    borderRadius: 48,
    transform: [{ scale: 1.5 }],
  },
});

export default Index;
