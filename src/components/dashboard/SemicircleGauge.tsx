import React from 'react';
import { useTrading } from '../../context/TradingContext';

interface MultiSegmentSemicircleProps {
  wins: number;
  breakevens?: number;
  losses: number;
  size?: number;
  strokeWidth?: number;
}

export const MultiSegmentSemicircleGauge: React.FC<MultiSegmentSemicircleProps> = ({
  wins,
  breakevens = 0,
  losses,
  size = 72,
  strokeWidth = 6.5,
}) => {
  const { theme } = useTrading();
  const isLight = theme === 'light';
  const total = wins + breakevens + losses;
  
  const width = size;
  const height = size / 2 + strokeWidth + 2;
  const cx = width / 2;
  const cy = size / 2;
  const r = (width - strokeWidth) / 2;
  const arcLength = Math.PI * r;

  const pathData = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  if (total === 0) {
    return (
      <div className="relative inline-flex items-center justify-center select-none" style={{ width, height }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <path
            d={pathData}
            fill="none"
            stroke={isLight ? '#e4e4e7' : '#27272a'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  const winFraction = wins / total;
  const beFraction = breakevens / total;
  const lossFraction = losses / total;

  const winLen = winFraction * arcLength;
  const beLen = beFraction * arcLength;
  const lossLen = lossFraction * arcLength;

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Background track */}
        <path
          d={pathData}
          fill="none"
          stroke={isLight ? '#E5E7EB' : '#20283A'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* 1. Green / Win Segment (starts from left) */}
        {winLen > 0 && (
          <path
            d={pathData}
            fill="none"
            stroke={isLight ? '#059669' : '#00D6A3'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${winLen} ${arcLength}`}
            strokeDashoffset="0"
            strokeLinecap={lossLen === 0 && beLen === 0 ? 'round' : 'round'}
            className="transition-all duration-500 ease-out"
          />
        )}

        {/* 2. Neutral / Breakeven Segment (Blue) */}
        {beLen > 0 && (
          <path
            d={pathData}
            fill="none"
            stroke={isLight ? '#2563FF' : '#4C7DFF'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${beLen} ${arcLength}`}
            strokeDashoffset={-winLen}
            className="transition-all duration-500 ease-out"
          />
        )}

        {/* 3. Red / Loss Segment */}
        {lossLen > 0 && (
          <path
            d={pathData}
            fill="none"
            stroke={isLight ? '#DC2626' : '#FF3D6E'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${lossLen} ${arcLength}`}
            strokeDashoffset={-(winLen + beLen)}
            strokeLinecap={winLen === 0 && beLen === 0 ? 'round' : 'round'}
            className="transition-all duration-500 ease-out"
          />
        )}
      </svg>
    </div>
  );
};

interface ProfitFactorDonutProps {
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  size?: number;
  strokeWidth?: number;
}

export const ProfitFactorDonut: React.FC<ProfitFactorDonutProps> = ({
  grossProfit,
  grossLoss,
  size = 52,
  strokeWidth = 6,
}) => {
  const { theme } = useTrading();
  const isLight = theme === 'light';
  const total = Math.max(0, grossProfit) + Math.max(0, grossLoss);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={isLight ? '#E5E7EB' : '#20283A'}
            strokeWidth={strokeWidth}
          />
        </svg>
      </div>
    );
  }

  const profitFraction = grossProfit / total;
  const lossFraction = grossLoss / total;

  const profitLen = profitFraction * circumference;
  const lossLen = lossFraction * circumference;

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={isLight ? '#E5E7EB' : '#20283A'}
          strokeWidth={strokeWidth}
        />

        {/* Profitable portion (Green) */}
        {profitLen > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={isLight ? '#059669' : '#00D6A3'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${profitLen} ${circumference}`}
            strokeDashoffset="0"
            className="transition-all duration-500 ease-out"
          />
        )}

        {/* Losing portion (Red) */}
        {lossLen > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={isLight ? '#DC2626' : '#FF3D6E'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${lossLen} ${circumference}`}
            strokeDashoffset={-profitLen}
            className="transition-all duration-500 ease-out"
          />
        )}
      </svg>
    </div>
  );
};

// Also keep legacy SemicircleGauge for any other references
export const SemicircleGauge: React.FC<{
  value: number;
  maxValue?: number;
  isProfitFactor?: boolean;
  size?: number;
  strokeWidth?: number;
  color?: string;
}> = ({
  value,
  maxValue = 4.0,
  isProfitFactor = false,
  size = 72,
  strokeWidth = 6.5,
  color,
}) => {
  const { theme } = useTrading();
  const isLight = theme === 'light';
  let fraction = 0;
  if (isProfitFactor) {
    fraction = Math.min(1, Math.max(0, value / maxValue));
  } else {
    fraction = Math.min(1, Math.max(0, value / 100));
  }

  const strokeColor = color || (value >= 50 || (isProfitFactor && value >= 1.5) ? (isLight ? '#059669' : '#00D6A3') : (isLight ? '#DC2626' : '#FF3D6E'));
  const width = size;
  const height = size / 2 + strokeWidth + 2;
  const cx = width / 2;
  const cy = size / 2;
  const r = (width - strokeWidth) / 2;
  const arcLength = Math.PI * r;
  const dashOffset = arcLength * (1 - fraction);
  const pathData = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <path
          d={pathData}
          fill="none"
          stroke={isLight ? '#E5E7EB' : '#20283A'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {fraction > 0 && (
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${arcLength}`}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500 ease-out"
          />
        )}
      </svg>
    </div>
  );
};
