import { supabase } from '~/lib/supabase';
import type { DiaryEntry } from '~/store/slices/diarySlice';

/**
 * Upsert a single diary entry to Supabase.
 *
 * Local always wins: we just push the local copy and let the server
 * row be replaced on conflict (id is the primary key). The local
 * `updated_at` is propagated so the cloud reflects when the change
 * actually happened on the device.
 */
export async function upsertEntry(entry: DiaryEntry, userId: string): Promise<void> {
  const { error } = await supabase.from('diary_input').upsert(
    {
      id: entry.id,
      user_id: userId,
      date: entry.date,
      title: entry.title ?? '',
      blocks: entry.blocks,
      updated_at: entry.updatedAt ?? new Date().toISOString(),
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
 * Push every local entry to Supabase. Each entry is upserted on its
 * own row so per-day data never gets mixed up.
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

/**
 * Pull every diary entry that belongs to this user from Supabase.
 *
 * The rows are normalised back into the local `DiaryEntry` shape so
 * the caller can hand them straight to the `mergeRemoteEntries`
 * reducer (which applies the local-wins merge rule).
 */
export async function pullRemoteEntries(userId: string): Promise<DiaryEntry[]> {
  const { data, error } = await supabase
    .from('diary_input')
    .select('id, date, title, blocks, created_at, updated_at')
    .eq('user_id', userId);
  if (error) throw error;
  if (!data) return [];

  return data.map((row: any) => ({
    id: row.id,
    date: row.date,
    title: row.title ?? '',
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
