import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Percent,
  DollarSign,
  ShieldAlert,
  Target,
  Calculator,
  Layers,
  Scale,
  Zap,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import {
  InstrumentConfig,
  OrderDirection,
  OrderType,
  ReplayCandle,
  DemoAccount,
  ReplayPosition,
  BacktestSessionSettings,
} from './types';

interface OrderPadProps {
  currentCandle?: ReplayCandle;
  instrument: InstrumentConfig;
  account: DemoAccount;
  settings?: BacktestSessionSettings;
  activePositions?: ReplayPosition[];
  onExecuteTrade: (trade: {
    direction: OrderDirection;
    orderType: OrderType;
    entryPrice: number;
    lotSize: number;
    stopLoss?: number;
    takeProfit?: number;
    riskAmount: number;
    marginRequired: number;
    commission: number;
    spreadCost: number;
    slippageCost: number;
    strategySetup?: string;
    marketCondition?: string;
    sessionTag?: string;
    tags?: string[];
    notesBefore?: string;
  }) => void;
  onPartialClosePosition?: (positionId: string, percent: number) => void;
  onBreakevenPosition?: (positionId: string) => void;
  onReversePosition?: (positionId: string) => void;
  formatCurrency: (val: number) => string;
}

export const OrderPad: React.FC<OrderPadProps> = ({
  currentCandle,
  instrument,
  account,
  settings,
  activePositions = [],
  onExecuteTrade,
  onPartialClosePosition,
  onBreakevenPosition,
  onReversePosition,
  formatCurrency,
}) => {
  const currentPrice = currentCandle ? currentCandle.close : instrument.defaultPrice;

  // Settings with defaults
  const spreadPips = settings?.spreadPips ?? instrument.spreadPips ?? 1.2;
  const commissionPerLot = settings?.commissionPerLot ?? 3.5;
  const slippagePips = settings?.slippagePips ?? 0.2;

  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [direction, setDirection] = useState<OrderDirection>('BUY');
  const [lotSize, setLotSize] = useState<number>(settings?.defaultLotSize || 0.1);
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [riskPercent, setRiskPercent] = useState<number>(settings?.riskPercent || 1.0);
  const [slPips, setSlPips] = useState<number>(20);
  const [tpPips, setTpPips] = useState<number>(40);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Advanced Tagging & Journaling
  const [showAdvancedTags, setShowAdvancedTags] = useState<boolean>(false);
  const [strategySetup, setStrategySetup] = useState<string>('Liquidity Sweep');
  const [marketCondition, setMarketCondition] = useState<string>('Trending Bull');
  const [sessionTag, setSessionTag] = useState<string>('New York');
  const [customTagInput, setCustomTagInput] = useState<string>('A+ Setup');
  const [notesBefore, setNotesBefore] = useState<string>('');

  // Sync limit price if market price shifts when not touched
  useEffect(() => {
    if (orderType === 'MARKET') {
      setLimitPrice(currentPrice);
    }
  }, [currentPrice, orderType]);

  const rawBaseEntry = orderType === 'MARKET' ? currentPrice : limitPrice;
  const pipVal = instrument.pipSize;
  const p = (val: number) => Number(val.toFixed(instrument.decimals));

  // Realistic Spread & Slippage adjustments
  // For BUY: entry price is Ask (Base + Spread + Slippage)
  // For SELL: entry price is Bid (Base - Slippage)
  const spreadPriceDelta = spreadPips * pipVal;
  const slippagePriceDelta = slippagePips * pipVal;

  const effectiveBuyEntry = p(rawBaseEntry + spreadPriceDelta + slippagePriceDelta);
  const effectiveSellEntry = p(rawBaseEntry - slippagePriceDelta);

  const effectiveEntry = direction === 'BUY' ? effectiveBuyEntry : effectiveSellEntry;

  const calculatedSlPrice = useMemo(() => {
    if (stopLoss !== '') return parseFloat(stopLoss);
    if (direction === 'BUY') {
      return p(effectiveBuyEntry - slPips * pipVal);
    } else {
      return p(effectiveSellEntry + slPips * pipVal);
    }
  }, [direction, effectiveBuyEntry, effectiveSellEntry, slPips, pipVal, stopLoss, instrument.decimals]);

  const calculatedTpPrice = useMemo(() => {
    if (takeProfit !== '') return parseFloat(takeProfit);
    if (direction === 'BUY') {
      return p(effectiveBuyEntry + tpPips * pipVal);
    } else {
      return p(effectiveSellEntry - tpPips * pipVal);
    }
  }, [direction, effectiveBuyEntry, effectiveSellEntry, tpPips, pipVal, takeProfit, instrument.decimals]);

  // Position value and Margin calculation
  const totalUnits = lotSize * instrument.contractMultiplier;
  const positionValue = totalUnits * rawBaseEntry;
  const marginRequired = positionValue / account.leverage;

  // Realistic Execution Costs
  const estSpreadCost = spreadPriceDelta * totalUnits;
  const estCommission = lotSize * commissionPerLot;
  const estSlippageCost = slippagePriceDelta * totalUnits;
  const estTotalExecutionCost = estSpreadCost + estCommission + estSlippageCost;

  // Risk and Reward calculations (incorporating execution cost)
  const slDist = Math.abs(effectiveEntry - calculatedSlPrice);
  const tpDist = Math.abs(calculatedTpPrice - effectiveEntry);

  const grossRiskAmount = slDist * totalUnits;
  const estimatedRiskAmount = grossRiskAmount + estTotalExecutionCost;
  const grossRewardAmount = tpDist * totalUnits;
  const estimatedRewardAmount = Math.max(0, grossRewardAmount - estTotalExecutionCost);

  const riskRewardRatio =
    estimatedRiskAmount > 0 ? (estimatedRewardAmount / estimatedRiskAmount).toFixed(2) : '0.00';

  // Auto lot calculation based on Risk %
  const calculateLotFromRisk = (targetRiskPct: number) => {
    setRiskPercent(targetRiskPct);
    const riskDollar = (account.equity * targetRiskPct) / 100;
    const slDistance = slPips * pipVal;
    if (slDistance > 0 && instrument.contractMultiplier > 0) {
      const computedLot = riskDollar / (slDistance * instrument.contractMultiplier);
      const steppedLot = Math.max(
        instrument.minLot,
        Math.min(instrument.maxLot, Number(computedLot.toFixed(2)))
      );
      setLotSize(steppedLot);
    }
  };

  // Set quick R:R preset (e.g., 1:1.5, 1:2, 1:3)
  const applyRrPreset = (multiplier: number) => {
    const newTpPips = Math.round(slPips * multiplier);
    setTpPips(newTpPips);
    if (direction === 'BUY') {
      setTakeProfit(p(effectiveBuyEntry + newTpPips * pipVal).toString());
    } else {
      setTakeProfit(p(effectiveSellEntry - newTpPips * pipVal).toString());
    }
  };

  // Submit Trade
  const handleExecute = (tradeDir: OrderDirection) => {
    setErrorMessage(null);
    setDirection(tradeDir);

    const actualEntry = tradeDir === 'BUY' ? effectiveBuyEntry : effectiveSellEntry;
    const finalSl = stopLoss !== '' ? parseFloat(stopLoss) : calculatedSlPrice;
    const finalTp = takeProfit !== '' ? parseFloat(takeProfit) : calculatedTpPrice;

    if (isNaN(lotSize) || lotSize < instrument.minLot || lotSize > instrument.maxLot) {
      setErrorMessage(`Lot size must be between ${instrument.minLot} and ${instrument.maxLot}`);
      return;
    }

    if (marginRequired > account.freeMargin) {
      setErrorMessage(
        `Insufficient free margin! Required: ${formatCurrency(marginRequired)}, Free: ${formatCurrency(
          account.freeMargin
        )}`
      );
      return;
    }

    if (finalSl) {
      if (tradeDir === 'BUY' && finalSl >= actualEntry) {
        setErrorMessage('For a BUY order, Stop Loss must be BELOW entry price.');
        return;
      }
      if (tradeDir === 'SELL' && finalSl <= actualEntry) {
        setErrorMessage('For a SELL order, Stop Loss must be ABOVE entry price.');
        return;
      }
    }

    if (finalTp) {
      if (tradeDir === 'BUY' && finalTp <= actualEntry) {
        setErrorMessage('For a BUY order, Take Profit must be ABOVE entry price.');
        return;
      }
      if (tradeDir === 'SELL' && finalTp >= actualEntry) {
        setErrorMessage('For a SELL order, Take Profit must be BELOW entry price.');
        return;
      }
    }

    const tagsArray = customTagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onExecuteTrade({
      direction: tradeDir,
      orderType,
      entryPrice: actualEntry,
      lotSize,
      stopLoss: finalSl > 0 ? finalSl : undefined,
      takeProfit: finalTp > 0 ? finalTp : undefined,
      riskAmount: estimatedRiskAmount,
      marginRequired,
      commission: estCommission,
      spreadCost: estSpreadCost,
      slippageCost: estSlippageCost,
      strategySetup,
      marketCondition,
      sessionTag,
      tags: tagsArray,
      notesBefore: notesBefore.trim() || undefined,
    });
  };

  const symbolPosition = activePositions.find(p => p.symbol === instrument.symbol);

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-4 shadow-xl backdrop-blur-sm space-y-4">
      {/* Header & Order Type Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-200">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span>Trading Execution Pad</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
          <button
            onClick={() => setOrderType('MARKET')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
              orderType === 'MARKET' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Market
          </button>
          <button
            onClick={() => setOrderType('LIMIT')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
              orderType === 'LIMIT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending Limit
          </button>
          <button
            onClick={() => setOrderType('STOP')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
              orderType === 'STOP' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stop
          </button>
        </div>
      </div>

      {/* Limit/Stop Price Input if selected */}
      {(orderType === 'LIMIT' || orderType === 'STOP') && (
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>{orderType} Target Price</span>
            <span className="font-mono text-indigo-400">Current: {currentPrice.toFixed(instrument.decimals)}</span>
          </label>
          <input
            type="number"
            step={instrument.pipSize}
            value={limitPrice}
            onChange={e => setLimitPrice(parseFloat(e.target.value) || currentPrice)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}

      {/* Lot / Volume Controls */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-300">Position Size (Lots)</span>
          <span className="text-slate-400 font-mono">
            {totalUnits.toLocaleString()} units • {formatCurrency(positionValue)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              step={instrument.lotStep}
              min={instrument.minLot}
              max={instrument.maxLot}
              value={lotSize}
              onChange={e => setLotSize(parseFloat(e.target.value) || instrument.minLot)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-black font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {[0.01, 0.1, 0.5, 1.0].map(preset => (
              <button
                key={preset}
                onClick={() => setLotSize(preset)}
                className={`px-2 py-1.5 rounded-lg border text-[11px] font-mono font-bold transition cursor-pointer ${
                  lotSize === preset
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset}L
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Risk % Auto-Lot Sizing Presets */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-400 flex items-center gap-1">
            <Calculator className="w-3 h-3 text-indigo-400" />
            <span>Risk-Based Auto Lot</span>
          </span>
          <span className="text-slate-400 font-mono">
            Risk: {formatCurrency((account.equity * riskPercent) / 100)} ({riskPercent}%)
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[0.5, 1.0, 1.5, 2.0].map(pct => (
            <button
              key={pct}
              onClick={() => calculateLotFromRisk(pct)}
              className={`py-1.5 rounded-xl border text-[11px] font-bold font-mono transition cursor-pointer ${
                riskPercent === pct
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {pct}% Risk
            </button>
          ))}
        </div>
      </div>

      {/* Stop Loss & Take Profit Brackets */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
        {/* SL */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-rose-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Stop Loss
            </span>
            <span className="font-mono text-slate-500">{slPips} pips</span>
          </label>
          <input
            type="number"
            step={instrument.pipSize}
            placeholder={calculatedSlPrice.toFixed(instrument.decimals)}
            value={stopLoss}
            onChange={e => setStopLoss(e.target.value)}
            className="w-full bg-slate-950 border border-rose-900/40 rounded-xl px-2.5 py-1.5 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* TP */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" /> Take Profit
            </span>
            <span className="font-mono text-slate-500">{tpPips} pips</span>
          </label>
          <input
            type="number"
            step={instrument.pipSize}
            placeholder={calculatedTpPrice.toFixed(instrument.decimals)}
            value={takeProfit}
            onChange={e => setTakeProfit(e.target.value)}
            className="w-full bg-slate-950 border border-emerald-900/40 rounded-xl px-2.5 py-1.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* R:R Presets Quick Selector */}
      <div className="flex items-center justify-between text-[11px] bg-slate-950 p-2 rounded-xl border border-slate-800">
        <span className="text-slate-400 font-mono">
          R:R <strong>1:{riskRewardRatio}</strong>
        </span>
        <div className="flex items-center gap-1 font-mono">
          {[1.5, 2.0, 3.0, 5.0].map(rr => (
            <button
              key={rr}
              onClick={() => applyRrPreset(rr)}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-indigo-400 font-bold border border-slate-800 transition cursor-pointer"
            >
              1:{rr}
            </button>
          ))}
        </div>
      </div>

      {/* Realistic Execution Cost Preview Strip */}
      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between text-slate-400 font-semibold">
          <span className="flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>Execution Cost Breakdown</span>
          </span>
          <span className="font-mono text-white font-bold">
            Total: {formatCurrency(estTotalExecutionCost)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
          <div>
            Spread: <strong className="text-slate-200">{spreadPips}p</strong> ({formatCurrency(estSpreadCost)})
          </div>
          <div>
            Comm: <strong className="text-slate-200">${commissionPerLot}/L</strong> ({formatCurrency(estCommission)})
          </div>
          <div>
            Slip: <strong className="text-slate-200">{slippagePips}p</strong> ({formatCurrency(estSlippageCost)})
          </div>
        </div>
      </div>

      {/* Strategy Setup, Tagging & Pre-Trade Note Toggle */}
      <div className="border-t border-slate-800/80 pt-2 space-y-2">
        <button
          type="button"
          onClick={() => setShowAdvancedTags(!showAdvancedTags)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white transition py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Trade Setup & Journal Tags</span>
          </span>
          <span className="text-[10px] text-indigo-400 font-mono">
            {showAdvancedTags ? '▲ Hide' : '▼ Tag Setup'}
          </span>
        </button>

        {showAdvancedTags && (
          <div className="space-y-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs animate-in fade-in zoom-in-95">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Strategy / Setup</label>
                <select
                  value={strategySetup}
                  onChange={e => setStrategySetup(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Liquidity Sweep">Liquidity Sweep</option>
                  <option value="Fair Value Gap">Fair Value Gap (FVG)</option>
                  <option value="Break & Retest">Break & Retest</option>
                  <option value="Order Block">Order Block (OB)</option>
                  <option value="Trend Continuation">Trend Continuation</option>
                  <option value="Mean Reversion">Mean Reversion</option>
                  <option value="Breakout">Breakout / S&R</option>
                  <option value="ICT Silver Bullet">ICT Silver Bullet</option>
                  <option value="Discretionary">Discretionary</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Market Condition</label>
                <select
                  value={marketCondition}
                  onChange={e => setMarketCondition(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Trending Bull">Trending Bull</option>
                  <option value="Trending Bear">Trending Bear</option>
                  <option value="Ranging / Chop">Ranging / Chop</option>
                  <option value="High Volatility">High Volatility</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Session</label>
                <select
                  value={sessionTag}
                  onChange={e => setSessionTag(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="London">London (08:00-16:00)</option>
                  <option value="New York">New York (13:00-21:00)</option>
                  <option value="Asian / Tokyo">Asian / Tokyo (00:00-08:00)</option>
                  <option value="Sydney">Sydney (21:00-05:00)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Custom Tags (CSV)</label>
                <input
                  type="text"
                  value={customTagInput}
                  onChange={e => setCustomTagInput(e.target.value)}
                  placeholder="e.g. A+ Setup, News Spike"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">Pre-Trade Entry Note / Thesis</label>
              <textarea
                rows={2}
                value={notesBefore}
                onChange={e => setNotesBefore(e.target.value)}
                placeholder="Why am I entering here? What are the confluence factors?"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* BUY & SELL ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => handleExecute('BUY')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition active:scale-95 cursor-pointer group"
        >
          <div className="flex items-center gap-1.5 font-black text-sm">
            <ArrowUpCircle className="w-4 h-4" />
            <span>BUY / LONG</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-100 mt-0.5 font-bold">
            @ {effectiveEntry.toFixed(instrument.decimals)}
          </span>
        </button>

        <button
          onClick={() => handleExecute('SELL')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 transition active:scale-95 cursor-pointer group"
        >
          <div className="flex items-center gap-1.5 font-black text-sm">
            <ArrowDownCircle className="w-4 h-4" />
            <span>SELL / SHORT</span>
          </div>
          <span className="text-[11px] font-mono text-rose-100 mt-0.5 font-bold">
            @ {effectiveEntry.toFixed(instrument.decimals)}
          </span>
        </button>
      </div>

      {/* Active Position Management Shortcuts if open position exists for this symbol */}
      {symbolPosition && (
        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-white">
              Open: {symbolPosition.direction} {symbolPosition.lotSize}L
            </span>
            <span
              className={`font-mono font-black ${
                symbolPosition.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {symbolPosition.unrealizedPnl >= 0 ? '+' : ''}
              {formatCurrency(symbolPosition.unrealizedPnl)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
            {onBreakevenPosition && (
              <button
                onClick={() => onBreakevenPosition(symbolPosition.id)}
                className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition cursor-pointer"
                title="Move Stop Loss to Entry Price (Break-Even)"
              >
                Break-Even
              </button>
            )}

            {onPartialClosePosition && (
              <button
                onClick={() => onPartialClosePosition(symbolPosition.id, 50)}
                className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 transition cursor-pointer"
                title="Close 50% of position size"
              >
                Close 50%
              </button>
            )}

            {onReversePosition && (
              <button
                onClick={() => onReversePosition(symbolPosition.id)}
                className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-400 border border-slate-800 transition cursor-pointer"
                title="Close position and open opposite direction"
              >
                Reverse
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
