import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Copy,
  ArrowUpDown,
  Download,
  Upload,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, directionFilter, statusFilter, setupFilter, sortField, sortOrder, pageSize]);

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

  const totalTrades = processedTrades.length;
  const totalPages = Math.max(1, Math.ceil(totalTrades / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalTrades);
  const paginatedTrades = processedTrades.slice(startIndex, endIndex);

  const handleSelectAll = () => {
    const currentPageIds = paginatedTrades.map(t => t.id);
    const allCurrentSelected = currentPageIds.every(id => selectedTradeIds.includes(id));
    if (allCurrentSelected) {
      setSelectedTradeIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedTradeIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
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

  const handleSort = (field: 'date' | 'pnl' | 'rMultiple' | 'symbol') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const renderSortIndicator = (field: 'date' | 'pnl' | 'rMultiple' | 'symbol') => {
    if (sortField === field) {
      return sortOrder === 'asc' ? (
        <ChevronUp className="w-3 h-3 text-[#3B82F6]" />
      ) : (
        <ChevronDown className="w-3 h-3 text-[#3B82F6]" />
      );
    }
    return <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-zinc-400' : 'text-[#525565]'}`} />;
  };

  const formatEntryTime = (dateStr?: string) => {
    if (!dateStr) return { date: '—', time: '' };
    try {
      const d = new Date(dateStr);
      const dateFormatted = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) + ',';
      const timeFormatted = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return { date: dateFormatted, time: timeFormatted };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '—';
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const formatNetPnl = (pnl: number) => {
    const isPositive = pnl > 0;
    const isNegative = pnl < 0;
    const absFormatted = Math.abs(pnl).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (isPositive) return `+${absFormatted}`;
    if (isNegative) return `-${absFormatted}`;
    return absFormatted;
  };

  return (
    <div className="w-full space-y-3.5">
      {/* Top Header */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
        isLight ? 'border-zinc-200' : 'border-[#1E202A]'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isLight ? 'text-zinc-900' : 'text-[#F4F4F6]'
            }`}>
              Trade Log & History
            </h1>
            <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${
              isLight
                ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                : 'bg-[#12131A] text-[#8E90A0] border-[#262838]'
            }`}>
              {processedTrades.length} trades
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-zinc-500' : 'text-[#717483]'}`}>
            Audit executions, verify rule discipline, and run automated AI reviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canUndo && (
            <button
              type="button"
              onClick={undoLastDelete}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
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

          {/* Secondary: Export CSV */}
          <button
            type="button"
            onClick={exportToCSV}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              isLight
                ? 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs'
                : 'border-[#262838] bg-[#12131A] hover:bg-[#1A1C26] text-[#A1A3B4] hover:text-white shadow-xs'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Secondary: Import */}
          <button
            type="button"
            onClick={onOpenImport}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              isLight
                ? 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs'
                : 'border-[#262838] bg-[#12131A] hover:bg-[#1A1C26] text-[#A1A3B4] hover:text-white shadow-xs'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          {/* Primary: Add Trade */}
          <button
            type="button"
            onClick={onOpenAddTrade}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563FF] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563FF] text-white px-4 py-1.5 text-xs font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Trade</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Toolbar */}
      <div className={`flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-xl border ${
        isLight
          ? 'bg-white border-zinc-200 shadow-xs'
          : 'bg-[#0E0F14] border-[#22242E]'
      }`}>
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isLight ? 'text-zinc-400' : 'text-[#646777]'}`} />
          <input
            type="text"
            placeholder="Search by symbol, setup, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none border transition-all ${
              isLight
                ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-blue-500'
                : 'bg-[#08090D] border-[#1E202A] text-[#F4F4F6] placeholder-[#5A5C69] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20'
            }`}
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Direction Filter Segment */}
          <div className={`flex items-center rounded-lg p-0.5 border ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#08090D] border-[#1E202A]'
          }`}>
            {(['ALL', 'BUY', 'SELL'] as const).map(dir => (
              <button
                key={dir}
                type="button"
                onClick={() => setDirectionFilter(dir)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  directionFilter === dir
                    ? 'bg-[#2563FF] text-white shadow-xs'
                    : isLight
                      ? 'text-zinc-600 hover:text-zinc-900'
                      : 'text-[#7C7E8C] hover:text-[#E1E3EB]'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>

          {/* Status Filter Segment */}
          <div className={`flex items-center rounded-lg p-0.5 border ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#08090D] border-[#1E202A]'
          }`}>
            {(['ALL', 'OPEN', 'CLOSED'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-[#2563FF] text-white shadow-xs'
                    : isLight
                      ? 'text-zinc-600 hover:text-zinc-900'
                      : 'text-[#7C7E8C] hover:text-[#E1E3EB]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Setup Filter Dropdown */}
          <div className="relative">
            <select
              value={setupFilter}
              onChange={e => setSetupFilter(e.target.value)}
              className={`appearance-none rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium focus:outline-none cursor-pointer border transition-all ${
                isLight
                  ? 'bg-white border-zinc-300 text-zinc-800 focus:border-blue-500 shadow-xs'
                  : 'bg-[#08090D] border-[#1E202A] text-[#A1A3B4] hover:text-white hover:border-[#2D303E] focus:border-[#3B82F6]'
              }`}
            >
              <option value="ALL">All Setups</option>
              {playbooks.map(pb => (
                <option key={pb.id} value={pb.name}>
                  {pb.name}
                </option>
              ))}
            </select>
            <ChevronDown className={`w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none ${isLight ? 'text-zinc-400' : 'text-[#646777]'}`} />
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedTradeIds.length > 0 && (
        <div className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs border animate-in fade-in duration-150 ${
          isLight
            ? 'bg-blue-50 border-blue-200 shadow-xs text-blue-950'
            : 'bg-blue-950/40 border-blue-500/30 text-blue-300'
        }`}>
          <span className={`font-semibold ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>
            {selectedTradeIds.length} {selectedTradeIds.length === 1 ? 'trade' : 'trades'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
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
              type="button"
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

      {/* Main Trade Table Card */}
      <div className={`rounded-xl border overflow-hidden shadow-2xl ${
        isLight
          ? 'border-zinc-200 bg-white text-zinc-900 shadow-zinc-200/50'
          : 'border-[#22242E] bg-[#0E0F14] text-[#F4F4F6] shadow-black/40'
      }`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`border-b text-[11px] font-semibold uppercase tracking-wider select-none ${
              isLight
                ? 'bg-zinc-50/90 border-zinc-200 text-zinc-600'
                : 'bg-[#090A0E] border-[#1E202A] text-[#7C7E8C]'
            }`}>
              <tr>
                {/* Select All Checkbox */}
                <th className="w-10 min-w-[40px] max-w-[40px] pl-3.5 pr-1 py-2.5 text-center align-middle">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    aria-label="Select all trades"
                    className={`inline-flex items-center justify-center p-0.5 rounded transition ${
                      isLight ? 'hover:bg-zinc-200/60' : 'hover:bg-white/10'
                    }`}
                  >
                    {paginatedTrades.length > 0 && paginatedTrades.every(t => selectedTradeIds.includes(t.id)) ? (
                      <CheckSquare className="w-4 h-4 text-[#3B82F6]" />
                    ) : (
                      <Square className={`w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-[#4E5162]'}`} />
                    )}
                  </button>
                </th>

                {/* Symbol Sort */}
                <th
                  onClick={() => handleSort('symbol')}
                  className={`pl-1 pr-3.5 py-2.5 cursor-pointer transition ${isLight ? 'hover:text-zinc-900' : 'hover:text-white'}`}
                >
                  <div className="flex items-center gap-1">
                    <span>SYMBOL</span> {renderSortIndicator('symbol')}
                  </div>
                </th>

                <th className="px-3 py-2.5">DIRECTION</th>
                <th className="px-3 py-2.5">STATUS</th>

                {/* Entry Time Sort */}
                <th
                  onClick={() => handleSort('date')}
                  className={`px-3 py-2.5 cursor-pointer transition ${isLight ? 'hover:text-zinc-900' : 'hover:text-white'}`}
                >
                  <div className="flex items-center gap-1">
                    <span>ENTRY TIME</span> {renderSortIndicator('date')}
                  </div>
                </th>

                <th className="px-3 py-2.5">ENTRY / EXIT</th>

                {/* Net P&L Sort */}
                <th
                  onClick={() => handleSort('pnl')}
                  className={`px-3 py-2.5 cursor-pointer transition ${isLight ? 'hover:text-zinc-900' : 'hover:text-white'}`}
                >
                  <div className="flex items-center gap-1">
                    <span>NET P&L</span> {renderSortIndicator('pnl')}
                  </div>
                </th>

                {/* R-Multiple Sort */}
                <th
                  onClick={() => handleSort('rMultiple')}
                  className={`px-3 py-2.5 cursor-pointer transition ${isLight ? 'hover:text-zinc-900' : 'hover:text-white'}`}
                >
                  <div className="flex items-center gap-1">
                    <span>R-MULTIPLE</span> {renderSortIndicator('rMultiple')}
                  </div>
                </th>

                <th className="px-3 py-2.5">SETUP / PLAYBOOK</th>
                <th className="px-3 py-2.5">RULES</th>
                <th className="px-3.5 py-2.5 text-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody className={`divide-y ${isLight ? 'divide-zinc-100' : 'divide-[#161821]'}`}>
              {paginatedTrades.map(trade => {
                const isSelected = selectedTradeIds.includes(trade.id);
                const isWin = trade.netPnl > 0;
                const isLoss = trade.netPnl < 0;
                const entryTime = formatEntryTime(trade.entryDate);

                return (
                  <tr
                    key={trade.id}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isLight
                        ? isSelected
                          ? 'bg-blue-50/80'
                          : 'hover:bg-zinc-50/90'
                        : isSelected
                        ? 'bg-[#19223D]/50 hover:bg-[#1E2847]/60'
                        : 'hover:bg-[#14151D]'
                    }`}
                    onClick={() => setSelectedTrade(trade)}
                  >
                    {/* Row Checkbox */}
                    <td
                      className="w-10 min-w-[40px] max-w-[40px] pl-3.5 pr-1 py-2.5 text-center align-middle"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSelectTrade(trade.id)}
                        aria-label={`Select trade ${trade.symbol}`}
                        className={`inline-flex items-center justify-center p-0.5 rounded transition ${
                          isLight ? 'hover:bg-zinc-200/60' : 'hover:bg-white/10'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#3B82F6]" />
                        ) : (
                          <Square className={`w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-[#4E5162]'}`} />
                        )}
                      </button>
                    </td>

                    {/* Symbol + Market Badge */}
                    <td className="pl-1 pr-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-[13px] tracking-tight ${
                          isLight ? 'text-zinc-900' : 'text-[#F4F4F6]'
                        }`}>
                          {trade.symbol}
                        </span>
                        <span className={`text-[10.5px] font-mono px-1.5 py-0.5 rounded border ${
                          isLight
                            ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            : 'bg-[#181A22] text-[#8C8F9F] border-[#272938]'
                        }`}>
                          {trade.market}
                        </span>
                      </div>
                    </td>

                    {/* Direction */}
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded text-[11px] font-black tracking-wider ${
                          trade.direction === 'BUY'
                            ? isLight
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-[#00D6A3]/10 text-[#00E599] border border-[#00D6A3]/30'
                            : isLight
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-[#FF3D6E]/10 text-[#FF4D6D] border border-[#FF3D6E]/30'
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide ${
                          trade.status === 'OPEN'
                            ? isLight
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-blue-950/40 text-blue-400 border border-blue-500/30 animate-pulse'
                            : isLight
                              ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                              : 'bg-[#181A22] text-[#8C8F9F] border border-[#272938]'
                        }`}
                      >
                        {trade.status}
                      </span>
                    </td>

                    {/* Entry Time */}
                    <td className="px-3 py-2.5 font-mono text-xs">
                      <div className={`font-medium ${isLight ? 'text-zinc-800' : 'text-[#C8CAD3]'}`}>
                        {entryTime.date}
                      </div>
                      {entryTime.time && (
                        <div className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-[#6E7182]'}`}>
                          {entryTime.time}
                        </div>
                      )}
                    </td>

                    {/* Entry / Exit */}
                    <td className="px-3 py-2.5 font-mono text-xs">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className={`font-medium ${isLight ? 'text-zinc-800' : 'text-[#E1E3EB]'}`}>
                          {formatPrice(trade.entryPrice)}
                        </span>
                        <span className={isLight ? 'text-zinc-400' : 'text-[#5D6071]'}>→</span>
                        <span className={`font-medium ${isLight ? 'text-zinc-800' : 'text-[#E1E3EB]'}`}>
                          {formatPrice(trade.exitPrice)}
                        </span>
                      </div>
                    </td>

                    {/* Net P&L */}
                    <td className="px-3 py-2.5 font-mono font-bold text-xs sm:text-[13px] tracking-tight">
                      <span className={
                        isWin
                          ? isLight ? 'text-emerald-600' : 'text-[#00E599]'
                          : isLoss
                          ? isLight ? 'text-rose-600' : 'text-[#FF4D6D]'
                          : isLight ? 'text-zinc-600' : 'text-[#8E909D]'
                      }>
                        {formatNetPnl(trade.netPnl)}
                      </span>
                    </td>

                    {/* R Multiple */}
                    <td className="px-3 py-2.5 font-mono font-semibold text-xs tracking-tight">
                      <span className={
                        trade.rMultiple > 0
                          ? isLight ? 'text-emerald-600' : 'text-[#00E599]'
                          : trade.rMultiple < 0
                          ? isLight ? 'text-rose-600' : 'text-[#FF4D6D]'
                          : isLight ? 'text-zinc-600' : 'text-[#8E909D]'
                      }>
                        {trade.rMultiple > 0 ? `+${trade.rMultiple.toFixed(2)}R` : `${trade.rMultiple.toFixed(2)}R`}
                      </span>
                    </td>

                    {/* Setup / Playbook */}
                    <td className="px-3 py-2.5">
                      <span className={`font-medium text-xs truncate max-w-[160px] block ${
                        isLight ? 'text-zinc-800' : 'text-[#C8CAD3]'
                      }`}>
                        {trade.setupType}
                      </span>
                    </td>

                    {/* Rules Followed */}
                    <td className="px-3 py-2.5">
                      {trade.rulesFollowed ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                          isLight
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-[#00E599] bg-[#00D6A3]/10 border border-[#00D6A3]/25'
                        }`}>
                          Followed ✓
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                          isLight
                            ? 'text-rose-700 bg-rose-50 border border-rose-200'
                            : 'text-[#FF3D6E] bg-[#FF3D6E]/10 border border-[#FF3D6E]/25'
                        }`}>
                          Broken ✗
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3.5 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateTrade(trade.id)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                            isLight
                              ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                              : 'text-[#717483] hover:text-[#E1E3EB] hover:bg-white/[0.07]'
                          }`}
                          title="Duplicate Trade"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTrade(trade.id)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                            isLight
                              ? 'text-zinc-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-[#717483] hover:text-[#FF4D6D] hover:bg-[#FF3D6E]/15'
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
            <div className={`text-center py-12 ${isLight ? 'text-zinc-400' : 'text-[#717483]'}`}>
              <p className="text-xs font-semibold">No trades matching your filters</p>
              <p className={`text-[11px] mt-1 ${isLight ? 'text-zinc-500' : 'text-[#5A5C69]'}`}>
                Try resetting the search or log a new trade
              </p>
            </div>
          )}
        </div>

        {/* Table Footer / Pagination */}
        <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t ${
          isLight
            ? 'border-zinc-200 bg-zinc-50/60 text-zinc-600'
            : 'border-[#1E202A] bg-[#090A0E] text-[#7C7E8C]'
        }`}>
          <div className="flex items-center gap-3 text-xs">
            <div>
              Showing <span className={`font-medium ${isLight ? 'text-zinc-900' : 'text-[#E1E3EB]'}`}>{totalTrades > 0 ? startIndex + 1 : 0}</span> to{' '}
              <span className={`font-medium ${isLight ? 'text-zinc-900' : 'text-[#E1E3EB]'}`}>{endIndex}</span> of{' '}
              <span className={`font-medium ${isLight ? 'text-zinc-900' : 'text-[#E1E3EB]'}`}>{totalTrades}</span> trades
            </div>

            <div className="flex items-center gap-1.5 ml-2 border-l border-zinc-700/30 pl-3">
              <span className="text-[11px] opacity-70">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={`px-2 py-0.5 rounded border text-[11px] font-semibold focus:outline-none ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-800'
                    : 'bg-[#14151C] border-[#2A2D3A] text-zinc-200'
                }`}
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${
                safePage === 1
                  ? 'opacity-30 cursor-not-allowed border-transparent'
                  : isLight
                    ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                    : 'border-[#1E202A] bg-[#0E0F14] hover:bg-[#181922] text-[#A1A3B4] hover:text-white'
              }`}
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Prev Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${
                safePage === 1
                  ? 'opacity-30 cursor-not-allowed border-transparent'
                  : isLight
                    ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                    : 'border-[#1E202A] bg-[#0E0F14] hover:bg-[#181922] text-[#A1A3B4] hover:text-white'
              }`}
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-6 h-6 rounded text-xs font-semibold transition-all ${
                  safePage === pageNum
                    ? 'bg-[#2563FF] text-white shadow-xs font-bold'
                    : isLight
                      ? 'text-zinc-600 hover:bg-zinc-100'
                      : 'text-[#7C7E8C] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {pageNum}
              </button>
            ))}

            {/* Next Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages || totalPages === 0}
              className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${
                safePage === totalPages || totalPages === 0
                  ? 'opacity-30 cursor-not-allowed border-transparent'
                  : isLight
                    ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                    : 'border-[#1E202A] bg-[#0E0F14] hover:bg-[#181922] text-[#A1A3B4] hover:text-white'
              }`}
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages || totalPages === 0}
              className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${
                safePage === totalPages || totalPages === 0
                  ? 'opacity-30 cursor-not-allowed border-transparent'
                  : isLight
                    ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                    : 'border-[#1E202A] bg-[#0E0F14] hover:bg-[#181922] text-[#A1A3B4] hover:text-white'
              }`}
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

