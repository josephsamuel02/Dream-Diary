// app/index.tsx
import { useRef, useEffect, useState } from 'react';
import { View, Text, FlatList, Dimensions, ScrollView } from 'react-native';
import { greetingsByTime, quotes } from '../util/greetings';

import MainTab from '~/components/mainTab';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const historyData = [
  { day: '24', month: 'Sept', year: '2025', text: 'Went for a morning walk and felt refreshed.' },
  {
    day: '25',
    month: 'Sept',
    year: '2025',
    text: 'Worked on my diary app, making great progress.',
  },
  {
    day: '26',
    month: 'Sept',
    year: '2025',
    text: 'Had coffee with an old friend, lots of laughter.',
  },
  { day: '27', month: 'Sept', year: '2025', text: "Finished reading a book I've been postponing." },
  { day: '28', month: 'Sept', year: '2025', text: 'Relaxed and watched a nice movie.' },
  { day: '29', month: 'Sept', year: '2025', text: 'Went to the gym, had an intense workout.' },
  { day: '30', month: 'Sept', year: '2025', text: 'Cleaned my workspace and organized notes.' },
  { day: '01', month: 'Oct', year: '2025', text: 'Started October with positive vibes.' },
];

export default function Index({ navigation }: any) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    let group: keyof typeof greetingsByTime;

    if (hour >= 5 && hour < 12) {
      group = 'morning';
    } else if (hour >= 12 && hour < 18) {
      group = 'afternoon';
    } else {
      group = 'evening';
    }

    const greetings = [...greetingsByTime[group], ...greetingsByTime.anytime];
    const randomIndex = Math.floor(Math.random() * greetings.length);
    setGreeting(greetings[randomIndex]);
  }, []);

  // Auto-slide for quotes
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % quotes.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 18000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
       <View className=" flex-1 bg-cozy_background ">
        {/* Screen content */}
        <View className=" p-2">
          <View className="h-auto w-full">
            <Text className="font-poppins text-[15px] font-bold text-cozy_text">{greeting} </Text>
          </View>

          {/* Motivational quotes slide */}
          <View className="my-4 mb-5 h-auto">
            <FlatList
              ref={flatListRef}
              data={quotes}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <View
                  style={{ width: width - 40, height: 90 }}
                  className="mx-2 justify-center rounded-xl border border-[silver] bg-[#ecba80] p-4  pt-2 shadow-2xl">
                  <Text className="font-lg pb-4 text-center font-poppins text-base text-cozy_text">
                    {item.text}
                  </Text>
                  <Text className="text-gray-500 absolute bottom-2 left-4 text-sm italic">
                    — {item.author !== 'Unknown' ? item.author : 'Anonymous'}
                  </Text>
                </View>
              )}
            />
          </View>

          {/* History Section */}
          <View className="h-auto w-full">
            <Text className="text-black pb-3 font-roboto text-lg">History</Text>
          </View>

          <ScrollView className="flex h-full w-auto flex-col space-y-3">
            {historyData.map((item, index) => (
              <View
                key={index}
                className="mb-4 flex h-auto w-full flex-1 flex-row items-center rounded-md bg-white p-3  shadow">
                {/* Date Block */}
                <View className="mr-3 flex flex-row items-center border-r-2 border-[silver] pr-2">
                  <Text className="text-black pr-1 font-roboto text-[40px] font-bold">
                    {item.day}
                  </Text>
                  <View className="flex flex-col justify-center">
                    <Text className="text-left font-roboto text-base font-bold text-cozy_text">
                      {item.month}
                    </Text>
                    <Text className="text-left font-roboto text-base font-bold text-cozy_text">
                      {item.year}
                    </Text>
                  </View>
                </View>

                {/* Diary Text */}
                <Text
                  className="flex-1 font-roboto text-[14px] text-cozy_text"
                  numberOfLines={3}
                  ellipsizeMode="tail"
                  style={{ lineHeight: 18 }}>
                  {item.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Custom tab at bottom */}
        <MainTab />
      </View>
   );
}
