import React, { useState } from 'react';

export const BeginnerGuideBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
            Beginner's Guide
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-sm font-semibold text-slate-100">
            How Your Multi-AI Trading Council Protects Your Capital
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer font-mono"
        >
          {isOpen ? '[ Hide Guide - ]' : '[ How It Works + ]'}
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="space-y-1">
            <span className="font-bold text-slate-100 block">1. Synchronized Snapshot</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Deriv streams live prices. Indicators (EMA 9/21/50, RSI 14, MACD, ATR) are packaged into a single exact snapshot for all models.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-100 block">2. 4 Secret AI Ballots</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Gemini, Mistral, FreeLLM, and the Technical Engine evaluate in parallel. None sees another's vote to prevent blind copying.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-100 block">3. 3-of-4 Quorum Rule</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              At least 3 voters must agree on RISE or FALL, with confidence $\ge$ 70%. If they disagree, the verdict is <strong>NO TRADE</strong>.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-100 block">4. Deriv DEMO Shield</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Strictly demo/virtual trades. $1.00 max stake per trade, $5.00 daily loss stop. Zero real capital risk.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
