export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  requiredDays: number;
  color: string;
  gradientColors: [string, string];
}

export const BADGES: Badge[] = [
  {
    id: 'starter',
    title: 'Starter Writer',
    description: 'Completed your first achievement day — 3 entries in one day!',
    icon: '🥉',
    requiredDays: 1,
    color: '#CD7F32',
    gradientColors: ['#CD7F32', '#A0522D'],
  },
  {
    id: 'consistent',
    title: 'Consistent Mind',
    description: 'Two full days of triple-entry journaling. You\'re building a habit.',
    icon: '🥈',
    requiredDays: 2,
    color: '#A8A9AD',
    gradientColors: ['#C0C0C0', '#808080'],
  },
  {
    id: 'focused',
    title: 'Focused Soul',
    description: 'Five achievement days. Your mind is finding its rhythm.',
    icon: '🥇',
    requiredDays: 5,
    color: '#FFD700',
    gradientColors: ['#FFD700', '#FFA500'],
  },
  {
    id: 'disciplined',
    title: 'Disciplined Keeper',
    description: 'Ten days of dedicated writing. Real commitment shows.',
    icon: '🏆',
    requiredDays: 10,
    color: '#F59E0B',
    gradientColors: ['#F59E0B', '#D97706'],
  },
  {
    id: 'guardian',
    title: 'Journal Guardian',
    description: 'Twenty achievement days. You\'re guarding your story faithfully.',
    icon: '🦅',
    requiredDays: 20,
    color: '#6366F1',
    gradientColors: ['#6366F1', '#4F46E5'],
  },
  {
    id: 'master',
    title: 'Diary Master',
    description: 'Thirty days of deep journaling. You\'ve mastered the craft.',
    icon: '👑',
    requiredDays: 30,
    color: '#8B5CF6',
    gradientColors: ['#A78BFA', '#7C3AED'],
  },
  {
    id: 'keeper',
    title: 'Memory Keeper',
    description: 'Fifty achievement days. Every memory is safe in your hands.',
    icon: '💎',
    requiredDays: 50,
    color: '#06B6D4',
    gradientColors: ['#22D3EE', '#0891B2'],
  },
  {
    id: 'weaver',
    title: 'Story Weaver',
    description: 'Seventy-five days of reflection. Your life is a beautifully woven story.',
    icon: '🌟',
    requiredDays: 75,
    color: '#EC4899',
    gradientColors: ['#F472B6', '#BE185D'],
  },
  {
    id: 'dream',
    title: 'Dream Keeper',
    description: 'One hundred achievement days. A true journaling legend.',
    icon: '✨',
    requiredDays: 100,
    color: '#10B981',
    gradientColors: ['#34D399', '#059669'],
  },
  {
    id: 'legend',
    title: 'Legend Writer',
    description: 'One hundred and fifty days. Your diary is a monument to your inner life.',
    icon: '🔮',
    requiredDays: 150,
    color: '#F43F5E',
    gradientColors: ['#FB7185', '#E11D48'],
  },
];

export const REQUIRED_ENTRIES_PER_DAY = 3;
