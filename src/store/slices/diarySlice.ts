import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TextBlock = { id: string; type: 'text'; content: string };
export type ImageBlock = { id: string; type: 'image'; content: string };
export type AudioBlock = { id: string; type: 'audio'; content: string };
export type Block = TextBlock | ImageBlock | AudioBlock;

export type DiaryEntry = {
  id: string;
  date: string; // ISO date string (yyyy-mm-dd)
  blocks: Block[];
  title?: string;
};

export type DiaryState = {
  entries: DiaryEntry[] | undefined; // keep undefined handling for migrations
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
      date: (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      })(),
      blocks: makeEmptyBlocks(),
    },
  ],
};

const ensureEntries = (state: DiaryState) => {
  if (!state.entries) state.entries = [];
};

const cloneBlock = (b: Block): Block => ({ ...b });
const cloneBlocks = (blocks?: Block[]) => (blocks ?? []).map(cloneBlock);

const DiarySlice = createSlice({
  name: 'diary',
  initialState,
  reducers: {
    // DEV: clears AsyncStorage (keeps side-effect out of reducers in production)
    resetAppState() {
      // call async helper (OK for dev only)
      clearAllStorageDevOnly();
    },

    // addEntry: guard against duplicate entries for the same date
    addEntry(
      state,
      action: PayloadAction<{ date?: string; blocks?: Block[]; id?: string; title?: string }>
    ) {
      ensureEntries(state);
      const {
        date = (() => {
          const d = new Date();
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        })(),
        blocks,
        id,
        title,
      } = action.payload;

      // Prevent creating more than one entry for the same date
      const exists = state.entries!.some((e) => e.date === date);
      if (exists) {
        // noop if an entry for this date already exists
        return;
      }

      state.entries!.unshift({
        id: id ?? genId(),
        date,
        blocks: blocks ? cloneBlocks(blocks) : makeEmptyBlocks(),
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
      state.entries = state.entries!.map((e) =>
        e.id === entryId ? { ...e, blocks: cloneBlocks(blocks) } : e
      );
    },

    addBlockToEntry(
      state,
      action: PayloadAction<{ entryId: string; type: Block['type']; content?: string }>
    ) {
      ensureEntries(state);
      const { entryId, type, content = '' } = action.payload;
      state.entries = state.entries!.map((e) => {
        if (e.id !== entryId) return e;
        if (type === 'image' || type === 'audio') {
          const cleaned = e.blocks.filter((b) => !(b.type === 'text' && b.content.trim() === ''));
          const next = [
            ...cleaned,
            { id: genId(), type, content } as ImageBlock | AudioBlock,
            { id: genId(), type: 'text', content: '' } as TextBlock,
          ];
          return { ...e, blocks: next };
        } else {
          return { ...e, blocks: [...e.blocks, { id: genId(), type: 'text', content }] };
        }
      });
    },

    updateTextInEntry(
      state,
      action: PayloadAction<{ entryId: string; index: number; content: string }>
    ) {
      ensureEntries(state);
      const { entryId, index, content } = action.payload;
      state.entries = state.entries!.map((e) => {
        if (e.id !== entryId) return e;
        if (index < 0 || index >= e.blocks.length) return e;
        const blk = e.blocks[index];
        if (blk.type !== 'text') return e;
        const newBlocks = e.blocks.map((b, i) => (i === index ? { ...b, content } : b));
        return { ...e, blocks: newBlocks };
      });
    },

    removeBlockFromEntry(state, action: PayloadAction<{ entryId: string; blockId: string }>) {
      ensureEntries(state);
      const { entryId, blockId } = action.payload;
      state.entries = state.entries!.map((e) => {
        if (e.id !== entryId) return e;
        const next = e.blocks.filter((b) => b.id !== blockId);
        if (!next.some((b) => b.type === 'text')) {
          return { ...e, blocks: [...next, { id: genId(), type: 'text', content: '' }] };
        }
        return { ...e, blocks: next };
      });
    },

    updateEntryMeta(
      state,
      action: PayloadAction<{ entryId: string; date?: string; title?: string }>
    ) {
      ensureEntries(state);
      const { entryId, date, title } = action.payload;
      state.entries = state.entries!.map((e) =>
        e.id !== entryId
          ? e
          : { ...e, ...(date ? { date } : {}), ...(title !== undefined ? { title } : {}) }
      );
    },

    replaceState(state, action: PayloadAction<DiaryState>) {
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
  resetAppState,
} = DiarySlice.actions;

// selectors
export const selectEntries = (state: { diary: DiaryState }) => state.diary.entries ?? [];
export const selectEntryById = (state: { diary: DiaryState }, id: string) =>
  state.diary.entries?.find((e) => e.id === id) ?? null;
export const selectEntryByDate = (state: { diary: DiaryState }, date: string) =>
  state.diary.entries?.find((e) => e.date === date) ?? null;

export default DiarySlice.reducer;
