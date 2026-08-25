import React from 'react';
import {
  X,
  Settings,
  Palette,
  Eye,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { ChartSettingsConfig } from '../types';

interface ChartSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChartSettingsConfig;
  onUpdateSettings: (settings: ChartSettingsConfig) => void;
}

const DEFAULT_SETTINGS: ChartSettingsConfig = {
  bullishColor: '#10b981',
  bearishColor: '#f43f5e',
  wickColor: '#94a3b8',
  lineColor: '#6366f1',
  areaTopColor: 'rgba(99, 102, 241, 0.35)',
  areaBottomColor: 'rgba(99, 102, 241, 0.0)',
  gridLinesColor: 'rgba(30, 41, 59, 0.45)',
  showGridLines: true,
  showWatermark: true,
  showVolume: true,
  priceScaleMode: 'NORMAL',
  showCountdownToBarClose: true,
};

export const ChartSettingsModal: React.FC<ChartSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof ChartSettingsConfig, val: any) => {
    onUpdateSettings({
      ...settings,
      [key]: val,
    });
  };

  const handleReset = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Chart Canvas Settings</h2>
              <p className="text-xs text-slate-400">Appearance, colors, and gridline preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Candle Colors */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span>Candlestick Colors</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-300 font-semibold">Bullish Bar</span>
                <input
                  type="color"
                  value={settings.bullishColor}
                  onChange={e => handleChange('bullishColor', e.target.value)}
                  className="w-7 h-7 rounded-md bg-transparent border-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-300 font-semibold">Bearish Bar</span>
                <input
                  type="color"
                  value={settings.bearishColor}
                  onChange={e => handleChange('bearishColor', e.target.value)}
                  className="w-7 h-7 rounded-md bg-transparent border-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2">
                <span className="text-xs text-slate-300 font-semibold">Wick & Shadow Line</span>
                <input
                  type="color"
                  value={settings.wickColor}
                  onChange={e => handleChange('wickColor', e.target.value)}
                  className="w-7 h-7 rounded-md bg-transparent border-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Visibility & Scales */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Display & Elements</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">Grid Lines</div>
                  <div className="text-[11px] text-slate-400">Show horizontal price & vertical time grid</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showGridLines}
                  onChange={e => handleChange('showGridLines', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">Symbol Watermark</div>
                  <div className="text-[11px] text-slate-400">Display background symbol watermark</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showWatermark}
                  onChange={e => handleChange('showWatermark', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white transition text-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
