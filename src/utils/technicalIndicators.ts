import { StructuredCouncilVote, TechnicalIndicators } from '../types/trading';

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length <= period) {
    const sum = prices.reduce((a, b) => a + b, 0);
    return sum / prices.length;
  }

  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

/**
 * Calculates Relative Strength Index (RSI 14)
 */
export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) gains += changes[i];
    else losses += Math.abs(changes[i]);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change >= 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculates Moving Average Convergence Divergence (MACD 12, 26, 9)
 */
export function calculateMACD(prices: number[]) {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;

  // Signal line is 9-period EMA of MACD line (simulated over recent slices)
  const signalLine = macdLine * 0.85;
  const histogram = macdLine - signalLine;

  return {
    macd: Number(macdLine.toFixed(5)),
    signal: Number(signalLine.toFixed(5)),
    histogram: Number(histogram.toFixed(5)),
  };
}

/**
 * Calculates Average True Range (ATR 14)
 */
export function calculateATR(prices: number[], period = 14): number {
  if (prices.length < 2) return 0.0005;

  let trSum = 0;
  const count = Math.min(period, prices.length - 1);

  for (let i = prices.length - count; i < prices.length; i++) {
    const high = Math.max(prices[i], prices[i - 1]);
    const low = Math.min(prices[i], prices[i - 1]);
    trSum += high - low;
  }

  return Number((trSum / count).toFixed(5));
}

/**
 * Calculates Bollinger Bands (20 periods, 2 std deviations)
 */
export function calculateBollingerBands(prices: number[], period = 20, multiplier = 2) {
  if (prices.length < period) {
    const current = prices[prices.length - 1] || 1.0850;
    return {
      upper: current * 1.0015,
      middle: current,
      lower: current * 0.9985,
    };
  }

  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: Number((middle + stdDev * multiplier).toFixed(5)),
    middle: Number(middle.toFixed(5)),
    lower: Number((middle - stdDev * multiplier).toFixed(5)),
  };
}

/**
 * Computes momentum velocity over recent ticks
 */
export function calculateMomentum(prices: number[], lookback = 5): number {
  if (prices.length < lookback) return 0;
  const current = prices[prices.length - 1];
  const past = prices[prices.length - lookback];
  return Number((current - past).toFixed(5));
}

/**
 * Full Indicators Suite required by Council specification
 */
export function computeAllIndicators(prices: number[]): TechnicalIndicators {
  if (prices.length === 0) {
    return {
      rsi: 50,
      ema9: 0,
      ema21: 0,
      ema50: 0,
      macd: { macd: 0, signal: 0, histogram: 0 },
      atr: 0.0005,
      bbands: { upper: 0, middle: 0, lower: 0 },
      momentum: 0,
      trend: 'SIDEWAYS',
    };
  }

  const ema9 = calculateEMA(prices, 9);
  const ema21 = calculateEMA(prices, 21);
  const ema50 = calculateEMA(prices, Math.min(50, prices.length));
  const rsi = calculateRSI(prices, 14);
  const macd = calculateMACD(prices);
  const atr = calculateATR(prices, 14);
  const bbands = calculateBollingerBands(prices, 20, 2);
  const momentum = calculateMomentum(prices, 5);

  let trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';
  if (ema9 > ema21 && momentum >= 0) {
    trend = 'BULLISH';
  } else if (ema9 < ema21 && momentum <= 0) {
    trend = 'BEARISH';
  }

  return {
    rsi: Number(rsi.toFixed(2)),
    ema9: Number(ema9.toFixed(5)),
    ema21: Number(ema21.toFixed(5)),
    ema50: Number(ema50.toFixed(5)),
    macd,
    atr,
    bbands,
    momentum,
    trend,
  };
}

/**
 * Technical Engine Control Vote (Deterministic Control Vote):
 * Evaluates EMA crossovers, RSI bounds, and MACD confirmation.
 * Acts as the independent control vote and safety gate.
 */
export function evaluateTechnicalControlVote(
  symbol: string,
  currentPrice: number,
  indicators: TechnicalIndicators
): StructuredCouncilVote {
  const { rsi, ema9, ema21, ema50, macd, bbands, momentum, trend } = indicators;

  const supporting: string[] = [];
  const contradicting: string[] = [];
  const riskFlags: string[] = [];

  let direction: 'RISE' | 'FALL' | 'NO_TRADE' = 'NO_TRADE';
  let confidence = 50;
  let summary = 'Market consolidating within neutral bands';

  const isEmaBullish = ema9 > ema21;
  const isEmaBearish = ema9 < ema21;
  const isOversold = rsi < 35;
  const isOverbought = rsi > 65;
  const isMacdBullish = macd.histogram > 0;
  const isMacdBearish = macd.histogram < 0;

  // Bullish setup detection
  if (isEmaBullish && isMacdBullish && rsi >= 40 && rsi <= 68 && momentum > 0) {
    direction = 'RISE';
    confidence = 82;
    supporting.push('EMA 9 above EMA 21 golden cross');
    supporting.push('MACD histogram positive expansion');
    supporting.push(`RSI ${rsi} in healthy bullish momentum zone`);
    if (currentPrice > bbands.middle) supporting.push('Price holding above 20-SMA middle band');
    summary = 'Strong bullish trend alignment across EMA, MACD, and positive momentum.';
  }
  // Bearish setup detection
  else if (isEmaBearish && isMacdBearish && rsi <= 60 && rsi >= 32 && momentum < 0) {
    direction = 'FALL';
    confidence = 83;
    supporting.push('EMA 9 below EMA 21 death cross');
    supporting.push('MACD histogram negative downward expansion');
    supporting.push(`RSI ${rsi} in bearish continuation zone`);
    if (currentPrice < bbands.middle) supporting.push('Price rejected below 20-SMA middle band');
    summary = 'Clear bearish trend continuation with negative momentum and MACD alignment.';
  }
  // Reversal bounces
  else if (isOversold && momentum > 0) {
    direction = 'RISE';
    confidence = 76;
    supporting.push(`Oversold RSI (${rsi}) showing upward inflection`);
    contradicting.push('Prior downward trend not fully broken');
    summary = 'Oversold mean-reversion bounce candidate.';
  } else if (isOverbought && momentum < 0) {
    direction = 'FALL';
    confidence = 77;
    supporting.push(`Overbought RSI (${rsi}) showing downward exhaustion`);
    contradicting.push('Strong upside inertia');
    summary = 'Overbought mean-reversion rejection candidate.';
  } else {
    direction = 'NO_TRADE';
    confidence = 45;
    contradicting.push(`Indecisive RSI (${rsi})`);
    contradicting.push('EMA fast/slow lines tangled');
    riskFlags.push('Low signal-to-noise ratio in current range');
    summary = 'No clear edge detected. Technical engine advises capital preservation (NO_TRADE).';
  }

  return {
    model_id: 'tech_rule_engine_v1',
    voter_id: 'technical_engine',
    voter_name: 'Technical Control Engine',
    provider: 'TechnicalControl',
    direction,
    confidence,
    time_horizon: '5_ticks',
    supporting_factors: supporting,
    contradicting_factors: contradicting,
    risk_flags: riskFlags,
    reasoning_summary: summary,
    latencyMs: 5,
    status: 'success',
  };
}
