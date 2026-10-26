import React, { useState } from 'react';
import { CouncilVoterConfig, LearningRecord } from '../types/trading';

interface LearningLabProps {
  voters: CouncilVoterConfig[];
  onUpdateVoter: (updated: CouncilVoterConfig) => void;
  learningRecords: LearningRecord[];
  freeLlmUrl: string;
  onChangeFreeLlmUrl: (url: string) => void;
  onDiscoverModels: () => void;
  discoveredModels: string[];
}

export const LearningLab: React.FC<LearningLabProps> = ({
  voters,
  onUpdateVoter,
  learningRecords,
  freeLlmUrl,
  onChangeFreeLlmUrl,
  onDiscoverModels,
  discoveredModels,
}) => {
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  const handleTestDiscovery = async () => {
    setTestingEndpoint(true);
    await onDiscoverModels();
    setTestingEndpoint(false);
  };

  const settledRecords = learningRecords.filter((r) => r.tradeStatus === 'won' || r.tradeStatus === 'lost');

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col gap-6 shadow-lg">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Council Learning Lab & Model Performance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Measuring accuracy, calibration (Brier score), and adaptive weights from settled Deriv Demo trades
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {settledRecords.length} Settled Training Samples
          </span>
        </div>
      </div>

      {/* Model Performance Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {voters.map((voter) => {
          return (
            <div
              key={voter.id}
              className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <span className="text-xs font-bold text-slate-100">{voter.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{voter.provider}</span>
                </div>

                {/* Accuracy & Score */}
                <div className="grid grid-cols-2 gap-2 mb-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Accuracy</span>
                    <span className="text-sm font-bold text-emerald-400 tabular-nums">
                      {voter.stats.accuracy.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      ({voter.stats.correctVotes}/{voter.stats.totalVotes})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Brier Score</span>
                    <span className="text-sm font-bold text-slate-200 tabular-nums">
                      {voter.stats.brierScore.toFixed(3)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Lower is better</span>
                  </div>
                </div>

                {/* Adaptive Weight */}
                <div className="mb-3">
                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mb-1">
                    <span>Council Vote Weight:</span>
                    <span className="text-emerald-400 font-semibold tabular-nums">
                      {(voter.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${voter.weight * 250}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Bounded in [10%, 40%] based on sample performance
                  </span>
                </div>
              </div>

              {/* Voter Enable Toggle & Model ID */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {voter.modelId}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voter.enabled}
                    onChange={(e) => onUpdateVoter({ ...voter, enabled: e.target.checked })}
                    className="accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-300">Active</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* FreeLLMAPI Connection & Model Discovery Panel */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-200">
              FreeLLMAPI & Model Panel Registry
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Connect local or remote FreeLLMAPI endpoint to discover installed models or use Fusion panel
            </p>
          </div>

          <button
            onClick={handleTestDiscovery}
            disabled={testingEndpoint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {testingEndpoint ? 'Discovering Models...' : 'Discover Installed Models'}
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={freeLlmUrl}
            onChange={(e) => onChangeFreeLlmUrl(e.target.value)}
            placeholder="http://localhost:8000/v1 (or your FreeLLMAPI endpoint)"
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-slate-600 rounded px-3 py-1.5 font-mono text-xs text-slate-200 focus:outline-none"
          />
        </div>

        {discoveredModels.length > 0 && (
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Discovered Models ({discoveredModels.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {discoveredModels.map((m) => (
                <span key={m} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Historical Audit Table of Predictions vs Reality */}
      <div>
        <h3 className="text-xs font-bold text-slate-200 mb-2 uppercase font-mono tracking-wider">
          Auditable Learning Log (Predictions vs Settled Outcomes)
        </h3>

        <div className="overflow-x-auto max-h-[320px]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Asset</th>
                <th className="py-2 px-3">Gemini</th>
                <th className="py-2 px-3">Mistral</th>
                <th className="py-2 px-3">FreeLLM</th>
                <th className="py-2 px-3">Tech Engine</th>
                <th className="py-2 px-3">Council Result</th>
                <th className="py-2 px-3">Contract Result</th>
                <th className="py-2 px-3 text-right">Settled PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {settledRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500 font-sans text-xs">
                    No settled demo trades yet. As contracts complete on Deriv Demo, each model's vote is scored here to calibrate accuracy.
                  </td>
                </tr>
              ) : (
                settledRecords.map((rec) => {
                  const geminiV = rec.votes.find((v) => v.voter_id === 'gemini_analyst')?.direction || '—';
                  const mistralV = rec.votes.find((v) => v.voter_id === 'mistral_analyst')?.direction || '—';
                  const freeLlmV = rec.votes.find((v) => v.voter_id === 'freellm_analyst')?.direction || '—';
                  const techV = rec.votes.find((v) => v.voter_id === 'technical_engine')?.direction || '—';
                  const isWon = rec.tradeStatus === 'won';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 text-slate-400">
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 text-slate-200 font-semibold">{rec.symbol}</td>
                      <td className="py-2 px-3 text-slate-300">{geminiV}</td>
                      <td className="py-2 px-3 text-slate-300">{mistralV}</td>
                      <td className="py-2 px-3 text-slate-300">{freeLlmV}</td>
                      <td className="py-2 px-3 text-slate-300">{techV}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-bold ${
                            rec.consensusDirection === 'RISE'
                              ? 'text-emerald-400'
                              : rec.consensusDirection === 'FALL'
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {rec.consensusDirection}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isWon
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-red-950 text-red-300'
                          }`}
                        >
                          {isWon ? 'WON' : 'LOST'}
                        </span>
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-semibold tabular-nums ${
                          isWon ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {rec.netProfit && rec.netProfit > 0 ? '+' : ''}${rec.netProfit?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
