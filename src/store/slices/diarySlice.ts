// src/store/slices/diarySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TextBlock = { id: string; type: 'text'; content: string };
type ImageBlock = { id: string; type: 'image'; content: string };
type AudioBlock = { id: string; type: 'audio'; content: string };
export type Block = TextBlock | ImageBlock | AudioBlock;

export type DiaryState = {
  blocks: Block[];
};

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const initialState: DiaryState = {
  blocks: [{ id: Date.now().toString(), type: 'text', content: '' }],
};
const DiarySlice = createSlice({
  name: 'diary',
  initialState,
  reducers: {
    replaceBlocks(state, action: PayloadAction<Block[]>) {
      state.blocks = action.payload;
    },
    clearDraft(state) {
      state.blocks = [{ id: genId(), type: 'text', content: '' }];
    },
    addBlock(state, action: PayloadAction<{ type: Block['type']; content?: string }>) {
      const { type, content = '' } = action.payload;
      if (type === 'image' || type === 'audio') {
        // remove empty text blocks first
        state.blocks = state.blocks.filter((b) => !(b.type === 'text' && b.content.trim() === ''));
        state.blocks.push({ id: genId(), type, content } as ImageBlock | AudioBlock);
        // ensure single trailing text block
        state.blocks.push({ id: genId(), type: 'text', content: '' });
      } else {
        state.blocks.push({ id: genId(), type: 'text', content });
      }
    },
    updateText(state, action: PayloadAction<{ index: number; content: string }>) {
      const { index, content } = action.payload;
      if (index >= 0 && index < state.blocks.length && state.blocks[index].type === 'text') {
        state.blocks[index] = { ...(state.blocks[index] as TextBlock), content };
      }
    },
    removeBlockById(state, action: PayloadAction<string>) {
      state.blocks = state.blocks.filter((b) => b.id !== action.payload);
      // ensure at least one text block remains
      if (!state.blocks.some((b) => b.type === 'text')) {
        state.blocks.push({ id: genId(), type: 'text', content: '' });
      }
    },
  },
});

export const { replaceBlocks, clearDraft, addBlock, updateText, removeBlockById } =
  DiarySlice.actions;
export default DiarySlice.reducer;
