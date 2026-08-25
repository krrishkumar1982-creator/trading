import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Copy,
  Edit,
  ArrowUpDown,
  Download,
  Upload,
  CheckSquare,
  Square,
  Sparkles,
  Bot,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { Trade } from '../../types';

interface TradesListViewProps {
  onOpenAddTrade: () => void;
  onOpenImport: () => void;
}

export const TradesListView: React.FC<TradesListViewProps> = ({ onOpenAddTrade, onOpenImport }) => {
  const {
    filteredTrades,
    selectedTrade,
    setSelectedTrade,
    deleteTrade,
    duplicateTrade,
    bulkDeleteTrades,
    bulkEditTrades,
    formatCurrency,
    formatRMultiple,
    undoLastDelete,
    canUndo,
    playbooks,
    addToast,
    theme,
  } = useTrading();

  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [setupFilter, setSetupFilter] = useState<string>('ALL');
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'date' | 'pnl' | 'rMultiple' | 'symbol'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtered & Sorted Trades
  const processedTrades = useMemo(() => {
    return filteredTrades
      .filter(trade => {
        const matchesSearch =
          trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trade.setupType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trade.notes.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDir = directionFilter === 'ALL' || trade.direction === directionFilter;
        const matchesStatus = statusFilter === 'ALL' || trade.status === statusFilter;
        const matchesSetup = setupFilter === 'ALL' || trade.setupType === setupFilter;
        return matchesSearch && matchesDir && matchesStatus && matchesSetup;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'date') {
          diff = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
        } else if (sortField === 'pnl') {
          diff = a.netPnl - b.netPnl;
        } else if (sortField === 'rMultiple') {
          diff = a.rMultiple - b.rMultiple;
        } else if (sortField === 'symbol') {
          diff = a.symbol.localeCompare(b.symbol);
        }
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [filteredTrades, searchQuery, directionFilter, statusFilter, setupFilter, sortField, sortOrder]);

  const handleSelectAll = () => {
    if (selectedTradeIds.length === processedTrades.length) {
      setSelectedTradeIds([]);
    } else {
      setSelectedTradeIds(processedTrades.map(t => t.id));
    }
  };

  const handleToggleSelectTrade = (id: string) => {
    setSelectedTradeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Symbol', 'Market', 'Direction', 'Status', 'Entry Date', 'Entry Price', 'Exit Price', 'Net PnL', 'R Multiple', 'Setup', 'Rules Followed'];
    const rows = processedTrades.map(t => [
      t.id,
      t.symbol,
      t.market,
      t.direction,
      t.status,
      t.entryDate,
      t.entryPrice,
      t.exitPrice || '',
      t.netPnl,
      t.rMultiple,
      `"${t.setupType}"`,
      t.rulesFollowed ? 'YES' : 'NO'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `duskflow_trades_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV Exported', `${processedTrades.length} trades saved to CSV file`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pb-3 border-b ${
        isLight ? 'border-zinc-200' : 'border-slate-800'
      }`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 ${
            isLight ? 'text-zinc-900' : 'text-white'
          }`}>
            Trade Log & History
            <span className={`text-xs font-mono font-normal px-2 py-0.5 rounded-full border ${
              isLight ? 'bg-zinc-100 text-zinc-600 border-zinc-200' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {processedTrades.length} trades
            </span>
          </h1>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
            Audit executions, verify rule discipline, and run automated AI reviews
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canUndo && (
            <button
              onClick={undoLastDelete}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                isLight
                  ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 shadow-xs'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              }`}
              title="Undo last deleted trade"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Delete</span>
            </button>
          )}

          <button
            onClick={exportToCSV}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              isLight
                ? 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs'
                : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenImport}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              isLight
                ? 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs'
                : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          <button
            onClick={onOpenAddTrade}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-semibold shadow-md shadow-blue-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Trade</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border ${
        isLight
          ? 'bg-white border-zinc-200 shadow-xs'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-zinc-400' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search by symbol, setup, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl py-1.5 pl-9 pr-4 text-xs focus:outline-none border ${
              isLight
                ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-blue-500'
                : 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Direction Filter */}
          <div className={`flex items-center rounded-xl p-0.5 border ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-slate-950 border-slate-800'
          }`}>
            {(['ALL', 'BUY', 'SELL'] as const).map(dir => (
              <button
                key={dir}
                onClick={() => setDirectionFilter(dir)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  directionFilter === dir
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : isLight
                      ? 'text-zinc-600 hover:text-zinc-900'
                      : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className={`flex items-center rounded-xl p-0.5 border ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-slate-950 border-slate-800'
          }`}>
            {(['ALL', 'OPEN', 'CLOSED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : isLight
                      ? 'text-zinc-600 hover:text-zinc-900'
                      : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Setup Filter Dropdown */}
          <select
            value={setupFilter}
            onChange={e => setSetupFilter(e.target.value)}
            className={`rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer border ${
              isLight
                ? 'bg-white border-zinc-300 text-zinc-800 focus:border-blue-500 shadow-xs'
                : 'bg-slate-950 border-slate-800 text-slate-300 focus:border-blue-500'
            }`}
          >
            <option value="ALL">All Setups</option>
            {playbooks.map(pb => (
              <option key={pb.id} value={pb.name}>
                {pb.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when rows selected) */}
      {selectedTradeIds.length > 0 && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs animate-in fade-in border ${
          isLight
            ? 'bg-blue-50 border-blue-200 shadow-xs text-blue-950'
            : 'bg-blue-950/40 border-blue-500/30 text-blue-300'
        }`}>
          <span className={`font-semibold ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>
            {selectedTradeIds.length} {selectedTradeIds.length === 1 ? 'trade' : 'trades'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                bulkEditTrades(selectedTradeIds, { rulesFollowed: true });
                setSelectedTradeIds([]);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                isLight
                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200'
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300'
              }`}
            >
              Mark Rules Followed
            </button>
            <button
              onClick={() => {
                bulkDeleteTrades(selectedTradeIds);
                setSelectedTradeIds([]);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition ${
                isLight
                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200'
                  : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Trades Table */}
      <div className={`rounded-2xl border shadow-xl overflow-hidden ${
        isLight
          ? 'border-zinc-200 bg-white text-zinc-900'
          : 'border-slate-800/90 bg-slate-900/90 shadow-2xl text-slate-300'
      }`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] font-bold uppercase tracking-wider select-none ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 text-zinc-600'
                : 'bg-slate-950/80 border-slate-800 text-slate-400'
            }`}>
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="flex items-center justify-center">
                    {selectedTradeIds.length === processedTrades.length && processedTrades.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className={`w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-slate-600'}`} />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => {
                    setSortField('symbol');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className={`p-3 cursor-pointer ${isLight ? 'hover:text-zinc-900' : 'hover:text-white'}`}
                >
                  <div className="flex items-center gap-1">
                    Symbol <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-zinc-400' : 'text-slate-600'}`} />
                  </div>
                </th>
                <th className="p-3">Direction</th>
                <th className="p-3">Status</th>
                <th
                  onClick={() => {
                    setSortField('date');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className={`p-3 cursor-pointer ${isLight ? 'hover:text-zinc-900' : 'hover:text-white'}`}
                >
                  <div className="flex items-center gap-1">
                    Entry Time <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-zinc-400' : 'text-slate-600'}`} />
                  </div>
                </th>
                <th className="p-3">Entry / Exit</th>
                <th
                  onClick={() => {
                    setSortField('pnl');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className={`p-3 cursor-pointer ${isLight ? 'hover:text-zinc-900' : 'hover:text-white'}`}
                >
                  <div className="flex items-center gap-1">
                    Net P&L <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-zinc-400' : 'text-slate-600'}`} />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField('rMultiple');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className={`p-3 cursor-pointer ${isLight ? 'hover:text-zinc-900' : 'hover:text-white'}`}
                >
                  <div className="flex items-center gap-1">
                    R-Multiple <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-zinc-400' : 'text-slate-600'}`} />
                  </div>
                </th>
                <th className="p-3">Setup / Playbook</th>
                <th className="p-3">Rules</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-zinc-100' : 'divide-slate-800/60'}`}>
              {processedTrades.map(trade => {
                const isSelected = selectedTradeIds.includes(trade.id);
                const isWin = trade.netPnl > 0;
                const isLoss = trade.netPnl < 0;

                return (
                  <tr
                    key={trade.id}
                    className={`transition cursor-pointer ${
                      isLight
                        ? isSelected
                          ? 'bg-blue-50/80'
                          : 'hover:bg-zinc-50'
                        : isSelected
                        ? 'bg-blue-950/20'
                        : 'hover:bg-slate-800/50'
                    }`}
                    onClick={() => setSelectedTrade(trade)}
                  >
                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleSelectTrade(trade.id)}
                        className="flex items-center justify-center mx-auto"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className={`w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-slate-600'}`} />
                        )}
                      </button>
                    </td>

                    {/* Symbol */}
                    <td className={`p-3 font-bold flex items-center gap-2 ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                      <span>{trade.symbol}</span>
                      <span className={`text-[10px] font-normal ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>{trade.market}</span>
                    </td>

                    {/* Direction */}
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trade.direction === 'BUY'
                            ? isLight ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isLight ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          trade.status === 'OPEN'
                            ? isLight ? 'bg-blue-100 text-blue-700 border border-blue-200 font-bold' : 'bg-blue-500/20 text-blue-300 animate-pulse'
                            : isLight ? 'bg-zinc-100 text-zinc-600 border border-zinc-200' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {trade.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className={`p-3 font-mono text-[11px] ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {trade?.entryDate ? new Date(trade.entryDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '—'}
                    </td>

                    {/* Entry / Exit */}
                    <td className={`p-3 font-mono text-[11px] ${isLight ? 'text-zinc-700' : 'text-slate-300'}`}>
                      <span>${trade.entryPrice}</span>
                      <span className={`mx-1 ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>→</span>
                      <span>{trade.exitPrice ? `$${trade.exitPrice}` : '—'}</span>
                    </td>

                    {/* Net P&L */}
                    <td className="p-3 font-mono font-extrabold text-xs">
                      <span className={
                        isWin
                          ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                          : isLoss
                          ? isLight ? 'text-rose-600' : 'text-rose-400'
                          : isLight ? 'text-zinc-600' : 'text-slate-400'
                      }>
                        {formatCurrency(trade.netPnl)}
                      </span>
                    </td>

                    {/* R Multiple */}
                    <td className="p-3 font-mono font-bold text-xs">
                      <span className={
                        trade.rMultiple >= 0
                          ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                          : isLight ? 'text-rose-600' : 'text-rose-400'
                      }>
                        {formatRMultiple(trade.rMultiple)}
                      </span>
                    </td>

                    {/* Setup Type */}
                    <td className={`p-3 ${isLight ? 'text-zinc-800' : 'text-slate-200'}`}>
                      <span className="font-medium truncate max-w-[140px] block">
                        {trade.setupType}
                      </span>
                    </td>

                    {/* Rules Followed */}
                    <td className="p-3">
                      {trade.rulesFollowed ? (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isLight
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        }`}>
                          Followed ✓
                        </span>
                      ) : (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isLight
                            ? 'text-rose-700 bg-rose-50 border border-rose-200'
                            : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        }`}>
                          Broken ✗
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => duplicateTrade(trade.id)}
                          className={`p-1 rounded transition ${
                            isLight
                              ? 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                          title="Duplicate Trade"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTrade(trade.id)}
                          className={`p-1 rounded transition ${
                            isLight
                              ? 'text-zinc-400 hover:text-rose-600 hover:bg-zinc-100'
                              : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                          }`}
                          title="Delete Trade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {processedTrades.length === 0 && (
            <div className={`text-center py-16 ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>
              <p className="text-sm font-semibold">No trades matching your filters</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-zinc-500' : 'text-slate-600'}`}>Try resetting the filter search or log a new trade</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
