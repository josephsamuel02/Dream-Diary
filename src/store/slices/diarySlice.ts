// src/store/slices/diarySlice.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TextBlock = { id: string; type: 'text'; content: string };
export type ImageBlock = { id: string; type: 'image'; content: string };
export type AudioBlock = { id: string; type: 'audio'; content: string };
export type Block = TextBlock | ImageBlock | AudioBlock;

export type DiaryEntry = {
  id: string;
  date: string; // ISO date string (e.g. "2025-09-30")
  blocks: Block[];
  title?: string;
};

export type DiaryState = {
  entries: DiaryEntry[] | undefined; // allow undefined so we can handle old persisted shapes
};

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const makeEmptyBlocks = (): Block[] => [{ id: genId(), type: 'text', content: '' }];
async function clearAllStorageDevOnly() {
  await AsyncStorage.clear();
  console.log('AsyncStorage cleared — restart the app.');
}
const initialState: DiaryState = {
  entries: [
    {
      id: genId(),
      date: new Date().toISOString().slice(0, 10),
      blocks: makeEmptyBlocks(),
    },
  ],
};

const ensureEntries = (state: DiaryState) => {
  if (!state.entries) state.entries = [];
};

const DiarySlice = createSlice({
  name: 'diary',
  initialState,
  reducers: {
    resetAppState() {
      clearAllStorageDevOnly();
    },

    addEntry(
      state,
      action: PayloadAction<{ date?: string; blocks?: Block[]; id?: string; title?: string }>
    ) {
      ensureEntries(state);
      const { date = new Date().toISOString().slice(0, 10), blocks, id, title } = action.payload;
      state.entries!.unshift({
        id: id ?? genId(),
        date,
        blocks: blocks ?? makeEmptyBlocks(),
        title,
      });
    },

    removeEntry(state, action: PayloadAction<string>) {
      ensureEntries(state);
      state.entries = state.entries!.filter((e) => e.id !== action.payload);
    },

    replaceBlocksForEntry(state, action: PayloadAction<{ entryId: string; blocks: Block[] }>) {
      ensureEntries(state);
      const { entryId, blocks } = action.payload;
      const idx = state.entries!.findIndex((e) => e.id === entryId);
      if (idx >= 0) state.entries![idx].blocks = blocks;
    },

    addBlockToEntry(
      state,
      action: PayloadAction<{ entryId: string; type: Block['type']; content?: string }>
    ) {
      ensureEntries(state);
      const { entryId, type, content = '' } = action.payload;
      const entry = state.entries!.find((e) => e.id === entryId);
      if (!entry) return;
      if (type === 'image' || type === 'audio') {
        entry.blocks = entry.blocks.filter((b) => !(b.type === 'text' && b.content.trim() === ''));
        entry.blocks.push({ id: genId(), type, content } as ImageBlock | AudioBlock);
        entry.blocks.push({ id: genId(), type: 'text', content: '' });
      } else {
        entry.blocks.push({ id: genId(), type: 'text', content });
      }
    },

    updateTextInEntry(
      state,
      action: PayloadAction<{ entryId: string; index: number; content: string }>
    ) {
      ensureEntries(state);
      const { entryId, index, content } = action.payload;
      const entry = state.entries!.find((e) => e.id === entryId);
      if (!entry) return;
      if (index >= 0 && index < entry.blocks.length && entry.blocks[index].type === 'text') {
        entry.blocks[index] = { ...(entry.blocks[index] as TextBlock), content };
      }
    },

    removeBlockFromEntry(state, action: PayloadAction<{ entryId: string; blockId: string }>) {
      ensureEntries(state);
      const { entryId, blockId } = action.payload;
      const entry = state.entries!.find((e) => e.id === entryId);
      if (!entry) return;
      entry.blocks = entry.blocks.filter((b) => b.id !== blockId);
      if (!entry.blocks.some((b) => b.type === 'text')) {
        entry.blocks.push({ id: genId(), type: 'text', content: '' });
      }
    },

    updateEntryMeta(
      state,
      action: PayloadAction<{ entryId: string; date?: string; title?: string }>
    ) {
      ensureEntries(state);
      const { entryId, date, title } = action.payload;
      const entry = state.entries!.find((e) => e.id === entryId);
      if (!entry) return;
      if (date) entry.date = date;
      if (title !== undefined) entry.title = title;
    },

    // optional: replace entire diary state (useful for migrations)
    replaceState(state, action: PayloadAction<DiaryState>) {
      // completely overwrite (used sparingly)
      return action.payload;
    },
  },
});

export const {
  addEntry,
  removeEntry,
  replaceBlocksForEntry,
  addBlockToEntry,
  updateTextInEntry,
  removeBlockFromEntry,
  updateEntryMeta,
  replaceState,
} = DiarySlice.actions;

export const selectEntries = (state: { diary: DiaryState }) => state.diary.entries ?? [];
export const selectEntryById = (state: { diary: DiaryState }, id: string) =>
  state.diary.entries?.find((e) => e.id === id);

export default DiarySlice.reducer;
