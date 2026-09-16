-- Dream Diary: add moods/mood/tag to diary_input (run once in Supabase SQL editor)
-- Phase 1 fix: previously upsertEntry/pullRemoteEntries only synced title+blocks,
-- so moods and tags were lost on restore. This adds the missing columns.

alter table public.diary_input
  add column if not exists moods jsonb not null default '[]'::jsonb,
  add column if not exists mood text null,
  add column if not exists tag text null;
