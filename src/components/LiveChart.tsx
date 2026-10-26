import React, { useRef, useEffect } from 'react';
import { MarketAsset, TechnicalIndicators, TradeContract } from '../types/trading';

interface LiveChartProps {
  asset: MarketAsset;
  priceHistory: number[];
  currentPrice: number;
  indicators: TechnicalIndicators;
  activeContracts: TradeContract[];
}

export const LiveChart: React.FC<LiveChartProps> = ({
  asset,
  priceHistory,
  currentPrice,
  indicators,
  activeContracts,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Price change calculation
  const firstPrice = priceHistory[0] || currentPrice;
  const priceChange = currentPrice - firstPrice;
  const percentChange = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    if (priceHistory.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for incoming tick stream...', width / 2, height / 2);
      return;
    }

    const padding = { top: 25, bottom: 35, left: 10, right: 65 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Calculate min and max bounds including Bollinger Bands if available
    let minPrice = Math.min(...priceHistory);
    let maxPrice = Math.max(...priceHistory);

    if (indicators.bbands.lower > 0 && indicators.bbands.lower < minPrice) {
      minPrice = indicators.bbands.lower;
    }
    if (indicators.bbands.upper > 0 && indicators.bbands.upper > maxPrice) {
      maxPrice = indicators.bbands.upper;
    }

    // Add 10% breathing room
    const range = maxPrice - minPrice || 1;
    minPrice -= range * 0.08;
    maxPrice += range * 0.08;
    const effectiveRange = maxPrice - minPrice;

    const getY = (price: number) => {
      return padding.top + chartH - ((price - minPrice) / effectiveRange) * chartH;
    };

    const getX = (index: number) => {
      return padding.left + (index / (priceHistory.length - 1)) * chartW;
    };

    // Draw horizontal grid lines & price labels on right axis
    const gridSteps = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridSteps; i++) {
      const stepPrice = minPrice + (effectiveRange / gridSteps) * i;
      const y = getY(stepPrice);

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(
        stepPrice.toLocaleString('en-US', {
          minimumFractionDigits: asset.pipPrecision,
          maximumFractionDigits: asset.pipPrecision,
        }),
        width - padding.right + 8,
        y + 3
      );
    }

    // Draw Bollinger Bands channel (if sufficient history)
    if (indicators.bbands.upper > 0 && indicators.bbands.lower > 0) {
      const upperY = getY(indicators.bbands.upper);
      const lowerY = getY(indicators.bbands.lower);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.03)';
      ctx.fillRect(padding.left, upperY, chartW, Math.max(1, lowerY - upperY));

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padding.left, upperY);
      ctx.lineTo(width - padding.right, upperY);
      ctx.moveTo(padding.left, lowerY);
      ctx.lineTo(width - padding.right, lowerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Price Path with Area Gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    if (isPositive) {
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.00)');
    } else {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.22)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.00)');
    }

    ctx.beginPath();
    priceHistory.forEach((price, idx) => {
      const x = getX(idx);
      const y = getY(price);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    // Fill under path
    ctx.lineTo(getX(priceHistory.length - 1), height - padding.bottom);
    ctx.lineTo(getX(0), height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Stroke the price line
    ctx.beginPath();
    priceHistory.forEach((price, idx) => {
      const x = getX(idx);
      const y = getY(price);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = isPositive ? '#10b981' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw active contracts entry spots
    activeContracts.forEach((contract) => {
      if (contract.symbol === asset.symbol && contract.status === 'active') {
        const contractY = getY(contract.entrySpot);
        ctx.strokeStyle = contract.action === 'RISE' ? '#10b981' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(padding.left, contractY);
        ctx.lineTo(width - padding.right, contractY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Contract tag
        ctx.fillStyle = contract.action === 'RISE' ? '#065f46' : '#7f1d1d';
        ctx.fillRect(width - padding.right - 85, contractY - 9, 80, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${contract.action} @ ${contract.entrySpot.toFixed(asset.pipPrecision)}`,
          width - padding.right - 45,
          contractY + 3
        );
      }
    });

    // Draw Current Spot Price Marker
    const latestX = getX(priceHistory.length - 1);
    const latestY = getY(currentPrice);

    ctx.fillStyle = isPositive ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(latestX, latestY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Price tag on axis
    ctx.fillStyle = isPositive ? '#10b981' : '#ef4444';
    ctx.fillRect(width - padding.right + 2, latestY - 10, 60, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(
      currentPrice.toLocaleString('en-US', {
        minimumFractionDigits: asset.pipPrecision,
        maximumFractionDigits: asset.pipPrecision,
      }),
      width - padding.right + 32,
      latestY + 4
    );
  }, [priceHistory, currentPrice, indicators, activeContracts, asset, isPositive]);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4 flex flex-col h-full">
      {/* Header telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-100 font-mono tracking-tight">
              {asset.symbol}
            </h1>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-300 font-medium">{asset.name}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400 capitalize">{asset.category}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {currentPrice.toLocaleString('en-US', {
                minimumFractionDigits: asset.pipPrecision,
                maximumFractionDigits: asset.pipPrecision,
              })}
            </span>
            <span
              className={`text-xs font-mono font-medium ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {priceChange.toFixed(asset.pipPrecision)} ({percentChange.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Technical Indicator Quick Metrics (Unboxed tabular-nums) */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">RSI (14)</span>
            <span
              className={`font-semibold tabular-nums ${
                indicators.rsi < 30
                  ? 'text-emerald-400'
                  : indicators.rsi > 70
                  ? 'text-red-400'
                  : 'text-slate-200'
              }`}
            >
              {indicators.rsi.toFixed(1)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">EMA 9 / 21</span>
            <span
              className={`font-semibold ${
                indicators.ema9 > indicators.ema21 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {indicators.trend}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">MACD Hist</span>
            <span className={`font-semibold tabular-nums ${indicators.macd.histogram >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {indicators.macd.histogram >= 0 ? '+' : ''}
              {indicators.macd.histogram.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">ATR (14)</span>
            <span className="font-semibold text-slate-300 tabular-nums">
              {indicators.atr.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[340px] relative">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Footer Sub-indicator Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>
            EMA 9:{' '}
            <strong className="text-slate-200 font-normal">
              {indicators.ema9.toFixed(asset.pipPrecision)}
            </strong>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>
            EMA 21:{' '}
            <strong className="text-slate-200 font-normal">
              {indicators.ema21.toFixed(asset.pipPrecision)}
            </strong>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>
            EMA 50:{' '}
            <strong className="text-slate-200 font-normal">
              {indicators.ema50.toFixed(asset.pipPrecision)}
            </strong>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>
            BB Lower:{' '}
            <strong className="text-slate-200 font-normal">
              {indicators.bbands.lower.toFixed(asset.pipPrecision)}
            </strong>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>
            BB Upper:{' '}
            <strong className="text-slate-200 font-normal">
              {indicators.bbands.upper.toFixed(asset.pipPrecision)}
            </strong>
          </span>
        </div>
        <div className="text-emerald-400 font-mono text-[10px]">
          Deriv Production Stream (wss://ws.derivws.com) · Real-Time Ticks
        </div>
      </div>
    </div>
  );
};
