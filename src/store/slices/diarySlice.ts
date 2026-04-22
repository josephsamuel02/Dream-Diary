import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TextBlock = { id: string; type: 'text'; content: string };
export type ImageBlock = { id: string; type: 'image'; content: string };
export type AudioBlock = { id: string; type: 'audio'; content: string };
export type Block = TextBlock | ImageBlock | AudioBlock;

export type DiaryEntry = {
  id: string;
  date: string; // local 'YYYY-MM-DD'
  blocks: Block[];
  title?: string;
  // Timestamps used for sync conflict resolution.
  // createdAt: set once when the entry is first created (local time ISO).
  // updatedAt: bumped on every mutation; the local copy is always the
  // source of truth, so we rely on this to know when to push.
  createdAt?: string;
  updatedAt?: string;
};

export type DiaryState = {
  entries: DiaryEntry[] | undefined; // keep undefined handling for migrations
};

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const makeEmptyBlocks = (): Block[] => [{ id: genId(), type: 'text', content: '' }];

const getLocalDateYYYYMMDD = (d: Date = new Date()): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const nowIso = () => new Date().toISOString();

async function clearAllStorageDevOnly() {
  await AsyncStorage.clear();
  console.log('AsyncStorage cleared — restart the app.');
}

const initialState: DiaryState = {
  entries: [
    {
      id: genId(),
      date: getLocalDateYYYYMMDD(),
      blocks: makeEmptyBlocks(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
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

    // addEntry is strictly date-unique: a given local date can only
    // ever have one entry. This is what keeps "today" and "yesterday"
    // from ever sharing the same data bucket.
    addEntry(
      state,
      action: PayloadAction<{ date?: string; blocks?: Block[]; id?: string; title?: string }>
    ) {
      ensureEntries(state);
      const {
        date = getLocalDateYYYYMMDD(),
        blocks,
        id,
        title,
      } = action.payload;

      if (state.entries!.some((e) => e.date === date)) {
        // An entry already exists for this date — never create a duplicate.
        return;
      }

      const ts = nowIso();
      state.entries!.unshift({
        id: id ?? genId(),
        date,
        blocks: blocks ? cloneBlocks(blocks) : makeEmptyBlocks(),
        title,
        createdAt: ts,
        updatedAt: ts,
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
        e.id === entryId ? { ...e, blocks: cloneBlocks(blocks), updatedAt: nowIso() } : e
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
          return { ...e, blocks: next, updatedAt: nowIso() };
        } else {
          return {
            ...e,
            blocks: [...e.blocks, { id: genId(), type: 'text', content }],
            updatedAt: nowIso(),
          };
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
        return { ...e, blocks: newBlocks, updatedAt: nowIso() };
      });
    },

    removeBlockFromEntry(state, action: PayloadAction<{ entryId: string; blockId: string }>) {
      ensureEntries(state);
      const { entryId, blockId } = action.payload;
      state.entries = state.entries!.map((e) => {
        if (e.id !== entryId) return e;
        const next = e.blocks.filter((b) => b.id !== blockId);
        if (!next.some((b) => b.type === 'text')) {
          return {
            ...e,
            blocks: [...next, { id: genId(), type: 'text', content: '' }],
            updatedAt: nowIso(),
          };
        }
        return { ...e, blocks: next, updatedAt: nowIso() };
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
          : {
              ...e,
              ...(date ? { date } : {}),
              ...(title !== undefined ? { title } : {}),
              updatedAt: nowIso(),
            }
      );
    },

    /**
     * Merge remote entries pulled from Supabase into local state.
     * Rule: LOCAL ALWAYS WINS.
     *   - If a local entry already exists with the same id → keep local.
     *   - If a local entry already exists with the same date → keep local.
     *   - Otherwise the remote entry is added to local state.
     * This is used after login / when the user has data in the cloud
     * that never made it onto this device.
     */
    mergeRemoteEntries(state, action: PayloadAction<DiaryEntry[]>) {
      ensureEntries(state);
      const localById = new Set(state.entries!.map((e) => e.id));
      const localByDate = new Set(state.entries!.map((e) => e.date));
      for (const remote of action.payload) {
        if (!remote || !remote.date) continue;
        if (localById.has(remote.id)) continue;
        if (localByDate.has(remote.date)) continue;
        state.entries!.push({
          id: remote.id,
          date: remote.date,
          blocks: cloneBlocks(remote.blocks ?? []),
          title: remote.title,
          createdAt: remote.createdAt ?? nowIso(),
          updatedAt: remote.updatedAt ?? nowIso(),
        });
        localById.add(remote.id);
        localByDate.add(remote.date);
      }
      // Keep newest first for nicer lists by default.
      state.entries!.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
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
  mergeRemoteEntries,
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
