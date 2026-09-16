import type { Block } from '~/store/slices/diarySlice';

/**
 * Type definitions matching the public.user table schema.
 */
export interface UserProfile {
  id: string;
  created_at: string;
  email: string;
  username: string;
  about: string;
  profile_image: string | null;
}

export type UserProfileInsert = Pick<UserProfile, 'email' | 'username'> & {
  about?: string;
  profile_image?: string | null;
};

export type UserProfileUpdate = Partial<Pick<UserProfile, 'username' | 'about' | 'profile_image'>>;

/**
 * Type definitions matching the public.diary_input table schema.
 *
 * NOTE: `moods`, `mood` and `tag` were added after the initial release.
 * Run `supabase/migrations/002_diary_input_moods_tag.sql` on your Supabase
 * project to add them. The sync code in `src/util/diarySync.ts` degrades
 * gracefully when those columns don't exist yet (falls back to legacy payload).
 */
export interface DiaryInputRow {
  id: string;
  user_id: string;
  date: string;       // 'yyyy-mm-dd'
  title: string;
  blocks: Block[];
  moods?: import('~/store/slices/diarySlice').MoodEntry[];
  mood?: import('~/store/slices/diarySlice').Mood | null;
  tag?: string | null;
  created_at: string;
  updated_at: string;
}
