import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Trade } from '../../types';
import { Sparkles, Info, TrendingUp, TrendingDown, Target, Shield, Zap, Activity } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

interface RadarScoreCardProps {
  trades: Trade[];
}

interface MetricPillar {
  key: string;
  name: string;
  rawValue: string;
  normalizedScore: number; // 0 to 100
  weight: number;
  description: string;
  calculation: string;
  improvementTip: string;
  statusLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const RadarScoreCard: React.FC<RadarScoreCardProps> = ({ trades }) => {
  const { theme } = useTrading();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const [animatedFractions, setAnimatedFractions] = useState<number[]>([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]);
  const prevScoreRef = useRef<number>(0);
  const [scoreDelta, setScoreDelta] = useState<number | null>(null);

  const isLight = theme === 'light';

  // Calculate 6 real performance pillars strictly from actual trade history
  const { metrics, finalScore, closedCount, winCount, lossCount } = useMemo(() => {
    const closed = trades.filter(t => t.status === 'CLOSED');
    const totalCount = closed.length;
    const wins = closed.filter(t => t.netPnl > 0);
    const losses = closed.filter(t => t.netPnl < 0);

    if (totalCount === 0) {
      const defaultMetrics: MetricPillar[] = [
        {
          key: 'winRate',
          name: 'Win %',
          rawValue: '0.0%',
          normalizedScore: 0,
          weight: 0.20,
          description: 'Percentage of winning trades among closed positions.',
          calculation: '0 Wins / 0 Trades',
          improvementTip: 'Log trades to calibrate your baseline win rate.',
          statusLabel: 'No Data',
          icon: Target,
        },
        {
          key: 'consistency',
          name: 'Consistency',
          rawValue: '0.0%',
          normalizedScore: 0,
          weight: 0.15,
          description: 'Percentage of profitable trading days & profit distribution.',
          calculation: '0 Green Days / 0 Total Days',
          improvementTip: 'Focus on repeatable session execution and regular profit targets.',
          statusLabel: 'No Data',
          icon: Activity,
        },
        {
          key: 'profitFactor',
          name: 'Profit factor',
          rawValue: '0.00',
          normalizedScore: 0,
          weight: 0.20,
          description: 'Gross profit divided by gross loss.',
          calculation: '$0.00 Gross Profit / $0.00 Gross Loss',
          improvementTip: 'Aim for a Profit Factor above 1.75 for sustainable prop profitability.',
          statusLabel: 'No Data',
          icon: TrendingUp,
        },
        {
          key: 'avgWinLoss',
          name: 'Avg win/loss',
          rawValue: '0.0x',
          normalizedScore: 0,
          weight: 0.15,
          description: 'Ratio of average winning trade size to average losing trade size.',
          calculation: '$0.00 Avg Win / $0.00 Avg Loss',
          improvementTip: 'Cut losing trades earlier to keep loss sizes strictly below 1R.',
          statusLabel: 'No Data',
          icon: Zap,
        },
        {
          key: 'maxDrawdown',
          name: 'Max drawdown',
          rawValue: '0.0%',
          normalizedScore: 100,
          weight: 0.15,
          description: 'Peak-to-trough equity drop as a percentage of total balance.',
          calculation: 'Max peak drop: $0.00',
          improvementTip: 'Strict stop-losses and max daily loss limits protect account equity.',
          statusLabel: 'Pristine',
          icon: Shield,
        },
        {
          key: 'recoveryFactor',
          name: 'Recovery factor',
          rawValue: '0.0',
          normalizedScore: 0,
          weight: 0.15,
          description: 'Total realized net profit divided by maximum dollar drawdown.',
          calculation: '$0 Net Profit / $1 Max DD',
          improvementTip: 'Higher recovery factor demonstrates rapid bounce-back without elevated risk.',
          statusLabel: 'No Data',
          icon: Sparkles,
        },
      ];
      return { metrics: defaultMetrics, finalScore: 0, closedCount: 0, winCount: 0, lossCount: 0 };
    }

    // 1. Win Rate
    const winRate = (wins.length / totalCount) * 100;
    // Map winRate: <35% -> <35, 50% -> 68, 65% -> 88, 80%+ -> 100
    const winRateScore = Math.min(
      100,
      Math.max(10, winRate >= 50 ? 68 + ((winRate - 50) / 25) * 32 : (winRate / 50) * 68)
    );

    // 2. Profit Factor
    const grossProfit = wins.reduce((acc, t) => acc + t.netPnl, 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.netPnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 5.0 : 0;
    // Map PF: 0 -> 0, 1.0 -> 40, 2.0 -> 75, 3.5+ -> 100
    const profitFactorScore = Math.min(
      100,
      Math.max(5, profitFactor <= 1.0 ? profitFactor * 40 : 40 + Math.min(60, ((profitFactor - 1.0) / 2.5) * 60))
    );

    // 3. Avg Win / Loss Ratio
    const avgWin = wins.length ? grossProfit / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 1;
    const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : 1;
    // Map ratio: 0 -> 0, 1.0 -> 40, 2.0 -> 75, 3.5+ -> 100
    const winLossScore = Math.min(
      100,
      Math.max(10, winLossRatio <= 1.0 ? winLossRatio * 40 : 40 + Math.min(60, ((winLossRatio - 1.0) / 2.5) * 60))
    );

    // Chronological Drawdown & Recovery Calculation
    const sorted = [...closed].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    let peak = 0;
    let equity = 0;
    let maxDdDollars = 0;
    let maxDdPercent = 0;

    sorted.forEach(t => {
      equity += t.netPnl;
      if (equity > peak) {
        peak = equity;
      }
      const dd = peak - equity;
      if (dd > maxDdDollars) {
        maxDdDollars = dd;
      }
      const ddPct = peak > 0 ? (dd / (50000 + peak)) * 100 : 0;
      if (ddPct > maxDdPercent) {
        maxDdPercent = ddPct;
      }
    });

    // 4. Max Drawdown Score: lower DD is better
    // 0% DD -> 100, 3% DD -> 90, 8% DD -> 75, 15% DD -> 50, 25%+ -> 15
    const ddScore = Math.min(100, Math.max(10, 100 - maxDdPercent * 3.2));

    // 5. Recovery Factor: Total Net P&L / Max DD Dollars
    const totalNetPnl = closed.reduce((acc, t) => acc + t.netPnl, 0);
    const recoveryFactor =
      maxDdDollars > 0 && totalNetPnl > 0
        ? totalNetPnl / maxDdDollars
        : totalNetPnl > 0
        ? 3.5
        : 0;
    // Map RF: 0 -> 0, 1.0 -> 40, 2.5 -> 78, 4.0+ -> 100
    const recoveryScore = Math.min(100, Math.max(5, (recoveryFactor / 3.6) * 100));

    // 6. Consistency: Daily win rate & profit distribution
    const dailyMap: { [key: string]: number } = {};
    closed.forEach(t => {
      const d = t.entryDate ? t.entryDate.split('T')[0] : 'N/A';
      dailyMap[d] = (dailyMap[d] || 0) + t.netPnl;
    });
    const days = Object.values(dailyMap);
    const greenDays = days.filter(pnl => pnl > 0).length;
    const dayWinRate = days.length ? (greenDays / days.length) * 100 : 0;
    const consistencyScore = Math.min(100, Math.max(10, (dayWinRate / 70) * 100));

    const getStatusLabel = (score: number) => {
      if (score >= 85) return 'Optimal';
      if (score >= 70) return 'Solid';
      if (score >= 50) return 'Moderate';
      return 'Needs Work';
    };

    const computedMetrics: MetricPillar[] = [
      {
        key: 'winRate',
        name: 'Win %',
        rawValue: `${winRate.toFixed(1)}%`,
        normalizedScore: Math.round(winRateScore),
        weight: 0.20,
        description: 'Percentage of winning trades across your closed executions.',
        calculation: `${wins.length} Wins / ${totalCount} Trades (${(grossProfit >= 0 ? '+' : '')}$${Math.round(grossProfit).toLocaleString()} gross profit)`,
        improvementTip:
          winRate < 50
            ? 'Avoid forcing low-conviction B/C setups; wait for confirmation on higher timeframe levels.'
            : 'Excellent hit rate. Keep enforcing your strict setup entry criteria.',
        statusLabel: getStatusLabel(winRateScore),
        icon: Target,
      },
      {
        key: 'consistency',
        name: 'Consistency',
        rawValue: `${dayWinRate.toFixed(0)}%`,
        normalizedScore: Math.round(consistencyScore),
        weight: 0.15,
        description: 'Ratio of profitable trading sessions and equity curve smoothness.',
        calculation: `${greenDays} Green Days / ${days.length} Active Days logged`,
        improvementTip:
          dayWinRate < 55
            ? 'Prevent red sessions from spiraling by stopping after hitting your daily max stop cap.'
            : 'High day-to-day discipline. Daily loss management is protecting your edge.',
        statusLabel: getStatusLabel(consistencyScore),
        icon: Activity,
      },
      {
        key: 'profitFactor',
        name: 'Profit factor',
        rawValue: profitFactor.toFixed(2),
        normalizedScore: Math.round(profitFactorScore),
        weight: 0.20,
        description: 'Total gross profit generated for every single dollar lost.',
        calculation: `$${Math.round(grossProfit).toLocaleString()} Gross Profit ÷ $${Math.round(grossLoss).toLocaleString()} Gross Loss`,
        improvementTip:
          profitFactor < 1.5
            ? 'Target trades offering minimum 2:1 Reward-to-Risk ratio and trim losing trades sooner.'
            : 'Institutional-grade ratio. Gross gains significantly outpace losing trade drag.',
        statusLabel: getStatusLabel(profitFactorScore),
        icon: TrendingUp,
      },
      {
        key: 'avgWinLoss',
        name: 'Avg win/loss',
        rawValue: `${winLossRatio.toFixed(2)}x`,
        normalizedScore: Math.round(winLossScore),
        weight: 0.15,
        description: 'Average payout on winning trades compared to average loss on losing trades.',
        calculation: `$${Math.round(avgWin).toLocaleString()} Avg Win ÷ $${Math.round(avgLoss).toLocaleString()} Avg Loss`,
        improvementTip:
          winLossRatio < 1.2
            ? 'Let winners run toward key structural liquidity rather than taking premature micro-profits.'
            : 'Strong risk/reward asymmetry. Winning trades comfortably cover red executions.',
        statusLabel: getStatusLabel(winLossScore),
        icon: Zap,
      },
      {
        key: 'maxDrawdown',
        name: 'Max drawdown',
        rawValue: `${maxDdPercent.toFixed(1)}%`,
        normalizedScore: Math.round(ddScore),
        weight: 0.15,
        description: 'Largest continuous peak-to-valley decline in account equity.',
        calculation: `Max Peak Drop: -$${Math.round(maxDdDollars).toLocaleString()} (${maxDdPercent.toFixed(1)}% of capital)`,
        improvementTip:
          maxDdPercent > 8
            ? 'Lower position sizing during volatile market conditions to prevent deep drawdowns.'
            : 'Superb risk containment. Capital preservation rules are functioning properly.',
        statusLabel: getStatusLabel(ddScore),
        icon: Shield,
      },
      {
        key: 'recoveryFactor',
        name: 'Recovery factor',
        rawValue: recoveryFactor.toFixed(2),
        normalizedScore: Math.round(recoveryScore),
        weight: 0.15,
        description: 'Measures how efficiently your trading profits overcome historical drawdowns.',
        calculation: `$${Math.round(totalNetPnl).toLocaleString()} Net P&L ÷ $${Math.round(maxDdDollars || 1).toLocaleString()} Max DD`,
        improvementTip:
          recoveryFactor < 1.5
            ? 'Focus on consistent base hits to pull equity out of pullback phases smoothly.'
            : 'Fast equity rebound capability with solid post-drawdown recovery momentum.',
        statusLabel: getStatusLabel(recoveryScore),
        icon: Sparkles,
      },
    ];

    const compositeScore = computedMetrics.reduce((acc, m) => acc + m.normalizedScore * m.weight, 0);

    return {
      metrics: computedMetrics,
      finalScore: Number(compositeScore.toFixed(2)),
      closedCount: totalCount,
      winCount: wins.length,
      lossCount: losses.length,
    };
  }, [trades]);

  // Smooth Count-Up Animation for Final Score and Morphing Polygon
  useEffect(() => {
    const targetScore = finalScore;
    const prevScore = prevScoreRef.current;
    const delta = targetScore - prevScore;
    if (prevScore !== 0 && Math.abs(delta) > 0.05) {
      setScoreDelta(delta);
      const timer = setTimeout(() => setScoreDelta(null), 3500);
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = targetScore;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimatedScore(targetScore);
      setAnimatedFractions(metrics.map(m => Math.max(0.15, m.normalizedScore / 100)));
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 650; // ms
    const initialScore = animatedScore;
    const targetFractions = metrics.map(m => Math.max(0.15, m.normalizedScore / 100));

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedScore(Number((initialScore + (targetScore - initialScore) * easeProgress).toFixed(2)));
      setAnimatedFractions(
        targetFractions.map((target, i) => {
          const current = animatedFractions[i] || 0.15;
          return current + (target - current) * easeProgress;
        })
      );

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [finalScore, metrics]);

  // Status Tier Badge based strictly on real calculated score
  const getOverallTier = (score: number) => {
    if (score >= 85) {
      return {
        label: 'EXCELLENT',
        color: 'text-[#00D6A3] bg-[rgba(0,214,163,0.12)] border-[rgba(0,214,163,0.25)]',
        glow: 'rgba(0, 214, 163, 0.4)',
        summary: 'Institutional-grade execution with high expectancy and minimal drawdown.',
      };
    }
    if (score >= 70) {
      return {
        label: 'STRONG',
        color: 'text-[#00D6A3] bg-[rgba(0,214,163,0.12)] border-[rgba(0,214,163,0.25)]',
        glow: 'rgba(0, 214, 163, 0.4)',
        summary: 'Solid profitable baseline with consistent discipline across trading sessions.',
      };
    }
    if (score >= 55) {
      return {
        label: 'CONSISTENT',
        color: 'text-[#4C7DFF] bg-[rgba(37,99,255,0.12)] border-[rgba(37,99,255,0.25)]',
        glow: 'rgba(37, 99, 255, 0.4)',
        summary: 'Reliable win frequency; optimize win/loss ratio for greater leverage.',
      };
    }
    if (score >= 40) {
      return {
        label: 'DEVELOPING',
        color: 'text-[#FFB547] bg-[rgba(255,181,71,0.12)] border-[rgba(255,181,71,0.25)]',
        glow: 'rgba(255, 181, 71, 0.4)',
        summary: 'Forming trading habits; reduce loss sizes and adhere to trade checklists.',
      };
    }
    return {
      label: 'NEEDS IMPROVEMENT',
      color: 'text-[#FF3D6E] bg-[rgba(255,61,110,0.12)] border-[rgba(255,61,110,0.25)]',
      glow: 'rgba(255, 61, 110, 0.4)',
      summary: 'High drawdown or low win rate detected. Enforce hard stop loss limits.',
    };
  };

  const currentTier = getOverallTier(animatedScore);

  // Hexagon chart geometry
  const cx = 135;
  const cy = 100;
  const maxRadius = 66;
  const numSides = 6;

  // Concentric hexagon levels (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const getHexagonPoints = (r: number) => {
    const points: string[] = [];
    for (let i = 0; i < numSides; i++) {
      const angle = (i * 2 * Math.PI) / numSides - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  // Compute Animated Polygon coordinates for actual trade performance
  const dataPoints = metrics.map((m, i) => {
    const angle = (i * 2 * Math.PI) / numSides - Math.PI / 2;
    const fraction = animatedFractions[i] !== undefined ? animatedFractions[i] : Math.max(0.15, m.normalizedScore / 100);
    const r = maxRadius * Math.min(1.0, Math.max(0.15, fraction));
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, angle, metric: m, index: i };
  });

  const polygonPoints = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Label offsets matching the 6 axes
  const labelPositions = [
    { label: 'Win %', x: cx, y: cy - maxRadius - 12, anchor: 'middle' },
    { label: 'Consistency', x: cx + maxRadius + 34, y: cy - maxRadius / 2 + 3, anchor: 'start' },
    { label: 'Profit factor', x: cx + maxRadius + 34, y: cy + maxRadius / 2 + 10, anchor: 'start' },
    { label: 'Avg win/loss', x: cx, y: cy + maxRadius + 18, anchor: 'middle' },
    { label: 'Max drawdown', x: cx - maxRadius - 34, y: cy + maxRadius / 2 + 10, anchor: 'end' },
    { label: 'Recovery factor', x: cx - maxRadius - 34, y: cy - maxRadius / 2 + 3, anchor: 'end' },
  ];

  const activeMetric = hoveredIndex !== null ? metrics[hoveredIndex] : null;

  return (
    <div className="flex flex-col justify-between w-full h-full pt-1 pb-1 select-none relative">
      {/* Top Header info */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-[#4B5563]' : 'text-[#8C97AB]'}`}>
          <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-[#1D4ED8]' : 'text-[#4C7DFF]'}`} />
          <span className={`font-semibold ${isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'}`}>Performance Hexagon</span>
        </div>
        <span className={`text-[10px] font-mono ${isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'}`}>
          {closedCount} Closed Trades
        </span>
      </div>

      {/* Radar Hexagon SVG Container */}
      <div className="relative flex items-center justify-center min-h-[198px]">
        <svg
          width="270"
          height="208"
          viewBox="0 0 270 208"
          className="overflow-visible filter drop-shadow-sm"
        >
          <defs>
            {/* Smooth radar background gradient */}
            <radialGradient id="duskflowRadarGrad" cx="50%" cy="50%" r="50%">
              {isLight ? (
                <>
                  <stop offset="0%" stopColor="#2563FF" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#2563FF" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#2563FF" stopOpacity="0.03" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#2563FF" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#2563FF" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#2563FF" stopOpacity="0.05" />
                </>
              )}
            </radialGradient>

            {/* Glowing filter */}
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Concentric Hexagon Background Grids */}
          {gridLevels.map((lvl, idx) => (
            <polygon
              key={idx}
              points={getHexagonPoints(maxRadius * lvl)}
              fill="none"
              stroke={isLight ? "#E5E7EB" : "#20283A"}
              strokeWidth={idx === gridLevels.length - 1 ? '1.2' : '0.8'}
              strokeDasharray={lvl === 1.0 ? undefined : '3 3'}
              className="opacity-75 transition-opacity duration-300"
            />
          ))}

          {/* 6 Axis Spoke Lines */}
          {Array.from({ length: numSides }).map((_, i) => {
            const angle = (i * 2 * Math.PI) / numSides - Math.PI / 2;
            const x2 = cx + maxRadius * Math.cos(angle);
            const y2 = cy + maxRadius * Math.sin(angle);
            const isHovered = hoveredIndex === i;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x2}
                y2={y2}
                stroke={isHovered ? (isLight ? '#2563FF' : '#4C7DFF') : (isLight ? '#E5E7EB' : '#20283A')}
                strokeWidth={isHovered ? '2' : '1'}
                className="transition-colors duration-200"
              />
            );
          })}

          {/* Dynamic Animated Radar Performance Polygon */}
          <polygon
            points={polygonPoints}
            fill="url(#duskflowRadarGrad)"
            stroke={isLight ? '#2563FF' : '#4C7DFF'}
            strokeWidth="2"
            strokeLinejoin="round"
            className="transition-all duration-300 ease-out"
            filter="url(#radarGlow)"
          />

          {/* Center Origin Dot */}
          <circle cx={cx} cy={cy} r="2.5" fill={isLight ? '#9CA3AF' : '#4B5563'} className="opacity-60" />

          {/* Corner Vertex Dots with Active Hover Ring */}
          {dataPoints.map((p, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible large hit area for touch/mouse */}
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                {/* Animated Pulsing Outer Ring on Hover */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="8"
                    fill="none"
                    stroke={isLight ? '#2563FF' : '#4C7DFF'}
                    strokeWidth="1.5"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Main Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : 4}
                  fill={isHovered ? '#ffffff' : (isLight ? '#2563FF' : '#4C7DFF')}
                  stroke={isHovered ? (isLight ? '#2563FF' : '#4C7DFF') : '#ffffff'}
                  strokeWidth={isHovered ? '2' : '1.5'}
                  className="transition-all duration-200"
                />
              </g>
            );
          })}

          {/* Axis Text Labels */}
          {labelPositions.map((pos, idx) => {
            const isHovered = hoveredIndex === idx;
            const metric = metrics[idx];
            return (
              <g
                key={idx}
                className="cursor-pointer select-none"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor={pos.anchor as any}
                  fill={isHovered ? (isLight ? '#1D4ED8' : '#4C7DFF') : (isLight ? '#4B5563' : '#8C97AB')}
                  fontSize={isHovered ? '10' : '9.5'}
                  fontWeight={isHovered ? '700' : '500'}
                  className="transition-all duration-200"
                >
                  {metric.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Rich Interactive Tooltip on Axis Hover */}
        {activeMetric && (
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] rounded-xl border p-3 shadow-2xl z-30 pointer-events-none animate-in fade-in zoom-in-95 space-y-1.5 ${
              isLight
                ? 'bg-white border-[#E5E7EB] text-[#111827]'
                : 'border-[#28344A] bg-[#0D111B] text-[#F3F6FB]'
            }`}
          >
            <div className={`flex items-center justify-between pb-1 border-b ${
              isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
            }`}>
              <div className="flex items-center gap-1.5">
                <activeMetric.icon className={`w-3.5 h-3.5 ${isLight ? 'text-[#1D4ED8]' : 'text-[#4C7DFF]'}`} />
                <span className={`font-semibold text-xs ${isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'}`}>{activeMetric.name}</span>
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                isLight ? 'bg-[rgba(37,99,255,0.08)] text-[#1D4ED8] border-[rgba(37,99,255,0.20)]' : 'bg-[rgba(37,99,255,0.12)] text-[#4C7DFF] border-[rgba(37,99,255,0.25)]'
              }`}>
                {activeMetric.normalizedScore}/100
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className={`text-[11px] ${isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'}`}>Real Value:</span>
              <span className={`font-bold ${isLight ? 'text-[#059669]' : 'text-[#00D6A3]'}`}>{activeMetric.rawValue}</span>
            </div>

            <div className={`text-[10px] font-mono rounded px-2 py-1 border ${
              isLight ? 'bg-[#F1F5F9] text-[#111827] border-[#E5E7EB]' : 'text-[#8C97AB] bg-[#111722] border-[#20283A]'
            }`}>
              {activeMetric.calculation}
            </div>

            <div className={`text-[10px] leading-snug pt-0.5 ${isLight ? 'text-[#4B5563]' : 'text-[#8C97AB]'}`}>
              <strong className={isLight ? 'text-[#1D4ED8]' : 'text-[#4C7DFF]'}>Tactical Tip: </strong>
              {activeMetric.improvementTip}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Score & Dynamic Progress Slider */}
      <div className={`mt-2 pt-2.5 border-t space-y-2 ${
        isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
      }`}>
        <div className="flex items-end justify-between">
          <div>
            <div className={`text-[11px] font-medium ${isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'}`}>Your TradeForge Score</div>
            <div className={`text-2xl font-bold font-mono tracking-tight flex items-center gap-2 ${
              isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
            }`}>
              <span>{animatedScore.toFixed(2)}</span>

              {/* Dynamic Tier Badge */}
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-all duration-300 ${currentTier.color}`}
              >
                {currentTier.label}
              </span>

              {/* Subtle Score Delta Indicator */}
              {scoreDelta !== null && (
                <span
                  className={`text-[11px] font-bold font-mono flex items-center gap-0.5 ${
                    scoreDelta >= 0 ? (isLight ? 'text-[#059669]' : 'text-[#00D6A3]') : (isLight ? 'text-[#DC2626]' : 'text-[#FF3D6E]')
                  }`}
                >
                  {scoreDelta >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {scoreDelta >= 0 ? `+${scoreDelta.toFixed(1)}` : scoreDelta.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[10px] ${isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'}`}>
              Win/Loss: <strong className={isLight ? 'text-[#059669]' : 'text-[#00D6A3]'}>{winCount}W</strong> / <strong className={isLight ? 'text-[#DC2626]' : 'text-[#FF3D6E]'}>{lossCount}L</strong>
            </span>
          </div>
        </div>

        {/* Dynamic 0-100 Color Gradient Bar with Animated Thumb */}
        <div className="space-y-1">
          <div className={`relative h-1.5 w-full rounded-full overflow-visible ${
            isLight ? 'bg-[#E5E7EB]' : 'bg-[#111722]'
          }`}>
            {/* Gradient Track: Red -> Amber -> Green -> Blue */}
            <div
              className="absolute inset-0 rounded-full transition-opacity duration-300"
              style={{
                background:
                  'linear-gradient(to right, #FF3D6E 0%, #FFB547 35%, #00D6A3 70%, #2563FF 100%)',
                opacity: 0.9,
              }}
            />

            {/* Position Indicator Bubble */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 shadow transition-all duration-500 flex items-center justify-center ${
                isLight ? 'border-[#9CA3AF]' : 'border-[#080B12]'
              }`}
              style={{
                left: `${Math.min(98, Math.max(2, animatedScore))}%`,
              }}
              title={`Score: ${animatedScore.toFixed(2)}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-[#2563FF]' : 'bg-[#2563FF]'}`} />
            </div>
          </div>

          {/* Scale Axis Markers (0, 20, 40, 60, 80, 100) */}
          <div className={`flex justify-between text-[9px] font-mono px-0.5 ${
            isLight ? 'text-[#9CA3AF]' : 'text-[#5F6B80]'
          }`}>
            <span>0</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
};
