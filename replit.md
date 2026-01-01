# Borders Dynasty - Web3 DeFi Platform

## Overview
Borders Dynasty is a Web3 DeFi sovereign blockchain platform for the CodexChain/Borders Dynasty ecosystem. It features an upgradeable ERC20 token (Borders Sovereign Coin/BSC) with advanced governance, token transfers, minting, blacklisting, and on-chain document verification. The platform integrates Web3 capabilities with traditional supply chain management, offering a multi-view loadboard, AI-powered dispatch, loyalty system, compliance engine, risk assessment, and rewards system. It is QFS-Compatible and ISO-20022 ready, targeting the Web3 logistics and finance market.

## User Preferences
- The agent should focus on high-level feature implementation and architectural guidance rather than granular code details.
- I prefer an iterative development approach, with regular check-ins before major changes.
- Please provide clear and concise explanations, avoiding overly technical jargon where possible.
- I expect the agent to prioritize security and compliance best practices in all development tasks.
- Do not make changes to the `contracts/` directory without explicit instruction.
- Do not make changes to the `.openzeppelin/` directory.

## System Architecture
The platform is a monorepo comprising multiple services and packages.

**UI/UX Decisions:**
- Frontend supports MetaMask/Web3 wallet integration, auto-network switching, and real-time balance updates.
- PWA support is provided via `manifest.json`.

**Technical Implementations:**
- **Smart Contracts:** Core contracts include `BordersSovereignCoin.sol` (upgradeable ERC20 with roles, blacklist, pausable, 1M cap), `DynasticIdentity.sol` (Soulbound NFT), and `ScrollHashRegistry.sol` (document hash verification).
- **Backend Services:** An Express-based Logistics API (`apps/api/`) uses a `FreightEngine` for load management. `Codex Ecclesia` (`packages/codex/`) handles hash-chain record keeping.
- **Database:** PostgreSQL with Drizzle ORM (server) and raw pg Pool queries (CommonJS packages) stores loads, drivers, contracts, credit lines, payouts, mobile operators, load notifications, buybacks, bridge transactions, fiat transactions, and Ecclesia anchors.
- **Database Persistence Pattern:** New packages (mobile-operator, bsc-bridge, ecclesia-integration) use in-memory Maps for performance caching combined with PostgreSQL persistence via db-persistence.cjs modules. All key operations are async and persist to database.
- **Development Environment:** Webpack for frontend, Hardhat for Ethereum development (Sepolia), and OpenZeppelin Upgrades for smart contract proxy patterns.

**Feature Specifications:**
- **Web3 DeFi:** Wallet connection, BSC token management (transfers, minting, blacklisting), on-chain document verification, network detection, real-time balance, transaction logging, and multi-token trading.
- **Logistics Core:** `FreightEngine` supports various modes (GROUND, AIR, OCEAN, COURIER) and regions.
- **Advanced Systems:** Includes `TreasuryEngine` (token escrow), `DevineCredit` (driver credit), `AI Dispatch` (driver suggestions, profitability), `Loyalty System` (tiered progression), `Compliance Engine`, `Risk Radar` (6-category scoring), and `Security Layer` (rate limiting, anomaly detection).
- **Portals:** `Single Operator Portal` with AI guidance and `Omega Portal` for leadership.
- **Governance:** On-chain constitution, ministries, roles, and driver charter.
- **Live Intelligence:** Real-time data for dispatch adjustments.
- **AI-Powered Logistics OS:** New packages include `ai-contract-capture`, `knowledge-corpus`, `ai-dispatch-brain`, `enhanced-loadboard`, and `cross-chain-evolution`.
- **API Categories:** Comprehensive APIs for AI Contract Capture, Knowledge Corpus, AI Dispatch Brain, Enhanced Loadboard, Cross-Chain Evolution, Reverse Logistics, Courier Hub, Universal Contract Capture, Multimodal Distribution, Mobile Owner/Operator App, BSC Bridge & Buyback, and Ecclesia Integration.

**System Design Choices:**
- **Monorepo Structure:** Facilitates management and code sharing across microservices.
- **Upgradeable Contracts:** Ensures future-proof smart contract design via OpenZeppelin Upgrades.
- **API-First Approach:** Core functionalities exposed through RESTful APIs.
- **Modular Design:** Separation of concerns into distinct packages (e.g., `freight-logic`, `treasury`).

## External Dependencies
- **MetaMask/Web3 Wallets:** User authentication and transaction signing.
- **Etherscan:** Contract verification on Sepolia network.
- **Codex Ecclesia:** External service for hash-chain record keeping.
- **PostgreSQL:** Primary database.
- **Hardhat:** Ethereum development environment.
- **OpenZeppelin Upgrades:** Smart contract upgradeability.
- **Webpack:** Frontend asset bundling.
- **Babel:** JavaScript transpilation.
- **Render.com:** Automated deployment platform.