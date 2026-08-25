import { ReplayCandle } from './types';

export interface IndicatorPoint {
  time: number;
  value: number;
}

export interface MultiLinePoint {
  time: number;
  [key: string]: number;
}

export interface BollingerPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface MacdPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface StochasticPoint {
  time: number;
  k: number;
  d: number;
}

export interface SupertrendPoint {
  time: number;
  value: number;
  direction: 1 | -1; // 1 = Bullish (Green), -1 = Bearish (Red)
}

export interface ParabolicSarPoint {
  time: number;
  sar: number;
  isBull: boolean;
}

export interface IchimokuPoint {
  time: number;
  tenkan: number;
  kijun: number;
  spanA: number;
  spanB: number;
  chikou: number;
}

export interface KeltnerPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface VolumeProfileBucket {
  priceLow: number;
  priceHigh: number;
  priceMid: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  isPoc?: boolean;
}

// ----------------------------------------------------
// TREND INDICATORS
// ----------------------------------------------------

// Simple Moving Average
export function calculateSMA(candles: ReplayCandle[], period: number): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  if (candles.length < period) return points;

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    points.push({
      time: candles[i].time,
      value: Number((sum / period).toFixed(5)),
    });
  }
  return points;
}

// Exponential Moving Average
export function calculateEMA(candles: ReplayCandle[], period: number): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  if (candles.length < period) return points;

  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEma = sum / period;

  points.push({
    time: candles[period - 1].time,
    value: Number(prevEma.toFixed(5)),
  });

  for (let i = period; i < candles.length; i++) {
    const currentPrice = candles[i].close;
    const ema = currentPrice * k + prevEma * (1 - k);
    points.push({
      time: candles[i].time,
      value: Number(ema.toFixed(5)),
    });
    prevEma = ema;
  }

  return points;
}

// Weighted Moving Average
export function calculateWMA(candles: ReplayCandle[], period: number): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  if (candles.length < period) return points;

  const denominator = (period * (period + 1)) / 2;

  for (let i = period - 1; i < candles.length; i++) {
    let weightedSum = 0;
    for (let j = 0; j < period; j++) {
      const weight = period - j;
      weightedSum += candles[i - j].close * weight;
    }
    points.push({
      time: candles[i].time,
      value: Number((weightedSum / denominator).toFixed(5)),
    });
  }
  return points;
}

// Volume Weighted Average Price (VWAP)
export function calculateVWAP(candles: ReplayCandle[]): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  if (candles.length === 0) return points;

  let cumulativeTypicalVolume = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 1;

    cumulativeTypicalVolume += typicalPrice * vol;
    cumulativeVolume += vol;

    const vwap = cumulativeVolume > 0 ? cumulativeTypicalVolume / cumulativeVolume : typicalPrice;
    points.push({
      time: c.time,
      value: Number(vwap.toFixed(5)),
    });
  }

  return points;
}

// Supertrend Indicator
export function calculateSupertrend(
  candles: ReplayCandle[],
  period = 10,
  multiplier = 3
): SupertrendPoint[] {
  const points: SupertrendPoint[] = [];
  if (candles.length < period + 1) return points;

  const atrPoints = calculateATR(candles, period);
  const atrMap = new Map<number, number>();
  atrPoints.forEach(p => atrMap.set(p.time, p.value));

  let prevUpper = 0;
  let prevLower = 0;
  let prevSupertrend = 0;
  let direction: 1 | -1 = 1;

  for (let i = period; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];
    const atr = atrMap.get(c.time) || (c.high - c.low);
    const hl2 = (c.high + c.low) / 2;

    let upperBand = hl2 + multiplier * atr;
    let lowerBand = hl2 - multiplier * atr;

    if (prevLower > 0 && prevC.close > prevLower) {
      lowerBand = Math.max(lowerBand, prevLower);
    }
    if (prevUpper > 0 && prevC.close < prevUpper) {
      upperBand = Math.min(upperBand, prevUpper);
    }

    if (i === period) {
      direction = c.close > upperBand ? 1 : -1;
      prevSupertrend = direction === 1 ? lowerBand : upperBand;
    } else {
      if (prevSupertrend === prevUpper && c.close > upperBand) {
        direction = 1;
      } else if (prevSupertrend === prevLower && c.close < lowerBand) {
        direction = -1;
      }
      prevSupertrend = direction === 1 ? lowerBand : upperBand;
    }

    prevUpper = upperBand;
    prevLower = lowerBand;

    points.push({
      time: c.time,
      value: Number(prevSupertrend.toFixed(5)),
      direction,
    });
  }

  return points;
}

// Parabolic SAR
export function calculateParabolicSAR(
  candles: ReplayCandle[],
  step = 0.02,
  maxStep = 0.2
): ParabolicSarPoint[] {
  const points: ParabolicSarPoint[] = [];
  if (candles.length < 3) return points;

  let isBull = candles[1].close > candles[0].close;
  let af = step;
  let ep = isBull ? candles[0].high : candles[0].low;
  let sar = isBull ? candles[0].low : candles[0].high;

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];

    sar = sar + af * (ep - sar);

    if (isBull) {
      if (curr.low < sar) {
        isBull = false;
        sar = ep;
        ep = curr.low;
        af = step;
      } else {
        if (curr.high > ep) {
          ep = curr.high;
          af = Math.min(af + step, maxStep);
        }
        sar = Math.min(sar, prev.low, i > 1 ? candles[i - 2].low : prev.low);
      }
    } else {
      if (curr.high > sar) {
        isBull = true;
        sar = ep;
        ep = curr.high;
        af = step;
      } else {
        if (curr.low < ep) {
          ep = curr.low;
          af = Math.min(af + step, maxStep);
        }
        sar = Math.max(sar, prev.high, i > 1 ? candles[i - 2].high : prev.high);
      }
    }

    points.push({
      time: curr.time,
      sar: Number(sar.toFixed(5)),
      isBull,
    });
  }

  return points;
}

// Ichimoku Cloud
export function calculateIchimoku(
  candles: ReplayCandle[],
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouBPeriod = 52
): IchimokuPoint[] {
  const points: IchimokuPoint[] = [];
  if (candles.length < senkouBPeriod) return points;

  const getHighLowMid = (slice: ReplayCandle[]) => {
    let h = -Infinity;
    let l = Infinity;
    slice.forEach(c => {
      if (c.high > h) h = c.high;
      if (c.low < l) l = c.low;
    });
    return (h + l) / 2;
  };

  for (let i = senkouBPeriod - 1; i < candles.length; i++) {
    const tenkan = getHighLowMid(candles.slice(i - tenkanPeriod + 1, i + 1));
    const kijun = getHighLowMid(candles.slice(i - kijunPeriod + 1, i + 1));
    const spanA = (tenkan + kijun) / 2;
    const spanB = getHighLowMid(candles.slice(i - senkouBPeriod + 1, i + 1));
    const chikou = candles[i].close;

    points.push({
      time: candles[i].time,
      tenkan: Number(tenkan.toFixed(5)),
      kijun: Number(kijun.toFixed(5)),
      spanA: Number(spanA.toFixed(5)),
      spanB: Number(spanB.toFixed(5)),
      chikou: Number(chikou.toFixed(5)),
    });
  }

  return points;
}

// ----------------------------------------------------
// MOMENTUM INDICATORS
// ----------------------------------------------------

// Relative Strength Index (RSI)
export function calculateRSI(candles: ReplayCandle[], period = 14): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  if (candles.length <= period) return points;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);

  points.push({
    time: candles[period].time,
    value: Number(rsi.toFixed(2)),
  });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);

    points.push({
      time: candles[i].time,
      value: Number(rsi.toFixed(2)),
    });
  }

  return points;
}

// MACD
export function calculateMACD(
  candles: ReplayCandle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MacdPoint[] {
  const points: MacdPoint[] = [];
  if (candles.length < slowPeriod + signalPeriod) return points;

  const fastEma = calculateEMA(candles, fastPeriod);
  const slowEma = calculateEMA(candles, slowPeriod);

  const slowMap = new Map<number, number>();
  slowEma.forEach(p => slowMap.set(p.time, p.value));

  const macdRaw: { time: number; value: number }[] = [];
  fastEma.forEach(p => {
    if (slowMap.has(p.time)) {
      const slowVal = slowMap.get(p.time)!;
      macdRaw.push({
        time: p.time,
        value: p.value - slowVal,
      });
    }
  });

  if (macdRaw.length < signalPeriod) return points;

  const k = 2 / (signalPeriod + 1);
  let sum = 0;
  for (let i = 0; i < signalPeriod; i++) {
    sum += macdRaw[i].value;
  }
  let prevSignal = sum / signalPeriod;

  points.push({
    time: macdRaw[signalPeriod - 1].time,
    macd: Number(macdRaw[signalPeriod - 1].value.toFixed(5)),
    signal: Number(prevSignal.toFixed(5)),
    histogram: Number((macdRaw[signalPeriod - 1].value - prevSignal).toFixed(5)),
  });

  for (let i = signalPeriod; i < macdRaw.length; i++) {
    const currentMacd = macdRaw[i].value;
    const signal = currentMacd * k + prevSignal * (1 - k);
    const histogram = currentMacd - signal;

    points.push({
      time: macdRaw[i].time,
      macd: Number(currentMacd.toFixed(5)),
      signal: Number(signal.toFixed(5)),
      histogram: Number(histogram.toFixed(5)),
    });

    prevSignal = signal;
  }

  return points;
}

// Stochastic Oscillator
export function calculateStochastic(
  candles: ReplayCandle[],
  kPeriod = 14,
  dPeriod = 3
): StochasticPoint[] {
  const points: StochasticPoint[] = [];
  if (candles.length < kPeriod + dPeriod) return points;

  const rawK: { time: number; k: number }[] = [];

  for (let i = kPeriod - 1; i < candles.length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      const c = candles[i - j];
      if (c.high > highestHigh) highestHigh = c.high;
      if (c.low < lowestLow) lowestLow = c.low;
    }
    const currentClose = candles[i].close;
    const range = highestHigh - lowestLow;
    const k = range === 0 ? 50 : ((currentClose - lowestLow) / range) * 100;
    rawK.push({ time: candles[i].time, k });
  }

  for (let i = dPeriod - 1; i < rawK.length; i++) {
    let sumK = 0;
    for (let j = 0; j < dPeriod; j++) {
      sumK += rawK[i - j].k;
    }
    const d = sumK / dPeriod;
    points.push({
      time: rawK[i].time,
      k: Number(rawK[i].k.toFixed(2)),
      d: Number(d.toFixed(2)),
    });
  }

  return points;
}

// Commodity Channel Index (CCI)
export function calculateCCI(candles: ReplayCandle[], period = 20): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  if (candles.length < period) return points;

  const typicalPrices = candles.map(c => (c.high + c.low + c.close) / 3);

  for (let i = period - 1; i < candles.length; i++) {
    let tpSum = 0;
    for (let j = 0; j < period; j++) {
      tpSum += typicalPrices[i - j];
    }
    const tpSma = tpSum / period;

    let meanDevSum = 0;
    for (let j = 0; j < period; j++) {
      meanDevSum += Math.abs(typicalPrices[i - j] - tpSma);
    }
    const meanDev = meanDevSum / period;
    const cci = meanDev === 0 ? 0 : (typicalPrices[i] - tpSma) / (0.015 * meanDev);

    points.push({
      time: candles[i].time,
      value: Number(cci.toFixed(2)),
    });
  }

  return points;
}

// Momentum Oscillator
export function calculateMomentum(candles: ReplayCandle[], period = 10): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  if (candles.length < period + 1) return points;

  for (let i = period; i < candles.length; i++) {
    const mom = candles[i].close - candles[i - period].close;
    points.push({
      time: candles[i].time,
      value: Number(mom.toFixed(5)),
    });
  }

  return points;
}

// ----------------------------------------------------
// VOLATILITY INDICATORS
// ----------------------------------------------------

// Bollinger Bands
export function calculateBollingerBands(
  candles: ReplayCandle[],
  period = 20,
  stdDevMultiplier = 2
): BollingerPoint[] {
  const points: BollingerPoint[] = [];
  if (candles.length < period) return points;

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    const sma = sum / period;

    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(candles[i - j].close - sma, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    points.push({
      time: candles[i].time,
      middle: Number(sma.toFixed(5)),
      upper: Number((sma + stdDev * stdDevMultiplier).toFixed(5)),
      lower: Number((sma - stdDev * stdDevMultiplier).toFixed(5)),
    });
  }

  return points;
}

// Average True Range (ATR)
export function calculateATR(candles: ReplayCandle[], period = 14): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  if (candles.length < period + 1) return points;

  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - prevC.close),
      Math.abs(c.low - prevC.close)
    );
    trs.push(tr);
  }

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trs[i];
  }
  let prevAtr = sum / period;

  points.push({
    time: candles[period].time,
    value: Number(prevAtr.toFixed(5)),
  });

  for (let i = period; i < trs.length; i++) {
    const atr = (prevAtr * (period - 1) + trs[i]) / period;
    points.push({
      time: candles[i + 1].time,
      value: Number(atr.toFixed(5)),
    });
    prevAtr = atr;
  }

  return points;
}

// Keltner Channels
export function calculateKeltnerChannels(
  candles: ReplayCandle[],
  emaPeriod = 20,
  atrPeriod = 10,
  multiplier = 2
): KeltnerPoint[] {
  const points: KeltnerPoint[] = [];
  if (candles.length < Math.max(emaPeriod, atrPeriod) + 1) return points;

  const ema = calculateEMA(candles, emaPeriod);
  const atr = calculateATR(candles, atrPeriod);

  const emaMap = new Map<number, number>();
  ema.forEach(p => emaMap.set(p.time, p.value));

  const atrMap = new Map<number, number>();
  atr.forEach(p => atrMap.set(p.time, p.value));

  candles.forEach(c => {
    if (emaMap.has(c.time) && atrMap.has(c.time)) {
      const mid = emaMap.get(c.time)!;
      const range = atrMap.get(c.time)! * multiplier;
      points.push({
        time: c.time,
        middle: Number(mid.toFixed(5)),
        upper: Number((mid + range).toFixed(5)),
        lower: Number((mid - range).toFixed(5)),
      });
    }
  });

  return points;
}

// ----------------------------------------------------
// VOLUME INDICATORS
// ----------------------------------------------------

// Volume Moving Average
export function calculateVolumeMA(candles: ReplayCandle[], period = 20): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  if (candles.length < period) return points;

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].volume || 0;
    }
    points.push({
      time: candles[i].time,
      value: Math.round(sum / period),
    });
  }

  return points;
}

// On-Balance Volume (OBV)
export function calculateOBV(candles: ReplayCandle[]): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  if (candles.length === 0) return points;

  let currentOBV = 0;
  points.push({ time: candles[0].time, value: currentOBV });

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];

    if (c.close > prev.close) {
      currentOBV += c.volume || 1;
    } else if (c.close < prev.close) {
      currentOBV -= c.volume || 1;
    }

    points.push({
      time: c.time,
      value: currentOBV,
    });
  }

  return points;
}

// Volume Profile (Calculates volume distribution across visible price range)
export function calculateVolumeProfile(
  candles: ReplayCandle[],
  bucketCount = 24
): VolumeProfileBucket[] {
  if (candles.length === 0) return [];

  let minPrice = Infinity;
  let maxPrice = -Infinity;

  candles.forEach(c => {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  });

  if (minPrice === maxPrice) {
    minPrice *= 0.99;
    maxPrice *= 1.01;
  }

  const bucketSize = (maxPrice - minPrice) / bucketCount;
  const buckets: VolumeProfileBucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const priceLow = minPrice + i * bucketSize;
    const priceHigh = priceLow + bucketSize;
    buckets.push({
      priceLow,
      priceHigh,
      priceMid: (priceLow + priceHigh) / 2,
      volume: 0,
      buyVolume: 0,
      sellVolume: 0,
    });
  }

  candles.forEach(c => {
    const isBull = c.close >= c.open;
    const vol = c.volume || 100;
    const candleMid = (c.high + c.low) / 2;

    const bIdx = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor((candleMid - minPrice) / bucketSize))
    );

    buckets[bIdx].volume += vol;
    if (isBull) {
      buckets[bIdx].buyVolume += vol * 0.65;
      buckets[bIdx].sellVolume += vol * 0.35;
    } else {
      buckets[bIdx].sellVolume += vol * 0.65;
      buckets[bIdx].buyVolume += vol * 0.35;
    }
  });

  // Identify Point of Control (POC)
  let maxVol = 0;
  let pocIdx = 0;
  buckets.forEach((b, idx) => {
    if (b.volume > maxVol) {
      maxVol = b.volume;
      pocIdx = idx;
    }
  });

  if (buckets[pocIdx]) {
    buckets[pocIdx].isPoc = true;
  }

  return buckets;
}
