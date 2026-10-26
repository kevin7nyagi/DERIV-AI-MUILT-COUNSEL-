export type AssetCategory = 'forex' | 'synthetics' | 'crypto';

export interface MarketAsset {
  symbol: string;
  name: string;
  category: AssetCategory;
  basePrice: number;
  pipPrecision: number;
  description: string;
  volatilityLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
}

export interface TickData {
  epoch: number;
  quote: number;
  symbol: string;
}

export interface TechnicalIndicators {
  rsi: number;
  ema9: number;
  ema21: number;
  ema50: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  atr: number;
  bbands: {
    upper: number;
    middle: number;
    lower: number;
  };
  momentum: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
}

export interface CouncilVoterConfig {
  id: string;
  name: string;
  provider: 'Gemini' | 'Mistral' | 'FreeLLMAPI' | 'OpenAI' | 'TechnicalControl';
  modelId: string;
  enabled: boolean;
  weight: number; // 0.10 to 0.40, initial 0.25
  stats: {
    totalVotes: number;
    correctVotes: number;
    accuracy: number; // 0 - 100%
    brierScore: number; // Lower is better calibration (0.0 to 1.0)
    netContribution: number; // In currency units
  };
}

export interface StructuredCouncilVote {
  model_id: string;
  voter_id: string;
  voter_name: string;
  provider: string;
  direction: 'RISE' | 'FALL' | 'NO_TRADE';
  confidence: number; // 0 to 100
  time_horizon: string;
  supporting_factors: string[];
  contradicting_factors: string[];
  risk_flags: string[];
  reasoning_summary: string;
  latencyMs: number;
  status: 'success' | 'unconfigured' | 'timeout' | 'error';
}

export interface CouncilConsensusResult {
  symbol: string;
  currentPrice: number;
  consensusDirection: 'RISE' | 'FALL' | 'NO_TRADE';
  riseVotes: number;
  fallVotes: number;
  noTradeVotes: number;
  totalEligibleVoters: number;
  onlineVotersCount: number;
  is3Of4QuorumMet: boolean;
  technicalEngineApproved: boolean;
  averageConfidence: number;
  weightedScore: number;
  reason: string;
  votes: StructuredCouncilVote[];
  timestamp: number;
}

export interface AIModelSettings {
  freeLlmUrl: string;
  freeLlmKey: string;
  freeLlmModel: string;
  mistralKey: string;
  mistralModel: string;
  openaiKey: string;
  openaiModel: string;
}

export interface RiskSettings {
  stake: number; // Strict max 1.00 USD
  maxDailyLoss: number; // Strict max 5.00 USD
  takeProfitTarget: number;
  maxOpenPositions: number; // Strict 1
  cooldownSeconds: number; // Default 10s
  tradeDurationTicks: number; // Default 5 ticks
  isEmergencyStopped: boolean;
  isAutoTrading: boolean;
  accountMode: 'DEMO_ONLY'; // Strictly Demo
}

export interface TradeContract {
  id: string;
  contractId: string | number;
  symbol: string;
  assetName: string;
  action: 'RISE' | 'FALL';
  stake: number;
  payout: number;
  entrySpot: number;
  exitSpot?: number;
  entryTime: number;
  expiryTime: number;
  remainingTicks?: number;
  status: 'pending' | 'active' | 'won' | 'lost';
  profit: number;
  consensusVotes: StructuredCouncilVote[];
  isVirtual: boolean; // Always true (DEMO only)
}

export interface LearningRecord {
  id: string;
  timestamp: number;
  symbol: string;
  snapshotPrice: number;
  indicators: TechnicalIndicators;
  votes: StructuredCouncilVote[];
  consensusDirection: 'RISE' | 'FALL' | 'NO_TRADE';
  contractId?: string | number;
  actualOutcome?: 'RISE' | 'FALL';
  tradeStatus?: 'won' | 'lost' | 'no_trade';
  netProfit?: number;
}

export interface DerivAccount {
  isAuthorized: boolean;
  isVirtual: boolean; // Always true (DEMO only)
  currency: string;
  balance: number;
  loginId: string;
  email: string;
  tokenMasked: string;
}
