/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { greetingsByTime, quotes } from '../util/greetings';
import { useAppSelector } from '~/store/hooks';
import { selectEntries } from '~/store/slices/diarySlice';
import MainTab from '~/components/mainTab';
import HistoryItem from '~/components/historyItem';
import { clearAllStorageDevOnly } from '~/util/reset';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const quotesRef = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const [, setCurrentIndex] = useState(0);

  const [greeting, setGreeting] = useState('');
  const entriesRaw = useAppSelector(selectEntries);

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

  useEffect(() => {
    const id = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % quotes.length;
      setCurrentIndex(indexRef.current);
      try {
        quotesRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
      } catch (e) {
        // ignore
      }
    }, 18000);
    return () => clearInterval(id);
  }, []);

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

  const renderQuote = useCallback(
    ({ item }: { item: { text: string; author: string } }) => (
      <View
        style={{ width: width - 40, height: 90 }}
        className="mx-2 justify-center rounded-xl  bg-[#ffffff] p-4  pt-2 shadow-2xl">
        <Text className="font-lg pb-4 text-center font-poppins text-base text-cozy_text">
          {item.text}
        </Text>
        <Text className="text-gray-500 absolute bottom-2 left-4 text-sm italic">
          — {item.author !== 'Unknown' ? item.author : 'Anonymous'}
        </Text>
      </View>
    ),
    []
  );

  return (
    <View className=" flex-1 bg-cozy_background ">
      <View className=" p-2">
        <View className="h-auto w-full">
          <Text className="font-poppins text-[15px] font-bold text-cozy_text">{greeting}</Text>
        </View>

        {/* Quotes */}
        <View className="my-4 mb-5 h-auto">
          <FlatList
            ref={quotesRef}
            data={quotes}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderQuote}
          />
        </View>

        {/* History header */}
        <Pressable className="h-auto w-full" onPress={() => clearAllStorageDevOnly()}>
          <Text className="pb-3 font-roboto text-lg text-black">History</Text>
        </Pressable>

        {/* Entries list */}
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryItem entry={item} onOpen={(id: string) => openEntryForEditing(id)} />
          )}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="mb-4 flex h-auto w-full flex-1 flex-row items-center rounded-md bg-white p-3  shadow">
              <Text
                className="flex-1 font-roboto text-[14px] text-cozy_text"
                style={{ lineHeight: 18 }}>
                No diary entries yet — tap the + button to create your first entry.
              </Text>
            </View>
          }
        />
      </View>

      <MainTab />
    </View>
  );
}
