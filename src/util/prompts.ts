// Daily reflection prompts shown on the home screen.
// A new prompt rotates in every day, deterministically picked from
// the day-of-year so the same prompt is shown across reloads but a
// fresh one appears at local midnight.
export const reflectionPrompts: string[] = [
  'What made you smile today?\nEven the smallest things count.',
  'What are three things you are grateful for right now?',
  'Describe a moment today when you felt most like yourself.',
  'What is one thing you learned about yourself this week?',
  'If today had a color, what would it be and why?',
  'What is something you are looking forward to?',
  'Write about a small win you had today.',
  'What is something you wish you had more time for?',
  'Who made a positive impact on your day?',
  'What is one feeling you want to let go of tonight?',
  'If you could relive one moment from today, which would it be?',
  'What did your body need today, and did you give it that?',
  'What is something you are proud of right now?',
  'What thought has been on your mind today?',
  'Describe today in three words.',
];

export const promptIdeas: string[] = [
  'Write about your dream last night.',
  'List three goals for this week.',
  'What is your favorite memory from this month?',
  'Describe your perfect afternoon.',
  'What is a habit you want to build?',
];

export const getDailyPrompt = (date: Date = new Date()): string => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return reflectionPrompts[dayOfYear % reflectionPrompts.length];
};

export const getRandomIdea = (): string =>
  promptIdeas[Math.floor(Math.random() * promptIdeas.length)];
