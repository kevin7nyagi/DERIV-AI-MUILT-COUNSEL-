import React from 'react';
import { TradeContract } from '../types/trading';

interface PositionLedgerProps {
  activeContracts: TradeContract[];
  settledContracts: TradeContract[];
  onClearHistory: () => void;
}

export const PositionLedger: React.FC<PositionLedgerProps> = ({
  activeContracts,
  settledContracts,
  onClearHistory,
}) => {
  // Aggregate statistics
  const totalTrades = settledContracts.length;
  const wonTrades = settledContracts.filter((c) => c.status === 'won').length;
  const lostTrades = settledContracts.filter((c) => c.status === 'lost').length;
  const winRate = totalTrades > 0 ? (wonTrades / totalTrades) * 100 : 0;
  const netProfit = settledContracts.reduce((sum, c) => sum + c.profit, 0);

  const exportCSV = () => {
    if (settledContracts.length === 0) return;
    const headers = [
      'ContractID',
      'Symbol',
      'Action',
      'Stake',
      'Payout',
      'EntrySpot',
      'ExitSpot',
      'Status',
      'NetProfit',
      'Timestamp',
    ];

    const rows = settledContracts.map((c) => [
      c.contractId,
      c.symbol,
      c.action,
      c.stake,
      c.payout,
      c.entrySpot,
      c.exitSpot || 0,
      c.status,
      c.profit,
      new Date(c.entryTime).toISOString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `deriv_ai_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-5 flex flex-col h-full">
      {/* Header & Ledger Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
            Execution Ledger & Trade Audit
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active tick contracts, historical settlements, and model congruence audit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={settledContracts.length === 0}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded transition-colors disabled:opacity-40 cursor-pointer"
          >
            Export CSV Ledger
          </button>
          <button
            onClick={onClearHistory}
            disabled={settledContracts.length === 0}
            className="px-3 py-1.5 text-xs font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors disabled:opacity-40 cursor-pointer"
          >
            Clear Ledger
          </button>
        </div>
      </div>

      {/* Metric Counters (Tabular figures) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5 text-xs font-mono">
        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded">
          <span className="text-[10px] text-slate-400 block uppercase">Total Settled</span>
          <span className="text-base font-bold text-slate-100 tabular-nums">{totalTrades}</span>
        </div>
        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded">
          <span className="text-[10px] text-slate-400 block uppercase">Wins</span>
          <span className="text-base font-bold text-emerald-400 tabular-nums">{wonTrades}</span>
        </div>
        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded">
          <span className="text-[10px] text-slate-400 block uppercase">Losses</span>
          <span className="text-base font-bold text-red-400 tabular-nums">{lostTrades}</span>
        </div>
        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded">
          <span className="text-[10px] text-slate-400 block uppercase">Win Rate</span>
          <span className="text-base font-bold text-slate-100 tabular-nums">
            {winRate.toFixed(1)}%
          </span>
        </div>
        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded">
          <span className="text-[10px] text-slate-400 block uppercase">Net Profit / Loss</span>
          <span
            className={`text-base font-bold tabular-nums ${
              netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Active Live Positions */}
      {activeContracts.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <span>Live Active Contracts ({activeContracts.length})</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Streaming Ticks</span>
          </div>

          <div className="space-y-2">
            {activeContracts.map((contract) => (
              <div
                key={contract.id}
                className="p-3 bg-slate-950/90 border border-emerald-500/40 rounded flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      contract.action === 'RISE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                        : 'bg-red-950 text-red-300 border border-red-700/60'
                    }`}
                  >
                    {contract.action}
                  </span>
                  <div>
                    <span className="font-bold text-slate-100 block">{contract.symbol}</span>
                    <span className="text-[10px] text-slate-400">{contract.contractId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-5 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stake</span>
                    <span className="text-slate-200 tabular-nums">${contract.stake.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Entry Spot</span>
                    <span className="text-slate-200 tabular-nums">{contract.entrySpot.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Est. Payout</span>
                    <span className="text-emerald-400 font-semibold tabular-nums">
                      +${contract.payout.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Remaining</span>
                    <span className="text-amber-400 font-bold tabular-nums">
                      {contract.remainingTicks ?? 5} ticks
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settled History Table */}
      <div className="flex-1 overflow-x-auto min-h-[220px]">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Contract</th>
              <th className="py-2.5 px-3">Symbol</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Stake</th>
              <th className="py-2.5 px-3">Entry / Exit</th>
              <th className="py-2.5 px-3">Net Profit</th>
              <th className="py-2.5 px-3 text-right">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {settledContracts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                  No settled trades recorded in session yet. Arm the bot or click "Evaluate Quorum" to run automated or manual execution.
                </td>
              </tr>
            ) : (
              settledContracts.map((c) => {
                const isWin = c.status === 'won';
                const dateStr = new Date(c.entryTime).toLocaleTimeString();

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">{dateStr}</td>
                    <td className="py-2.5 px-3 text-slate-300">{c.contractId}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-semibold">{c.symbol}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${
                          c.action === 'RISE' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {c.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-200">${c.stake.toFixed(2)}</td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-300">
                      {c.entrySpot.toFixed(2)} → {c.exitSpot?.toFixed(2) || '—'}
                    </td>
                    <td
                      className={`py-2.5 px-3 tabular-nums font-semibold ${
                        isWin ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {c.profit >= 0 ? '+' : ''}${c.profit.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isWin
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            : 'bg-red-950 text-red-300 border border-red-700/60'
                        }`}
                      >
                        {isWin ? 'WON' : 'LOST'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
