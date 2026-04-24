import type { Mood } from '~/store/slices/diarySlice';

export type MoodMeta = {
  key: Mood;
  label: string;
  emoji: string;
  color: string; // background tint for the chip / selector circle
};

// Ordered to match the home-screen mood selector (best -> worst).
export const MOODS: MoodMeta[] = [
  { key: 'great', label: 'Great', emoji: '😄', color: '#F5B544' },
  { key: 'good', label: 'Good', emoji: '🙂', color: '#5FB344' },
  { key: 'okay', label: 'Okay', emoji: '😐', color: '#3FA4D8' },
  { key: 'notgreat', label: 'Not great', emoji: '🙁', color: '#E07A4A' },
  { key: 'stressed', label: 'Stressed', emoji: '😣', color: '#A86CC4' },
];

export const getMoodMeta = (mood?: Mood): MoodMeta | undefined =>
  mood ? MOODS.find((m) => m.key === mood) : undefined;

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

export const averageMoodLabel = (moods: Mood[]): { label: string; emoji: string; color: string } => {
  if (!moods.length) return { label: '—', emoji: '🙂', color: '#5FB344' };
  const avg = moods.reduce((a, b) => a + moodScore(b), 0) / moods.length;
  const rounded = Math.max(1, Math.min(5, Math.round(avg)));
  const meta = MOODS[rounded - 1];
  return { label: meta.label, emoji: meta.emoji, color: meta.color };
};
