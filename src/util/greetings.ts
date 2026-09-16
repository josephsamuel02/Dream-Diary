// greetings.ts
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface GreetingData {
  period: TimePeriod;
  text: string;
  icon: string;
}

const greetingsByTime: Record<TimePeriod, string[]> = {
  morning: [
    'Good morning!',
    'Rise and shine!',
    'Morning, sunshine!',
    'A fresh start awaits.',
    'New day, new story.',
  ],
  afternoon: [
    'Good afternoon!',
    "How's the day treating you?",
    'Afternoon check-in!',
    'Hope your day is going well.',
    'Taking a midday moment?',
  ],
  evening: [
    'Good evening!',
    'Winding down nicely?',
    'Evening reflection time.',
    'How was your day?',
    'The day is almost done.',
  ],
  night: [
    'Burning the midnight oil?',
    "Still up? Let's journal.",
    'Late nights, deep thoughts.',
    'The quiet hours are yours.',
    'Night owl mode activated.',
  ],
};

const periodIcons: Record<TimePeriod, string> = {
  morning: 'sunny',
  afternoon: 'partly-sunny',
  evening: 'moon',
  night: 'star',
};

/** Returns which time period the given hour falls in. */
export function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Returns a randomly chosen greeting for the current time of day.
 * Each call may return a different greeting from the pool of 5.
 */
export function getTimeGreeting(): GreetingData {
  const period = getTimePeriod(new Date().getHours());
  const pool = greetingsByTime[period];
  const text = pool[Math.floor(Math.random() * pool.length)];
  return { period, text, icon: periodIcons[period] };
}

export interface Quote {
  text: string;
  author: string;
}

const quotes: Quote[] = [
  { text: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Your life is your story. Write it well.', author: 'Unknown' },
  { text: 'In the journal I do not just express myself more openly than I could to any person; I create myself.', author: 'Susan Sontag' },
  { text: 'Fill your paper with the breathings of your heart.', author: 'William Wordsworth' },
  { text: 'Write what should not be forgotten.', author: 'Isabel Allende' },
  { text: 'A diary is the only place where you can be completely yourself.', author: 'Unknown' },
  { text: 'The act of writing is the act of discovering what you believe.', author: 'David Hare' },
  { text: 'Great things never come from comfort zones.', author: 'Unknown' },
  { text: 'One day or day one. You decide.', author: 'Unknown' },
  { text: 'The more you write, the more you discover who you are.', author: 'Unknown' },
  { text: 'Every day is a new page in the story of your life.', author: 'Unknown' },
  { text: 'Keep a diary and one day it will keep you.', author: 'Mae West' },
  { text: 'Writing is thinking on paper.', author: 'William Zinsser' },
  { text: 'Small steps every day lead to big changes over time.', author: 'Unknown' },
  { text: 'Your feelings are valid. Write them down.', author: 'Unknown' },
  { text: 'Journaling is like whispering to one\'s self and listening at the same time.', author: 'Mina Murray' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { text: 'Be yourself; everyone else is already taken.', author: 'Oscar Wilde' },
  { text: 'Happiness is not something ready made. It comes from your own actions.', author: 'Dalai Lama' },
  { text: 'The unexamined life is not worth living.', author: 'Socrates' },
  { text: 'What we think, we become.', author: 'Buddha' },
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
  { text: 'To write is to descend, to excavate, to go underground.', author: 'Anaïs Nin' },
  { text: 'Dream it. Wish it. Do it.', author: 'Unknown' },
];

/**
 * Returns 2 different quotes for the given date.
 * The pair changes each day and is deterministic (same date → same pair).
 */
export function getDailyQuotes(date: Date = new Date()): [Quote, Quote] {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  const first = quotes[dayOfYear % quotes.length];
  const second = quotes[(dayOfYear + Math.floor(quotes.length / 2) + 1) % quotes.length];
  return [first, second];
}

/**
 * Returns a single quote for the current time of day.
 * Switches to a second quote after 3 PM (15:00).
 */
export function getSingleDailyQuote(date: Date = new Date()): Quote {
  const [quoteA, quoteB] = getDailyQuotes(date);
  const hour = date.getHours();
  return hour >= 15 ? quoteB : quoteA;
}

const QUOTE_API_URL = 'https://zenquotes.io/api/quotes';

export { greetingsByTime, quotes, QUOTE_API_URL };
