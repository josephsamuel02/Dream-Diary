// app/index.tsx
import { useRef, useEffect, useState } from 'react';
import { View, Text, FlatList, Dimensions } from 'react-native';
import MainTab from '~/components/mainTab';

const { width } = Dimensions.get('window');

const quotes = [
  { text: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt' },
  { text: "Your limitation—it's only your imagination.", author: 'Unknown' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { text: 'Great things never come from comfort zones.', author: 'Unknown' },
  { text: 'Dream it. Wish it. Do it.', author: 'Unknown' },
];

export default function Index({ navigation }: any) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % quotes.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 8000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <View className="flex-1 bg-cozy_background">
      {/* Screen content */}
      <View className="flex-1 p-2">
        <View className="h-auto w-full">
          <Text className="text-lg font-roboto font-semibold text-cozy_text">Hi, what&#39;s going on with you today!</Text>
        </View>

        {/* Motivational quotes slide */}
        <View className="mt-4 h-36">
          <FlatList
            ref={flatListRef}
            data={quotes}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View
                style={{ width: width - 40 }}
                className="mx-2 justify-center rounded-2xl border border-[silver] bg-white p-4 pt-2 shadow-lg">
                <Text className="font-poppins pb-4 text-center text-lg text-cozy_text">
                  {item.text}
                </Text>
                <Text className="text-gray-500 absolute bottom-2 left-4 text-sm italic">
                  — {item.author !== 'Unknown' ? item.author : 'Anonymous'}
                </Text>
              </View>
            )}
          />
        </View>
      </View>

      {/* Custom tab at bottom */}
      <MainTab navigation={navigation} />
    </View>
  );
}
