import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { Trade } from '../../types';

interface ImportTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportTradesModal: React.FC<ImportTradesModalProps> = ({ isOpen, onClose }) => {
  const { importTrades, addToast, accounts } = useTrading();
  const [csvText, setCsvText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const sampleCsv = `Symbol,Direction,EntryPrice,ExitPrice,NetPnL,RMultiple,Setup,Date
MES,BUY,5640.00,5665.00,625.00,2.50,Opening Drive,2026-08-20T09:35:00.000Z
NQ,SELL,19850.00,19780.00,700.00,3.00,Absorption Reversal,2026-08-21T10:15:00.000Z
ES,BUY,5635.00,5630.00,-250.00,-1.00,Gap Up and Fail,2026-08-22T09:40:00.000Z`;

  const handleParseAndImport = () => {
    const text = csvText.trim() || sampleCsv;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length <= 1) {
      addToast('Invalid CSV', 'Please provide CSV rows with headers', 'error');
      return;
    }

    const newTrades: Array<Omit<Trade, 'id'>> = [];
    const rows = lines.slice(1);

    rows.forEach(row => {
      const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 5) {
        const symbol = cols[0] || 'MES';
        const direction = (cols[1]?.toUpperCase() === 'SELL' ? 'SELL' : 'BUY') as 'BUY' | 'SELL';
        const entryPrice = parseFloat(cols[2]) || 5640;
        const exitPrice = parseFloat(cols[3]) || 5650;
        const netPnl = parseFloat(cols[4]) || 100;
        const rMultiple = parseFloat(cols[5]) || 1.5;
        const setup = cols[6] || 'Opening Drive';
        const date = cols[7] || new Date().toISOString();

        newTrades.push({
          accountId: accounts[0]?.id || 'acc-1',
          symbol,
          market: 'Futures',
          direction,
          status: 'CLOSED',
          entryDate: date,
          exitDate: date,
          entryPrice,
          exitPrice,
          quantity: 2,
          commission: 5.0,
          swap: 0,
          fees: 0,
          grossPnl: netPnl + 5.0,
          netPnl,
          rMultiple,
          roiPercent: parseFloat(((netPnl / (entryPrice * 2)) * 100).toFixed(2)),
          rating: 4,
          setupType: setup,
          session: 'New York',
          rulesFollowed: netPnl > 0,
          mistakes: [],
          emotionalState: 'Disciplined',
          notes: `Imported from CSV execution log (${symbol} ${direction})`,
          durationMinutes: 25,
          tags: ['CSV_IMPORT', setup],
        });
      }
    });

    if (newTrades.length > 0) {
      importTrades(newTrades);
      onClose();
    } else {
      addToast('Import Error', 'Could not parse any valid trade rows', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-400" />
            Import Trades via CSV / Broker Export
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag Drop Area */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = ev => setCsvText(ev.target?.result as string || '');
              reader.readAsText(file);
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
            isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-200">
            Drag & Drop your NinjaTrader, Tradovate, IBKR, or MT4/5 CSV export here
          </p>
          <p className="text-[11px] text-slate-500 mt-1">or paste raw CSV text in the box below</p>
        </div>

        {/* Text Area */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Raw CSV Data</label>
          <textarea
            rows={5}
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={sampleCsv}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-indigo-500 custom-scrollbar"
          />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCsvText(sampleCsv)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Insert Sample CSV Data
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleParseAndImport}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20"
            >
              Import Trades
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
