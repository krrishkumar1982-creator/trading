import {
  SelfHabit,
  HabitCompletion,
  DailyTask,
  DailyCheckin,
  MorningCheckin,
  NightlyReview,
  DailyRoutine,
  RoutineCompletion,
  SleepLog,
  ExerciseLog,
  LearningLog,
  DeepWorkSession,
  DistractionLog,
  DisciplineStreakRecord,
  GrowthScoreBreakdown,
  Trade,
  GrowthAchievement,
  UserGrowthLevel,
  PersonalRule,
} from '../types';

// Category Weights (Sum = 100%)
export const GROWTH_WEIGHTS = {
  discipline: 0.20,      // 20%
  productivity: 0.20,    // 20%
  physical: 0.15,        // 15%
  mental: 0.15,          // 15%
  recovery: 0.10,        // 10%
  learning: 0.10,        // 10%
  trading: 0.10,         // 10%
};

/**
 * Calculates Trading Discipline Score (0-100) based on actual TradeForge trades
 */
export function calculateTradingDisciplineMetrics(trades: Trade[], targetDate?: string): {
  overallScore: number;
  riskDiscipline: number;
  ruleCompliance: number;
  overtradingControl: number;
  journalCompletion: number;
  emotionalControl: number;
  totalTradesToday: number;
} {
  const filteredTrades = targetDate
    ? trades.filter(t => t.entryDate.startsWith(targetDate))
    : trades;

  if (filteredTrades.length === 0) {
    return {
      overallScore: 85, // Neutral baseline when no trades taken
      riskDiscipline: 90,
      ruleCompliance: 90,
      overtradingControl: 95,
      journalCompletion: 85,
      emotionalControl: 90,
      totalTradesToday: 0,
    };
  }

  let rulesFollowedCount = 0;
  let journalFilledCount = 0;
  let emotionalCleanCount = 0;
  let stopLossDefinedCount = 0;
  let severeMistakesCount = 0;

  filteredTrades.forEach(trade => {
    if (trade.rulesFollowed) rulesFollowedCount++;
    if (trade.notes && trade.notes.trim().length > 10 && trade.rating > 0) journalFilledCount++;
    if (trade.stopLoss && trade.stopLoss > 0) stopLossDefinedCount++;

    const isEmotional =
      trade.emotionalState === 'FOMO' ||
      trade.emotionalState === 'Revenge' ||
      trade.emotionalState === 'Greedy' ||
      (trade.mistakes && trade.mistakes.some(m => /fomo|revenge|chasing|impulsive|gambling/i.test(m)));
    if (!isEmotional) emotionalCleanCount++;

    if (trade.mistakeSeverity === 'High') severeMistakesCount++;
  });

  const ruleCompliance = Math.round((rulesFollowedCount / filteredTrades.length) * 100);
  const journalCompletion = Math.round((journalFilledCount / filteredTrades.length) * 100);
  const emotionalControl = Math.round((emotionalCleanCount / filteredTrades.length) * 100);
  const stopLossScore = Math.round((stopLossDefinedCount / filteredTrades.length) * 100);

  // Overtrading penalty: ideal 1-5 trades; severe penalty if > 10 trades in a day
  let overtradingControl = 100;
  if (filteredTrades.length > 5) {
    overtradingControl = Math.max(30, 100 - (filteredTrades.length - 5) * 10);
  }

  // Risk discipline
  const riskDiscipline = Math.max(20, Math.round((stopLossScore * 0.7) + ((filteredTrades.length - severeMistakesCount) / filteredTrades.length * 30)));

  const overallScore = Math.round(
    ruleCompliance * 0.25 +
    riskDiscipline * 0.25 +
    overtradingControl * 0.20 +
    journalCompletion * 0.15 +
    emotionalControl * 0.15
  );

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    riskDiscipline,
    ruleCompliance,
    overtradingControl,
    journalCompletion,
    emotionalControl,
    totalTradesToday: filteredTrades.length,
  };
}

/**
 * Calculates Comprehensive Personal Growth Score Breakdown (0-100) for a given date
 */
export function calculateDailyGrowthScore(params: {
  date: string;
  habits: SelfHabit[];
  habitCompletions: HabitCompletion[];
  tasks: DailyTask[];
  checkin?: DailyCheckin;
  morningCheckin?: MorningCheckin;
  nightlyReview?: NightlyReview;
  routines: DailyRoutine[];
  routineCompletions: RoutineCompletion[];
  sleepLog?: SleepLog;
  exerciseLog?: ExerciseLog;
  learningLog?: LearningLog;
  deepWorkSessions: DeepWorkSession[];
  distractionLog?: DistractionLog;
  disciplineStreak?: DisciplineStreakRecord;
  trades: Trade[];
  rules: PersonalRule[];
}): GrowthScoreBreakdown {
  const {
    date,
    habits,
    habitCompletions,
    tasks,
    checkin,
    morningCheckin,
    nightlyReview,
    routines,
    routineCompletions,
    sleepLog,
    exerciseLog,
    learningLog,
    deepWorkSessions,
    distractionLog,
    disciplineStreak,
    trades,
    rules,
  } = params;

  // 1. DISCIPLINE SCORE (Habits, Routines, Rules, Discipline Streak, Nightly Review)
  const activeHabits = habits.filter(h => h.active);
  const daysHabitCompletions = habitCompletions.filter(c => c.date === date && c.completed);
  const habitRate = activeHabits.length > 0
    ? (daysHabitCompletions.length / activeHabits.length) * 100
    : 80;

  // Routine rate
  const totalRoutineItems = routines.filter(r => r.active).reduce((acc, r) => acc + (r.items?.length || 0), 0);
  const daysRoutineCompletions = routineCompletions.filter(c => c.date === date && c.completed);
  const routineRate = totalRoutineItems > 0
    ? (daysRoutineCompletions.length / totalRoutineItems) * 100
    : 80;

  // Rules verification
  const activeRules = rules.filter(r => r.active);
  const verifiedRules = activeRules.filter(r => r.verifiedDates?.includes(date));
  const rulesRate = activeRules.length > 0
    ? (verifiedRules.length / activeRules.length) * 100
    : 85;

  // Digital / Purity discipline factor
  let digitalDisciplineBonus = 85;
  if (disciplineStreak && disciplineStreak.currentStreakDays > 0) {
    digitalDisciplineBonus = Math.min(100, 75 + Math.min(25, disciplineStreak.currentStreakDays * 2));
  }

  // Nightly review reflection
  const reflectionScore = nightlyReview?.reflectionScore || 80;

  const disciplineScore = Math.round(
    habitRate * 0.35 +
    routineRate * 0.25 +
    rulesRate * 0.15 +
    digitalDisciplineBonus * 0.15 +
    reflectionScore * 0.10
  );

  // 2. PRODUCTIVITY SCORE (Tasks, Deep Work, Low Distraction)
  const daysTasks = tasks.filter(t => t.dueDate === date);
  const completedTasks = daysTasks.filter(t => t.status === 'Completed');
  const taskRate = daysTasks.length > 0
    ? (completedTasks.length / daysTasks.length) * 100
    : 75;

  const totalDeepWorkMins = deepWorkSessions
    .filter(s => s.date === date)
    .reduce((acc, s) => acc + s.durationMins, 0);
  // 90 mins deep work = 100%
  const deepWorkScore = Math.min(100, Math.round((totalDeepWorkMins / 90) * 100));

  // Distraction penalty
  const totalDistractionMins = distractionLog
    ? (distractionLog.socialMediaMins || 0) +
      (distractionLog.youtubeMins || 0) +
      (distractionLog.gamingMins || 0) +
      (distractionLog.entertainmentMins || 0) +
      (distractionLog.randomBrowsingMins || 0)
    : 0;
  const distractionScore = Math.max(30, 100 - Math.round(totalDistractionMins / 2));

  const checkinProductivity = (checkin?.productivity || 7) * 10;

  const productivityScore = Math.round(
    taskRate * 0.35 +
    deepWorkScore * 0.35 +
    distractionScore * 0.15 +
    checkinProductivity * 0.15
  );

  // 3. PHYSICAL HEALTH (Exercise, Steps, Physical habits)
  let exerciseScore = 70;
  if (exerciseLog && exerciseLog.completed) {
    const durationPts = Math.min(60, (exerciseLog.durationMins / 45) * 60);
    const stepsPts = Math.min(40, ((exerciseLog.steps || 6000) / 10000) * 40);
    exerciseScore = Math.min(100, Math.round(durationPts + stepsPts));
  }
  const physicalScore = exerciseScore;

  // 4. MENTAL WELLBEING (Mood, Focus, Stress, Gratitude, Morning Mission)
  let mentalScore = 75;
  if (checkin) {
    const moodPts = checkin.mood * 10;
    const focusPts = checkin.focus * 10;
    const stressInvertedPts = (11 - checkin.stress) * 10; // lower stress = higher score
    const motivationPts = checkin.motivation * 10;
    const gratitudeBonus = (checkin.gratitudes && checkin.gratitudes.length > 0) ? 10 : 0;

    mentalScore = Math.min(100, Math.round(
      (moodPts * 0.25 + focusPts * 0.25 + stressInvertedPts * 0.25 + motivationPts * 0.25) + gratitudeBonus * 0.5
    ));
  } else if (morningCheckin) {
    mentalScore = Math.min(100, morningCheckin.energyLevel * 10);
  }

  // 5. SLEEP & RECOVERY
  let recoveryScore = 75;
  if (sleepLog) {
    const durationRatio = sleepLog.durationHours / (sleepLog.targetHours || 8.0);
    const durationPts = Math.min(50, durationRatio >= 0.9 && durationRatio <= 1.15 ? 50 : durationRatio * 45);
    const qualityPts = (sleepLog.quality / 10) * 50;
    recoveryScore = Math.min(100, Math.round(durationPts + qualityPts));
  } else if (morningCheckin) {
    recoveryScore = morningCheckin.sleepQuality * 10;
  }

  // 6. LEARNING & INTELLECT
  let learningScore = 70;
  if (learningLog) {
    const durationPts = Math.min(60, (learningLog.durationMins / 30) * 60);
    const pagesPts = Math.min(40, ((learningLog.pagesRead || 15) / 20) * 40);
    learningScore = Math.min(100, Math.round(durationPts + pagesPts));
  }

  // 7. TRADING DISCIPLINE
  const tradingMetrics = calculateTradingDisciplineMetrics(trades, date);
  const tradingDisciplineScore = tradingMetrics.overallScore;

  // WEIGHTED TOTAL SCORE (0-100)
  const totalScore = Math.min(100, Math.max(0, Math.round(
    disciplineScore * GROWTH_WEIGHTS.discipline +
    productivityScore * GROWTH_WEIGHTS.productivity +
    physicalScore * GROWTH_WEIGHTS.physical +
    mentalScore * GROWTH_WEIGHTS.mental +
    recoveryScore * GROWTH_WEIGHTS.recovery +
    learningScore * GROWTH_WEIGHTS.learning +
    tradingDisciplineScore * GROWTH_WEIGHTS.trading
  )));

  return {
    totalScore,
    disciplineScore: Math.min(100, Math.max(0, disciplineScore)),
    productivityScore: Math.min(100, Math.max(0, productivityScore)),
    physicalScore: Math.min(100, Math.max(0, physicalScore)),
    mentalScore: Math.min(100, Math.max(0, mentalScore)),
    recoveryScore: Math.min(100, Math.max(0, recoveryScore)),
    learningScore: Math.min(100, Math.max(0, learningScore)),
    tradingDisciplineScore: Math.min(100, Math.max(0, tradingDisciplineScore)),
    tradingMetrics,
    streakDays: 1,
    yesterdayScore: 0,
    sevenDayAvg: totalScore,
    thirtyDayAvg: totalScore,
    bestDayScore: totalScore,
  };
}

/**
 * Calculates XP & Growth Level
 */
export function calculateGrowthLevelAndXp(actions: {
  completedHabitsCount: number;
  completedTasksCount: number;
  completedRoutinesCount: number;
  checkinsCount: number;
  sleepLogsCount: number;
  exerciseLogsCount: number;
  learningLogsCount: number;
  deepWorkHoursTotal: number;
  disciplinedTradesCount: number;
}): UserGrowthLevel {
  const xp =
    actions.completedHabitsCount * 15 +
    actions.completedTasksCount * 20 +
    actions.completedRoutinesCount * 25 +
    actions.checkinsCount * 30 +
    actions.sleepLogsCount * 15 +
    actions.exerciseLogsCount * 35 +
    actions.learningLogsCount * 30 +
    Math.round(actions.deepWorkHoursTotal * 40) +
    actions.disciplinedTradesCount * 25;

  // Level scaling: Level 1 = 0-500 XP, Level 2 = 500-1100 XP, etc.
  let level = 1;
  let remainingXp = xp;
  let threshold = 500;

  while (remainingXp >= threshold) {
    remainingXp -= threshold;
    level++;
    threshold = Math.round(threshold * 1.25);
  }

  const titles = [
    'Initiate Trader',
    'Disciplined Practitioner',
    'Execution Apprentice',
    'Focused Operator',
    'Cognitive Master',
    'High-Performance Trader',
    'Elite Strategist',
    'Master of Mind & Capital',
    'Institutional Grandmaster',
  ];

  const titleIndex = Math.min(titles.length - 1, Math.floor((level - 1) / 3));

  return {
    level,
    currentXp: remainingXp,
    nextLevelXp: threshold,
    title: titles[titleIndex],
  };
}

/**
 * Default starter achievement definitions
 */
export const DEFAULT_ACHIEVEMENTS: GrowthAchievement[] = [
  {
    id: 'first-step',
    title: 'First Step',
    description: 'Complete your first daily self-improvement check-in.',
    icon: 'Sparkles',
    category: 'Consistency',
    xpReward: 50,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: '7-day-discipline',
    title: '7-Day Discipline',
    description: 'Maintain a 7-day personal growth streak.',
    icon: 'Flame',
    category: 'Discipline',
    xpReward: 150,
    unlocked: false,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: '30-day-discipline',
    title: '30-Day Discipline',
    description: 'Maintain a 30-day disciplined routine streak.',
    icon: 'Trophy',
    category: 'Discipline',
    xpReward: 400,
    unlocked: false,
    progress: 0,
    maxProgress: 30,
  },
  {
    id: '100-day-discipline',
    title: '100-Day Centurion',
    description: 'Maintain an unbroken 100-day execution streak.',
    icon: 'Shield',
    category: 'Discipline',
    xpReward: 1000,
    unlocked: false,
    progress: 0,
    maxProgress: 100,
  },
  {
    id: 'deep-worker',
    title: 'Deep Worker',
    description: 'Accumulate 50 hours of distraction-free deep work.',
    icon: 'Brain',
    category: 'DeepWork',
    xpReward: 300,
    unlocked: false,
    progress: 0,
    maxProgress: 50,
  },
  {
    id: 'consistent-trader',
    title: 'Consistent Trader',
    description: 'Complete 30 comprehensive trading reviews.',
    icon: 'Target',
    category: 'Trading',
    xpReward: 350,
    unlocked: false,
    progress: 0,
    maxProgress: 30,
  },
  {
    id: 'risk-master',
    title: 'Risk Master',
    description: 'Maintain zero risk breaches for 30 trading days.',
    icon: 'Lock',
    category: 'Trading',
    xpReward: 500,
    unlocked: false,
    progress: 0,
    maxProgress: 30,
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Score 90+ growth score for 7 consecutive days.',
    icon: 'Zap',
    category: 'Consistency',
    xpReward: 450,
    unlocked: false,
    progress: 0,
    maxProgress: 7,
  },
];

/**
 * Recommended starter habit templates
 */
export const STARTER_HABIT_TEMPLATES = [
  { name: 'Sleep 7.5+ Hours', category: 'Morning' as const, target: '7.5h', difficulty: 'medium' as const, weight: 3 },
  { name: 'Morning Hydration & Sunlight', category: 'Morning' as const, target: '500ml water + 10m sun', difficulty: 'easy' as const, weight: 2 },
  { name: 'Pre-Market Preparation Checklist', category: 'Trading' as const, target: 'Complete before market open', difficulty: 'medium' as const, weight: 4 },
  { name: 'Respect Daily Loss Limit (No Revenge)', category: 'Trading' as const, target: 'Max 2% daily loss cap', difficulty: 'hard' as const, weight: 5 },
  { name: '60 Min Deep Work Block', category: 'Productivity' as const, target: 'Zero phone/socials', difficulty: 'medium' as const, weight: 3 },
  { name: '30-45 Min Physical Workout', category: 'Fitness' as const, target: 'Strength or Cardio', difficulty: 'medium' as const, weight: 3 },
  { name: 'Read 20 Pages of Book / Market Material', category: 'Productivity' as const, target: '20 pages', difficulty: 'easy' as const, weight: 2 },
  { name: 'Nightly Reflection & Gratitude', category: 'Mind' as const, target: 'Complete before bed', difficulty: 'easy' as const, weight: 2 },
];
