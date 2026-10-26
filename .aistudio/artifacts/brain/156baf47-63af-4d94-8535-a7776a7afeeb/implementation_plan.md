# Deriv Multi-AI Trading Council: Dynamic Roster, Real Deriv Stream & SQLite Persistence

A production-grade algorithmic trading console for Deriv DEMO accounts where a customizable council of independent AI models (supporting multiple API keys per provider, such as multiple Mistral members) analyze real-time market data, vote via deterministic consensus, and log transparent audit trails to a server-side SQLite database.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed via interactive clarification:
> - **Dynamic Council Roster**: Users can add, name, and configure custom AI voter members—each with its own provider, custom API key (e.g. multiple distinct Mistral keys), target model ID, and voting weight.
> - **Direct In-App Deriv Authentication & Live Diagnostics**: Direct token and App ID input modal with real-time handshake validation, explicit error diagnosis, and exponential auto-reconnect to eliminate connection drops.
> - **Server-Side SQLite Database**: All council rosters, API keys, Deriv configurations, position ledgers, and consensus vote records persist in a lightweight, zero-dependency SQLite database on the server.
> - **Pure Real-Market Data Only**: Zero simulated price drift or dummy quotes. Market data feeds directly from the Deriv production WebSocket (`wss://ws.derivws.com`), with 24/7 Deriv Synthetic Indices (e.g., Volatility 100 (1s), Jump 50) supported alongside standard Forex pairs so real market ticks flow even when weekend Forex sessions are paused.
> - **Full-Spectrum Screen Responsiveness**: Clean mobile drawer/collapsible panels, tablet-optimized grids, and desktop high-density trading layouts without overflow or clipping.

---

### 1. Overview & Core Concept

- **What It Does**: The platform connects directly to the official Deriv WebSocket API (`wss://ws.derivws.com/websockets/v3`) using the trader's DEMO token. Real tick feeds and technical indicators (RSI 14, EMA 9/21/50, MACD, ATR 14, Bollinger Bands) are dispatched concurrently to a configurable panel of independent AI voters. When a deterministic quorum (e.g. $\ge 75\%$ consensus with $\ge 70\%$ confidence) is met and passes the strict server-side risk gate, a 5-tick Rise/Fall DEMO contract is placed, monitored, and settled.
- **Target Audience / Persona**: Algorithmic retail traders, quantitative researchers, and AI experimenters seeking transparent, multi-perspective model evaluation without risking real capital.
- **Key Value**: Replaces black-box trading bots with an auditable council of independent AI voters, complete with Brier score calibration, real-time latency tracking, and resilient execution.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Deriv Setup & Status Diagnostics**:
   - The user opens the Deriv Connection dialog, inputs their API token (with Trade and Application Insights permissions) and optional custom App ID.
   - The client initiates an authorization handshake. If valid, the UI transitions from "Token Needed" to a verified DEMO account status with live balance and currency (`VRTC...`).
   - If authorization fails (e.g., token expired or missing scope), the diagnostic panel explains the exact error code from Deriv (e.g., `InvalidToken`, `RateLimit`) and enables 1-click re-authorization.
2. **Dynamic Council Roster Configuration**:
   - The user accesses the "Council Roster" modal.
   - They can click **"Add Council Member"** to introduce as many voters as needed (e.g. "Mistral Scalper A" with Key 1, "Mistral Swing B" with Key 2, "Gemini Flash Macro", "FreeLLM DeepSeek").
   - For each member, the user configures: Display Name, Provider (Mistral, Gemini, FreeLLM, OpenAI, Technical Engine), Custom API Key, Target Model ID, and Voting Weight.
   - Changes are immediately saved to the server-side SQLite database.
3. **Real Market Stream & Indicator Dashboard**:
   - The user selects a live asset (Forex EUR/USD, GBP/USD, USD/JPY, or 24/7 Synthetics like Volatility 100 (1s)).
   - Real ticks populate the lightweight canvas chart in real time. Historical candles are fetched directly from Deriv's `ticks_history` API.
   - If the Forex market is closed (weekend), a clear status banner informs the user and offers 1-click switching to active 24/7 Deriv Synthetic Indices.
4. **Council Deliberation & Democratic Consensus**:
   - The user triggers manual analysis or enables auto-evaluation.
   - Real-time indicator snapshots are broadcast to all enabled council members in parallel.
   - The Council Voting Deck displays each member's vote card (Direction, Confidence, Supporting Factors, Risk Flags, Latency, and Status).
   - The Consensus Engine calculates total directional consensus and checks the Deterministic Risk Gate (Stake $\le \$1.00$, Max Daily Loss $\le \$5.00$, Max Open Positions = 1).
5. **Contract Execution & Learning Lab**:
   - Eligible setups generate a live Deriv proposal and contract purchase on the DEMO account.
   - Real ticks update the active contract progress (Entry Spot, Exit Spot, P&L).
   - Upon contract settlement, the outcome is recorded to the SQLite database and updates each voter's Brier score, directional accuracy, and historical win rate in the Learning Lab.

#### Responsive & Visual Architecture
- **Design Constitution**: Follows the Universal Frontend Design Constitution (SaaS & Dashboard specifications):
  - **Color Palette**: Dark Slate foundation (`#0B0F19`), surface cards (`#111827`), subtle hairline dividers (`border-slate-800`), accent emerald for Rise/Wins (`#10B981`), rose for Fall/Losses (`#F43F5E`), and indigo for Council consensus (`#6366F1`).
  - **Zero-Pill Discipline**: Metadata displayed as unboxed clean text separated by typographic middots (`·`). Interactive tabs are segmented control buttons.
  - **Tabular Figures**: All prices, balances, timestamps, and Brier scores use `tabular-nums font-mono` to prevent layout shift.
  - **Mobile & Tablet Responsiveness**:
    - **Mobile (< 768px)**: Stacked single-column layout, sticky compact header with Deriv DEMO status badge, horizontally scrollable council cards, swipeable asset selector, and bottom navigation bar for quick switching between Live Terminal, Council Deck, Risk Gate, and Trade Ledger.
    - **Tablet (768px - 1024px)**: 2-column balanced layout with real-time chart and council deck side by side.
    - **Desktop (> 1024px)**: Full-width high-density multi-column workspace with real-time chart, live order book / tick tape, council voting grid, and risk controller.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side SQLite Database vs Browser LocalStorage**
  - *Chosen Approach*: Lightweight server-side SQLite (`better-sqlite3` or `sqlite3`) accessed via Express REST API (`/api/settings`, `/api/council/roster`, `/api/trades/history`).
  - *Why*: Guarantees persistent storage across restarts and device browsers. Protects multiple API keys securely on the server without exposing raw credentials in client bundles. LocalStorage serves as an offline client cache.
  - *Alternatives Considered*: Cloud SQL / PostgreSQL (excessive complexity and latency for a single-user trading console); client-only LocalStorage (vulnerable to cache clears and unable to run background council jobs).

- **Decision 2: Dynamic Council Roster Architecture**
  - *Chosen Approach*: Replace fixed voter arrays with a flexible, user-extensible roster schema. Each voter record defines `{ id, name, provider, apiKey, modelId, weight, enabled }`.
  - *Why*: Allows users to deploy multiple Mistral keys, test multiple Gemini models, or connect several custom FreeLLM endpoints simultaneously.
  - *Alternatives Considered*: Hardcoded 4-slot structure (too rigid; prevents testing multiple accounts or specialized model variants from the same provider).

- **Decision 3: Deriv WebSocket Gateway Hardening & Reconnect Diagnostics**
  - *Chosen Approach*: Implement an exponential backoff auto-reconnect system with continuous 20s ping heartbeats, message queueing during reconnections, and explicit Deriv error code mapping (e.g. `InvalidToken`, `RateLimit`, `MarketClosed`).
  - *Why*: Resolves the "Deriv connection closed" and "Deriv Public Mode" loops when networks fluctuate or tokens require re-authorization.

- **Decision 4: Pure Real Market Data Policy**
  - *Chosen Approach*: Strip out all mock/synthetic fallback generators. If Deriv disconnects, show a clear reconnecting state rather than fake random-walk ticks. Include Deriv Synthetic Volatility Indices (which trade 24/7/365 with real Deriv tick feeds) so users can trade and test AI models during weekend Forex closures.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│                                                                             │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ TopBar & Diagnostics  │  │ Asset & Chart Canvas │  │ Dynamic Council  │  │
│  │ - Deriv DEMO Auth     │  │ - Real Deriv Ticks   │  │ - Multi-Voter UI │  │
│  │ - WS Latency & Heart  │  │ - EMA, RSI, MACD     │  │ - 3/4 Consensus  │  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
│              │                         │                       │            │
│              ▼                         ▼                       │            │
│  ┌────────────────────────────────────────────────────────┐    │            │
│  │ Deriv WebSocket Service (derivWs.ts)                   │    │            │
│  │ - wss://ws.derivws.com/websockets/v3?app_id=...        │    │            │
│  │ - Heartbeat ping/pong, auto-reconnect, token auth      │    │            │
│  │ - Real tick subscriptions & open contract monitoring   │    │            │
│  └────────────────────────────────────────────────────────┘    │            │
└────────────────────────────────────┬───────────────────────────┼────────────┘
                                     │                           │
                                     ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FULL-STACK SERVER (server.ts)                      │
│                                                                             │
│  ┌──────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │ Express REST & Proxy API │  │ Multi-AI Council Execution Engine       │  │
│  │ - /api/council/roster    │  │ - Gemini 3.8 Flash (SDK)                │  │
│  │ - /api/council/vote      │  │ - Mistral 1, Mistral 2, ... (Multi-Key) │  │
│  │ - /api/deriv/config      │  │ - FreeLLM API / OpenAI endpoints        │  │
│  │ - /api/ledger/trades     │  │ - Technical Control Signal Generator    │  │
│  └───────────┬──────────────┘  └─────────────────────────────────────────┘  │
│              │                                                              │
│              ▼                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ SQLite Database Layer (sqlite3 / better-sqlite3)                      │  │
│  │ - council_members (id, name, provider, api_key, model_id, weight)     │  │
│  │ - deriv_config (app_id, token, account_mode, last_connected)          │  │
│  │ - trade_ledger (contract_id, symbol, type, stake, pnl, consensus_log) │  │
│  │ - voter_performance (voter_id, total_votes, brier_score, accuracy)   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Core Data Entities

1. **CouncilMember**:
   ```typescript
   interface CouncilMember {
     id: string;
     name: string; // e.g. "Mistral Scalper A", "Mistral Trend B"
     provider: 'Mistral' | 'Gemini' | 'FreeLLM' | 'OpenAI' | 'TechnicalControl';
     apiKey: string; // Stored securely in SQLite
     modelId: string; // e.g. "mistral-small-latest", "gemini-3.8-flash"
     endpointUrl?: string; // For custom FreeLLM/OpenAI compatible servers
     weight: number; // Decimal weight (0.0 to 1.0)
     enabled: boolean;
     stats: {
       totalVotes: number;
       correctVotes: number;
       accuracy: number;
       brierScore: number;
     };
   }
   ```

2. **DerivSessionConfig**:
   ```typescript
   interface DerivSessionConfig {
     appId: string;
     token: string;
     accountMode: 'DEMO_ONLY';
     isAuthorized: boolean;
     lastError?: string;
   }
   ```

3. **TradeRecord**:
   ```typescript
   interface TradeRecord {
     contractId: string;
     timestamp: number;
     symbol: string;
     direction: 'RISE' | 'FALL';
     stake: number;
     payout: number;
     profit: number;
     status: 'won' | 'lost';
     consensusSummary: string;
     voterBreakdown: string; // JSON array of individual voter decisions
   }
   ```

---

### Implementation Phases

1. **Phase 1: Server-Side SQLite Database & Schema Migration**
   - Install `better-sqlite3` (or pure JS SQLite equivalent) and set up `src/db/sqlite.ts` / server routes.
   - Initialize tables for `council_members`, `deriv_config`, `trade_ledger`, and `voter_performance`.
   - Provide REST endpoints for fetching and updating roster members, settings, and trade logs.

2. **Phase 2: Dynamic Multi-Model Council Engine in `server.ts`**
   - Update `/api/council/vote` to accept an arbitrary roster of voters.
   - Dispatch independent analysis requests in parallel to each configured model using its assigned API key.
   - Collect and parse structured JSON responses with schema validation and strict error fallbacks.

3. **Phase 3: Deriv WebSocket Gateway Hardening & Diagnostics**
   - Enhance `src/services/derivWs.ts` with exponential backoff auto-reconnect, keepalive pings, and token validation.
   - Connect client auth directly with the backend SQLite settings so tokens persist across sessions.
   - Implement detailed error diagnostics in `DerivAuthModal` and `TopBar`.

4. **Phase 4: Responsive UI & Dynamic Roster Management**
   - Build a Roster Editor component allowing users to add, edit, test, and remove council members with individual API keys.
   - Ensure responsive layouts across mobile, tablet, and desktop viewports using Tailwind CSS.
   - Connect the live chart and indicators to Deriv tick streams without synthetic simulation.

5. **Phase 5: Verification & Quality Assurance**
   - Run `lint_applet` and `compile_applet` to ensure zero compilation or syntax errors.
   - Verify WebSocket reconnection resilience and multi-model voting execution.
