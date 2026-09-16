import type { Mood, MoodEntry, MAX_MOODS_PER_DAY } from '~/store/slices/diarySlice';

export type MoodMeta = {
  key: Mood;
  label: string;
  icon: string;
  color: string; // color for the icon
};

// Ordered to match the home-screen mood selector (best -> worst).
export const MOODS: MoodMeta[] = [
  { key: 'great', label: 'Great', icon: 'emoji-happy', color: '#F5B544' },
  { key: 'good', label: 'Good', icon: 'emoji-happy', color: '#5FB344' },
  { key: 'okay', label: 'Okay', icon: 'emoji-neutral', color: '#3FA4D8' },
  { key: 'notgreat', label: 'Not great', icon: 'emoji-sad', color: '#E07A4A' },
  { key: 'stressed', label: 'Stressed', icon: 'emoji-sad', color: '#A86CC4' },
];

// Re-export MAX_MOODS_PER_DAY for convenience
export { MAX_MOODS_PER_DAY } from '~/store/slices/diarySlice';

// Note: If you want to use Gifs or specific icons, you can replace the emoji strings 
// with local asset paths or icon names here. For now, we've removed the background 
// colors in the UI and applied these colors directly to the emojis/icons.

export const getMoodMeta = (mood?: Mood): MoodMeta | undefined =>
  mood ? MOODS.find((m) => m.key === mood) : undefined;

// Get mood meta from a MoodEntry
export const getMoodEntryMeta = (moodEntry?: MoodEntry): MoodMeta | undefined =>
  moodEntry ? getMoodMeta(moodEntry.mood) : undefined;

// Human label for the average-mood stat card. Maps the 1..5 average
// (where 1 = great, 5 = stressed) back to a friendly label.
export const moodScore = (m: Mood): number => {
  switch (m) {
    case 'great':
      return 1;
    case 'good':
      return 2;
    case 'okay':
      return 3;
    case 'notgreat':
      return 4;
    case 'stressed':
      return 5;
  }
};

export const averageMoodLabel = (moods: Mood[]): { label: string; icon: string; color: string } => {
  if (!moods.length) return { label: '—', icon: 'emoji-happy', color: '#5FB344' };
  const avg = moods.reduce((a, b) => a + moodScore(b), 0) / moods.length;
  const rounded = Math.max(1, Math.min(5, Math.round(avg)));
  const meta = MOODS[rounded - 1];
  return { label: meta.label, icon: meta.icon, color: meta.color };
};

// Average mood from MoodEntry array
export const averageMoodFromEntries = (moodEntries: MoodEntry[]): { label: string; icon: string; color: string } => {
  const moods = moodEntries.map((e) => e.mood);
  return averageMoodLabel(moods);
};

// Format timestamp for display (e.g., "08:12 AM")
export const formatMoodTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
};

// Get the latest mood from an entry (handles both legacy and new format)
export const getLatestMoodFromEntry = (entry: { mood?: Mood; moods?: MoodEntry[] }): MoodMeta | undefined => {
  if (entry.moods?.length) {
    return getMoodMeta(entry.moods[entry.moods.length - 1].mood);
  }
  return getMoodMeta(entry.mood);
};

// Check if more moods can be added today
export const canAddMoreMoods = (moods?: MoodEntry[]): boolean => {
  return (moods?.length ?? 0) < 3;
};

// Get remaining mood slots for today
export const getRemainingMoodSlots = (moods?: MoodEntry[]): number => {
  return Math.max(0, 3 - (moods?.length ?? 0));
};
