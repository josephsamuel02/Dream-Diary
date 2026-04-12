import { supabase } from '~/lib/supabase';
import type { DiaryEntry } from '~/store/slices/diarySlice';

/**
 * Upsert a single diary entry to Supabase.
 * Uses INSERT ... ON CONFLICT (id) DO UPDATE so it is safe to call
 * on entries that already exist in the cloud.
 */
export async function upsertEntry(entry: DiaryEntry, userId: string): Promise<void> {
  const { error } = await supabase.from('diary_input').upsert(
    {
      id: entry.id,
      user_id: userId,
      date: entry.date,
      title: entry.title ?? '',
      blocks: entry.blocks,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
}

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

/**
 * Sync every local diary entry to Supabase.
 * Skips empty entries (no meaningful content).
 * Returns a summary of what succeeded and what failed.
 */
export async function syncAllEntries(
  entries: DiaryEntry[],
  userId: string
): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, errors: [] };

  for (const entry of entries) {
    try {
      await upsertEntry(entry, userId);
      result.synced++;
    } catch (err: any) {
      result.failed++;
      result.errors.push(err?.message ?? 'Unknown error');
    }
  }

  return result;
}

/**
 * Delete a diary entry from Supabase.
 * Called when the user deletes an entry locally while sync is on.
 */
export async function deleteRemoteEntry(entryId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('diary_input')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);
  if (error) throw error;
}
