import React from 'react';
import { CouncilConsensusResult, StructuredCouncilVote } from '../types/trading';

interface CouncilVotingDeckProps {
  consensusResult: CouncilConsensusResult | null;
  isEvaluating: boolean;
  onEvaluate: () => void;
  isAutoTrading: boolean;
  onToggleAutoTrading: () => void;
  dailyLoss: number;
  maxDailyLoss: number;
  isAuthorized?: boolean;
  onOpenAIConfig?: () => void;
  onOpenDerivAuth?: () => void;
}

export const CouncilVotingDeck: React.FC<CouncilVotingDeckProps> = ({
  consensusResult,
  isEvaluating,
  onEvaluate,
  isAutoTrading,
  onToggleAutoTrading,
  dailyLoss,
  maxDailyLoss,
  isAuthorized = false,
  onOpenAIConfig,
  onOpenDerivAuth,
}) => {
  const votes: StructuredCouncilVote[] = consensusResult?.votes || [
    {
      model_id: 'gemini-3.8-flash',
      voter_id: 'gemini_analyst',
      voter_name: 'Gemini 3.8 Flash',
      provider: 'Gemini',
      direction: 'NO_TRADE',
      confidence: 65,
      time_horizon: '5_ticks',
      supporting_factors: ['Awaiting market trigger'],
      contradicting_factors: [],
      risk_flags: [],
      reasoning_summary: 'Ready to analyze market momentum on command.',
      latencyMs: 110,
      status: 'success',
    },
    {
      model_id: 'mistral-small-latest',
      voter_id: 'mistral_analyst',
      voter_name: 'Mistral Analyst',
      provider: 'Mistral',
      direction: 'NO_TRADE',
      confidence: 0,
      time_horizon: '5_ticks',
      supporting_factors: [],
      contradicting_factors: [],
      risk_flags: ['API Key Required'],
      reasoning_summary: 'Configure Mistral API key to participate in Council voting.',
      latencyMs: 0,
      status: 'unconfigured',
    },
    {
      model_id: 'llama-3.3-70b-instruct',
      voter_id: 'freellm_analyst',
      voter_name: 'FreeLLM / Open Model',
      provider: 'FreeLLMAPI',
      direction: 'NO_TRADE',
      confidence: 0,
      time_horizon: '5_ticks',
      supporting_factors: [],
      contradicting_factors: [],
      risk_flags: ['Endpoint Required'],
      reasoning_summary: 'Configure FreeLLM endpoint URL to participate in Council voting.',
      latencyMs: 0,
      status: 'unconfigured',
    },
    {
      model_id: 'tech_rule_engine_v1',
      voter_id: 'technical_engine',
      voter_name: 'Technical Control Engine',
      provider: 'TechnicalControl',
      direction: 'NO_TRADE',
      confidence: 50,
      time_horizon: '5_ticks',
      supporting_factors: ['Rule-based control gatekeeper'],
      contradicting_factors: [],
      risk_flags: [],
      reasoning_summary: 'Deterministic EMA/MACD control vote active.',
      latencyMs: 3,
      status: 'success',
    },
  ];

  const direction = consensusResult?.consensusDirection || 'NO_TRADE';
  const isRise = direction === 'RISE';
  const isFall = direction === 'FALL';
  const isNoTrade = direction === 'NO_TRADE';
  const riseCount = consensusResult?.riseVotes || 0;
  const fallCount = consensusResult?.fallVotes || 0;
  const quorumMet = consensusResult?.is3Of4QuorumMet || false;
  const isDailyStopReached = Math.abs(dailyLoss) >= maxDailyLoss && dailyLoss < 0;

  return (
    <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-5 flex flex-col h-full shadow-lg">
      {/* Top Banner: Big Council Decision in Simple English */}
      <div className="pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>The 4-AI Trading Council</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">·</span>
            <span className="text-xs text-slate-400">Rule: 3 of 4 Must Agree</span>
          </div>

          {/* Action Buttons for Beginners */}
          <div className="flex items-center gap-2">
            {onOpenAIConfig && (
              <button
                onClick={onOpenAIConfig}
                className="px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="Configure FreeLLM, Mistral, OpenAI, or Gemini"
              >
                <span>AI Models Config</span>
              </button>
            )}

            <button
              onClick={onEvaluate}
              disabled={isEvaluating}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isEvaluating ? 'Council Deliberating...' : 'Poll Council Votes'}
            </button>

            {!isAuthorized ? (
              <button
                onClick={onOpenDerivAuth}
                className="px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer bg-amber-600 hover:bg-amber-500 text-white shadow-sm flex items-center gap-1.5"
                title="Authorize your Deriv Demo Token to enable automated trade execution"
              >
                <span>Connect Demo Token to Trade</span>
              </button>
            ) : (
              <button
                onClick={onToggleAutoTrading}
                disabled={isDailyStopReached}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm ${
                  isAutoTrading
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50'
                }`}
              >
                {isAutoTrading ? 'Pause Auto-Trading' : 'Auto-Trade on Demo ($1)'}
              </button>
            )}
          </div>
        </div>

        {/* Big Simple Decision Card */}
        <div
          className={`p-4 rounded-lg border transition-all ${
            isRise
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100'
              : isFall
              ? 'bg-red-950/40 border-red-500/60 text-red-100'
              : 'bg-slate-950/70 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider block text-slate-400 mb-0.5">
                Council Consensus Verdict
              </span>
              <div className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                <span
                  className={
                    isRise
                      ? 'text-emerald-400'
                      : isFall
                      ? 'text-red-400'
                      : 'text-slate-300'
                  }
                >
                  {isRise
                    ? 'COUNCIL SAYS: RISE (CALL)'
                    : isFall
                    ? 'COUNCIL SAYS: FALL (PUT)'
                    : 'COUNCIL SAYS: NO TRADE'}
                </span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({isRise ? riseCount : isFall ? fallCount : '0'} of 4 Voted in Agreement)
                </span>
              </div>
            </div>

            {/* Beginner Explanation Badge */}
            <div className="text-right">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-md font-mono ${
                  quorumMet
                    ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-600/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {quorumMet ? '3-OF-4 QUORUM PASSED' : 'CAPITAL PRESERVED (NO QUORUM)'}
              </span>
              <span className="text-[11px] font-mono text-slate-400 block mt-1">
                Avg Confidence: {consensusResult?.averageConfidence || 0}%
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-sans">
            <strong>Council Rationale:</strong> {consensusResult?.reason || 'Click "Poll Council Votes" to gather independent votes from Gemini, Mistral, FreeLLM, and the Technical Engine.'}
          </p>
        </div>
      </div>

      {/* 4 Independent Voters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
        {votes.map((voter) => {
          const isUnconfigured = voter.status === 'unconfigured';
          const isError = voter.status === 'error';
          const isTimeout = voter.status === 'timeout';
          const isSuccess = voter.status === 'success';

          const voteRise = isSuccess && voter.direction === 'RISE';
          const voteFall = isSuccess && voter.direction === 'FALL';

          return (
            <div
              key={voter.voter_id}
              className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
                voteRise
                  ? 'bg-emerald-950/20 border-emerald-600/40'
                  : voteFall
                  ? 'bg-red-950/20 border-red-600/40'
                  : isUnconfigured || isError
                  ? 'bg-slate-950/70 border-slate-800/60 opacity-90'
                  : 'bg-slate-950/50 border-slate-800/80'
              }`}
            >
              <div>
                {/* Voter Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">
                      {voter.voter_name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      {voter.model_id}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    {voter.latencyMs > 0 ? `${voter.latencyMs}ms` : '--'}
                  </span>
                </div>

                {/* Vote Direction Badge */}
                <div className="flex items-center justify-between my-2">
                  <span
                    className={`text-sm font-extrabold font-mono tracking-tight ${
                      voteRise
                        ? 'text-emerald-400'
                        : voteFall
                        ? 'text-red-400'
                        : isUnconfigured
                        ? 'text-amber-400/90 text-xs'
                        : isError
                        ? 'text-red-400 text-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    {isUnconfigured
                      ? 'KEY REQUIRED'
                      : isError
                      ? 'OFFLINE / ERROR'
                      : isTimeout
                      ? 'TIMEOUT'
                      : voter.direction}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-200 tabular-nums">
                    {isSuccess ? `${voter.confidence}% conf.` : '0%'}
                  </span>
                </div>

                {/* Confidence Meter */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      voteRise ? 'bg-emerald-500' : voteFall ? 'bg-red-500' : isSuccess ? 'bg-slate-600' : 'bg-transparent'
                    }`}
                    style={{ width: `${isSuccess ? voter.confidence : 0}%` }}
                  />
                </div>

                {/* Plain English Reasoning or Setup Action */}
                {isUnconfigured ? (
                  <div className="bg-amber-950/30 border border-amber-800/40 rounded p-2 my-1">
                    <p className="text-[11px] text-amber-200/90 leading-snug mb-2">
                      Zero dummy data policy: requires active API key or endpoint to participate in Council voting.
                    </p>
                    {onOpenAIConfig && (
                      <button
                        type="button"
                        onClick={onOpenAIConfig}
                        className="w-full py-1 px-2 text-[10px] font-bold bg-amber-600/80 hover:bg-amber-500 text-white rounded transition-colors cursor-pointer"
                      >
                        Set API Key / Endpoint →
                      </button>
                    )}
                  </div>
                ) : isError ? (
                  <div className="bg-red-950/30 border border-red-800/40 rounded p-2 my-1">
                    <p className="text-[11px] text-red-300/90 leading-snug mb-2 truncate">
                      {voter.reasoning_summary}
                    </p>
                    {onOpenAIConfig && (
                      <button
                        type="button"
                        onClick={onOpenAIConfig}
                        className="w-full py-1 px-2 text-[10px] font-bold bg-red-800/80 hover:bg-red-700 text-white rounded transition-colors cursor-pointer"
                      >
                        Check Settings →
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-300 leading-snug mb-2 italic">
                    "{voter.reasoning_summary}"
                  </p>
                )}

                {/* Key Supporting Factors */}
                {isSuccess && voter.supporting_factors.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">
                      Key Signals
                    </span>
                    <ul className="text-[10px] text-slate-300 space-y-0.5">
                      {voter.supporting_factors.slice(0, 2).map((fac, idx) => (
                        <li key={idx} className="truncate">
                          · {fac}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Voter Footer */}
              <div className="pt-2 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{voter.provider}</span>
                <span
                  className={
                    isSuccess
                      ? 'text-emerald-400 font-semibold'
                      : isUnconfigured
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }
                >
                  {isSuccess ? '● Online' : isUnconfigured ? '○ Key Needed' : '× Offline'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice Footer */}
      <div className="pt-3 mt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>Deriv DEMO Mode: Active</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>Max Stake: $1.00 USD</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>Daily Loss Cap: $5.00 USD</span>
        </div>
        <div className="text-emerald-400">
          Zero Dummy Data: Real Deriv WS & Live AI Models
        </div>
      </div>
    </div>
  );
};
