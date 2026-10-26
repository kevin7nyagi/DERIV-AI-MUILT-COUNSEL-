import React from 'react';
import { RiskSettings } from '../types/trading';

interface RiskManagementPanelProps {
  settings: RiskSettings;
  onUpdateSettings: (newSettings: RiskSettings) => void;
  dailyPnL: number;
  consecutiveLosses: number;
  isDailyLossHit: boolean;
  onEmergencyStop: () => void;
}

export const RiskManagementPanel: React.FC<RiskManagementPanelProps> = ({
  settings,
  onUpdateSettings,
  dailyPnL,
  consecutiveLosses,
  isDailyLossHit,
  onEmergencyStop,
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col gap-6 shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Deriv DEMO Safety Gate & Risk Constraints
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict, server-enforced risk parameters to prevent any account drawdown
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {isDailyLossHit ? (
            <span className="px-3 py-1 rounded bg-red-950 text-red-300 border border-red-700/60 font-bold">
              DAILY LOSS LIMIT REACHED ($5.00 STOP)
            </span>
          ) : (
            <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
              RISK SHIELD: ACTIVE & VERIFIED
            </span>
          )}
        </div>
      </div>

      {/* Real-Time Risk Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg font-mono">
          <span className="text-[10px] text-slate-400 uppercase block">Daily Loss / PnL</span>
          <span
            className={`text-xl font-bold tabular-nums block ${
              dailyPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)} USD
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Hard Stop: -$5.00 USD
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg font-mono">
          <span className="text-[10px] text-slate-400 uppercase block">Stake Sizing</span>
          <span className="text-xl font-bold text-slate-100 tabular-nums block">
            ${settings.stake.toFixed(2)} USD
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">
            Enforced Max $\le$ $1.00 USD
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg font-mono">
          <span className="text-[10px] text-slate-400 uppercase block">Open Positions</span>
          <span className="text-xl font-bold text-slate-100 tabular-nums block">
            0 / 1 Max
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Strict single-order constraint
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg font-mono">
          <span className="text-[10px] text-slate-400 uppercase block">Execution Target</span>
          <span className="text-xl font-bold text-emerald-400 block">
            DEMO ONLY
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Virtual simulation token
          </span>
        </div>
      </div>

      {/* Rules Breakdown & Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300">
        <div className="space-y-3 p-4 bg-slate-950/50 border border-slate-800/80 rounded-lg">
          <h3 className="font-bold text-slate-100 uppercase font-mono tracking-wider">
            Mandatory Risk Policy (Specification Enforced)
          </h3>
          <ul className="space-y-2 text-slate-400 text-[11px] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Fixed Stake:</strong> Locked to $1.00 USD per trade. No Martingale, no multiplier doubling, and no loss chasing.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>$5.00 Daily Loss Limit:</strong> If session losses reach $5.00, the system automatically shuts down all trading for the day.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Deriv DEMO Account Only:</strong> Real-money execution is completely blocked by design to ensure safe testing.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Single Open Contract:</strong> Never places a trade while another contract is running.</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4 p-4 bg-slate-950/50 border border-slate-800/80 rounded-lg">
          <h3 className="font-bold text-slate-100 uppercase font-mono tracking-wider">
            Execution Timings & Safety Cooldown
          </h3>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">
              Contract Duration (Ticks)
            </label>
            <select
              value={settings.tradeDurationTicks}
              onChange={(e) => onUpdateSettings({ ...settings, tradeDurationTicks: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 font-mono text-slate-200 focus:outline-none"
            >
              <option value="5">5 Ticks (Fast Option Horizon)</option>
              <option value="10">10 Ticks (Intermediate Horizon)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">
              Post-Trade Cooldown (Seconds)
            </label>
            <select
              value={settings.cooldownSeconds}
              onChange={(e) => onUpdateSettings({ ...settings, cooldownSeconds: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 font-mono text-slate-200 focus:outline-none"
            >
              <option value="5">5 Seconds</option>
              <option value="10">10 Seconds (Recommended)</option>
              <option value="20">20 Seconds</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={onEmergencyStop}
              className={`w-full py-2 font-bold rounded font-mono text-xs transition-colors cursor-pointer ${
                settings.isEmergencyStopped
                  ? 'bg-red-600 text-white'
                  : 'bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300'
              }`}
            >
              {settings.isEmergencyStopped ? 'RESUME AUTONOMOUS ENGINE' : 'EMERGENCY STOP (HALT ALL)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
