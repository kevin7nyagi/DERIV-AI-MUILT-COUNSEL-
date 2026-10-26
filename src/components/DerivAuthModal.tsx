import React, { useState } from 'react';
import { DerivAccount } from '../types/trading';

interface DerivAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: DerivAccount;
  onConnectToken: (token: string, appId?: string) => void;
  onDisconnect: () => void;
  onResetDemoBalance: () => void;
}

export const DerivAuthModal: React.FC<DerivAuthModalProps> = ({
  isOpen,
  onClose,
  account,
  onConnectToken,
  onDisconnect,
  onResetDemoBalance,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [appIdInput, setAppIdInput] = useState('1089');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setIsSubmitting(true);
    onConnectToken(tokenInput.trim(), appIdInput.trim() || '1089');
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Connect Deriv Account (Real Data)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live market stream via official Deriv WebSocket (wss://ws.derivws.com)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base font-bold p-1 cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Live Stream Status Banner */}
        <div className="mb-4 p-3.5 bg-emerald-950/30 border border-emerald-600/40 rounded-lg text-xs space-y-1">
          <div className="flex items-center justify-between font-mono">
            <span className="font-bold text-emerald-400">Real Deriv Data Stream: ACTIVE</span>
            <span className="text-[11px] text-emerald-300">Live Gateway</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Market prices, ticks, and candle history for Forex and Synthetics are streamed directly from Deriv's production servers without synthetic simulation.
          </p>
        </div>

        {/* Account Authorization Card */}
        <div className="mb-4 p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg font-mono text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Deriv Account:</span>
            <span
              className={`font-bold ${
                account.isAuthorized
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {account.isAuthorized
                ? `Authorized Demo (${account.loginId})`
                : 'Public Stream (Enter Token to Trade)'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Account Balance:</span>
            <span className="text-slate-100 font-bold tabular-nums">
              ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {account.currency}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Execution Safety:</span>
            <span className="text-emerald-400">DEMO Account Only (No Real Funds At Risk)</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-200">
                Deriv DEMO API Token
              </label>
              <a
                href="https://app.deriv.com/account/api-token"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-mono"
              >
                Get Token from Deriv ↗
              </a>
            </div>
            <input
              type="password"
              placeholder="Paste your Deriv API token here..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              In your Deriv account: Go to <strong>Settings &gt; API Token</strong>, name it (e.g. "CouncilBot"), check <strong>Read</strong> and <strong>Trade</strong> permissions, and paste the token here.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Deriv App ID (Default 1089)
            </label>
            <input
              type="text"
              value={appIdInput}
              onChange={(e) => setAppIdInput(e.target.value)}
              placeholder="1089"
              className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Official gateway App ID for standard Deriv WebSocket connections.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={!tokenInput.trim() || isSubmitting}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Authenticating with Deriv...' : 'Connect & Authorize Deriv DEMO'}
            </button>

            {account.isAuthorized && (
              <button
                type="button"
                onClick={onDisconnect}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Need fresh demo funds?</span>
          <button
            type="button"
            onClick={onResetDemoBalance}
            className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            Refill $10,000 Demo Balance
          </button>
        </div>
      </div>
    </div>
  );
};
