import { supabase, isSupabaseConfigured } from '~/lib/supabase';
import type { DiaryEntry } from '~/store/slices/diarySlice';

function assertConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured — set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
}

/**
 * Upsert a single diary entry to Supabase.
 *
 * Local always wins: we just push the local copy and let the server
 * row be replaced on conflict (id is the primary key). The local
 * `updated_at` is propagated so the cloud reflects when the change
 * actually happened on the device.
 *
 * Includes moods/mood/tag so nothing is lost on restore. Falls back to
 * the legacy payload when the cloud table hasn't been migrated yet
 * (missing moods/mood/tag columns).
 */
export async function upsertEntry(entry: DiaryEntry, userId: string): Promise<void> {
  assertConfigured();
  const fullPayload = {
    id: entry.id,
    user_id: userId,
    date: entry.date,
    title: entry.title ?? '',
    blocks: entry.blocks,
    moods: entry.moods ?? [],
    mood: entry.mood ?? entry.moods?.[entry.moods.length - 1]?.mood ?? null,
    tag: entry.tag ?? null,
    updated_at: entry.updatedAt ?? new Date().toISOString(),
  };
  const { error } = await supabase.from('diary_input').upsert(fullPayload, { onConflict: 'id' });
  if (!error) return;

  if (isMissingColumnError(error)) {
    // Legacy table without new columns — retry without them.
    const { error: legacyError } = await supabase.from('diary_input').upsert(
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
    if (legacyError) throw legacyError;
    console.warn(
      'diarySync: cloud table missing moods/mood/tag columns — ran migration 002_diary_input_moods_tag.sql to fix.'
    );
    return;
  }
  throw error;
}

function isMissingColumnError(err: any): boolean {
  const msg = `${err?.message ?? ''} ${err?.details ?? ''} ${err?.hint ?? ''}`.toLowerCase();
  return (
    err?.code === 'PGRST204' ||
    msg.includes('could not find') ||
    (msg.includes('column') && msg.includes('does not exist')) ||
    msg.includes('moods') ||
    msg.includes('schema cache')
  );
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
  if (!isSupabaseConfigured()) {
    result.failed = entries.length;
    result.errors.push('Supabase not configured');
    return result;
  }

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
  assertConfigured();
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
  assertConfigured();
  const { data, error } = await supabase
    .from('diary_input')
    .select('id, date, title, blocks, moods, mood, tag, created_at, updated_at')
    .eq('user_id', userId);
  if (error) {
    if (isMissingColumnError(error)) {
      // Legacy table — pull without new columns.
      const { data: legacyData, error: legacyError } = await supabase
        .from('diary_input')
        .select('id, date, title, blocks, created_at, updated_at')
        .eq('user_id', userId);
      if (legacyError) throw legacyError;
      if (!legacyData) return [];
      return legacyData.map((row: any) => ({
        id: row.id,
        date: row.date,
        title: row.title ?? '',
        blocks: Array.isArray(row.blocks) ? row.blocks : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }
    throw error;
  }
  if (!data) return [];

  return data.map((row: any) => ({
    id: row.id,
    date: row.date,
    title: row.title ?? '',
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    moods: Array.isArray(row.moods) ? row.moods : undefined,
    mood: row.mood ?? undefined,
    tag: row.tag ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
