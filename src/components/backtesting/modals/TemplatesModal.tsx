import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Bookmark,
  Check,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import { ChartTemplate, ChartType, IndicatorConfig } from '../types';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChartType: ChartType;
  currentIndicators: IndicatorConfig[];
  onApplyTemplate: (template: ChartTemplate) => void;
}

const DEFAULT_TEMPLATES: ChartTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Price Action & Key Levels',
    description: 'Clean chart without indicator clutter. Focus on raw candlesticks, market structure, and liquidity zones.',
    chartType: 'CANDLESTICK',
    indicators: [],
  },
  {
    id: 'tpl-2',
    name: 'ICT / Smart Money Concepts',
    description: 'Configured for order blocks, fair value gaps, liquidity runs, with Volume Profile and VWAP.',
    chartType: 'CANDLESTICK',
    indicators: [
      {
        id: 'vwap-ict',
        type: 'VWAP',
        name: 'VWAP',
        category: 'TREND',
        pane: 'MAIN',
        visible: true,
        params: {},
        styles: { color: '#f59e0b', lineWidth: 2 },
      },
      {
        id: 'vp-ict',
        type: 'VOLUME_PROFILE',
        name: 'Volume Profile',
        category: 'VOLUME',
        pane: 'MAIN',
        visible: true,
        params: { buckets: 24 },
        styles: { color: '#eab308', lineWidth: 1 },
      },
    ],
  },
  {
    id: 'tpl-3',
    name: 'Trend Follower Pro',
    description: 'Triple EMA system (20/50/200) + MACD Momentum sub-pane for high-probability trend continuation.',
    chartType: 'CANDLESTICK',
    indicators: [
      {
        id: 'ema-20',
        type: 'EMA',
        name: 'EMA 20',
        category: 'TREND',
        pane: 'MAIN',
        visible: true,
        params: { period: 20 },
        styles: { color: '#38bdf8', lineWidth: 1.5 },
      },
      {
        id: 'ema-50',
        type: 'EMA',
        name: 'EMA 50',
        category: 'TREND',
        pane: 'MAIN',
        visible: true,
        params: { period: 50 },
        styles: { color: '#f59e0b', lineWidth: 2 },
      },
      {
        id: 'macd-trend',
        type: 'MACD',
        name: 'MACD (12, 26, 9)',
        category: 'MOMENTUM',
        pane: 'LOWER_1',
        visible: true,
        params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
        styles: { color: '#38bdf8', secondaryColor: '#f97316', lineWidth: 2 },
      },
    ],
  },
  {
    id: 'tpl-4',
    name: 'Mean Reversion & Scalper',
    description: 'Bollinger Bands + RSI (14) oversold/overbought extremes for high-frequency scalping setups.',
    chartType: 'CANDLESTICK',
    indicators: [
      {
        id: 'bb-scalp',
        type: 'BOLLINGER',
        name: 'Bollinger Bands (20, 2)',
        category: 'VOLATILITY',
        pane: 'MAIN',
        visible: true,
        params: { period: 20, stdDev: 2 },
        styles: { color: '#38bdf8', lineWidth: 1.5 },
      },
      {
        id: 'rsi-scalp',
        type: 'RSI',
        name: 'RSI (14)',
        category: 'MOMENTUM',
        pane: 'LOWER_1',
        visible: true,
        params: { period: 14 },
        styles: { color: '#a855f7', lineWidth: 2 },
      },
    ],
  },
];

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  currentChartType,
  currentIndicators,
  onApplyTemplate,
}) => {
  const [templates, setTemplates] = useState<ChartTemplate[]>(() => {
    const saved = localStorage.getItem('duskflow_chart_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });

  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  if (!isOpen) return null;

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newTpl: ChartTemplate = {
      id: 'custom-' + Date.now(),
      name: newTemplateName,
      description: newTemplateDesc || 'Custom workspace template with active studies',
      chartType: currentChartType,
      indicators: currentIndicators,
    };

    const updated = [newTpl, ...templates];
    setTemplates(updated);
    localStorage.setItem('duskflow_chart_templates', JSON.stringify(updated));
    setNewTemplateName('');
    setNewTemplateDesc('');
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('duskflow_chart_templates', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Chart Layout Templates</h2>
              <p className="text-xs text-slate-400">Save and load configured technical study combinations</p>
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
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Save Current Workspace */}
          <form onSubmit={handleSaveCurrentAsTemplate} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Save Current Setup as Template
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Template name (e.g. My Trend Strategy)..."
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <input
                type="text"
                placeholder="Brief description..."
                value={newTemplateDesc}
                onChange={e => setNewTemplateDesc(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Template</span>
              </button>
            </div>
          </form>

          {/* Templates Grid */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300">Available Templates ({templates.length})</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map(tpl => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{tpl.name}</h4>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-indigo-400 font-mono">
                        {tpl.chartType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                    <div className="mt-2 text-[10px] text-slate-500 font-mono">
                      Studies: {tpl.indicators.length > 0 ? tpl.indicators.map(i => i.name).join(', ') : 'None (Clean)'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                    <button
                      onClick={() => {
                        onApplyTemplate(tpl);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply</span>
                    </button>

                    {tpl.id.startsWith('custom-') && (
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
