import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Clock,
  Zap,
  Calendar,
  Compass,
  FastForward,
} from 'lucide-react';
import { ReplayCandle } from '../types';

interface ReplayControlBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onResetToStart: () => void;
  currentIndex: number;
  startIndex: number;
  totalCandles: number;
  onSeek: (index: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speedMs: number) => void;
  startDate: string;
  onChangeStartDate: (date: string) => void;
  currentCandle?: ReplayCandle;
  isReplayModeActive: boolean;
  onToggleReplayMode: () => void;
  theme: 'dark' | 'light' | 'liquid';
}

export const ReplayControlBar: React.FC<ReplayControlBarProps> = ({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onResetToStart,
  currentIndex,
  startIndex,
  totalCandles,
  onSeek,
  playbackSpeed,
  onChangeSpeed,
  startDate,
  onChangeStartDate,
  currentCandle,
  isReplayModeActive,
  onToggleReplayMode,
  theme,
}) => {
  const progressPercent =
    totalCandles > 0 ? ((currentIndex - startIndex) / Math.max(1, totalCandles - 1 - startIndex)) * 100 : 0;

  return (
    <div
      className={`w-full flex flex-wrap items-center justify-between gap-2.5 p-2 px-3 rounded-2xl border transition-all ${
        theme === 'liquid'
          ? 'bg-slate-900/80 border-slate-700/60 backdrop-blur-md shadow-xl'
          : theme === 'dark'
          ? 'bg-slate-950/90 border-slate-800 shadow-md'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* 1. REPLAY MODE BADGE & SESSION DATE */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleReplayMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            isReplayModeActive
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/50'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
          title="Toggle Bar Replay Simulator"
        >
          <Compass className={`w-3.5 h-3.5 ${isReplayModeActive ? 'animate-spin' : ''}`} />
          <span>REPLAY MODE</span>
        </button>

        {/* Start Date Picker */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <input
            type="date"
            value={startDate}
            onChange={e => onChangeStartDate(e.target.value)}
            className="bg-transparent text-slate-300 text-xs focus:outline-none font-mono cursor-pointer"
            title="Replay Session Historical Start Date"
          />
        </div>
      </div>

      {/* 2. CENTER PLAYBACK CONTROLLER */}
      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-inner">
        {/* Reset to Start */}
        <button
          onClick={onResetToStart}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Jump to Session Replay Start"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
        </button>

        {/* Step Back (1 Bar) */}
        <button
          onClick={onStepBackward}
          disabled={currentIndex <= startIndex}
          className={`p-2 rounded-xl transition cursor-pointer ${
            currentIndex <= startIndex
              ? 'text-slate-700 cursor-not-allowed'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Step Backward (1 Bar)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Play / Pause Toggle */}
        <button
          onClick={onTogglePlay}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        {/* Step Forward (1 Bar) */}
        <button
          onClick={onStepForward}
          disabled={currentIndex >= totalCandles - 1}
          className={`p-2 rounded-xl transition cursor-pointer ${
            currentIndex >= totalCandles - 1
              ? 'text-slate-700 cursor-not-allowed'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Step Forward (1 Bar)"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Speed Selector Dropdown */}
        <select
          value={playbackSpeed}
          onChange={e => onChangeSpeed(Number(e.target.value))}
          className="bg-slate-950 border border-slate-800 text-indigo-400 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
        >
          <option value={2000}>0.5x Speed</option>
          <option value={1000}>1.0x Speed</option>
          <option value={500}>2.0x Speed</option>
          <option value={200}>5.0x Speed</option>
          <option value={100}>10.0x Speed</option>
          <option value={30}>Max / Instant</option>
        </select>
      </div>

      {/* 3. REPLAY TIMELINE PROGRESS SCRUBBER */}
      <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-sm">
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min={startIndex}
            max={Math.max(startIndex + 1, totalCandles - 1)}
            value={currentIndex}
            onChange={e => onSeek(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>
              Bar <strong className="text-white">{currentIndex + 1}</strong> / {totalCandles}
            </span>
            <span className="text-indigo-400 font-semibold">{progressPercent.toFixed(0)}%</span>
            <span>{currentCandle ? currentCandle.timeString.substring(5) : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
