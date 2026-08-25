import React, { useState } from 'react';
import {
  CalendarDays,
  Star,
  Bell,
  Search,
  Filter,
  AlertTriangle,
  Flame,
  Globe,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { PerformanceCalendar } from '../dashboard/PerformanceCalendar';
import { DrawdownChart } from '../dashboard/DrawdownChart';
import { TradeTimePerformanceChart } from '../dashboard/TradeTimePerformanceChart';

export const EconomicCalendarView: React.FC = () => {
  const {
    calendarEvents,
    toggleEventFavorite,
    toggleEventReminder,
    filteredTrades,
    formatCurrency,
    formatRMultiple,
    setSelectedTrade,
  } = useTrading();

  const [viewTab, setViewTab] = useState<'trading' | 'economic'>('trading');
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const closedTrades = filteredTrades.filter(t => t.status === 'CLOSED');

  const filteredEvents = calendarEvents.filter(ev => {
    const matchesImpact = impactFilter === 'ALL' || ev.impact === impactFilter;
    const matchesCurrency = currencyFilter === 'ALL' || ev.currency === currencyFilter;
    const matchesSearch = ev.event.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesImpact && matchesCurrency && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1520px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-400" />
            Trading & Economic Calendar
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time monthly P&L performance, daily trade executions, and global macroeconomic events
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setViewTab('trading')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewTab === 'trading'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Monthly Trading Calendar</span>
          </button>
          <button
            onClick={() => setViewTab('economic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewTab === 'economic'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Macroeconomic Releases</span>
          </button>
        </div>
      </div>

      {/* View 1: Trading Performance Calendar & Time Analysis */}
      {viewTab === 'trading' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start animate-in fade-in">
          <div className="xl:col-span-8">
            <PerformanceCalendar
              trades={closedTrades}
              formatCurrency={formatCurrency}
              formatRMultiple={formatRMultiple}
              onSelectTrade={t => setSelectedTrade(t)}
            />
          </div>
          <div className="xl:col-span-4 space-y-4">
            <DrawdownChart
              trades={closedTrades}
              formatCurrency={formatCurrency}
            />
            <TradeTimePerformanceChart
              trades={closedTrades}
              formatCurrency={formatCurrency}
              onSelectTrade={t => setSelectedTrade(t)}
            />
          </div>
        </div>
      )}

      {/* View 2: Economic Calendar */}
      {viewTab === 'economic' && (
        <div className="space-y-6 animate-in fade-in">

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search events (FOMC, CPI, GDP)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 py-1.5 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Impact Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(imp => (
            <button
              key={imp}
              onClick={() => setImpactFilter(imp)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                impactFilter === imp
                  ? imp === 'HIGH'
                    ? 'bg-rose-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {imp}
            </button>
          ))}
        </div>

        {/* Currency Filter */}
        <select
          value={currencyFilter}
          onChange={e => setCurrencyFilter(e.target.value)}
          className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Currencies</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
        </select>
      </div>

      {/* Calendar List */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="divide-y divide-slate-800/60">
          {filteredEvents.map(event => {
            const isHigh = event.impact === 'HIGH';
            const isMed = event.impact === 'MEDIUM';

            return (
              <div
                key={event.id}
                className="p-4 hover:bg-slate-800/40 transition flex flex-wrap items-center justify-between gap-4"
              >
                {/* Left: Time & Flag & Event Name */}
                <div className="flex items-center gap-3 min-w-[280px]">
                  <button
                    onClick={() => toggleEventFavorite(event.id)}
                    className="p-1 text-slate-500 hover:text-amber-400 transition"
                  >
                    <Star
                      className={`w-4 h-4 ${event.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`}
                    />
                  </button>

                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {event.time}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{event.date}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-200 border border-slate-700">
                    {event.currency}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isHigh
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isMed
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {event.impact}
                  </span>

                  <span className="text-xs font-semibold text-slate-100">{event.event}</span>
                </div>

                {/* Right: Data Forecast, Previous, Actual + Reminder */}
                <div className="flex items-center gap-6 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Actual</span>
                    <span className={`font-bold ${event.actual ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {event.actual || 'Pending'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Forecast</span>
                    <span className="text-slate-300">{event.forecast}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Previous</span>
                    <span className="text-slate-400">{event.previous}</span>
                  </div>

                  <button
                    onClick={() => toggleEventReminder(event.id)}
                    className={`p-2 rounded-xl border transition ${
                      event.hasReminder
                        ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                        : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                    title="Toggle Alert Reminder"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
      )}
    </div>
  );
};
