import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google GenAI with required telemetry headers
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface TechnicalIndicators {
  rsi: number;
  ema9: number;
  ema21: number;
  ema50: number;
  macd: { macd: number; signal: number; histogram: number };
  atr: number;
  bbands: { upper: number; middle: number; lower: number };
  momentum: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
}

interface StructuredCouncilVote {
  model_id: string;
  voter_id: string;
  voter_name: string;
  provider: string;
  direction: 'RISE' | 'FALL' | 'NO_TRADE';
  confidence: number;
  time_horizon: string;
  supporting_factors: string[];
  contradicting_factors: string[];
  risk_flags: string[];
  reasoning_summary: string;
  latencyMs: number;
  status: 'success' | 'unconfigured' | 'timeout' | 'error';
}

interface MarketSnapshot {
  symbol: string;
  assetName: string;
  category: string;
  currentPrice: number;
  indicators: TechnicalIndicators;
  recentTicks: number[];
  customKeys?: {
    mistral?: string;
    openai?: string;
    freellm?: string;
  };
  freeLlmApiUrl?: string;
  freeLlmModelId?: string;
  mistralModelId?: string;
  openaiModelId?: string;
}

// 1. Google Gemini Council Voter (Real API Only)
async function evaluateGeminiVoter(snapshot: MarketSnapshot): Promise<StructuredCouncilVote> {
  const start = Date.now();
  const voterId = 'gemini_analyst';
  const modelId = 'gemini-3.8-flash';

  if (!process.env.GEMINI_API_KEY) {
    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: 'Gemini 3.8 Flash',
      provider: 'Gemini',
      direction: 'NO_TRADE',
      confidence: 0,
      time_horizon: '5_ticks',
      supporting_factors: [],
      contradicting_factors: [],
      risk_flags: ['GEMINI_API_KEY not configured in environment'],
      reasoning_summary: 'Gemini API key is unconfigured on server. Voter offline.',
      latencyMs: 0,
      status: 'unconfigured',
    };
  }

  try {
    const prompt = `You are Council Voter #1 (Macro Trend & Momentum Analyst) in the Deriv Multi-AI Trading Council.
Analyze this REAL Forex / Deriv market snapshot:
- Asset: ${snapshot.assetName} (${snapshot.symbol})
- Spot Price: ${snapshot.currentPrice}
- Technical Indicators:
  * RSI (14): ${snapshot.indicators.rsi}
  * EMA 9: ${snapshot.indicators.ema9} | EMA 21: ${snapshot.indicators.ema21} | EMA 50: ${snapshot.indicators.ema50}
  * MACD Histogram: ${snapshot.indicators.macd.histogram} (MACD: ${snapshot.indicators.macd.macd}, Signal: ${snapshot.indicators.macd.signal})
  * ATR (14): ${snapshot.indicators.atr}
  * Bollinger Bands: Lower ${snapshot.indicators.bbands.lower}, Middle ${snapshot.indicators.bbands.middle}, Upper ${snapshot.indicators.bbands.upper}
  * Tick Momentum: ${snapshot.indicators.momentum}
  * Trend: ${snapshot.indicators.trend}
Recent Ticks: ${JSON.stringify(snapshot.recentTicks.slice(-8))}

You must make an independent decision for a 5-tick Rise/Fall contract.
Output strict JSON with exact schema:
{
  "direction": "RISE" | "FALL" | "NO_TRADE",
  "confidence": integer between 0 and 100,
  "supporting_factors": array of strings (max 3),
  "contradicting_factors": array of strings (max 2),
  "risk_flags": array of strings (max 2),
  "reasoning_summary": string under 25 words
}`;

    const geminiPromise = ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini inference timeout (>4500ms)')), 4500)
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');

    const direction = ['RISE', 'FALL', 'NO_TRADE'].includes(parsed.direction)
      ? parsed.direction
      : 'NO_TRADE';
    const confidence =
      typeof parsed.confidence === 'number'
        ? Math.min(100, Math.max(0, Math.round(parsed.confidence)))
        : 50;

    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: 'Gemini 3.8 Flash',
      provider: 'Gemini',
      direction,
      confidence,
      time_horizon: '5_ticks',
      supporting_factors: Array.isArray(parsed.supporting_factors) ? parsed.supporting_factors : [],
      contradicting_factors: Array.isArray(parsed.contradicting_factors) ? parsed.contradicting_factors : [],
      risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
      reasoning_summary: parsed.reasoning_summary || 'Gemini quantitative pattern evaluation complete.',
      latencyMs: Date.now() - start,
      status: 'success',
    };
  } catch (err: any) {
    console.error('Gemini voter real error:', err.message);
    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: 'Gemini 3.8 Flash',
      provider: 'Gemini',
      direction: 'NO_TRADE',
      confidence: 0,
      time_horizon: '5_ticks',
      supporting_factors: [],
      contradicting_factors: [],
      risk_flags: [err.message || 'API request failed'],
      reasoning_summary: `Gemini API error: ${err.message || 'Call failed'}. Voter abstaining.`,
      latencyMs: Date.now() - start,
      status: 'error',
    };
  }
}

// 2. Mistral Council Voter (Real API Only)
async function evaluateMistralVoter(snapshot: MarketSnapshot): Promise<StructuredCouncilVote> {
  const start = Date.now();
  const voterId = 'mistral_analyst';
  const modelId = snapshot.mistralModelId || 'mistral-small-latest';
  const key = snapshot.customKeys?.mistral || process.env.MISTRAL_API_KEY;

  if (!key) {
    // Check for failover to OpenAI if Mistral is unconfigured
    if (snapshot.customKeys?.openai || process.env.OPENAI_API_KEY) {
      return evaluateOpenAIVoter(snapshot, true);
    }
    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: 'Mistral Analyst',
      provider: 'Mistral',
      direction: 'NO_TRADE',
      confidence: 0,
      time_horizon: '5_ticks',
      supporting_factors: [],
      contradicting_factors: [],
      risk_flags: ['Mistral API key not configured'],
      reasoning_summary: 'Mistral API key not set in AI Configuration modal. Voter offline.',
      latencyMs: 0,
      status: 'unconfigured',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: modelId,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Forex analyst. Respond JSON: {"direction":"RISE"|"FALL"|"NO_TRADE","confidence":0-100,"supporting_factors":[],"contradicting_factors":[],"risk_flags":[],"reasoning_summary":""}',
          },
          {
            role: 'user',
            content: `Analyze: ${snapshot.symbol}, Spot: ${snapshot.currentPrice}, RSI: ${snapshot.indicators.rsi}, MACD Hist: ${snapshot.indicators.macd.histogram}, EMA 9/21/50: [${snapshot.indicators.ema9},${snapshot.indicators.ema21},${snapshot.indicators.ema50}], Trend: ${snapshot.indicators.trend}`,
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Mistral HTTP ${res.status}: ${errText.slice(0, 100)}`);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: 'Mistral Analyst',
      provider: 'Mistral',
      direction: ['RISE', 'FALL', 'NO_TRADE'].includes(parsed.direction) ? parsed.direction : 'NO_TRADE',
      confidence: parsed.confidence || 50,
      time_horizon: '5_ticks',
      supporting_factors: parsed.supporting_factors || [],
      contradicting_factors: parsed.contradicting_factors || [],
      risk_flags: parsed.risk_flags || [],
      reasoning_summary: parsed.reasoning_summary || 'Mistral price action analysis complete.',
      latencyMs: Date.now() - start,
      status: 'success',
    };
  } catch (err: any) {
    console.error('Mistral voter real error:', err.message);
    if (snapshot.customKeys?.openai || process.env.OPENAI_API_KEY) {
      console.log('Failing over to OpenAI due to Mistral error');
      return evaluateOpenAIVoter(snapshot, true);
    }
    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: 'Mistral Analyst',
      provider: 'Mistral',
      direction: 'NO_TRADE',
      confidence: 0,
      time_horizon: '5_ticks',
      supporting_factors: [],
      contradicting_factors: [],
      risk_flags: [err.message || 'API request failed'],
      reasoning_summary: `Mistral API error: ${err.message || 'Call failed'}. Voter abstaining.`,
      latencyMs: Date.now() - start,
      status: 'error',
    };
  }
}

// 2b. OpenAI Voter with Failover Integration
async function evaluateOpenAIVoter(snapshot: MarketSnapshot, isFailover = false): Promise<StructuredCouncilVote> {
  const start = Date.now();
  const voterId = isFailover ? 'mistral_analyst' : 'openai_analyst';
  const modelId = snapshot.openaiModelId || 'gpt-4o-mini';
  const key = snapshot.customKeys?.openai || process.env.OPENAI_API_KEY;

  if (!key) {
    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: isFailover ? 'Mistral (OpenAI Failover)' : 'OpenAI Analyst',
      provider: 'OpenAI',
      direction: 'NO_TRADE',
      confidence: 0,
      time_horizon: '5_ticks',
      supporting_factors: [],
      contradicting_factors: [],
      risk_flags: ['OpenAI API key not configured'],
      reasoning_summary: 'OpenAI API key not configured. Voter offline.',
      latencyMs: 0,
      status: 'unconfigured',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: modelId,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an expert Deriv financial analyst. Respond with JSON strictly: {"direction":"RISE"|"FALL"|"NO_TRADE","confidence":0-100,"supporting_factors":[],"contradicting_factors":[],"risk_flags":[],"reasoning_summary":""}',
          },
          {
            role: 'user',
            content: `Analyze: ${snapshot.symbol}, Spot: ${snapshot.currentPrice}, RSI: ${snapshot.indicators.rsi}, MACD Hist: ${snapshot.indicators.macd.histogram}, EMA 9/21/50: [${snapshot.indicators.ema9},${snapshot.indicators.ema21},${snapshot.indicators.ema50}], Trend: ${snapshot.indicators.trend}`,
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 100)}`);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: isFailover ? 'Mistral (OpenAI Failover)' : 'OpenAI Analyst',
      provider: 'OpenAI',
      direction: ['RISE', 'FALL', 'NO_TRADE'].includes(parsed.direction) ? parsed.direction : 'NO_TRADE',
      confidence: parsed.confidence || 50,
      time_horizon: '5_ticks',
      supporting_factors: parsed.supporting_factors || [],
      contradicting_factors: parsed.contradicting_factors || [],
      risk_flags: parsed.risk_flags || [],
      reasoning_summary: (isFailover ? '[Failover to OpenAI] ' : '') + (parsed.reasoning_summary || 'OpenAI analysis complete.'),
      latencyMs: Date.now() - start,
      status: 'success',
    };
  } catch (err: any) {
    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: isFailover ? 'Mistral (OpenAI Failover)' : 'OpenAI Analyst',
      provider: 'OpenAI',
      direction: 'NO_TRADE',
      confidence: 0,
      time_horizon: '5_ticks',
      supporting_factors: [],
      contradicting_factors: [],
      risk_flags: [err.message || 'API request failed'],
      reasoning_summary: `OpenAI error: ${err.message || 'Call failed'}. Voter abstaining.`,
      latencyMs: Date.now() - start,
      status: 'error',
    };
  }
}

// 3. FreeLLM API Council Voter (Real API Only)
async function evaluateFreeLlmVoter(snapshot: MarketSnapshot): Promise<StructuredCouncilVote> {
  const start = Date.now();
  const voterId = 'freellm_analyst';
  const baseUrl = snapshot.freeLlmApiUrl || process.env.FREELLM_API_URL;
  const key = snapshot.customKeys?.freellm || process.env.FREELLM_API_KEY;
  const modelId = snapshot.freeLlmModelId || 'llama-3.3-70b-instruct';

  if (!baseUrl && !key) {
    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: 'FreeLLM / Open Model',
      provider: 'FreeLLMAPI',
      direction: 'NO_TRADE',
      confidence: 0,
      time_horizon: '5_ticks',
      supporting_factors: [],
      contradicting_factors: [],
      risk_flags: ['FreeLLM API endpoint not configured'],
      reasoning_summary: 'FreeLLM API endpoint not configured in AI Configuration modal. Voter offline.',
      latencyMs: 0,
      status: 'unconfigured',
    };
  }

  const endpoint = baseUrl || 'http://localhost:8000/v1';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key) {
      headers['Authorization'] = `Bearer ${key}`;
    }

    const res = await fetch(`${endpoint.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'system',
            content:
              'Council voter. Respond JSON: {"direction":"RISE"|"FALL"|"NO_TRADE","confidence":0-100,"supporting_factors":[],"contradicting_factors":[],"risk_flags":[],"reasoning_summary":""}',
          },
          {
            role: 'user',
            content: `Snapshot: ${snapshot.symbol}, Spot: ${snapshot.currentPrice}, RSI: ${snapshot.indicators.rsi}, Momentum: ${snapshot.indicators.momentum}, BB: [${snapshot.indicators.bbands.lower}, ${snapshot.indicators.bbands.upper}], MACD: ${snapshot.indicators.macd.histogram}`,
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`FreeLLM HTTP ${res.status}: ${errText.slice(0, 100)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      // Extract json from markdown block if returned
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: 'FreeLLM / Open Model',
      provider: 'FreeLLMAPI',
      direction: ['RISE', 'FALL', 'NO_TRADE'].includes(parsed.direction) ? parsed.direction : 'NO_TRADE',
      confidence: parsed.confidence || 50,
      time_horizon: '5_ticks',
      supporting_factors: parsed.supporting_factors || [],
      contradicting_factors: parsed.contradicting_factors || [],
      risk_flags: parsed.risk_flags || [],
      reasoning_summary: parsed.reasoning_summary || 'FreeLLM statistical inference complete.',
      latencyMs: Date.now() - start,
      status: 'success',
    };
  } catch (err: any) {
    console.error('FreeLLM voter real error:', err.message);
    return {
      model_id: modelId,
      voter_id: voterId,
      voter_name: 'FreeLLM / Open Model',
      provider: 'FreeLLMAPI',
      direction: 'NO_TRADE',
      confidence: 0,
      time_horizon: '5_ticks',
      supporting_factors: [],
      contradicting_factors: [],
      risk_flags: [err.message || 'FreeLLM connection failed'],
      reasoning_summary: `FreeLLM connection error: ${err.message || 'Endpoint unreachable'}. Voter abstaining.`,
      latencyMs: Date.now() - start,
      status: 'error',
    };
  }
}

// 4. Deterministic Technical Engine Control Vote (Calculated directly from live Deriv ticks)
function evaluateTechnicalEngineVoter(snapshot: MarketSnapshot): StructuredCouncilVote {
  const { rsi, ema9, ema21, ema50, macd, bbands, momentum, trend } = snapshot.indicators;
  const isEmaBullish = ema9 > ema21 && ema21 > ema50 * 0.9995;
  const isEmaBearish = ema9 < ema21 && ema21 < ema50 * 1.0005;
  const isMacdBullish = macd.histogram > 0;
  const isMacdBearish = macd.histogram < 0;

  const supporting: string[] = [];
  const contradicting: string[] = [];
  const riskFlags: string[] = [];
  let direction: 'RISE' | 'FALL' | 'NO_TRADE' = 'NO_TRADE';
  let confidence = 50;
  let summary = 'Consolidation inside Bollinger envelope';

  if (isEmaBullish && isMacdBullish && rsi >= 42 && rsi <= 68 && momentum > 0) {
    direction = 'RISE';
    confidence = 84;
    supporting.push('EMA 9/21/50 bullish alignment');
    supporting.push('MACD positive histogram expansion');
    supporting.push(`RSI ${rsi} healthy momentum`);
    summary = 'Technical confirmation: Bullish trend with upward tick momentum.';
  } else if (isEmaBearish && isMacdBearish && rsi <= 58 && rsi >= 32 && momentum < 0) {
    direction = 'FALL';
    confidence = 85;
    supporting.push('EMA 9/21/50 bearish alignment');
    supporting.push('MACD negative histogram expansion');
    supporting.push(`RSI ${rsi} downward trend`);
    summary = 'Technical confirmation: Bearish continuation with downward velocity.';
  } else if (rsi < 30 && momentum > 0) {
    direction = 'RISE';
    confidence = 76;
    supporting.push(`Oversold RSI (${rsi}) bouncing`);
    contradicting.push('Prior downward inertia');
    summary = 'Oversold mean-reversion candidate.';
  } else if (rsi > 70 && momentum < 0) {
    direction = 'FALL';
    confidence = 77;
    supporting.push(`Overbought RSI (${rsi}) rejection`);
    contradicting.push('Prior upward inertia');
    summary = 'Overbought mean-reversion candidate.';
  } else {
    direction = 'NO_TRADE';
    confidence = 45;
    contradicting.push(`Indecisive RSI ${rsi}`);
    contradicting.push('MACD near zero line');
    riskFlags.push('Whipsaw risk in tight range');
    summary = 'No decisive edge detected. Technical engine rejects entry.';
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
    latencyMs: 2,
    status: 'success',
  };
}

// POST /api/council/vote (100% Real API Executions)
app.post('/api/council/vote', async (req: Request, res: Response) => {
  try {
    const snapshot: MarketSnapshot = req.body;

    if (!snapshot || !snapshot.symbol || !snapshot.indicators) {
      return res.status(400).json({ error: 'Missing required market snapshot parameters' });
    }

    // Run independent voters concurrently with real APIs
    const [geminiVote, mistralVote, freeLlmVote] = await Promise.all([
      evaluateGeminiVoter(snapshot),
      evaluateMistralVoter(snapshot),
      evaluateFreeLlmVoter(snapshot),
    ]);

    const techVote = evaluateTechnicalEngineVoter(snapshot);

    const allVotes: StructuredCouncilVote[] = [geminiVote, mistralVote, freeLlmVote, techVote];

    // Filter active voters that are online and connected
    const activeOnlineVoters = allVotes.filter((v) => v.status === 'success');

    // Count votes
    const riseVotes = allVotes.filter((v) => v.direction === 'RISE').length;
    const fallVotes = allVotes.filter((v) => v.direction === 'FALL').length;
    const noTradeVotes = allVotes.filter((v) => v.direction === 'NO_TRADE').length;

    let consensusDirection: 'RISE' | 'FALL' | 'NO_TRADE' = 'NO_TRADE';
    let is3Of4QuorumMet = false;
    let technicalEngineApproved = true;
    let reason = 'Votes split or confidence weak. Council preserves capital in NO_TRADE.';

    const directionalVotes = allVotes.filter((v) => v.direction !== 'NO_TRADE');
    const averageConfidence =
      directionalVotes.length > 0
        ? Math.round(directionalVotes.reduce((acc, v) => acc + v.confidence, 0) / directionalVotes.length)
        : 0;

    // Quorum check: requires at least 3 active online voters to form a quorum
    if (activeOnlineVoters.length < 3) {
      consensusDirection = 'NO_TRADE';
      is3Of4QuorumMet = false;
      reason = `INSUFFICIENT VOTER QUORUM: Only ${activeOnlineVoters.length} of 4 voters are online. Configure FreeLLM or Mistral keys in AI Configuration to activate the 3-of-4 Council.`;
    } else if (riseVotes >= 3) {
      is3Of4QuorumMet = true;
      if (techVote.direction === 'FALL') {
        technicalEngineApproved = false;
        consensusDirection = 'NO_TRADE';
        reason = 'VETO: 3 models voted RISE, but Technical Control Engine rejected with FALL. Safety gate held.';
      } else if (averageConfidence < 70) {
        consensusDirection = 'NO_TRADE';
        reason = `QUORUM BLOCKED: 3 models voted RISE, but average confidence (${averageConfidence}%) is below 70% threshold.`;
      } else {
        consensusDirection = 'RISE';
        reason = `COUNCIL APPROVAL: ${riseVotes} of 4 voters agreed on RISE with ${averageConfidence}% average confidence.`;
      }
    } else if (fallVotes >= 3) {
      is3Of4QuorumMet = true;
      if (techVote.direction === 'RISE') {
        technicalEngineApproved = false;
        consensusDirection = 'NO_TRADE';
        reason = 'VETO: 3 models voted FALL, but Technical Control Engine rejected with RISE. Safety gate held.';
      } else if (averageConfidence < 70) {
        consensusDirection = 'NO_TRADE';
        reason = `QUORUM BLOCKED: 3 models voted FALL, but average confidence (${averageConfidence}%) is below 70% threshold.`;
      } else {
        consensusDirection = 'FALL';
        reason = `COUNCIL APPROVAL: ${fallVotes} of 4 voters agreed on FALL with ${averageConfidence}% average confidence.`;
      }
    } else {
      is3Of4QuorumMet = false;
      reason = `NO QUORUM: Votes split (Rise: ${riseVotes}, Fall: ${fallVotes}, No Trade: ${noTradeVotes}). 3-of-4 consensus not reached.`;
    }

    const weightedScore = allVotes.reduce((sum, v) => {
      if (v.direction === 'RISE') return sum + v.confidence * 0.25;
      if (v.direction === 'FALL') return sum - v.confidence * 0.25;
      return sum;
    }, 0);

    return res.json({
      symbol: snapshot.symbol,
      currentPrice: snapshot.currentPrice,
      consensusDirection,
      riseVotes,
      fallVotes,
      noTradeVotes,
      totalEligibleVoters: allVotes.length,
      onlineVotersCount: activeOnlineVoters.length,
      is3Of4QuorumMet,
      technicalEngineApproved,
      averageConfidence,
      weightedScore: Number(weightedScore.toFixed(2)),
      reason,
      votes: allVotes,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('Council vote endpoint error:', err);
    return res.status(500).json({ error: err.message || 'Internal council vote failure' });
  }
});

// POST /api/council/test-connection: Tests real endpoint connectivity
app.post('/api/council/test-connection', async (req: Request, res: Response) => {
  const { provider, baseUrl, apiKey, model } = req.body;
  const start = Date.now();

  try {
    if (provider === 'gemini') {
      if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
      const test = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'ping',
      });
      return res.json({ ok: true, latencyMs: Date.now() - start, response: 'Gemini connected successfully' });
    }

    if (provider === 'freellm') {
      const url = baseUrl || 'http://localhost:8000/v1';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const headers: Record<string, string> = {};
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const resp = await fetch(`${url.replace(/\/+$/, '')}/models`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = await resp.json();
      return res.json({
        ok: true,
        latencyMs: Date.now() - start,
        models: Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [],
      });
    }

    if (provider === 'mistral') {
      if (!apiKey) throw new Error('Mistral API key is required');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch('https://api.mistral.ai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return res.json({ ok: true, latencyMs: Date.now() - start, response: 'Mistral API key verified' });
    }

    if (provider === 'openai') {
      if (!apiKey) throw new Error('OpenAI API key is required');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return res.json({ ok: true, latencyMs: Date.now() - start, response: 'OpenAI API key verified' });
    }

    return res.status(400).json({ error: 'Unknown provider' });
  } catch (err: any) {
    return res.status(400).json({ ok: false, latencyMs: Date.now() - start, error: err.message || 'Connection test failed' });
  }
});

// Discover models endpoint
app.get('/api/council/models', async (req: Request, res: Response) => {
  const freeLlmApiUrl = (req.query.url as string) || process.env.FREELLM_API_URL || '';
  const freeLlmKey = (req.query.key as string) || process.env.FREELLM_API_KEY || '';
  let discoveredFreeLlmModels: string[] = [];

  if (freeLlmApiUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const headers: Record<string, string> = {};
      if (freeLlmKey) headers['Authorization'] = `Bearer ${freeLlmKey}`;

      const resp = await fetch(`${freeLlmApiUrl.replace(/\/+$/, '')}/models`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json();
        discoveredFreeLlmModels = Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [];
      }
    } catch (e: any) {
      console.warn('FreeLLM discovery skipped/timed out:', e.message);
    }
  }

  res.json({
    status: 'online',
    registry: [
      { id: 'gemini', provider: 'Gemini', defaultModel: 'gemini-3.8-flash', status: process.env.GEMINI_API_KEY ? 'active' : 'unconfigured' },
      { id: 'mistral', provider: 'Mistral', defaultModel: 'mistral-small-latest', status: 'ready' },
      { id: 'freellm', provider: 'FreeLLMAPI', defaultModel: 'llama-3.3-70b-instruct', status: 'ready', discoveredModels: discoveredFreeLlmModels },
      { id: 'tech_engine', provider: 'TechnicalControl', defaultModel: 'tech_rule_engine_v1', status: 'active_control' },
    ],
  });
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Deriv Multi-AI Trading Council running on http://localhost:${PORT}`);
  });
}

startServer();
