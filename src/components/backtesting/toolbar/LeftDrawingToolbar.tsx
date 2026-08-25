import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer,
  Crosshair,
  Hand,
  TrendingUp,
  Minus,
  MoveRight,
  Split,
  Square,
  Circle,
  Triangle,
  Type,
  Tag,
  Shield,
  Target,
  Ruler,
  Calendar,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  ChevronRight,
  PenTool,
  Grid,
} from 'lucide-react';
import { DrawingToolType, ChartDrawing } from '../types';

interface LeftDrawingToolbarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  drawings: ChartDrawing[];
  onUpdateDrawings: (drawings: ChartDrawing[]) => void;
  theme: 'dark' | 'light' | 'liquid';
}

interface ToolGroup {
  id: string;
  defaultTool: DrawingToolType;
  icon: React.ReactNode;
  label: string;
  subTools: { id: DrawingToolType; label: string; icon: React.ReactNode }[];
}

export const LeftDrawingToolbar: React.FC<LeftDrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  drawings,
  onUpdateDrawings,
  theme,
}) => {
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [areDrawingsLocked, setAreDrawingsLocked] = useState(false);
  const [areDrawingsHidden, setAreDrawingsHidden] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close flyout on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveFlyout(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toolGroups: ToolGroup[] = [
    // 1. Cursors
    {
      id: 'CURSORS',
      defaultTool: 'CROSSHAIR',
      icon: <Crosshair className="w-4 h-4" />,
      label: 'Cursor & Crosshair',
      subTools: [
        { id: 'CROSSHAIR', label: 'Crosshair', icon: <Crosshair className="w-4 h-4" /> },
        { id: 'CURSOR', label: 'Pointer', icon: <MousePointer className="w-4 h-4" /> },
        { id: 'PAN', label: 'Pan / Hand', icon: <Hand className="w-4 h-4" /> },
      ],
    },
    // 2. Lines
    {
      id: 'LINES',
      defaultTool: 'TREND_LINE',
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Trendlines & Rays',
      subTools: [
        { id: 'TREND_LINE', label: 'Trend Line', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'HORIZONTAL_LINE', label: 'Horizontal Line', icon: <Minus className="w-4 h-4" /> },
        { id: 'HORIZONTAL_RAY', label: 'Horizontal Ray', icon: <MoveRight className="w-4 h-4" /> },
        { id: 'VERTICAL_LINE', label: 'Vertical Line', icon: <div className="w-4 h-4 flex items-center justify-center font-bold">|</div> },
        { id: 'ARROW', label: 'Arrow Line', icon: <MoveRight className="w-4 h-4" /> },
      ],
    },
    // 3. Channels & Forks
    {
      id: 'CHANNELS',
      defaultTool: 'PARALLEL_CHANNEL',
      icon: <Split className="w-4 h-4" />,
      label: 'Channels & Pitchforks',
      subTools: [
        { id: 'PARALLEL_CHANNEL', label: 'Parallel Channel', icon: <Split className="w-4 h-4" /> },
        { id: 'REGRESSION_CHANNEL', label: 'Regression Channel', icon: <Split className="w-4 h-4" /> },
        { id: 'PITCHFORK', label: 'Andrews Pitchfork', icon: <Grid className="w-4 h-4" /> },
      ],
    },
    // 4. Fibonacci
    {
      id: 'FIBONACCI',
      defaultTool: 'FIB_RETRACEMENT',
      icon: <Grid className="w-4 h-4" />,
      label: 'Fibonacci Tools',
      subTools: [
        { id: 'FIB_RETRACEMENT', label: 'Fib Retracement (0 - 1.0)', icon: <Grid className="w-4 h-4" /> },
        { id: 'FIB_EXTENSION', label: 'Fib Extension', icon: <Grid className="w-4 h-4" /> },
        { id: 'FIB_TIME_ZONES', label: 'Fib Time Zones', icon: <Calendar className="w-4 h-4" /> },
      ],
    },
    // 5. Geometric Shapes
    {
      id: 'SHAPES',
      defaultTool: 'RECTANGLE',
      icon: <Square className="w-4 h-4" />,
      label: 'Geometric Shapes',
      subTools: [
        { id: 'RECTANGLE', label: 'Rectangle / Order Block', icon: <Square className="w-4 h-4" /> },
        { id: 'CIRCLE', label: 'Circle / Ellipse', icon: <Circle className="w-4 h-4" /> },
        { id: 'TRIANGLE', label: 'Triangle Pattern', icon: <Triangle className="w-4 h-4" /> },
        { id: 'BRUSH', label: 'Freehand Brush', icon: <PenTool className="w-4 h-4" /> },
      ],
    },
    // 6. Annotations
    {
      id: 'ANNOTATIONS',
      defaultTool: 'TEXT',
      icon: <Type className="w-4 h-4" />,
      label: 'Text & Price Labels',
      subTools: [
        { id: 'TEXT', label: 'Text Note', icon: <Type className="w-4 h-4" /> },
        { id: 'PRICE_LABEL', label: 'Price Label', icon: <Tag className="w-4 h-4" /> },
      ],
    },
    // 7. Measurement & Risk/Reward
    {
      id: 'MEASUREMENT',
      defaultTool: 'LONG_POSITION',
      icon: <Target className="w-4 h-4" />,
      label: 'Long/Short Risk Reward & Ruler',
      subTools: [
        { id: 'LONG_POSITION', label: 'Long Position Setup (R:R)', icon: <Target className="w-4 h-4 text-emerald-400" /> },
        { id: 'SHORT_POSITION', label: 'Short Position Setup (R:R)', icon: <Target className="w-4 h-4 text-rose-400" /> },
        { id: 'PRICE_RANGE', label: 'Price Range (Pips/Ticks)', icon: <Ruler className="w-4 h-4" /> },
        { id: 'DATE_RANGE', label: 'Date / Bars Range', icon: <Calendar className="w-4 h-4" /> },
      ],
    },
  ];

  // Lock / Unlock all drawings
  const handleToggleLock = () => {
    const nextLocked = !areDrawingsLocked;
    setAreDrawingsLocked(nextLocked);
    onUpdateDrawings(drawings.map(d => ({ ...d, locked: nextLocked })));
  };

  // Hide / Show all drawings
  const handleToggleHide = () => {
    const nextHidden = !areDrawingsHidden;
    setAreDrawingsHidden(nextHidden);
    onUpdateDrawings(drawings.map(d => ({ ...d, visible: !nextHidden })));
  };

  // Clear all drawings
  const handleClearAll = () => {
    if (drawings.length === 0) return;
    if (window.confirm('Delete all chart drawings?')) {
      onUpdateDrawings([]);
    }
  };

  return (
    <div
      ref={toolbarRef}
      className={`flex flex-col items-center gap-1.5 p-1.5 rounded-2xl border transition-all ${
        theme === 'liquid'
          ? 'bg-slate-900/80 border-slate-700/60 backdrop-blur-md shadow-xl'
          : theme === 'dark'
          ? 'bg-slate-950/90 border-slate-800 shadow-md'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Tool Groups List */}
      {toolGroups.map(group => {
        const isGroupActive = group.subTools.some(st => st.id === activeTool);
        const activeSubTool = group.subTools.find(st => st.id === activeTool) || group.subTools[0];
        const isFlyoutOpen = activeFlyout === group.id;

        return (
          <div key={group.id} className="relative group">
            <button
              onClick={() => {
                if (isFlyoutOpen) {
                  setActiveFlyout(null);
                } else {
                  setActiveFlyout(group.id);
                  onSelectTool(activeSubTool.id);
                }
              }}
              className={`p-2 rounded-xl text-xs transition relative flex items-center justify-center cursor-pointer ${
                isGroupActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={group.label}
            >
              {activeSubTool.icon}
              {group.subTools.length > 1 && (
                <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-slate-500 rounded-full" />
              )}
            </button>

            {/* Flyout Menu */}
            {isFlyoutOpen && group.subTools.length > 1 && (
              <div className="absolute left-full top-0 ml-2 w-52 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 px-2 py-0.5 border-b border-slate-800">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.subTools.map(st => (
                    <button
                      key={st.id}
                      onClick={() => {
                        onSelectTool(st.id);
                        setActiveFlyout(null);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition text-left cursor-pointer ${
                        activeTool === st.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="shrink-0">{st.icon}</span>
                      <span className="truncate">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="w-6 border-t border-slate-800 my-1" />

      {/* Utility Actions (Lock, Hide, Clear) */}
      <button
        onClick={handleToggleLock}
        className={`p-2 rounded-xl text-xs transition cursor-pointer ${
          areDrawingsLocked
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
        title={areDrawingsLocked ? 'Unlock all drawings' : 'Lock all drawings'}
      >
        {areDrawingsLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
      </button>

      <button
        onClick={handleToggleHide}
        className={`p-2 rounded-xl text-xs transition cursor-pointer ${
          areDrawingsHidden
            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
        title={areDrawingsHidden ? 'Show all drawings' : 'Hide all drawings'}
      >
        {areDrawingsHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      <button
        onClick={handleClearAll}
        disabled={drawings.length === 0}
        className={`p-2 rounded-xl text-xs transition cursor-pointer ${
          drawings.length > 0
            ? 'text-rose-400 hover:bg-rose-500/20'
            : 'text-slate-700 cursor-not-allowed'
        }`}
        title="Delete all chart drawings"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
