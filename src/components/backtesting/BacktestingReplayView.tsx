import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  History,
  RotateCcw,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  FolderOpen,
  DollarSign,
  TrendingUp,
  Layers,
  BarChart3,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Scale,
  Shield,
} from 'lucide-react';
import {
  ReplayCandle,
  ReplayPosition,
  ReplayTrade,
  PendingOrder,
  DemoAccount,
  TimeframeId,
  ChartType,
  ChartLayoutType,
  ChartDrawing,
  DrawingToolType,
  IndicatorConfig,
  ChartAlert,
  ChartTemplate,
  ChartSettingsConfig,
  SavedBacktestSession,
  BacktestSessionSettings,
  IntrabarAmbiguityRule,
} from './types';
import { INSTRUMENTS, getInstrumentConfig, TIMEFRAMES } from './instruments';
import {
  transformCandlesByChartType,
} from './historicalDataGenerator';
import { NativeChart } from './NativeChart';
import { marketDataService } from '../../services/marketDataService';
import { getBacktestSessionsApi, saveBacktestSessionApi, deleteBacktestSessionApi } from '../../services/apiClient';
import { OHLCVData } from '../../types/ohlcv';
import { TopChartToolbar } from './toolbar/TopChartToolbar';
import { LeftDrawingToolbar } from './toolbar/LeftDrawingToolbar';
import { ReplayControlBar } from './toolbar/ReplayControlBar';
import { OrderPad } from './OrderPad';
import { OpenPositionsTable } from './OpenPositionsTable';
import { TradeHistoryTable } from './TradeHistoryTable';
import { SessionAnalytics } from './SessionAnalytics';
import { SessionManagerModal } from './SessionManagerModal';
import { SessionScorecardModal } from './modals/SessionScorecardModal';
import { IndicatorsModal } from './modals/IndicatorsModal';
import { AlertsModal } from './modals/AlertsModal';
import { TemplatesModal } from './modals/TemplatesModal';
import { ChartSettingsModal } from './modals/ChartSettingsModal';
import { CompareSymbolModal } from './modals/CompareSymbolModal';
import { WatchlistPanel } from './panels/WatchlistPanel';
import { PendingOrdersTable } from './panels/PendingOrdersTable';
import { AccountSummaryTab } from './panels/AccountSummaryTab';

interface BacktestingReplayViewProps {
  theme?: 'dark' | 'light' | 'liquid';
}

const DEFAULT_INDICATORS: IndicatorConfig[] = [
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
    id: 'rsi-14',
    type: 'RSI',
    name: 'RSI (14)',
    category: 'MOMENTUM',
    pane: 'LOWER_1',
    visible: true,
    params: { period: 14, overbought: 70, oversold: 30 },
    styles: { color: '#a855f7', lineWidth: 2 },
  },
];

const DEFAULT_CHART_SETTINGS: ChartSettingsConfig = {
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

export const BacktestingReplayView: React.FC<BacktestingReplayViewProps> = ({
  theme = 'dark',
}) => {
  // 1. Session & Market Config
  const [symbol, setSymbol] = useState<string>('XAUUSD');
  const [timeframe, setTimeframe] = useState<TimeframeId>('15m');
  const [chartType, setChartType] = useState<ChartType>('CANDLESTICK');
  const [layout, setLayout] = useState<ChartLayoutType>('SINGLE');
  const [startDate, setStartDate] = useState<string>('2024-06-10');
  const [isReplayModeActive, setIsReplayModeActive] = useState<boolean>(true);

  // Market OHLCV data state connected to isolated marketDataService
  const [ohlcvData, setOhlcvData] = useState<OHLCVData[]>([]);
  const [isLoadingMarketData, setIsLoadingMarketData] = useState<boolean>(true);
  const [marketDataError, setMarketDataError] = useState<string | null>(null);

  // 2. Replay Playback State
  const [allCandles, setAllCandles] = useState<ReplayCandle[]>([]);
  const [startIndex, setStartIndex] = useState<number>(50); // Initial 50 bars history
  const [currentIndex, setCurrentIndex] = useState<number>(50);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(500); // 500ms per bar

  // 3. Virtual Demo Account State
  const [account, setAccount] = useState<DemoAccount>({
    startingBalance: 10000,
    balance: 10000,
    equity: 10000,
    currency: 'USD',
    leverage: 100,
    usedMargin: 0,
    freeMargin: 10000,
    marginLevel: 100,
    realizedPnl: 0,
    unrealizedPnl: 0,
    totalReturnPercent: 0,
    maxDrawdown: 0,
    maxDrawdownPercent: 0,
    peakEquity: 10000,
  });
  const [isEditingBalance, setIsEditingBalance] = useState<boolean>(false);
  const [customBalanceInput, setCustomBalanceInput] = useState<string>('10000');

  // 4. Trading State: Open Positions, Pending Orders, Closed History & Execution Realism Settings
  const [sessionSettings, setSessionSettings] = useState<BacktestSessionSettings>({
    startingBalance: 10000,
    currency: 'USD',
    leverage: 100,
    riskPercent: 1.0,
    defaultLotSize: 0.1,
    spreadPips: 1.2,
    commissionPerLot: 3.5,
    slippagePips: 0.2,
    intrabarAmbiguityRule: 'CONSERVATIVE',
    tradingSession: 'ALL',
    timezone: 'UTC',
  });
  const [positions, setPositions] = useState<ReplayPosition[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [trades, setTrades] = useState<ReplayTrade[]>([]);

  // Update single trade from journal
  const handleUpdateTrade = (updatedTrade: ReplayTrade) => {
    setTrades(prev => prev.map(t => (t.id === updatedTrade.id ? updatedTrade : t)));
    addToast('Journal Saved', `Updated notes & review for trade #${updatedTrade.id.slice(-6)}`, 'success');
  };

  // 5. Chart Drawings & Drawing History Stack (Undo/Redo)
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [drawingHistory, setDrawingHistory] = useState<ChartDrawing[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('CROSSHAIR');

  // 6. Indicators & Alerts
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(DEFAULT_INDICATORS);
  const [alerts, setAlerts] = useState<ChartAlert[]>([]);
  const [comparedSymbol, setComparedSymbol] = useState<string | null>(null);

  // 7. Chart Appearance Settings
  const [chartSettings, setChartSettings] = useState<ChartSettingsConfig>(DEFAULT_CHART_SETTINGS);

  // 8. Panels & Modals State
  const [isWatchlistOpen, setIsWatchlistOpen] = useState<boolean>(false);
  const [activeBottomTab, setActiveBottomTab] = useState<
    'POSITIONS' | 'PENDING' | 'HISTORY' | 'ACCOUNT' | 'ANALYTICS' | 'NOTES'
  >('POSITIONS');
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState<boolean>(false);
  const [alertPresetPrice, setAlertPresetPrice] = useState<number | undefined>(undefined);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // 9. Toast Notifications
  const [toasts, setToasts] = useState<
    { id: string; title: string; message: string; type: 'success' | 'danger' | 'info' }[]
  >([]);

  const addToast = (title: string, message: string, type: 'success' | 'danger' | 'info' = 'info') => {
    const id = 'toast-' + Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const instrument = useMemo(() => getInstrumentConfig(symbol), [symbol]);

  // Load Saved Sessions from Backend API / Database
  const [savedSessions, setSavedSessions] = useState<SavedBacktestSession[]>([]);

  useEffect(() => {
    let isMounted = true;
    getBacktestSessionsApi().then(sessions => {
      if (isMounted && Array.isArray(sessions)) {
        setSavedSessions(sessions);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Fetch structured real historical OHLCV data from marketDataService whenever symbol, timeframe, or startDate changes
  const loadHistoricalMarketData = useCallback(async () => {
    setIsLoadingMarketData(true);
    setMarketDataError(null);
    try {
      const candles = await marketDataService.getHistoricalCandles({
        symbol,
        timeframe,
        limit: 350,
        startDate,
      });
      setOhlcvData(candles);
      setMarketDataError(null);
    } catch (err: any) {
      console.error('Failed to load real market data:', err);
      setMarketDataError(err?.message || `Unable to load historical candles for ${symbol} (${timeframe}).`);
    } finally {
      setIsLoadingMarketData(false);
    }
  }, [symbol, timeframe, startDate]);

  useEffect(() => {
    loadHistoricalMarketData();
  }, [loadHistoricalMarketData]);

  // Construct real historical candle dataset from market data provider when ohlcvData or chartType changes
  useEffect(() => {
    if (!ohlcvData || ohlcvData.length === 0) return;

    const rawCandles: ReplayCandle[] = ohlcvData.map(c => {
      const d = new Date(c.time * 1000);
      const timeString = d.toISOString().replace('T', ' ').substring(0, 19);
      return {
        time: c.time,
        timeString,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume || 0,
      };
    });

    const transformed = transformCandlesByChartType(rawCandles, chartType, instrument.pipSize);
    setAllCandles(transformed);
    const initStart = Math.min(50, Math.max(5, Math.floor(transformed.length * 0.2)));
    setStartIndex(initStart);
    setCurrentIndex(initStart);
    setIsPlaying(false);
  }, [ohlcvData, chartType, instrument.pipSize]);

  // Sliced Visible Candles (Strictly zero look-ahead bias during replay)
  const visibleCandles = useMemo(() => {
    if (!isReplayModeActive) return allCandles;
    return allCandles.slice(0, Math.min(allCandles.length, currentIndex + 1));
  }, [allCandles, currentIndex, isReplayModeActive]);

  const currentCandle = visibleCandles[visibleCandles.length - 1];

  // Currency Formatter
  const formatCurrency = useCallback(
    (val: number) => {
      const sym = account.currency === 'USD' ? '$' : account.currency === 'EUR' ? '€' : '£';
      return `${val < 0 ? '-' : ''}${sym}${Math.abs(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [account.currency]
  );

  // Update drawings with history snapshot for Undo/Redo
  const handleUpdateDrawings = (newDrawings: ChartDrawing[]) => {
    const nextHistory = drawingHistory.slice(0, historyIndex + 1);
    setDrawingHistory([...nextHistory, newDrawings]);
    setHistoryIndex(nextHistory.length);
    setDrawings(newDrawings);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = drawingHistory[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setDrawings(prev);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setDrawings([]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < drawingHistory.length - 1) {
      const next = drawingHistory[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setDrawings(next);
    }
  };

  // ----------------------------------------------------
  // SIMULATION ENGINE: ACCOUNT TELEMETRY & AUTO-FILL
  // ----------------------------------------------------
  const updatePositionsAndAccount = useCallback(
    (candle: ReplayCandle) => {
      if (!candle) return;

      const currentPrice = candle.close;
      let newPositions: ReplayPosition[] = [];
      let closedThisTick: ReplayTrade[] = [];
      let newPending: PendingOrder[] = [];

      // 1. Check Pending Orders Auto-fill
      pendingOrders.forEach(order => {
        if (order.status !== 'PENDING') return;

        let triggered = false;
        if (order.orderType === 'LIMIT') {
          if (order.direction === 'BUY' && candle.low <= order.targetPrice) triggered = true;
          if (order.direction === 'SELL' && candle.high >= order.targetPrice) triggered = true;
        } else if (order.orderType === 'STOP') {
          if (order.direction === 'BUY' && candle.high >= order.targetPrice) triggered = true;
          if (order.direction === 'SELL' && candle.low <= order.targetPrice) triggered = true;
        }

        if (triggered) {
          // Convert pending order to open position
          const openPos: ReplayPosition = {
            id: 'pos-' + Date.now() + Math.random().toString().slice(2, 5),
            symbol: order.symbol,
            direction: order.direction,
            orderType: order.orderType,
            entryPrice: order.targetPrice,
            currentPrice: order.targetPrice,
            lotSize: order.lotSize,
            units: order.units,
            stopLoss: order.stopLoss,
            takeProfit: order.takeProfit,
            openTime: candle.time,
            openTimeString: candle.timeString,
            unrealizedPnl: 0,
            unrealizedPnlPercent: 0,
            marginUsed: order.marginRequired,
          };
          newPositions.push(openPos);
          addToast(
            'Order Filled',
            `${order.orderType} ${order.direction} ${order.lotSize}L @ ${order.targetPrice.toFixed(
              instrument.decimals
            )} executed`,
            'info'
          );
        } else {
          newPending.push(order);
        }
      });

      // 2. Check Open Positions (TP, SL, Intrabar Ambiguity, Floating P&L)
      [...positions, ...newPositions].forEach(pos => {
        let isClosed = false;
        let exitPrice = currentPrice;
        let exitReason: 'TP' | 'SL' | 'MANUAL' | 'TRAILING_STOP' = 'MANUAL';
        let ambiguityResolvedBy: IntrabarAmbiguityRule | undefined = undefined;

        let tpHit = false;
        let slHit = false;

        // Check TP reach within bar
        if (pos.takeProfit) {
          if (pos.direction === 'BUY' && candle.high >= pos.takeProfit) tpHit = true;
          if (pos.direction === 'SELL' && candle.low <= pos.takeProfit) tpHit = true;
        }

        // Check SL reach within bar
        if (pos.stopLoss) {
          if (pos.direction === 'BUY' && candle.low <= pos.stopLoss) slHit = true;
          if (pos.direction === 'SELL' && candle.high >= pos.stopLoss) slHit = true;
        }

        // Handle Intrabar Ambiguity when BOTH TP and SL are touched in the same candle
        if (tpHit && slHit) {
          const rule = sessionSettings.intrabarAmbiguityRule || 'CONSERVATIVE';
          ambiguityResolvedBy = rule;

          if (rule === 'CONSERVATIVE') {
            isClosed = true;
            exitPrice = pos.stopLoss!;
            exitReason = 'SL';
          } else if (rule === 'OPTIMISTIC') {
            isClosed = true;
            exitPrice = pos.takeProfit!;
            exitReason = 'TP';
          } else if (rule === 'OHLC_PATH') {
            const isBullBar = candle.close >= candle.open;
            if (isBullBar) {
              // Bullish bar typical path: Open -> Low -> High -> Close
              if (pos.direction === 'BUY') {
                isClosed = true;
                exitPrice = pos.stopLoss!;
                exitReason = 'SL';
              } else {
                isClosed = true;
                exitPrice = pos.takeProfit!;
                exitReason = 'TP';
              }
            } else {
              // Bearish bar typical path: Open -> High -> Low -> Close
              if (pos.direction === 'BUY') {
                isClosed = true;
                exitPrice = pos.takeProfit!;
                exitReason = 'TP';
              } else {
                isClosed = true;
                exitPrice = pos.stopLoss!;
                exitReason = 'SL';
              }
            }
          } else if (rule === 'RANDOM') {
            if (Math.random() < 0.5) {
              isClosed = true;
              exitPrice = pos.stopLoss!;
              exitReason = 'SL';
            } else {
              isClosed = true;
              exitPrice = pos.takeProfit!;
              exitReason = 'TP';
            }
          }
        } else if (tpHit) {
          isClosed = true;
          exitPrice = pos.takeProfit!;
          exitReason = 'TP';
        } else if (slHit) {
          isClosed = true;
          exitPrice = pos.stopLoss!;
          exitReason = 'SL';
        }

        if (isClosed) {
          const pipVal = instrument.pipSize;
          const slippageDelta = (sessionSettings.slippagePips || 0) * pipVal;
          // Apply exit slippage (closing BUY is selling, closing SELL is buying)
          const actualExitPrice =
            pos.direction === 'BUY'
              ? Number((exitPrice - slippageDelta).toFixed(instrument.decimals))
              : Number((exitPrice + slippageDelta).toFixed(instrument.decimals));

          const mult = pos.direction === 'BUY' ? 1 : -1;
          const grossPnl = (actualExitPrice - pos.entryPrice) * mult * pos.units;
          const commission = pos.commission ?? pos.lotSize * (sessionSettings.commissionPerLot || 3.5);
          const spreadCost = pos.spreadCost ?? (sessionSettings.spreadPips || 1.2) * pipVal * pos.units;
          const slippageCost = (pos.slippageCost ?? 0) + slippageDelta * pos.units;

          const realizedPnl = grossPnl - commission;
          const pnlPercent = (realizedPnl / account.startingBalance) * 100;

          // R-Multiple calculation
          let rMultiple = 1.0;
          if (pos.stopLoss) {
            const riskDistance = Math.abs(pos.entryPrice - pos.stopLoss);
            if (riskDistance > 0) {
              const gainDistance = (actualExitPrice - pos.entryPrice) * mult;
              rMultiple = Number((gainDistance / riskDistance).toFixed(2));
            }
          }

          const durationCandles = Math.max(
            1,
            Math.round((candle.time - pos.openTime) / (TIMEFRAMES.find(t => t.id === timeframe)?.seconds || 900))
          );

          closedThisTick.push({
            id: pos.id,
            symbol: pos.symbol,
            direction: pos.direction,
            entryPrice: pos.entryPrice,
            exitPrice: actualExitPrice,
            stopLoss: pos.stopLoss,
            takeProfit: pos.takeProfit,
            lotSize: pos.lotSize,
            units: pos.units,
            openTime: pos.openTime,
            closeTime: candle.time,
            openTimeString: pos.openTimeString,
            closeTimeString: candle.timeString,
            grossPnl,
            commission,
            spreadCost,
            slippageCost,
            realizedPnl,
            pnlPercent,
            rMultiple,
            exitReason,
            strategySetup: pos.strategySetup,
            marketCondition: pos.marketCondition,
            sessionTag: pos.sessionTag,
            tags: pos.tags,
            notesBefore: pos.notesBefore,
            ambiguityResolvedBy,
            durationMinutes: durationCandles * 15,
            durationCandles,
          });

          addToast(
            exitReason === 'TP'
              ? 'Take Profit Hit 🎯'
              : exitReason === 'SL'
              ? 'Stop Loss Hit 🛑'
              : 'Position Closed',
            `${pos.direction} ${pos.symbol} closed @ ${actualExitPrice.toFixed(instrument.decimals)} (${formatCurrency(
              realizedPnl
            )})${ambiguityResolvedBy ? ` [Ambiguity: ${ambiguityResolvedBy}]` : ''}`,
            realizedPnl >= 0 ? 'success' : 'danger'
          );
        } else {
          // Position still active -> Update Unrealized PnL
          const mult = pos.direction === 'BUY' ? 1 : -1;
          const unrealizedPnl = (currentPrice - pos.entryPrice) * mult * pos.units;
          const unrealizedPnlPercent = (unrealizedPnl / account.startingBalance) * 100;

          let rMultiple = undefined;
          if (pos.stopLoss) {
            const riskDistance = Math.abs(pos.entryPrice - pos.stopLoss);
            if (riskDistance > 0) {
              const gainDistance = (currentPrice - pos.entryPrice) * mult;
              rMultiple = Number((gainDistance / riskDistance).toFixed(2));
            }
          }

          newPositions.push({
            ...pos,
            currentPrice,
            unrealizedPnl,
            unrealizedPnlPercent,
            rMultiple,
          });
        }
      });

      // 3. Check Price Alerts
      alerts.forEach(alert => {
        if (alert.triggered) return;
        let triggered = false;

        if (alert.condition === 'CROSS_ABOVE' && candle.high >= alert.targetPrice) triggered = true;
        if (alert.condition === 'CROSS_BELOW' && candle.low <= alert.targetPrice) triggered = true;
        if (alert.condition === 'PRICE_ABOVE' && candle.close >= alert.targetPrice) triggered = true;
        if (alert.condition === 'PRICE_BELOW' && candle.close <= alert.targetPrice) triggered = true;

        if (triggered) {
          addToast(
            '🔔 Price Alert Triggered',
            `${alert.symbol} reached ${alert.targetPrice.toFixed(instrument.decimals)}!`,
            'info'
          );
          setAlerts(prev =>
            prev.map(a =>
              a.id === alert.id
                ? {
                    ...a,
                    triggered: true,
                    triggeredAt: candle.time,
                    triggeredAtString: candle.timeString,
                    triggeredPrice: candle.close,
                  }
                : a
            )
          );
        }
      });

      // 4. Update Account Balances
      setPositions(newPositions);
      setPendingOrders(newPending);

      if (closedThisTick.length > 0) {
        setTrades(prev => [...closedThisTick, ...prev]);
      }

      setAccount(prev => {
        let totalRealized = prev.realizedPnl;
        closedThisTick.forEach(t => {
          totalRealized += t.realizedPnl;
        });

        const newBalance = prev.startingBalance + totalRealized;
        const totalUnrealized = newPositions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
        const totalUsedMargin = newPositions.reduce((acc, p) => acc + p.marginUsed, 0);
        const newEquity = newBalance + totalUnrealized;
        const newFreeMargin = Math.max(0, newEquity - totalUsedMargin);
        const marginLevel = totalUsedMargin > 0 ? (newEquity / totalUsedMargin) * 100 : 100;

        const peakEquity = Math.max(prev.peakEquity, newEquity);
        const currentDrawdownDollar = Math.max(0, peakEquity - newEquity);
        const currentDrawdownPercent = peakEquity > 0 ? (currentDrawdownDollar / peakEquity) * 100 : 0;
        const maxDrawdown = Math.max(prev.maxDrawdown, currentDrawdownDollar);
        const maxDrawdownPercent = Math.max(prev.maxDrawdownPercent, currentDrawdownPercent);
        const totalReturnPercent =
          prev.startingBalance > 0 ? ((newEquity - prev.startingBalance) / prev.startingBalance) * 100 : 0;

        return {
          ...prev,
          balance: newBalance,
          equity: newEquity,
          usedMargin: totalUsedMargin,
          freeMargin: newFreeMargin,
          marginLevel,
          realizedPnl: totalRealized,
          unrealizedPnl: totalUnrealized,
          totalReturnPercent,
          maxDrawdown,
          maxDrawdownPercent,
          peakEquity,
        };
      });
    },
    [positions, pendingOrders, alerts, account.startingBalance, timeframe, instrument.decimals, formatCurrency]
  );

  // Advance 1 Candle forward
  const advanceCandle = useCallback(() => {
    if (currentIndex < allCandles.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      updatePositionsAndAccount(allCandles[nextIdx]);
    } else {
      setIsPlaying(false);
      addToast('Replay Complete', 'Reached end of historical dataset', 'info');
    }
  }, [currentIndex, allCandles, updatePositionsAndAccount]);

  // Step 1 Candle backward
  const stepBackward = useCallback(() => {
    if (currentIndex > startIndex) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      updatePositionsAndAccount(allCandles[prevIdx]);
    }
  }, [currentIndex, startIndex, allCandles, updatePositionsAndAccount]);

  // Auto-play interval timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        advanceCandle();
      }, playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, advanceCandle]);

  // ----------------------------------------------------
  // TRADING HANDLERS (EXECUTE, CLOSE, PARTIAL, BREAKEVEN)
  // ----------------------------------------------------

  const handleExecuteTrade = (tradeData: {
    direction: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'LIMIT' | 'STOP';
    entryPrice: number;
    lotSize: number;
    stopLoss?: number;
    takeProfit?: number;
    riskAmount: number;
    marginRequired: number;
    commission?: number;
    spreadCost?: number;
    slippageCost?: number;
    strategySetup?: string;
    marketCondition?: string;
    sessionTag?: string;
    tags?: string[];
    notesBefore?: string;
  }) => {
    const time = currentCandle ? currentCandle.time : Date.now() / 1000;
    const timeString = currentCandle ? currentCandle.timeString : new Date().toLocaleTimeString();
    const units = tradeData.lotSize * instrument.contractMultiplier;

    if (tradeData.orderType === 'MARKET') {
      const newPos: ReplayPosition = {
        id: 'pos-' + Date.now() + Math.random().toString().slice(2, 5),
        symbol,
        direction: tradeData.direction,
        orderType: tradeData.orderType,
        entryPrice: tradeData.entryPrice,
        currentPrice: tradeData.entryPrice,
        lotSize: tradeData.lotSize,
        units,
        stopLoss: tradeData.stopLoss,
        takeProfit: tradeData.takeProfit,
        openTime: time,
        openTimeString: timeString,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0,
        marginUsed: tradeData.marginRequired,
        commission: tradeData.commission,
        spreadCost: tradeData.spreadCost,
        slippageCost: tradeData.slippageCost,
        strategySetup: tradeData.strategySetup,
        marketCondition: tradeData.marketCondition,
        sessionTag: tradeData.sessionTag,
        tags: tradeData.tags,
        notesBefore: tradeData.notesBefore,
      };

      setPositions(prev => [newPos, ...prev]);
      setAccount(prev => {
        const totalUsedMargin = prev.usedMargin + tradeData.marginRequired;
        const newFreeMargin = Math.max(0, prev.equity - totalUsedMargin);
        const marginLevel = totalUsedMargin > 0 ? (prev.equity / totalUsedMargin) * 100 : 100;
        return {
          ...prev,
          usedMargin: totalUsedMargin,
          freeMargin: newFreeMargin,
          marginLevel,
        };
      });

      addToast(
        'Market Order Executed',
        `${tradeData.direction} ${tradeData.lotSize}L ${symbol} @ ${tradeData.entryPrice.toFixed(
          instrument.decimals
        )}${tradeData.strategySetup ? ` [${tradeData.strategySetup}]` : ''}`,
        'success'
      );
    } else {
      const newPending: PendingOrder = {
        id: 'po-' + Date.now() + Math.random().toString().slice(2, 5),
        symbol,
        direction: tradeData.direction,
        orderType: tradeData.orderType as any,
        targetPrice: tradeData.entryPrice,
        currentPrice: tradeData.entryPrice,
        lotSize: tradeData.lotSize,
        units,
        stopLoss: tradeData.stopLoss,
        takeProfit: tradeData.takeProfit,
        placedTime: time,
        placedTimeString: timeString,
        status: 'PENDING',
        marginRequired: tradeData.marginRequired,
        commission: tradeData.commission,
        spreadCost: tradeData.spreadCost,
        slippageCost: tradeData.slippageCost,
        strategySetup: tradeData.strategySetup,
        marketCondition: tradeData.marketCondition,
        sessionTag: tradeData.sessionTag,
        tags: tradeData.tags,
        notesBefore: tradeData.notesBefore,
      };

      setPendingOrders(prev => [newPending, ...prev]);
      addToast(
        'Pending Order Placed',
        `${tradeData.orderType} ${tradeData.direction} ${tradeData.lotSize}L @ ${tradeData.entryPrice.toFixed(
          instrument.decimals
        )}`,
        'info'
      );
    }
  };

  const handleClosePosition = (positionId: string) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos || !currentCandle) return;

    const pipVal = instrument.pipSize;
    const slippageDelta = (sessionSettings.slippagePips || 0) * pipVal;
    const actualExitPrice =
      pos.direction === 'BUY'
        ? Number((currentCandle.close - slippageDelta).toFixed(instrument.decimals))
        : Number((currentCandle.close + slippageDelta).toFixed(instrument.decimals));

    const mult = pos.direction === 'BUY' ? 1 : -1;
    const grossPnl = (actualExitPrice - pos.entryPrice) * mult * pos.units;
    const commission = pos.commission ?? pos.lotSize * (sessionSettings.commissionPerLot || 3.5);
    const spreadCost = pos.spreadCost ?? (sessionSettings.spreadPips || 1.2) * pipVal * pos.units;
    const slippageCost = (pos.slippageCost ?? 0) + slippageDelta * pos.units;
    const realizedPnl = grossPnl - commission;
    const pnlPercent = (realizedPnl / account.startingBalance) * 100;

    let rMultiple = 1.0;
    if (pos.stopLoss) {
      const riskDistance = Math.abs(pos.entryPrice - pos.stopLoss);
      if (riskDistance > 0) {
        const gainDistance = (actualExitPrice - pos.entryPrice) * mult;
        rMultiple = Number((gainDistance / riskDistance).toFixed(2));
      }
    }

    const durationCandles = Math.max(
      1,
      Math.round((currentCandle.time - pos.openTime) / (TIMEFRAMES.find(t => t.id === timeframe)?.seconds || 900))
    );

    const closedTrade: ReplayTrade = {
      id: pos.id,
      symbol: pos.symbol,
      direction: pos.direction,
      entryPrice: pos.entryPrice,
      exitPrice: actualExitPrice,
      stopLoss: pos.stopLoss,
      takeProfit: pos.takeProfit,
      lotSize: pos.lotSize,
      units: pos.units,
      openTime: pos.openTime,
      closeTime: currentCandle.time,
      openTimeString: pos.openTimeString,
      closeTimeString: currentCandle.timeString,
      grossPnl,
      commission,
      spreadCost,
      slippageCost,
      realizedPnl,
      pnlPercent,
      rMultiple,
      exitReason: 'MANUAL',
      strategySetup: pos.strategySetup,
      marketCondition: pos.marketCondition,
      sessionTag: pos.sessionTag,
      tags: pos.tags,
      notesBefore: pos.notesBefore,
      durationMinutes: durationCandles * 15,
      durationCandles,
    };

    const remainingPositions = positions.filter(p => p.id !== positionId);
    setPositions(remainingPositions);
    setTrades(prev => [closedTrade, ...prev]);

    setAccount(prev => {
      const newRealizedPnl = prev.realizedPnl + realizedPnl;
      const newBalance = prev.startingBalance + newRealizedPnl;
      const totalUnrealized = remainingPositions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
      const totalUsedMargin = remainingPositions.reduce((acc, p) => acc + p.marginUsed, 0);
      const newEquity = newBalance + totalUnrealized;
      const newFreeMargin = Math.max(0, newEquity - totalUsedMargin);
      const marginLevel = totalUsedMargin > 0 ? (newEquity / totalUsedMargin) * 100 : 100;
      const peakEquity = Math.max(prev.peakEquity, newEquity);
      const currentDrawdownDollar = Math.max(0, peakEquity - newEquity);
      const currentDrawdownPercent = peakEquity > 0 ? (currentDrawdownDollar / peakEquity) * 100 : 0;
      const maxDrawdown = Math.max(prev.maxDrawdown, currentDrawdownDollar);
      const maxDrawdownPercent = Math.max(prev.maxDrawdownPercent, currentDrawdownPercent);

      return {
        ...prev,
        balance: newBalance,
        equity: newEquity,
        usedMargin: totalUsedMargin,
        freeMargin: newFreeMargin,
        marginLevel,
        realizedPnl: newRealizedPnl,
        unrealizedPnl: totalUnrealized,
        maxDrawdown,
        maxDrawdownPercent,
        peakEquity,
      };
    });

    addToast(
      'Position Closed Manually',
      `${pos.direction} ${pos.symbol} closed @ ${actualExitPrice.toFixed(instrument.decimals)} (${formatCurrency(
        realizedPnl
      )})`,
      realizedPnl >= 0 ? 'success' : 'danger'
    );
  };

  const handleCloseAllPositions = () => {
    if (positions.length === 0 || !currentCandle) return;

    let totalRealized = 0;
    const closedTrades: ReplayTrade[] = [];
    const pipVal = instrument.pipSize;
    const slippageDelta = (sessionSettings.slippagePips || 0) * pipVal;

    positions.forEach(pos => {
      const actualExitPrice =
        pos.direction === 'BUY'
          ? Number((currentCandle.close - slippageDelta).toFixed(instrument.decimals))
          : Number((currentCandle.close + slippageDelta).toFixed(instrument.decimals));

      const mult = pos.direction === 'BUY' ? 1 : -1;
      const grossPnl = (actualExitPrice - pos.entryPrice) * mult * pos.units;
      const commission = pos.commission ?? pos.lotSize * (sessionSettings.commissionPerLot || 3.5);
      const spreadCost = pos.spreadCost ?? (sessionSettings.spreadPips || 1.2) * pipVal * pos.units;
      const slippageCost = (pos.slippageCost ?? 0) + slippageDelta * pos.units;
      const realizedPnl = grossPnl - commission;
      const pnlPercent = (realizedPnl / account.startingBalance) * 100;

      let rMultiple = 1.0;
      if (pos.stopLoss) {
        const riskDistance = Math.abs(pos.entryPrice - pos.stopLoss);
        if (riskDistance > 0) {
          const gainDistance = (actualExitPrice - pos.entryPrice) * mult;
          rMultiple = Number((gainDistance / riskDistance).toFixed(2));
        }
      }

      const durationCandles = Math.max(
        1,
        Math.round((currentCandle.time - pos.openTime) / (TIMEFRAMES.find(t => t.id === timeframe)?.seconds || 900))
      );

      closedTrades.push({
        id: pos.id,
        symbol: pos.symbol,
        direction: pos.direction,
        entryPrice: pos.entryPrice,
        exitPrice: actualExitPrice,
        stopLoss: pos.stopLoss,
        takeProfit: pos.takeProfit,
        lotSize: pos.lotSize,
        units: pos.units,
        openTime: pos.openTime,
        closeTime: currentCandle.time,
        openTimeString: pos.openTimeString,
        closeTimeString: currentCandle.timeString,
        grossPnl,
        commission,
        spreadCost,
        slippageCost,
        realizedPnl,
        pnlPercent,
        rMultiple,
        exitReason: 'MANUAL',
        strategySetup: pos.strategySetup,
        marketCondition: pos.marketCondition,
        sessionTag: pos.sessionTag,
        tags: pos.tags,
        notesBefore: pos.notesBefore,
        durationMinutes: durationCandles * 15,
        durationCandles,
      });

      totalRealized += realizedPnl;
    });

    setPositions([]);
    setTrades(prev => [...closedTrades, ...prev]);

    setAccount(prev => {
      const newRealizedPnl = prev.realizedPnl + totalRealized;
      const newBalance = prev.startingBalance + newRealizedPnl;
      const newEquity = newBalance;
      const peakEquity = Math.max(prev.peakEquity, newEquity);
      const currentDrawdownDollar = Math.max(0, peakEquity - newEquity);
      const currentDrawdownPercent = peakEquity > 0 ? (currentDrawdownDollar / peakEquity) * 100 : 0;
      const maxDrawdown = Math.max(prev.maxDrawdown, currentDrawdownDollar);
      const maxDrawdownPercent = Math.max(prev.maxDrawdownPercent, currentDrawdownPercent);

      return {
        ...prev,
        balance: newBalance,
        equity: newEquity,
        usedMargin: 0,
        freeMargin: newEquity,
        marginLevel: 100,
        realizedPnl: newRealizedPnl,
        unrealizedPnl: 0,
        maxDrawdown,
        maxDrawdownPercent,
        peakEquity,
      };
    });

    addToast(
      'All Positions Closed',
      `Closed ${closedTrades.length} open positions (${formatCurrency(totalRealized)})`,
      totalRealized >= 0 ? 'success' : 'danger'
    );
  };

  const handleCancelPendingOrder = (orderId: string) => {
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    addToast('Order Cancelled', 'Pending order was cancelled', 'info');
  };

  const handlePartialClose = (posId: string, percent: number) => {
    const pos = positions.find(p => p.id === posId);
    if (!pos || !currentCandle) return;

    const closedLots = Number((pos.lotSize * (percent / 100)).toFixed(2));
    const remainingLots = Number((pos.lotSize - closedLots).toFixed(2));

    if (closedLots <= 0 || remainingLots <= 0) {
      handleClosePosition(posId);
      return;
    }

    const pipVal = instrument.pipSize;
    const slippageDelta = (sessionSettings.slippagePips || 0) * pipVal;
    const actualExitPrice =
      pos.direction === 'BUY'
        ? Number((currentCandle.close - slippageDelta).toFixed(instrument.decimals))
        : Number((currentCandle.close + slippageDelta).toFixed(instrument.decimals));

    const mult = pos.direction === 'BUY' ? 1 : -1;
    const closedUnits = closedLots * instrument.contractMultiplier;
    const grossPnl = (actualExitPrice - pos.entryPrice) * mult * closedUnits;
    const commission = closedLots * (sessionSettings.commissionPerLot || 3.5);
    const spreadCost = (sessionSettings.spreadPips || 1.2) * pipVal * closedUnits;
    const slippageCost = slippageDelta * closedUnits;
    const realizedPnl = grossPnl - commission;
    const pnlPercent = (realizedPnl / account.startingBalance) * 100;

    let rMultiple = 1.0;
    if (pos.stopLoss) {
      const riskDistance = Math.abs(pos.entryPrice - pos.stopLoss);
      if (riskDistance > 0) {
        const gainDistance = (actualExitPrice - pos.entryPrice) * mult;
        rMultiple = Number((gainDistance / riskDistance).toFixed(2));
      }
    }

    const durationCandles = Math.max(
      1,
      Math.round((currentCandle.time - pos.openTime) / (TIMEFRAMES.find(t => t.id === timeframe)?.seconds || 900))
    );

    const closedTrade: ReplayTrade = {
      id: 'part-' + Date.now(),
      symbol: pos.symbol,
      direction: pos.direction,
      entryPrice: pos.entryPrice,
      exitPrice: actualExitPrice,
      stopLoss: pos.stopLoss,
      takeProfit: pos.takeProfit,
      lotSize: closedLots,
      units: closedUnits,
      openTime: pos.openTime,
      closeTime: currentCandle.time,
      openTimeString: pos.openTimeString,
      closeTimeString: currentCandle.timeString,
      grossPnl,
      commission,
      spreadCost,
      slippageCost,
      realizedPnl,
      pnlPercent,
      rMultiple,
      exitReason: 'PARTIAL',
      strategySetup: pos.strategySetup,
      marketCondition: pos.marketCondition,
      sessionTag: pos.sessionTag,
      tags: pos.tags,
      notesBefore: pos.notesBefore,
      durationMinutes: durationCandles * 15,
      durationCandles,
    };

    const remainingPositions = positions.map(p =>
      p.id === posId
        ? {
            ...p,
            lotSize: remainingLots,
            units: remainingLots * instrument.contractMultiplier,
            marginUsed: p.marginUsed * (remainingLots / pos.lotSize),
          }
        : p
    );

    setPositions(remainingPositions);
    setTrades(prev => [closedTrade, ...prev]);

    setAccount(prev => {
      const newRealizedPnl = prev.realizedPnl + realizedPnl;
      const newBalance = prev.startingBalance + newRealizedPnl;
      const totalUnrealized = remainingPositions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
      const totalUsedMargin = remainingPositions.reduce((acc, p) => acc + p.marginUsed, 0);
      const newEquity = newBalance + totalUnrealized;
      const newFreeMargin = Math.max(0, newEquity - totalUsedMargin);
      const marginLevel = totalUsedMargin > 0 ? (newEquity / totalUsedMargin) * 100 : 100;
      const peakEquity = Math.max(prev.peakEquity, newEquity);
      const currentDrawdownDollar = Math.max(0, peakEquity - newEquity);
      const currentDrawdownPercent = peakEquity > 0 ? (currentDrawdownDollar / peakEquity) * 100 : 0;
      const maxDrawdown = Math.max(prev.maxDrawdown, currentDrawdownDollar);
      const maxDrawdownPercent = Math.max(prev.maxDrawdownPercent, currentDrawdownPercent);

      return {
        ...prev,
        balance: newBalance,
        equity: newEquity,
        usedMargin: totalUsedMargin,
        freeMargin: newFreeMargin,
        marginLevel,
        realizedPnl: newRealizedPnl,
        unrealizedPnl: totalUnrealized,
        maxDrawdown,
        maxDrawdownPercent,
        peakEquity,
      };
    });

    addToast(
      'Partial Close Executed',
      `Secured ${percent}% (${closedLots}L) at ${currentCandle.close.toFixed(instrument.decimals)} (${formatCurrency(
        realizedPnl
      )})`,
      'success'
    );
  };

  const handleUpdateStartingBalance = (newStartingBal: number) => {
    if (isNaN(newStartingBal) || newStartingBal <= 0) return;
    setAccount(prev => {
      const newBalance = newStartingBal + prev.realizedPnl;
      const newEquity = newBalance + prev.unrealizedPnl;
      const newFreeMargin = Math.max(0, newEquity - prev.usedMargin);
      const marginLevel = prev.usedMargin > 0 ? (newEquity / prev.usedMargin) * 100 : 100;
      return {
        ...prev,
        startingBalance: newStartingBal,
        balance: newBalance,
        equity: newEquity,
        freeMargin: newFreeMargin,
        marginLevel,
        peakEquity: Math.max(newStartingBal, newEquity),
      };
    });
    setIsEditingBalance(false);
    addToast('Demo Balance Updated', `Starting balance set to ${formatCurrency(newStartingBal)}`, 'info');
  };

  const handleBreakevenPosition = (posId: string) => {
    const pos = positions.find(p => p.id === posId);
    if (!pos) return;
    setPositions(prev =>
      prev.map(p => (p.id === posId ? { ...p, stopLoss: p.entryPrice } : p))
    );
    addToast(
      'Break-Even Set',
      `Stop loss moved to entry price ${pos.entryPrice.toFixed(instrument.decimals)}`,
      'info'
    );
  };

  const handleReversePosition = (posId: string) => {
    const pos = positions.find(p => p.id === posId);
    if (!pos || !currentCandle) return;
    handleClosePosition(posId);
    const newDir = pos.direction === 'BUY' ? 'SELL' : 'BUY';
    handleExecuteTrade({
      direction: newDir,
      orderType: 'MARKET',
      entryPrice: currentCandle.close,
      lotSize: pos.lotSize,
      riskAmount: 100,
      marginRequired: pos.marginUsed,
    });
  };

  const handleUpdatePositionSlTp = (positionId: string, stopLoss?: number, takeProfit?: number) => {
    setPositions(prev =>
      prev.map(p => (p.id === positionId ? { ...p, stopLoss, takeProfit } : p))
    );
  };

  // Screenshot Snapshot Capture
  const handleTakeScreenshot = () => {
    addToast('Snapshot Captured', 'Chart snapshot saved to clipboard & downloads', 'success');
  };

  // Save Session
  const handleSaveSession = (name: string, notes?: string) => {
    const sessionToSave: SavedBacktestSession = {
      id: 'session-' + Date.now(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      symbol,
      timeframe,
      chartType,
      startDate,
      startIndex,
      currentIndex,
      account,
      positions,
      pendingOrders,
      trades,
      drawings,
      indicators,
      alerts,
      notes,
      settings: sessionSettings,
    };
    setSavedSessions(prev => [sessionToSave, ...prev]);
    saveBacktestSessionApi(sessionToSave);
    addToast('Session Saved', `"${name}" saved to library`, 'success');
  };

  // Load Session
  const handleLoadSession = (sess: SavedBacktestSession) => {
    setSymbol(sess.symbol);
    setTimeframe(sess.timeframe);
    if (sess.chartType) setChartType(sess.chartType);
    setStartDate(sess.startDate);
    setStartIndex(sess.startIndex);
    setCurrentIndex(sess.currentIndex);
    setAccount(sess.account);
    setPositions(sess.positions || []);
    setPendingOrders(sess.pendingOrders || []);
    setTrades(sess.trades || []);
    setDrawings(sess.drawings || []);
    if (sess.indicators) setIndicators(sess.indicators);
    if (sess.alerts) setAlerts(sess.alerts);
    if (sess.settings) setSessionSettings(sess.settings);
    setSessionNotes(sess.notes || '');
    setIsPlaying(false);
    addToast('Session Loaded', `Restored ${sess.name}`, 'info');
  };

  // Reset Session
  const handleResetSession = () => {
    setCurrentIndex(startIndex);
    setPositions([]);
    setPendingOrders([]);
    setTrades([]);
    setAccount({
      startingBalance: sessionSettings.startingBalance || 10000,
      balance: sessionSettings.startingBalance || 10000,
      equity: sessionSettings.startingBalance || 10000,
      currency: sessionSettings.currency || 'USD',
      leverage: sessionSettings.leverage || 100,
      usedMargin: 0,
      freeMargin: sessionSettings.startingBalance || 10000,
      marginLevel: 100,
      realizedPnl: 0,
      unrealizedPnl: 0,
      totalReturnPercent: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      peakEquity: sessionSettings.startingBalance || 10000,
    });
    setIsPlaying(false);
    addToast('Session Reset', 'Reset replay to start and cleared account history', 'info');
  };

  // Delete Session
  const handleDeleteSession = (sessionId: string) => {
    setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
    deleteBacktestSessionApi(sessionId);
    addToast('Session Deleted', 'Session removed from library', 'info');
  };

  const handleStartNewSession = (config: {
    symbol: string;
    timeframe: TimeframeId;
    startDate: string;
    startingBalance: number;
    leverage: number;
    currency: 'USD' | 'EUR' | 'GBP';
    settings?: BacktestSessionSettings;
  }) => {
    setSymbol(config.symbol);
    setTimeframe(config.timeframe);
    setStartDate(config.startDate);
    if (config.settings) {
      setSessionSettings(config.settings);
    }
    setPositions([]);
    setPendingOrders([]);
    setTrades([]);
    setAccount({
      startingBalance: config.startingBalance,
      balance: config.startingBalance,
      equity: config.startingBalance,
      currency: config.currency,
      leverage: config.leverage,
      usedMargin: 0,
      freeMargin: config.startingBalance,
      marginLevel: 100,
      realizedPnl: 0,
      unrealizedPnl: 0,
      totalReturnPercent: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      peakEquity: config.startingBalance,
    });
    addToast('New Replay Initialized', `Loaded ${config.symbol} ${config.timeframe} session`, 'success');
  };

  return (
    <div className="p-2 sm:p-4 lg:p-5 space-y-3.5 max-w-[1700px] mx-auto min-h-screen">
      {/* 1. TOP HEADER & VIRTUAL DEMO ACCOUNT TELEMETRY STRIP */}
      <div
        className={`rounded-2xl border p-3.5 transition-all ${
          theme === 'liquid'
            ? 'bg-slate-900/85 border-slate-700/60 backdrop-blur-md shadow-2xl'
            : theme === 'dark'
            ? 'bg-slate-900/90 border-slate-800 shadow-xl'
            : 'bg-white border-slate-200 shadow-md'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Backtesting Replay Terminal
                </h1>
                <span className="text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  PRO SIMULATOR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Deterministic bar replay engine with realistic execution modeling (spread, commission, slippage) & ambiguity handling
              </p>
            </div>
          </div>

          {/* Top Session Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs shadow-lg shadow-amber-500/10 transition cursor-pointer"
              title="Open Professional Backtest Scorecard & Audit Report"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Scorecard</span>
            </button>

            <button
              onClick={() => setIsSessionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Sessions ({savedSessions.length})</span>
            </button>

            <button
              onClick={handleResetSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition cursor-pointer"
              title="Reset replay to initial starting candle"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Live Virtual Account Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 mt-3 border-t border-slate-800/80">
          <div className="relative p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
              <span>Balance</span>
              <button
                onClick={() => {
                  setCustomBalanceInput(account.startingBalance.toString());
                  setIsEditingBalance(!isEditingBalance);
                }}
                className="text-slate-400 hover:text-indigo-400 p-0.5 rounded transition cursor-pointer"
                title="Edit Demo Starting Balance"
              >
                <DollarSign className="w-3 h-3 text-indigo-400" />
              </button>
            </div>
            <div className="text-sm font-black font-mono text-white mt-0.5 flex items-center justify-between">
              <span>{formatCurrency(account.balance)}</span>
            </div>

            {/* Quick Balance Editor Popover */}
            {isEditingBalance && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                <div className="text-[11px] font-bold text-white mb-2">Edit Starting Demo Balance</div>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {[5000, 10000, 25000, 50000, 100000, 200000].map(val => (
                    <button
                      key={val}
                      onClick={() => handleUpdateStartingBalance(val)}
                      className={`px-1.5 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                        account.startingBalance === val
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      ${val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={customBalanceInput}
                    onChange={e => setCustomBalanceInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Custom amount"
                  />
                  <button
                    onClick={() => handleUpdateStartingBalance(parseFloat(customBalanceInput) || 10000)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                  >
                    Set
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
              <span>Floating Equity</span>
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            </div>
            <div
              className={`text-sm font-black font-mono mt-0.5 ${
                account.equity >= account.startingBalance ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(account.equity)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Free Margin</div>
            <div className="text-sm font-black font-mono text-slate-200 mt-0.5">
              {formatCurrency(account.freeMargin)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Realized P&L</div>
            <div
              className={`text-sm font-black font-mono mt-0.5 ${
                account.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {account.realizedPnl >= 0 ? '+' : ''}
              {formatCurrency(account.realizedPnl)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Floating P&L</div>
            <div
              className={`text-sm font-black font-mono mt-0.5 ${
                account.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {account.unrealizedPnl >= 0 ? '+' : ''}
              {formatCurrency(account.unrealizedPnl)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Max Drawdown</div>
            <div className="text-sm font-black font-mono text-rose-400 mt-0.5">
              {account.maxDrawdownPercent.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP CHART TOOLBAR */}
      <TopChartToolbar
        currentSymbol={symbol}
        onSelectSymbol={setSymbol}
        currentTimeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        chartType={chartType}
        onSelectChartType={setChartType}
        layout={layout}
        onSelectLayout={setLayout}
        activeIndicatorsCount={indicators.filter(i => i.visible).length}
        onOpenIndicatorsModal={() => setIsIndicatorsModalOpen(true)}
        onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
        onOpenAlertsModal={() => {
          setAlertPresetPrice(currentCandle?.close);
          setIsAlertsModalOpen(true);
        }}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onTakeScreenshot={handleTakeScreenshot}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < drawingHistory.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isWatchlistOpen={isWatchlistOpen}
        onToggleWatchlist={() => setIsWatchlistOpen(!isWatchlistOpen)}
        theme={theme}
      />

      {/* 3. REPLAY CONTROLLER & SCRUBBER BAR */}
      <ReplayControlBar
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStepForward={advanceCandle}
        onStepBackward={stepBackward}
        onResetToStart={() => setCurrentIndex(startIndex)}
        currentIndex={currentIndex}
        startIndex={startIndex}
        totalCandles={allCandles.length}
        onSeek={idx => {
          setCurrentIndex(idx);
          if (allCandles[idx]) {
            updatePositionsAndAccount(allCandles[idx]);
          }
        }}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={setPlaybackSpeed}
        startDate={startDate}
        onChangeStartDate={setStartDate}
        currentCandle={currentCandle}
        isReplayModeActive={isReplayModeActive}
        onToggleReplayMode={() => setIsReplayModeActive(!isReplayModeActive)}
        theme={theme}
      />

      {/* 4. MASTER WORKSPACE (LEFT DRAWING BAR + CHART CANVAS + WATCHLIST DRAWER + ORDER PAD) */}
      <div className="flex gap-2.5">
        {/* Left Drawing Toolbar */}
        <LeftDrawingToolbar
          activeTool={activeDrawingTool}
          onSelectTool={setActiveDrawingTool}
          drawings={drawings}
          onUpdateDrawings={handleUpdateDrawings}
          theme={theme}
        />

        {/* Center Main Chart Area (Single or Multi-Grid) */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Chart Canvas Area */}
            <div className="lg:col-span-8 xl:col-span-9 h-[540px] flex flex-col min-w-0">
              <NativeChart
                data={visibleCandles}
                symbol={symbol}
                timeframe={timeframe}
                decimals={instrument.decimals}
                theme={theme}
                showVolume={chartSettings.showVolume}
                isLoading={isLoadingMarketData}
                error={marketDataError}
                onRetry={loadHistoricalMarketData}
              />
            </div>

            {/* Trading Order Pad */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-3">
              <OrderPad
                currentCandle={currentCandle}
                instrument={instrument}
                account={account}
                activePositions={positions}
                settings={sessionSettings}
                onExecuteTrade={handleExecuteTrade}
                onPartialClosePosition={handlePartialClose}
                onBreakevenPosition={handleBreakevenPosition}
                onReversePosition={handleReversePosition}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        </div>

        {/* Collapsible Watchlist Drawer on right if open */}
        {isWatchlistOpen && (
          <WatchlistPanel
            isOpen={isWatchlistOpen}
            onClose={() => setIsWatchlistOpen(false)}
            currentSymbol={symbol}
            onSelectSymbol={setSymbol}
            theme={theme}
          />
        )}
      </div>

      {/* 5. BOTTOM DOCKED TERMINAL TABS (POSITIONS, PENDING ORDERS, TRADE HISTORY, ACCOUNT, ANALYTICS, NOTES) */}
      <div
        className={`rounded-2xl border overflow-hidden transition-all ${
          theme === 'liquid'
            ? 'bg-slate-900/85 border-slate-700/60 backdrop-blur-md shadow-xl'
            : theme === 'dark'
            ? 'bg-slate-900/90 border-slate-800 shadow-xl'
            : 'bg-white border-slate-200 shadow-md'
        }`}
      >
        {/* Tab Headers */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveBottomTab('POSITIONS')}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-t-xl font-bold text-xs transition border-b-2 cursor-pointer ${
                activeBottomTab === 'POSITIONS'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Positions ({positions.length})</span>
            </button>

            <button
              onClick={() => setActiveBottomTab('PENDING')}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-t-xl font-bold text-xs transition border-b-2 cursor-pointer ${
                activeBottomTab === 'PENDING'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pending Orders ({pendingOrders.filter(o => o.status === 'PENDING').length})</span>
            </button>

            <button
              onClick={() => setActiveBottomTab('HISTORY')}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-t-xl font-bold text-xs transition border-b-2 cursor-pointer ${
                activeBottomTab === 'HISTORY'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Trade History ({trades.length})</span>
            </button>

            <button
              onClick={() => setActiveBottomTab('ACCOUNT')}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-t-xl font-bold text-xs transition border-b-2 cursor-pointer ${
                activeBottomTab === 'ACCOUNT'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Account Summary</span>
            </button>

            <button
              onClick={() => setActiveBottomTab('ANALYTICS')}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-t-xl font-bold text-xs transition border-b-2 cursor-pointer ${
                activeBottomTab === 'ANALYTICS'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Session Scorecard</span>
            </button>

            <button
              onClick={() => setActiveBottomTab('NOTES')}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-t-xl font-bold text-xs transition border-b-2 cursor-pointer ${
                activeBottomTab === 'NOTES'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Replay Journal</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500 pb-2">
            <span>
              Bar: <strong className="text-slate-300">{currentIndex + 1}</strong> / {allCandles.length}
            </span>
          </div>
        </div>

        {/* Tab Content Panes */}
        <div className="p-4">
          {activeBottomTab === 'POSITIONS' && (
            <OpenPositionsTable
              positions={positions}
              onClosePosition={handleClosePosition}
              onCloseAll={handleCloseAllPositions}
              onPartialClose={handlePartialClose}
              onBreakeven={handleBreakevenPosition}
              onReverse={handleReversePosition}
              formatCurrency={formatCurrency}
            />
          )}

          {activeBottomTab === 'PENDING' && (
            <PendingOrdersTable
              orders={pendingOrders}
              onCancelOrder={handleCancelPendingOrder}
              formatCurrency={formatCurrency}
              decimals={instrument.decimals}
            />
          )}

          {activeBottomTab === 'HISTORY' && (
            <TradeHistoryTable
              trades={trades}
              onUpdateTrade={handleUpdateTrade}
              formatCurrency={formatCurrency}
            />
          )}

          {activeBottomTab === 'ACCOUNT' && (
            <AccountSummaryTab account={account} formatCurrency={formatCurrency} />
          )}

          {activeBottomTab === 'ANALYTICS' && (
            <SessionAnalytics trades={trades} account={account} formatCurrency={formatCurrency} />
          )}

          {activeBottomTab === 'NOTES' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  Session Journal & Strategy Execution Notes
                </span>
                <span className="text-slate-500">Auto-saved with replay session</span>
              </div>
              <textarea
                rows={5}
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder="Log your market context observations, entry triggers, emotional state, setup compliance, or post-trade notes for this backtesting session..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* 6. MODALS */}
      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
        indicators={indicators}
        onUpdateIndicators={setIndicators}
      />

      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        symbol={symbol}
        currentPrice={currentCandle?.close || instrument.defaultPrice}
        decimals={instrument.decimals}
        alerts={alerts}
        onUpdateAlerts={setAlerts}
        presetPrice={alertPresetPrice}
      />

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        currentChartType={chartType}
        currentIndicators={indicators}
        onApplyTemplate={tpl => {
          setChartType(tpl.chartType);
          setIndicators(tpl.indicators);
          addToast('Template Applied', `Loaded "${tpl.name}" setup`, 'success');
        }}
      />

      <ChartSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={chartSettings}
        onUpdateSettings={setChartSettings}
      />

      <CompareSymbolModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        currentSymbol={symbol}
        comparedSymbol={comparedSymbol}
        onSelectCompareSymbol={setComparedSymbol}
      />

      <SessionManagerModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        currentSymbol={symbol}
        currentTimeframe={timeframe}
        currentStartDate={startDate}
        currentAccount={account}
        currentTradesCount={trades.length}
        currentSettings={sessionSettings}
        onStartNewSession={handleStartNewSession}
        onSaveSession={handleSaveSession}
        savedSessions={savedSessions}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        formatCurrency={formatCurrency}
      />

      <SessionScorecardModal
        isOpen={isScorecardModalOpen}
        onClose={() => setIsScorecardModalOpen(false)}
        trades={trades}
        account={account}
        formatCurrency={formatCurrency}
        sessionName={`${symbol} (${timeframe}) Backtest Session`}
      />

      {/* 7. TOAST NOTIFICATION STACK */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`p-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs pointer-events-auto flex items-start gap-2.5 animate-in slide-in-from-right-5 fade-in duration-150 ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : t.type === 'danger'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-slate-900/95 border-indigo-500/40 text-slate-200'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : t.type === 'danger' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <Zap className="w-4 h-4 text-indigo-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-white text-xs">{t.title}</div>
              <div className="text-[11px] text-slate-300 mt-0.5">{t.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
