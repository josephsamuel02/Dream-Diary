// app/DiaryInput.tsx
import { useSearchParams } from 'expo-router/build/hooks';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DiaryInputBody from '~/components/diaryInputBody';

// redux
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { selectEntries, addEntry, updateEntryMeta } from '~/store/slices/diarySlice';

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function DiaryInput() {
  const { entryId: paramEntryId } = useSearchParams() as { entryId?: string };
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectEntries);

  const [title, setTitle] = useState('');
  const [entryId, setEntryId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Today's ISO date (yyyy-mm-dd)
  const todayIso = new Date().toISOString().slice(0, 10);

  // If an entryId param was passed, use it (and create it if it doesn't exist).
  // Otherwise, find today's entry or create one.
  useEffect(() => {
    if (paramEntryId) {
      // if entry already exists in store, just open it
      const existing = entries.find((e) => e.id === paramEntryId);
      if (existing) {
        setEntryId(paramEntryId);
        setTitle(existing.title ?? '');
      } else {
        // create a new entry with the provided id (defensive)
        dispatch(
          addEntry({
            id: paramEntryId,
            date: todayIso,
            title: '',
          })
        );
        setEntryId(paramEntryId);
        setTitle('');
      }
      return;
    }

    // no param: find an entry for today or create one
    const existingToday = entries.find((e) => e.date === todayIso);
    if (existingToday) {
      setEntryId(existingToday.id);
      setTitle(existingToday.title ?? '');
      return;
    }

    // create new entry for today and open it
    const newId = genId();
    dispatch(
      addEntry({
        id: newId,
        date: todayIso,
        title: '',
      })
    );
    setEntryId(newId);
    setTitle('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramEntryId, entries]); // runs when entries update or param changes

  // keep local title in sync with store updates when entry changes externally
  useEffect(() => {
    if (!entryId) return;
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    if ((entry.title ?? '') !== title) {
      setTitle(entry.title ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, entryId]);

  // Debounced save of title -> dispatch updateEntryMeta
  const onChangeTitle = (text: string) => {
    setTitle(text);
    if (!entryId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      dispatch(updateEntryMeta({ entryId, title: text }));
      saveTimer.current = null;
    }, 700);
  };

  if (!entryId) {
    // simple loading while entry is created/identified
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 p-2">
          {/* Title */}
          <View className="relative mb-2">
            {title.length === 0 && (
              <Text className="text-gray-300 absolute left-3 top-3 text-lg ">Title...</Text>
            )}
            <TextInput
              className="rounded-lg border border-[#a09997de] p-3 font-roboto-medium text-xl font-semibold"
              value={title}
              onChangeText={onChangeTitle}
            />
          </View>

          {/* Pass the resolved entryId into the body */}
          <DiaryInputBody entryId={entryId} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
