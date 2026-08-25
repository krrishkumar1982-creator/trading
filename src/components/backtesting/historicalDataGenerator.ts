import { ReplayCandle, TimeframeId, ChartType } from './types';
import { getInstrumentConfig, TIMEFRAMES } from './instruments';

// Seedable PRNG for deterministic replay
class PRNG {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  gaussian(mean = 0, stdev = 1): number {
    const u1 = Math.max(1e-10, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdev + mean;
  }
}

// Generate raw base historical candles
export function generateHistoricalCandles(
  symbol: string,
  timeframe: TimeframeId,
  startDateStr: string,
  totalCandles = 500
): ReplayCandle[] {
  const config = getInstrumentConfig(symbol);
  const tfConfig = TIMEFRAMES.find(t => t.id === timeframe) || TIMEFRAMES[3];
  const stepSeconds = tfConfig.seconds;

  let seedNum = 5381;
  const key = `${symbol}_${timeframe}_${startDateStr}`;
  for (let i = 0; i < key.length; i++) {
    seedNum = (seedNum << 5) + seedNum + key.charCodeAt(i);
  }
  const rng = new PRNG(Math.abs(seedNum));

  let startTime = Math.floor(new Date(startDateStr || '2024-06-10T08:00:00Z').getTime() / 1000);
  if (isNaN(startTime) || startTime <= 0) {
    startTime = Math.floor(new Date('2024-06-10T08:00:00Z').getTime() / 1000);
  }

  let baseVolatility = 0.0015;
  if (config.category === 'CRYPTO') baseVolatility = 0.0040;
  if (config.category === 'COMMODITIES') baseVolatility = 0.0022;
  if (config.category === 'INDICES') baseVolatility = 0.0018;

  const tfMultiplier = Math.sqrt(stepSeconds / 300);
  const candleVolatility = baseVolatility * tfMultiplier;

  let currentPrice = config.defaultPrice * (1 + (rng.next() - 0.5) * 0.04);
  const candles: ReplayCandle[] = [];

  let currentRegime: 'TREND_UP' | 'TREND_DOWN' | 'RANGING' = 'RANGING';
  let regimeDuration = Math.floor(rng.range(25, 60));
  let regimeCounter = 0;
  let regimeTrendStrength = 0;

  for (let i = 0; i < totalCandles; i++) {
    const candleTime = startTime + i * stepSeconds;

    regimeCounter++;
    if (regimeCounter > regimeDuration) {
      regimeCounter = 0;
      regimeDuration = Math.floor(rng.range(20, 50));
      const roll = rng.next();
      if (roll < 0.38) {
        currentRegime = 'TREND_UP';
        regimeTrendStrength = rng.range(0.0004, 0.0012) * tfMultiplier;
      } else if (roll < 0.76) {
        currentRegime = 'TREND_DOWN';
        regimeTrendStrength = -rng.range(0.0004, 0.0012) * tfMultiplier;
      } else {
        currentRegime = 'RANGING';
        regimeTrendStrength = 0;
      }
    }

    const open = currentPrice;
    const shock = rng.gaussian(0, candleVolatility);
    const drift = regimeTrendStrength;
    const priceChangePct = drift + shock;
    let close = open * (1 + priceChangePct);
    if (close <= 0) close = open * 0.99;

    const isGreen = close >= open;
    const bodyHigh = Math.max(open, close);
    const bodyLow = Math.min(open, close);

    const upperWickPct = Math.abs(rng.gaussian(0, candleVolatility * 0.65));
    const lowerWickPct = Math.abs(rng.gaussian(0, candleVolatility * 0.65));

    let high = bodyHigh * (1 + upperWickPct);
    let low = bodyLow * (1 - lowerWickPct);

    // Occasional liquidity wicks
    if (rng.next() < 0.08) {
      if (isGreen) {
        high = bodyHigh * (1 + upperWickPct * 2.2);
      } else {
        low = bodyLow * (1 - lowerWickPct * 2.2);
      }
    }

    const rangePct = (high - low) / open;
    const baseVolume = rng.range(1200, 3500);
    const volumeMultiplier = 1 + (rangePct / (candleVolatility || 1)) * 1.8;
    const volume = Math.round(baseVolume * volumeMultiplier);

    const d = new Date(candleTime * 1000);
    const timeString = d.toISOString().replace('T', ' ').substring(0, 16);
    const p = (val: number) => Number(val.toFixed(config.decimals));

    candles.push({
      time: candleTime,
      timeString,
      open: p(open),
      high: p(high),
      low: p(low),
      close: p(close),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

// Convert Standard Candles to Heikin Ashi Candles
export function convertToHeikinAshi(candles: ReplayCandle[]): ReplayCandle[] {
  if (candles.length === 0) return [];
  const haCandles: ReplayCandle[] = [];

  // First candle
  const first = candles[0];
  let prevHaOpen = (first.open + first.close) / 2;
  let prevHaClose = (first.open + first.high + first.low + first.close) / 4;

  haCandles.push({
    ...first,
    open: prevHaOpen,
    close: prevHaClose,
    high: Math.max(first.high, prevHaOpen, prevHaClose),
    low: Math.min(first.low, prevHaOpen, prevHaClose),
  });

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    haCandles.push({
      time: c.time,
      timeString: c.timeString,
      open: Number(haOpen.toFixed(5)),
      high: Number(haHigh.toFixed(5)),
      low: Number(haLow.toFixed(5)),
      close: Number(haClose.toFixed(5)),
      volume: c.volume,
    });

    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }

  return haCandles;
}

// Convert Candles to Renko Bricks
export function convertToRenko(candles: ReplayCandle[], pipSize = 0.0001, brickMultiplier = 10): ReplayCandle[] {
  if (candles.length === 0) return [];
  const brickSize = pipSize * brickMultiplier;
  const renko: ReplayCandle[] = [];

  let currentBrickClose = candles[0].close;
  let lastDirection: 1 | -1 = 1;

  candles.forEach(c => {
    const priceDiff = c.close - currentBrickClose;
    const bricksCount = Math.floor(Math.abs(priceDiff) / brickSize);

    if (bricksCount > 0) {
      const isUp = priceDiff > 0;
      for (let b = 0; b < Math.min(bricksCount, 5); b++) {
        const brickOpen = currentBrickClose;
        const brickClose = isUp ? currentBrickClose + brickSize : currentBrickClose - brickSize;
        renko.push({
          time: c.time,
          timeString: c.timeString,
          open: Number(brickOpen.toFixed(5)),
          close: Number(brickClose.toFixed(5)),
          high: Number(Math.max(brickOpen, brickClose).toFixed(5)),
          low: Number(Math.min(brickOpen, brickClose).toFixed(5)),
          volume: Math.round((c.volume || 100) / bricksCount),
        });
        currentBrickClose = brickClose;
        lastDirection = isUp ? 1 : -1;
      }
    }
  });

  return renko.length > 0 ? renko : candles;
}

// Transform raw candles depending on the selected chart type
export function transformCandlesByChartType(
  candles: ReplayCandle[],
  chartType: ChartType,
  pipSize = 0.0001
): ReplayCandle[] {
  if (chartType === 'HEIKIN_ASHI') {
    return convertToHeikinAshi(candles);
  }
  if (chartType === 'RENKO') {
    return convertToRenko(candles, pipSize, 12);
  }
  return candles;
}
