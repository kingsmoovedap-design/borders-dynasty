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