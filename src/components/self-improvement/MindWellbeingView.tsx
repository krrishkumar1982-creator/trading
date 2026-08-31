import React, { useState } from 'react';
import {
  Moon,
  Dumbbell,
  Brain,
  Smartphone,
  Plus,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const MindWellbeingView: React.FC = () => {
  const {
    theme,
    selectedImprovementDate,
    sleepLogs,
    logSleep,
    exerciseLogs,
    logExercise,
    deepWorkSessions,
    distractionLogs,
    logDistraction,
  } = useTrading();

  const isLight = theme === 'light';

  // Sleep Log Form Modal/Inline state
  const [sleepHours, setSleepHours] = useState(7.8);
  const [sleepScore, setSleepScore] = useState(8);
  const [sleepBedtime, setSleepBedtime] = useState('22:30');
  const [sleepWakeTime, setSleepWakeTime] = useState('06:15');

  // Exercise Log state
  const [exerciseType, setExerciseType] = useState<'Strength' | 'Cardio' | 'HIIT' | 'Running' | 'Mobility' | 'Sports' | 'Walking'>('Strength');
  const [exerciseDuration, setExerciseDuration] = useState(45);
  const [exerciseIntensity, setExerciseIntensity] = useState<'Light' | 'Moderate' | 'Intense'>('Intense');

  // Distraction Log state
  const [socialMediaMins, setSocialMediaMins] = useState(15);
  const [youtubeMins, setYoutubeMins] = useState(10);
  const [distractionNotes, setDistractionNotes] = useState('');

  const handleSaveSleep = (e: React.FormEvent) => {
    e.preventDefault();
    logSleep({
      date: selectedImprovementDate || new Date().toISOString().split('T')[0],
      bedtime: sleepBedtime,
      wakeTime: sleepWakeTime,
      durationHours: Number(sleepHours),
      quality: Number(sleepScore),
      targetHours: 8,
      notes: 'Optimal deep sleep cycle and calm wake state.',
    });
  };

  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    logExercise({
      date: selectedImprovementDate || new Date().toISOString().split('T')[0],
      type: exerciseType,
      durationMins: Number(exerciseDuration),
      completed: true,
      intensity: exerciseIntensity,
      notes: 'Maintained strong form and breath control.',
    });
  };

  const handleSaveDistraction = (e: React.FormEvent) => {
    e.preventDefault();
    logDistraction({
      date: selectedImprovementDate || new Date().toISOString().split('T')[0],
      socialMediaMins: Number(socialMediaMins),
      youtubeMins: Number(youtubeMins),
      gamingMins: 0,
      entertainmentMins: 0,
      randomBrowsingMins: 5,
      notes: distractionNotes.trim() || 'Resisted urge to check non-essential feeds during trading session',
    });
    setDistractionNotes('');
  };

  const totalDeepWorkMinutes = deepWorkSessions.reduce((acc, s) => acc + (s.durationMins || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 4 Health Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Sleep */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Moon className="w-4 h-4" /> Sleep Index
            </span>
            <span className="font-mono text-[10px] text-slate-500">Recovery</span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-mono font-black text-indigo-400">
              {sleepLogs.length > 0 ? `${sleepLogs[0].durationHours}h` : '7.8h'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Quality: <strong className="text-indigo-300">{sleepLogs.length > 0 ? sleepLogs[0].quality : 8}/10</strong> (Optimal)
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/40">
            Bed: {sleepLogs.length > 0 ? sleepLogs[0].bedtime : '10:30 PM'} • Wake: {sleepLogs.length > 0 ? sleepLogs[0].wakeTime : '06:15 AM'}
          </div>
        </div>

        {/* 2. Physical Fitness */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Dumbbell className="w-4 h-4" /> Physical Training
            </span>
            <span className="font-mono text-[10px] text-slate-500">Endurance</span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-mono font-black text-rose-400">
              {exerciseLogs.length > 0 ? `${exerciseLogs[0].durationMins}m` : '45m'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {exerciseLogs.length > 0 ? `${exerciseLogs[0].type} (${exerciseLogs[0].intensity})` : 'Strength (Intense)'}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/40">
            Endurance & Core Conditioning
          </div>
        </div>

        {/* 3. Deep Work Flow */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Brain className="w-4 h-4" /> Deep Work Flow
            </span>
            <span className="font-mono text-[10px] text-slate-500">Cognitive</span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-mono font-black text-blue-400">
              {totalDeepWorkMinutes} min
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {deepWorkSessions.length} sessions completed today
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/40">
            Average Flow Rating: 9 / 10
          </div>
        </div>

        {/* 4. Digital Detox & Screen Discipline */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Smartphone className="w-4 h-4" /> Screen Discipline
            </span>
            <span className="font-mono text-[10px] text-slate-500">Detox</span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-mono font-black text-emerald-400">
              {distractionLogs.length > 0 ? `${distractionLogs[0].socialMediaMins}m` : '15m'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Controlled non-productive screen time
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/40">
            Zero doomscrolling during trading hours
          </div>
        </div>
      </div>

      {/* Two Columns: Sleep Architecture Log & Athletic Training Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sleep Logger */}
        <div
          className={`p-5 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Log Sleep Architecture & Recovery
              </h3>
            </div>
          </div>

          <form onSubmit={handleSaveSleep} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value) || 7.5)}
                  className={`w-full px-3 py-1.5 rounded-xl border font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Quality Score (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sleepScore}
                  onChange={(e) => setSleepScore(parseInt(e.target.value) || 8)}
                  className={`w-full px-3 py-1.5 rounded-xl border font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bedtime</label>
                <input
                  type="time"
                  value={sleepBedtime}
                  onChange={(e) => setSleepBedtime(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Wake Time</label>
                <input
                  type="time"
                  value={sleepWakeTime}
                  onChange={(e) => setSleepWakeTime(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/20"
              >
                Log Sleep (+40 XP)
              </button>
            </div>
          </form>
        </div>

        {/* Physical Exercise Logger */}
        <div
          className={`p-5 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Log Athletic Performance & Workout
              </h3>
            </div>
          </div>

          <form onSubmit={handleSaveExercise} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Workout Type</label>
                <select
                  value={exerciseType}
                  onChange={(e) => setExerciseType(e.target.value as any)}
                  className={`w-full px-3 py-1.5 rounded-xl border font-semibold ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <option value="Strength">Strength / Weights</option>
                  <option value="Cardio">Cardio / Zone 2</option>
                  <option value="Running">Running</option>
                  <option value="HIIT">HIIT</option>
                  <option value="Mobility">Mobility / Yoga</option>
                  <option value="Walking">Walking</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Intensity</label>
                <select
                  value={exerciseIntensity}
                  onChange={(e) => setExerciseIntensity(e.target.value as any)}
                  className={`w-full px-3 py-1.5 rounded-xl border font-semibold ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <option value="Light">Light</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Intense">Intense</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={exerciseDuration}
                onChange={(e) => setExerciseDuration(parseInt(e.target.value) || 45)}
                className={`w-full px-3 py-1.5 rounded-xl border font-mono ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-md shadow-rose-600/20"
              >
                Log Workout (+50 XP)
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Screen Distraction & Urge Control Protocol */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Digital Detox & Impulse Interception Log
            </h3>
          </div>
        </div>

        <form onSubmit={handleSaveDistraction} className="flex flex-wrap items-center gap-3 text-xs">
          <input
            type="text"
            placeholder="e.g. Resisted urge to open Twitter / Instagram during consolidation"
            value={distractionNotes}
            onChange={(e) => setDistractionNotes(e.target.value)}
            className={`flex-1 min-w-[240px] px-3.5 py-2 rounded-xl border font-medium ${
              isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 shrink-0"
          >
            Log Urge Resisted (+25 XP)
          </button>
        </form>
      </div>
    </div>
  );
};
