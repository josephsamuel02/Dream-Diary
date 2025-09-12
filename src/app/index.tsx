/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { greetingsByTime, quotes } from '../util/greetings';
import { useAppSelector } from '~/store/hooks';
import { selectEntries } from '~/store/slices/diarySlice';
import MainTab from '~/components/mainTab';
import { clearAllStorageDevOnly } from '~/util/reset';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  // quotes carousel ref & index
  const quotesRef = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const [, setCurrentIndex] = useState(0);

  const [greeting, setGreeting] = useState('');
  // get entries from redux
  const entriesRaw = useAppSelector(selectEntries);

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

  // Auto-slide for quotes: set interval once and use refs to update index
  useEffect(() => {
    const id = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % quotes.length;
      setCurrentIndex(indexRef.current);
      try {
        quotesRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
      } catch (e: any) {
        // ignore if virtualization mismatch
      }
    }, 18000);
    return () => clearInterval(id);
  }, []);

  // sort entries by date desc (newest first). Expect date as yyyy-mm-dd; fallback to 0 if missing
  const entries = useMemo(() => {
    return [...(entriesRaw ?? [])].sort((a, b) => {
      const ta = a?.date ? new Date(a.date).getTime() : 0;
      const tb = b?.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });
  }, [entriesRaw]);

  // navigate to DiaryInput screen with entryId (so user can continue editing)
  const openEntryForEditing = useCallback(
    (entryId: string) => {
      // navigate to DiaryInput screen and pass entryId as query param
      router.push(`/DiaryInput?entryId=${encodeURIComponent(entryId)}`);
    },
    [router]
  );

  // stable renderer for diary entry items (keeps your styles intact)
  const renderEntry = useCallback(
    ({ item: entry }: any) => {
      const firstText = entry.blocks.find((b: any) => b.type === 'text' && b.content?.trim());
      const preview = firstText ? firstText.content : (entry.blocks[0]?.type ?? 'Empty');
      const dateParts = (entry.date ?? '').split('-');
      const day = dateParts[2] ?? '';
      const month = entry.date
        ? new Date(entry.date).toLocaleString(undefined, { month: 'short' })
        : '';
      const year = dateParts[0] ?? '';

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => openEntryForEditing(entry.id)}
          className="mb-4 flex h-auto w-full flex-1 flex-row items-center rounded-md bg-white p-3  shadow">
          {/* Date Block */}
          <View className="mr-3 flex flex-row items-center border-r-2 border-[silver] pr-2">
            <Text className="pr-1 font-roboto text-[40px] font-bold text-black">{day || '—'}</Text>
            <View className="flex flex-col justify-center">
              <Text className="text-left font-roboto text-base font-bold text-cozy_text">
                {month || '—'}
              </Text>
              <Text className="text-left font-roboto text-base font-bold text-cozy_text">
                {year || '—'}
              </Text>
            </View>
          </View>

          {/* Diary Text */}
          <Text
            className="flex-1 font-roboto text-[14px] text-cozy_text"
            numberOfLines={3}
            ellipsizeMode="tail"
            style={{ lineHeight: 18 }}>
            {preview}
          </Text>
        </TouchableOpacity>
      );
    },
    [openEntryForEditing]
  );

  // quotes card renderer (keeps your styling)
  const renderQuote = useCallback(
    ({ item }: { item: { text: string; author: string } }) => (
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
    ),
    []
  );

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
            ref={quotesRef}
            data={quotes}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderQuote}
          />
        </View>

        {/* History Section */}
        <TouchableOpacity className="h-auto w-full" onPress={() => clearAllStorageDevOnly()}>
          <Text className="pb-3 font-roboto text-lg text-black">History</Text>
        </TouchableOpacity>

        {/* Entries list (FlatList for performance) */}
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
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

      {/* Custom tab at bottom */}
      <MainTab />
    </View>
  );
}

function resetAppState(): any {
  throw new Error('Function not implemented.');
}
// Note: The diary input state management has been refactored to use Redux for better scalability and maintainability.
