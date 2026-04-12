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
}

export type UserProfileInsert = Pick<UserProfile, 'email' | 'username'> & {
  about?: string;
};

export type UserProfileUpdate = Partial<Pick<UserProfile, 'username' | 'about'>>;

/**
 * Type definitions matching the public.diary_input table schema.
 */
export interface DiaryInputRow {
  id: string;
  user_id: string;
  date: string;       // 'yyyy-mm-dd'
  title: string;
  blocks: Block[];
  created_at: string;
  updated_at: string;
}
