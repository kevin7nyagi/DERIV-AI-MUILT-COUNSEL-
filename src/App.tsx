import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AIModelSettings,
  CouncilConsensusResult,
  CouncilVoterConfig,
  DerivAccount,
  LearningRecord,
  MarketAsset,
  RiskSettings,
  StructuredCouncilVote,
  TechnicalIndicators,
  TradeContract,
} from './types/trading';
import { DERIV_ASSETS } from './data/assets';
import { derivWsService } from './services/derivWs';
import { computeAllIndicators } from './utils/technicalIndicators';
import { TopBar } from './components/TopBar';
import { BeginnerGuideBanner } from './components/BeginnerGuideBanner';
import { AssetSelector } from './components/AssetSelector';
import { LiveChart } from './components/LiveChart';
import { CouncilVotingDeck } from './components/CouncilVotingDeck';
import { LearningLab } from './components/LearningLab';
import { RiskManagementPanel } from './components/RiskManagementPanel';
import { PositionLedger } from './components/PositionLedger';
import { DerivAuthModal } from './components/DerivAuthModal';
import { AIModelConfigModal } from './components/AIModelConfigModal';

export default function App() {
  const [activeView, setActiveView] = useState<'terminal' | 'learning' | 'risk' | 'ledger'>('terminal');
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(DERIV_ASSETS[0]); // EUR/USD Forex default
  const [currentPrice, setCurrentPrice] = useState<number>(DERIV_ASSETS[0].basePrice);
  const [priceHistory, setPriceHistory] = useState<number[]>([
    DERIV_ASSETS[0].basePrice * 0.9995,
    DERIV_ASSETS[0].basePrice,
  ]);
  const [indicators, setIndicators] = useState<TechnicalIndicators>({
    rsi: 50,
    ema9: DERIV_ASSETS[0].basePrice,
    ema21: DERIV_ASSETS[0].basePrice,
    ema50: DERIV_ASSETS[0].basePrice,
    macd: { macd: 0, signal: 0, histogram: 0 },
    atr: 0.0005,
    bbands: {
      upper: DERIV_ASSETS[0].basePrice * 1.0015,
      middle: DERIV_ASSETS[0].basePrice,
      lower: DERIV_ASSETS[0].basePrice * 0.9985,
    },
    momentum: 0,
    trend: 'SIDEWAYS',
  });

  // Deriv Account
  const [account, setAccount] = useState<DerivAccount>(derivWsService.account);
  const [connectionStatus, setConnectionStatus] = useState<string>('Deriv DEMO Sandbox');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Council Consensus
  const [consensusResult, setConsensusResult] = useState<CouncilConsensusResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // 4 Council Voters with Adaptive Learning Weights
  const [voters, setVoters] = useState<CouncilVoterConfig[]>([
    {
      id: 'gemini_analyst',
      name: 'Gemini 3.8 Flash',
      provider: 'Gemini',
      modelId: 'gemini-3.8-flash',
      enabled: true,
      weight: 0.25,
      stats: { totalVotes: 0, correctVotes: 0, accuracy: 75.0, brierScore: 0.185, netContribution: 0 },
    },
    {
      id: 'mistral_analyst',
      name: 'Mistral Analyst',
      provider: 'Mistral',
      modelId: 'mistral-small-latest',
      enabled: true,
      weight: 0.25,
      stats: { totalVotes: 0, correctVotes: 0, accuracy: 72.5, brierScore: 0.210, netContribution: 0 },
    },
    {
      id: 'freellm_analyst',
      name: 'FreeLLM / Open Model',
      provider: 'FreeLLMAPI',
      modelId: 'llama-3.3-70b-instruct',
      enabled: true,
      weight: 0.25,
      stats: { totalVotes: 0, correctVotes: 0, accuracy: 70.0, brierScore: 0.225, netContribution: 0 },
    },
    {
      id: 'technical_engine',
      name: 'Technical Control Engine',
      provider: 'TechnicalControl',
      modelId: 'tech_rule_engine_v1',
      enabled: true,
      weight: 0.25,
      stats: { totalVotes: 0, correctVotes: 0, accuracy: 80.0, brierScore: 0.150, netContribution: 0 },
    },
  ]);

  // Strict DEMO Risk Gate Settings
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
    stake: 1.0, // Fixed strictly at $1.00 USD
    maxDailyLoss: 5.0, // Fixed strictly at $5.00 USD
    takeProfitTarget: 20.0,
    maxOpenPositions: 1, // Single contract only
    cooldownSeconds: 10,
    tradeDurationTicks: 5,
    isEmergencyStopped: false,
    isAutoTrading: false,
    accountMode: 'DEMO_ONLY',
  });

  const [dailyPnL, setDailyPnL] = useState<number>(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState<number>(0);

  // Contracts & Learning Database
  const [activeContracts, setActiveContracts] = useState<TradeContract[]>([]);
  const [settledContracts, setSettledContracts] = useState<TradeContract[]>([]);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);

  // FreeLLM & AI Models Configuration
  const [aiSettings, setAiSettings] = useState<AIModelSettings>(() => {
    try {
      const saved = localStorage.getItem('ai_council_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved ai_council_settings:', e);
    }
    return {
      freeLlmUrl: 'http://localhost:8000/v1',
      freeLlmKey: '',
      freeLlmModel: 'llama-3.3-70b-instruct',
      mistralKey: '',
      mistralModel: 'mistral-small-latest',
      openaiKey: '',
      openaiModel: 'gpt-4o-mini',
    };
  });
  const [isAiConfigOpen, setIsAiConfigOpen] = useState<boolean>(false);
  const [freeLlmUrl, setFreeLlmUrl] = useState<string>(() => aiSettings.freeLlmUrl || 'http://localhost:8000/v1');
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);

  // Startup: Check if Deriv token is configured or prompt user
  useEffect(() => {
    const savedToken = localStorage.getItem('deriv_demo_token');
    const savedAppId = localStorage.getItem('deriv_app_id');
    if (savedToken) {
      if (savedAppId) derivWsService.setAppId(savedAppId);
      derivWsService.connect(savedToken);
    } else {
      // Prompt user to connect Deriv token on first load
      setIsAuthOpen(true);
    }
  }, []);

  const handleSaveAiSettings = (newSettings: AIModelSettings) => {
    setAiSettings(newSettings);
    setFreeLlmUrl(newSettings.freeLlmUrl);
    try {
      localStorage.setItem('ai_council_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save ai settings to localStorage:', e);
    }
  };

  // Timers & References
  const evalTimerRef = useRef<any>(null);
  const lastTradeTimeRef = useRef<number>(0);
  const activeContractsRef = useRef<TradeContract[]>([]);
  activeContractsRef.current = activeContracts;

  // Initialize Deriv WebSocket listeners
  useEffect(() => {
    const unsubConn = derivWsService.onConnection((_isConnected, status) => {
      setConnectionStatus(status);
      setAccount({ ...derivWsService.account });
    });

    const unsubBalance = derivWsService.onBalance((newBal) => {
      setAccount((prev) => ({ ...prev, balance: newBal }));
    });

    const unsubHistory = derivWsService.onHistory((realPrices) => {
      if (realPrices.length > 0) {
        setPriceHistory(realPrices);
        setCurrentPrice(realPrices[realPrices.length - 1]);
        const newIndicators = computeAllIndicators(realPrices);
        setIndicators(newIndicators);
      }
    });

    const unsubTick = derivWsService.onTick((tick) => {
      if (tick.symbol === selectedAsset.symbol) {
        setCurrentPrice(tick.quote);
        setPriceHistory((prev) => {
          const updated = [...prev, tick.quote].slice(-80);
          const newIndicators = computeAllIndicators(updated);
          setIndicators(newIndicators);
          return updated;
        });
      }
    });

    const unsubContract = derivWsService.onContract((update) => {
      if (!update.contractId) return;

      setActiveContracts((prev) => {
        const existing = prev.find((c) => c.contractId === update.contractId);
        if (!existing) return prev;

        const merged: TradeContract = { ...existing, ...update };

        // When contract is settled (won or lost)
        if (merged.status === 'won' || merged.status === 'lost') {
          setSettledContracts((sPrev) => [merged, ...sPrev]);

          // Update Daily PnL
          setDailyPnL((p) => {
            const nextPnL = Number((p + merged.profit).toFixed(2));
            // Check $5 daily loss limit
            if (nextPnL <= -riskSettings.maxDailyLoss) {
              setRiskSettings((rs) => ({ ...rs, isAutoTrading: false }));
            }
            return nextPnL;
          });

          // Consecutive loss tracking
          if (merged.status === 'lost') {
            setConsecutiveLosses((cl) => cl + 1);
          } else {
            setConsecutiveLosses(0);
          }

          // Trigger Model Learning Loop
          recordContractLearning(merged);

          return prev.filter((c) => c.contractId !== update.contractId);
        }

        return prev.map((c) => (c.contractId === update.contractId ? merged : c));
      });
    });

    return () => {
      unsubConn();
      unsubBalance();
      unsubHistory();
      unsubTick();
      unsubContract();
    };
  }, [selectedAsset, riskSettings.maxDailyLoss]);

  // Learning Engine: Evaluates predictions against settled outcome and recalibrates weights cautiously
  const recordContractLearning = (contract: TradeContract) => {
    const actualDirection: 'RISE' | 'FALL' =
      contract.status === 'won'
        ? contract.action
        : contract.action === 'RISE'
        ? 'FALL'
        : 'RISE';

    setLearningRecords((prev) =>
      prev.map((rec) => {
        if (rec.contractId === contract.contractId) {
          return {
            ...rec,
            actualOutcome: actualDirection,
            tradeStatus: contract.status === 'won' ? 'won' : 'lost',
            netProfit: contract.profit,
          };
        }
        return rec;
      })
    );

    // Recalibrate Model Performance & Weights
    setVoters((prevVoters) => {
      return prevVoters.map((voter) => {
        const voterDecision = contract.consensusVotes.find((v) => v.voter_id === voter.id);
        if (!voterDecision) return voter;

        const isCorrect = voterDecision.direction === actualDirection;
        const total = voter.stats.totalVotes + 1;
        const correct = voter.stats.correctVotes + (isCorrect ? 1 : 0);
        const newAccuracy = Number(((correct / total) * 100).toFixed(1));

        // Compute Brier Score ((confidence/100) - outcomeBool)^2
        const p = voterDecision.confidence / 100;
        const actualBool = isCorrect ? 1 : 0;
        const singleBrier = Math.pow(p - actualBool, 2);
        const newBrier = Number(((voter.stats.brierScore * (total - 1) + singleBrier) / total).toFixed(3));

        // Bounded adaptive weight: slightly reward high accuracy (between 0.10 and 0.40)
        let newWeight = voter.weight;
        if (total >= 3) {
          const rawWeight = 0.15 + (newAccuracy / 100) * 0.2;
          newWeight = Math.min(0.4, Math.max(0.1, Number(rawWeight.toFixed(2))));
        }

        return {
          ...voter,
          weight: newWeight,
          stats: {
            totalVotes: total,
            correctVotes: correct,
            accuracy: newAccuracy,
            brierScore: newBrier,
            netContribution: Number((voter.stats.netContribution + contract.profit * voter.weight).toFixed(2)),
          },
        };
      });
    });
  };

  // Asset switch handler: Real Deriv stream takes over immediately
  const handleSelectAsset = (asset: MarketAsset) => {
    setSelectedAsset(asset);
    derivWsService.setSymbol(asset.symbol);
  };

  // Poll 4-AI Council Votes
  const evaluateCouncil = useCallback(async (): Promise<CouncilConsensusResult | null> => {
    if (isEvaluating) return null;
    setIsEvaluating(true);

    try {
      const res = await fetch('/api/council/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedAsset.symbol,
          assetName: selectedAsset.name,
          category: selectedAsset.category,
          currentPrice,
          indicators,
          recentTicks: priceHistory.slice(-15),
          voterConfigs: voters,
          customKeys: {
            mistral: aiSettings.mistralKey || undefined,
            openai: aiSettings.openaiKey || undefined,
            freellm: aiSettings.freeLlmKey || undefined,
          },
          freeLlmApiUrl: aiSettings.freeLlmUrl,
          freeLlmModelId: aiSettings.freeLlmModel,
          mistralModelId: aiSettings.mistralModel,
          openaiModelId: aiSettings.openaiModel,
        }),
      });

      if (!res.ok) {
        throw new Error(`Council API HTTP ${res.status}`);
      }

      const result: CouncilConsensusResult = await res.json();
      setConsensusResult(result);
      return result;
    } catch (err) {
      console.error('Council evaluation error:', err);
      return null;
    } finally {
      setIsEvaluating(false);
    }
  }, [isEvaluating, selectedAsset, currentPrice, indicators, priceHistory, voters, aiSettings]);

  // Autonomous Council Execution Loop (Deriv DEMO only)
  useEffect(() => {
    if (!riskSettings.isAutoTrading || riskSettings.isEmergencyStopped) {
      if (evalTimerRef.current) clearInterval(evalTimerRef.current);
      return;
    }

    evalTimerRef.current = setInterval(async () => {
      const now = Date.now();

      // Enforce post-trade cooldown (default 10s)
      if (now - lastTradeTimeRef.current < riskSettings.cooldownSeconds * 1000) return;

      // Strict single open contract constraint
      if (activeContractsRef.current.length >= riskSettings.maxOpenPositions) return;

      // Strict $5.00 daily loss stop
      if (dailyPnL <= -riskSettings.maxDailyLoss) {
        setRiskSettings((rs) => ({ ...rs, isAutoTrading: false }));
        return;
      }

      const result = await evaluateCouncil();

      // Check 3-of-4 Council Rule + Technical Confirmation
      if (
        result &&
        result.is3Of4QuorumMet &&
        result.technicalEngineApproved &&
        result.consensusDirection !== 'NO_TRADE' &&
        result.averageConfidence >= 70
      ) {
        lastTradeTimeRef.current = now;
        const action = result.consensusDirection;
        const stake = Math.min(1.0, riskSettings.stake); // Strict max 1.00 USD

        try {
          const contract = await derivWsService.executeTrade({
            symbol: selectedAsset.symbol,
            assetName: selectedAsset.name,
            action,
            stake,
            durationTicks: riskSettings.tradeDurationTicks,
            votes: result.votes,
          });

          setActiveContracts((prev) => [contract, ...prev]);

          // Save pending learning record
          setLearningRecords((prev) => [
            {
              id: 'LR_' + Date.now(),
              timestamp: Date.now(),
              symbol: selectedAsset.symbol,
              snapshotPrice: currentPrice,
              indicators,
              votes: result.votes,
              consensusDirection: action,
              contractId: contract.contractId,
              tradeStatus: 'no_trade',
            },
            ...prev,
          ]);
        } catch (tradeErr) {
          console.error('Demo contract execution error:', tradeErr);
        }
      }
    }, 6000);

    return () => {
      if (evalTimerRef.current) clearInterval(evalTimerRef.current);
    };
  }, [
    riskSettings.isAutoTrading,
    riskSettings.isEmergencyStopped,
    riskSettings.cooldownSeconds,
    riskSettings.maxOpenPositions,
    riskSettings.maxDailyLoss,
    riskSettings.stake,
    riskSettings.tradeDurationTicks,
    dailyPnL,
    selectedAsset,
    currentPrice,
    indicators,
    evaluateCouncil,
  ]);

  // Model discovery handler for FreeLLMAPI
  const handleDiscoverModels = async () => {
    try {
      const res = await fetch(`/api/council/models?url=${encodeURIComponent(freeLlmUrl)}`);
      const data = await res.json();
      if (data.registry) {
        const freeLlmEntry = data.registry.find((r: any) => r.id === 'freellm');
        if (freeLlmEntry && freeLlmEntry.discoveredModels) {
          setDiscoveredModels(freeLlmEntry.discoveredModels);
        }
      }
    } catch (e) {
      console.warn('Model discovery failed:', e);
    }
  };

  const isDailyLossHit = dailyPnL <= -riskSettings.maxDailyLoss;

  const handleToggleAutoTrading = () => {
    if (!account.isAuthorized) {
      setIsAuthOpen(true);
      return;
    }
    if (isDailyLossHit) {
      alert('Daily loss limit of $5.00 has been reached. Trading is paused for capital preservation.');
      return;
    }
    setRiskSettings((rs) => ({
      ...rs,
      isAutoTrading: !rs.isAutoTrading,
      isEmergencyStopped: false,
    }));
  };

  const handleEmergencyStop = () => {
    setRiskSettings((rs) => ({
      ...rs,
      isEmergencyStopped: !rs.isEmergencyStopped,
      isAutoTrading: false,
    }));
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Strict Top Navigation Bar */}
      <TopBar
        activeView={activeView}
        onSelectView={setActiveView}
        isAutoTrading={riskSettings.isAutoTrading}
        onToggleAutoTrading={handleToggleAutoTrading}
        account={account}
        connectionStatus={connectionStatus}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAIConfig={() => setIsAiConfigOpen(true)}
        onEmergencyStop={handleEmergencyStop}
        isEmergencyStopped={riskSettings.isEmergencyStopped}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 flex flex-col gap-5">
        {/* Beginner Guide Banner (Expandable/Collapsible) */}
        <BeginnerGuideBanner />

        {/* View 1: Council Terminal (Simple for Beginners) */}
        {activeView === 'terminal' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
            {/* Left 4 Cols: Forex Universe Selector */}
            <div className="lg:col-span-4 h-full">
              <AssetSelector
                selectedSymbol={selectedAsset.symbol}
                onSelectAsset={handleSelectAsset}
                currentPrice={currentPrice}
              />
            </div>

            {/* Right 8 Cols: Live Chart + The 4-AI Council Deck */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <div className="min-h-[380px] flex-1">
                <LiveChart
                  asset={selectedAsset}
                  priceHistory={priceHistory}
                  currentPrice={currentPrice}
                  indicators={indicators}
                  activeContracts={activeContracts}
                />
              </div>

              {/* Big Beginner Council Voting Deck */}
              <div className="min-h-[300px]">
                <CouncilVotingDeck
                  consensusResult={consensusResult}
                  isEvaluating={isEvaluating}
                  onEvaluate={evaluateCouncil}
                  isAutoTrading={riskSettings.isAutoTrading}
                  onToggleAutoTrading={handleToggleAutoTrading}
                  dailyLoss={dailyPnL}
                  maxDailyLoss={riskSettings.maxDailyLoss}
                  isAuthorized={account.isAuthorized}
                  onOpenAIConfig={() => setIsAiConfigOpen(true)}
                  onOpenDerivAuth={() => setIsAuthOpen(true)}
                />
              </div>
            </div>
          </div>
        )}

        {/* View 2: Council Learning Lab & Registry */}
        {activeView === 'learning' && (
          <div className="flex-1">
            <LearningLab
              voters={voters}
              onUpdateVoter={(updated) =>
                setVoters((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
              }
              learningRecords={learningRecords}
              freeLlmUrl={freeLlmUrl}
              onChangeFreeLlmUrl={setFreeLlmUrl}
              onDiscoverModels={handleDiscoverModels}
              discoveredModels={discoveredModels}
            />
          </div>
        )}

        {/* View 3: Demo Risk Shield */}
        {activeView === 'risk' && (
          <div className="flex-1">
            <RiskManagementPanel
              settings={riskSettings}
              onUpdateSettings={setRiskSettings}
              dailyPnL={dailyPnL}
              consecutiveLosses={consecutiveLosses}
              isDailyLossHit={isDailyLossHit}
              onEmergencyStop={handleEmergencyStop}
            />
          </div>
        )}

        {/* View 4: Trade History & Audit Ledger */}
        {activeView === 'ledger' && (
          <div className="flex-1">
            <PositionLedger
              activeContracts={activeContracts}
              settledContracts={settledContracts}
              onClearHistory={() => setSettledContracts([])}
            />
          </div>
        )}
      </main>

      {/* Deriv Auth Modal (Demo Enforced) */}
      <DerivAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        account={account}
        onConnectToken={(token, appId) => {
          if (appId) derivWsService.setAppId(appId);
          derivWsService.connect(token);
        }}
        onDisconnect={() => derivWsService.disconnect()}
        onResetDemoBalance={() => derivWsService.resetDemoBalance(10000)}
      />

      {/* AI Models & FreeLLM Council Configuration Modal */}
      <AIModelConfigModal
        isOpen={isAiConfigOpen}
        onClose={() => setIsAiConfigOpen(false)}
        settings={aiSettings}
        onSaveSettings={handleSaveAiSettings}
      />
    </div>
  );
}
