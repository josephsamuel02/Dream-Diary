// app/DiaryInput.tsx
import { useSearchParams } from 'expo-router/build/hooks';
import { useEffect, useRef, useState } from 'react';
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
import { selectEntries, updateEntryMeta } from '~/store/slices/diarySlice';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { selectSettings } from '~/store/slices/settingsSlice';
import { store } from '~/store/store';
import { ensureEntryForDate, ensureTodayEntry } from '~/util/ensureTodayEntry';

export default function DiaryInput() {
  const { entryId: paramEntryId } = useSearchParams() as { entryId?: string };
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectEntries);
  const themeColors = useAppSelector(selectThemeColors);
  const { diaryFont, diaryFontSize } = useAppSelector(selectSettings);
  // Title scales with body but stays a couple of points larger so the
  // visual hierarchy is preserved as the user changes the slider.
  const titleFontSize = (diaryFontSize ?? 16) + 2;

  const [title, setTitle] = useState('');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve which entry this screen edits. We deliberately depend ONLY
  // on `paramEntryId` so the resolution runs once per navigation —
  // re-running on every `entries` change while the user types would
  // clobber their input.
  useEffect(() => {
    const state = store.getState();
    const all = state.diary.entries ?? [];

    if (paramEntryId) {
      // Happy path: the entry already exists in the store.
      const existing = all.find((e) => e.id === paramEntryId);
      if (existing) {
        setEntryId(existing.id);
        setTitle(existing.title ?? '');
        return;
      }

      // The param points at an id that is NOT in the store. This can
      // happen if the caller minted a fresh id but the date-uniqueness
      // guard rejected the addEntry. Fall back to today's entry so we
      // never end up editing a ghost id.
      const todayId = ensureTodayEntry(store.getState, dispatch);
      const resolved =
        store.getState().diary.entries?.find((e) => e.id === todayId) ?? null;
      setEntryId(todayId);
      setTitle(resolved?.title ?? '');
      return;
    }

    // No param: open today's entry, creating it if needed.
    const todayId = ensureTodayEntry(store.getState, dispatch);
    const resolved =
      store.getState().diary.entries?.find((e) => e.id === todayId) ?? null;
    setEntryId(todayId);
    setTitle(resolved?.title ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramEntryId]);

  // Keep local title in sync with external store updates (e.g. cloud
  // pull). Skips when the value already matches so we don't fight the
  // user's typing.
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
                fontSize: titleFontSize,
              },
            ]}
            value={title}
            onChangeText={onChangeTitle}
            placeholder="Title..."
            placeholderTextColor={themeColors.text + '35'}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <DiaryInputBody
            entryId={entryId}
            diaryFont={diaryFont}
            diaryFontSize={diaryFontSize ?? 16}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Suppress unused import linter warning — kept to make the helper
// available if we later need to open a specific past date.
void ensureEntryForDate;

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
