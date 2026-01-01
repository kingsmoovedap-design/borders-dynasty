# Borders Dynasty - Web3 DeFi Platform

## Overview
Borders Dynasty is a Web3 DeFi sovereign blockchain platform designed for the CodexChain/Borders Dynasty ecosystem. It features an upgradeable ERC20 token (Borders Sovereign Coin/BSC) with advanced governance controls, token transfers, minting, blacklisting, and on-chain document verification. The project aims to provide a comprehensive logistics and financial ecosystem, integrating Web3 capabilities with traditional supply chain management. Key capabilities include a multi-view loadboard, AI-powered dispatch, a loyalty system, compliance engine, risk assessment, and a rewards system, all underpinned by a secure and transparent blockchain infrastructure. The platform is QFS-Compatible and ISO-20022 ready, targeting a broad market potential in the Web3 logistics and finance space.

## User Preferences
- The agent should focus on high-level feature implementation and architectural guidance rather than granular code details.
- I prefer an iterative development approach, with regular check-ins before major changes.
- Please provide clear and concise explanations, avoiding overly technical jargon where possible.
- I expect the agent to prioritize security and compliance best practices in all development tasks.
- Do not make changes to the `contracts/` directory without explicit instruction.
- Do not make changes to the `.openzeppelin/` directory.

## System Architecture
The platform is built as a monorepo containing multiple services and packages.

**UI/UX Decisions:**
- Frontend integration with MetaMask/Web3 wallets for seamless user interaction.
- Auto-network switching and real-time balance updates enhance user experience.
- PWA support via `manifest.json` in `public/`.

**Technical Implementations:**
- **Smart Contracts:** Core contracts include `BordersSovereignCoin.sol` (upgradeable ERC20 with roles, blacklist, pausable, 1M cap), `DynasticIdentity.sol` (Soulbound NFT), and `ScrollHashRegistry.sol` (document hash verification).
- **Backend Services:**
    - **Logistics API:** An Express-based API (`apps/api/`) utilizing a `FreightEngine` for load management, integrated with various domain-specific packages.
    - **Codex Ecclesia:** A separate service (`packages/codex/`) for hash-chain record keeping and anchoring.
- **Database:** PostgreSQL with Drizzle ORM for persistent storage of loads, drivers, contracts, credit lines, and payouts.
- **Development Environment:** Webpack for frontend bundling with Babel, Hardhat for Ethereum development (Sepolia network), and OpenZeppelin Upgrades for transparent proxy patterns.

**Feature Specifications:**
- **Web3 DeFi:** Wallet connection, BSC token transfers, admin minting, blacklisting, on-chain document verification, network detection, real-time balance updates, transaction logging.
- **Logistics Core:** `FreightEngine` for load management with various modes (GROUND, AIR, OCEAN, COURIER) and regions (NORTH_AMERICA, EUROPE, ASIA_PACIFIC, LATAM).
- **Advanced Systems:**
    - `TreasuryEngine`: BSC token escrow and payouts.
    - `DevineCredit`: Driver credit lines and advances.
    - `AI Dispatch`: AI-powered driver suggestions and load profitability analysis.
    - `Loyalty System`: 5-tier driver progression with points, badges, and streaks.
    - `Compliance Engine`: Mode, region, and cargo rule validation.
    - `Risk Radar`: 6-category composite risk scoring.
    - `Security Layer`: Rate limiting, anomaly detection, API key management.
    - `Token Trading`: Multi-token support (BSC, ETH, USDC, USDT, WETH, DAI) with swap functionality.
- **Portals:** `Single Operator Portal` with AI guidance, `Omega Portal` for leadership control.
- **Governance:** On-chain constitution, ministries, roles, and a driver charter.
- **Live Intelligence:** Real-time market, operational, and partner data for dispatch adjustments.

**System Design Choices:**
- **Monorepo Structure:** Organizes various microservices and packages for better management and code sharing.
- **Upgradeable Contracts:** Utilizes OpenZeppelin Upgrades for future-proof smart contract design.
- **API-First Approach:** Comprehensive set of RESTful APIs for all core functionalities, including ops, treasury, dispatch, loyalty, compliance, risk, rewards, and security.
- **Modular Design:** Separation of concerns into distinct packages (e.g., `freight-logic`, `treasury`, `compliance`, `risk-radar`).

## External Dependencies
- **MetaMask/Web3 Wallets:** For user authentication and transaction signing.
- **Etherscan:** Contract verification on the Sepolia network.
- **Codex Ecclesia:** An external (or co-deployed) service for hash-chain record keeping, accessed via `CODEX_URL`.
- **PostgreSQL:** Primary database for persistent data storage, integrated with Drizzle ORM.
- **Hardhat:** Ethereum development environment.
- **OpenZeppelin Upgrades:** For smart contract upgradeability.
- **Webpack:** Frontend asset bundling.
- **Babel:** JavaScript transpilation.
- **Render.com:** Automated deployment platform.

## New Packages (AI-Powered Logistics OS)
- `packages/ai-contract-capture/` - AI Contract Capture Engine for external loadboard scanning
- `packages/knowledge-corpus/` - Knowledge Corpus (Law, Commerce, Logistics, Freight domains)
- `packages/ai-dispatch-brain/` - AI Dispatch Brain with multi-factor scoring and predictions
- `packages/enhanced-loadboard/` - Enhanced Loadboard with 4 views (Shipper, Driver, Ops, Omega)
- `packages/cross-chain-evolution/` - Cross-Chain Token Evolution framework

## AI Contract Capture API Endpoints
- `GET /capture/loadboards` - List external loadboard integrations (DAT, Truckstop, etc.)
- `POST /capture/scan` - Scan external loadboards for contracts (auth required)
- `POST /capture/score` - Score a contract for Dynasty fit
- `POST /capture/capture` - Capture a qualified contract (auth required)
- `POST /capture/convert/:contractId` - Convert captured contract to Dynasty load (auth required)
- `GET /capture/captured` - List captured contracts with filters
- `GET /capture/qualified` - Get contracts ready for conversion
- `GET /capture/stats` - Contract capture statistics

## Knowledge Corpus API Endpoints
- `GET /knowledge/domains` - List all knowledge domains (Law, Commerce, Logistics, Freight)
- `GET /knowledge/domains/:domainId` - Get domain with categories and topics
- `GET /knowledge/search?q=query` - Search knowledge corpus
- `POST /knowledge/query` - Process knowledge query with AI guidance
- `GET /knowledge/stats` - Knowledge corpus statistics

## AI Dispatch Brain API Endpoints
- `GET /brain/model` - Get dispatch scoring model and weights
- `GET /brain/fallbacks` - Get fallback strategies for dispatch
- `POST /brain/profile` - Initialize driver profile (auth required)
- `GET /brain/profile/:driverId` - Get driver profile
- `PUT /brain/profile/:driverId` - Update driver profile (auth required)
- `POST /brain/score` - Score driver for load
- `POST /brain/predict-acceptance` - Predict driver acceptance probability
- `POST /brain/suggestions` - Generate dispatch suggestions with predictions
- `POST /brain/outcome` - Record dispatch outcome for learning (auth required)
- `GET /brain/analytics` - Get dispatch analytics

## Enhanced Loadboard API Endpoints
- `GET /loadboard/views` - Get available views (Shipper, Driver, Ops, Omega)
- `GET /loadboard/statuses` - Get load status definitions
- `POST /loadboard/post` - Post new load with AI pricing (auth required)
- `GET /loadboard/:view` - Get loads for specific view (shipper, driver, ops, omega)
- `POST /loadboard/assign` - Assign load to driver (auth required)
- `PUT /loadboard/status/:loadId` - Update load status (auth required)
- `GET /loadboard/capacity` - Get capacity overview with gaps
- `GET /loadboard/revenue` - Get revenue analytics
- `GET /loadboard/lanes` - Get lane analytics
- `GET /loadboard/penetration` - Get market penetration metrics

## Cross-Chain Evolution API Endpoints
- `GET /crosschain/chains` - List all supported chains
- `GET /crosschain/active` - Get active chains (currently Sepolia)
- `GET /crosschain/planned` - Get planned chains (Polygon, Arbitrum, Base, etc.)
- `GET /crosschain/dex` - Get DEX integrations (Uniswap, SushiSwap, etc.)
- `GET /crosschain/phases` - Get evolution phases
- `GET /crosschain/progress` - Get overall progress
- `GET /crosschain/staking` - Get staking tiers and APY
- `POST /crosschain/staking/calculate` - Calculate staking rewards
- `GET /crosschain/bridge` - Get bridge status and planned chains
- `GET /crosschain/tokenomics` - Get BSC tokenomics
- `GET /crosschain/roadmap` - Get complete cross-chain roadmap