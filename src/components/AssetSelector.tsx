import React, { useState } from 'react';
import { MarketAsset } from '../types/trading';
import { DERIV_ASSETS } from '../data/assets';

interface AssetSelectorProps {
  selectedSymbol: string;
  onSelectAsset: (asset: MarketAsset) => void;
  currentPrice: number;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedSymbol,
  onSelectAsset,
  currentPrice,
}) => {
  const [filter, setFilter] = useState<'all' | 'synthetics' | 'forex' | 'crypto'>('all');
  const [search, setSearch] = useState('');

  const filteredAssets = DERIV_ASSETS.filter((asset) => {
    const matchesFilter = filter === 'all' || asset.category === filter;
    const matchesSearch =
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col bg-slate-900/60 border border-slate-800/80 rounded-lg p-4 h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">Market Universe</h2>
          <p className="text-xs text-slate-400 mt-0.5">Select Deriv asset to stream & trade</p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {filteredAssets.length} Available
        </span>
      </div>

      {/* Search Input */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search symbol or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950/70 border border-slate-800 focus:border-slate-600 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Segmented Category Filter (Functional buttons) */}
      <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded mb-3">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1 text-xs font-medium rounded transition-colors cursor-pointer text-center whitespace-nowrap ${
            filter === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('synthetics')}
          className={`flex-1 py-1 text-xs font-medium rounded transition-colors cursor-pointer text-center whitespace-nowrap ${
            filter === 'synthetics'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Synthetics
        </button>
        <button
          onClick={() => setFilter('forex')}
          className={`flex-1 py-1 text-xs font-medium rounded transition-colors cursor-pointer text-center whitespace-nowrap ${
            filter === 'forex'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Forex
        </button>
        <button
          onClick={() => setFilter('crypto')}
          className={`flex-1 py-1 text-xs font-medium rounded transition-colors cursor-pointer text-center whitespace-nowrap ${
            filter === 'crypto'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Crypto
        </button>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[460px]">
        {filteredAssets.map((asset) => {
          const isSelected = asset.symbol === selectedSymbol;
          const displayPrice = isSelected ? currentPrice : asset.basePrice;

          return (
            <button
              key={asset.symbol}
              onClick={() => onSelectAsset(asset)}
              className={`w-full text-left p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500/50 shadow-xs'
                  : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-850 hover:border-slate-700/60'
              }`}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100 font-mono">
                    {asset.symbol}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">
                    {asset.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span className="capitalize">{asset.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{asset.volatilityLevel} Volatility</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-medium text-slate-100 tabular-nums block">
                  {displayPrice.toLocaleString('en-US', {
                    minimumFractionDigits: asset.pipPrecision,
                    maximumFractionDigits: asset.pipPrecision,
                  })}
                </span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isSelected ? 'Active Stream' : 'Ready'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
