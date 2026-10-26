import React from 'react';
import { DerivAccount } from '../types/trading';

interface TopBarProps {
  activeView: 'terminal' | 'learning' | 'risk' | 'ledger';
  onSelectView: (view: 'terminal' | 'learning' | 'risk' | 'ledger') => void;
  isAutoTrading: boolean;
  onToggleAutoTrading: () => void;
  account: DerivAccount;
  connectionStatus: string;
  onOpenAuth: () => void;
  onOpenAIConfig?: () => void;
  onEmergencyStop: () => void;
  isEmergencyStopped: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onSelectView,
  isAutoTrading,
  onToggleAutoTrading,
  account,
  connectionStatus,
  onOpenAuth,
  onOpenAIConfig,
  onEmergencyStop,
  isEmergencyStopped,
}) => {
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Wordmark + Unboxed Demo Badges */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#terminal"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('terminal');
          }}
          className="text-base font-bold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap"
        >
          Deriv Multi-AI Council
        </a>

        {/* Clean Unboxed Metadata */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span aria-hidden="true" className="text-slate-600">·</span>
          <button
            onClick={onOpenAuth}
            className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
              account.isAuthorized
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-amber-400 hover:text-amber-300'
            }`}
            title="Deriv DEMO Environment Status"
          >
            <span className={`w-2 h-2 rounded-full ${account.isAuthorized ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{account.isAuthorized ? 'Deriv DEMO Connected' : 'Deriv Public Mode (Token Needed)'}</span>
          </button>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-200 font-semibold tabular-nums">
            ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {account.currency}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-500">{connectionStatus}</span>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Single-line, 4 links) */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => onSelectView('terminal')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap py-1 cursor-pointer ${
            activeView === 'terminal' ? 'text-white border-b-2 border-emerald-500 font-semibold' : ''
          }`}
        >
          Council Terminal
        </button>
        <button
          onClick={() => onSelectView('learning')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap py-1 cursor-pointer ${
            activeView === 'learning' ? 'text-white border-b-2 border-emerald-500 font-semibold' : ''
          }`}
        >
          Learning Lab & Registry
        </button>
        <button
          onClick={() => onSelectView('risk')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap py-1 cursor-pointer ${
            activeView === 'risk' ? 'text-white border-b-2 border-emerald-500 font-semibold' : ''
          }`}
        >
          Demo Risk Shield
        </button>
        <button
          onClick={() => onSelectView('ledger')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap py-1 cursor-pointer ${
            activeView === 'ledger' ? 'text-white border-b-2 border-emerald-500 font-semibold' : ''
          }`}
        >
          Trade History
        </button>
      </nav>

      {/* Zone 3: Actions + Primary CTA */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onEmergencyStop}
          className={`px-3 py-1.5 text-xs font-bold rounded-md font-mono transition-colors cursor-pointer ${
            isEmergencyStopped
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300'
          }`}
          title="Immediate Emergency Halt"
        >
          {isEmergencyStopped ? 'HALTED (CLICK TO RESUME)' : 'EMERGENCY STOP'}
        </button>

        {onOpenAIConfig && (
          <button
            onClick={onOpenAIConfig}
            className="text-xs px-3 py-1.5 text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/70 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            title="Configure FreeLLM, Mistral, OpenAI & Gemini"
          >
            <span>AI Models</span>
          </button>
        )}

        <button
          onClick={onOpenAuth}
          className="text-xs px-3 py-1.5 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors whitespace-nowrap cursor-pointer"
        >
          Demo Token
        </button>

        {/* Primary CTA Button */}
        <button
          onClick={onToggleAutoTrading}
          disabled={isEmergencyStopped}
          className={`px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer shadow-sm disabled:opacity-50 ${
            isAutoTrading
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isAutoTrading ? 'Pause Council' : 'Auto-Trade on Demo ($1)'}
        </button>
      </div>
    </header>
  );
};
