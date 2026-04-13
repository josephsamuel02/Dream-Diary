// app/DiaryInput.tsx
import { useSearchParams } from 'expo-router/build/hooks';
import  { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import DiaryInputBody from '~/components/diaryInputBody';

// redux
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { selectEntries, addEntry, updateEntryMeta } from '~/store/slices/diarySlice';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { selectSettings } from '~/store/slices/settingsSlice';

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function DiaryInput() {
  const { entryId: paramEntryId } = useSearchParams() as { entryId?: string };
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectEntries);
  const themeColors = useAppSelector(selectThemeColors);
  const { diaryFont } = useAppSelector(selectSettings);

  const [title, setTitle] = useState('');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
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
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
          <Text style={[styles.loadingText, { color: themeColors.text + '80' }]}>
            Loading your entry...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          {/* Title Input */}
          <TextInput
            style={[
              styles.titleInput,
              {
                color: themeColors.text,
                backgroundColor: themeColors.background,
                borderColor: isFocused ? themeColors.accent : themeColors.text + '15',
                fontFamily: diaryFont,
              },
            ]}
            value={title}
            onChangeText={onChangeTitle}
            placeholder="Title..."
            placeholderTextColor={themeColors.text + '35'}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <DiaryInputBody entryId={entryId} diaryFont={diaryFont} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'RobotoRegular',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  titleInput: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});
