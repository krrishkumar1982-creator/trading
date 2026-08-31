import React, { useState } from 'react';
import { RefreshCw, Plus, Trash2, CheckSquare, Square, CheckCircle } from 'lucide-react';

interface TradingChecklistCalcProps {
  onClose: () => void;
}

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export const TradingChecklistCalc: React.FC<TradingChecklistCalcProps> = ({ onClose }) => {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', text: 'Check Economic Calendar for High Impact News (CPI, FOMC, NFP)', checked: false },
    { id: '2', text: 'Identify Daily/HTF Trend and Bias (Bullish, Bearish, Range)', checked: false },
    { id: '3', text: 'Map Key Levels (HTF Support/Resistance, Order Blocks, Liquidity Pools)', checked: false },
    { id: '4', text: 'Assess market correlation indices (DXY, US10Y, VIX index)', checked: false },
    { id: '5', text: 'Calculate correct Position Size based on account risk rules (Max 1-2%)', checked: false },
    { id: '6', text: 'Confirm Entry Trigger adheres to Playbook setups (Strict confluence)', checked: false },
    { id: '7', text: 'Define Stop-Loss and Multiple Take-Profit targets in trade ticket', checked: false },
  ]);

  const [newItemText, setNewItemText] = useState('');

  const handleReset = () => {
    setItems(items.map(item => ({ ...item, checked: false })));
  };

  const toggleCheck = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      checked: false,
    };
    setItems([...items, newItem]);
    setNewItemText('');
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const checkedCount = items.filter(i => i.checked).length;
  const isAllChecked = items.length > 0 && checkedCount === items.length;

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Pre-Market Confluence Checklist</h4>
          <button
            onClick={handleReset}
            className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider font-mono"
          >
            <RefreshCw className="w-3 h-3" /> Reset Checks
          </button>
        </div>

        {/* Custom Input Form */}
        <form onSubmit={handleAddItem} className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add custom pre-flight rule..."
            className="flex-grow rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {/* Checklist List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                item.checked 
                  ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-400' 
                  : 'bg-slate-900 border-slate-800/80 text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.checked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
                <span className={`text-xs ${item.checked ? 'line-through' : ''}`}>{item.text}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
                className="text-slate-500 hover:text-rose-400 transition p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Progress indicators */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Progress: <span className="font-mono text-slate-200">{checkedCount} / {items.length}</span>
          </div>

          {isAllChecked && (
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle className="w-4 h-4 animate-bounce" /> Setups 100% Ready
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
