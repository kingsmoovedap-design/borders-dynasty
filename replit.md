# Borders Dynasty - CodexChain Frontend

## Overview
A sovereign blockchain platform for the CodexChain/Borders Dynasty ecosystem. Features an upgradeable ERC20 token (Borders Sovereign Coin/BSC) with advanced governance controls, integrated with the Codex Ecclesia sister repository for cross-repository identity and governance.

## Live Deployment
- **Contract Address**: `0x12efC9a5D115AE7833c9a6D79f1B3BA18Cde817c` (Sepolia)
- **Implementation**: `0xa0aE7B3bf4BB6e47Eebf858e50A34A570E156582` (Verified on Etherscan)
- **Sovereign Wallet**: `0xE89fDED72D0D83De3421C6642FA035ebE197804f`

## Project Structure
- `src/` - Frontend source files (index.js, index.html)
- `contracts/` - Solidity smart contracts (BordersSovereignCoin, DynasticIdentity, ScrollHashRegistry)
- `scripts/` - Deployment and utility scripts
- `test/` - Test files
- `dist/` - Built output (generated)
- `.openzeppelin/` - Proxy deployment manifests

## Smart Contracts
- **BordersSovereignCoin.sol**: Upgradeable ERC20 with MINTER_ROLE, GUARD_ROLE, blacklist, pausable, 1M cap
- **DynasticIdentity.sol**: Soulbound NFT for royal titles and sovereign recognition
- **ScrollHashRegistry.sol**: On-chain document verification via keccak256 hashes

## Development
- Run `npm run dev` to start the webpack dev server on port 5000
- Run `npm run build` to create production bundle in `dist/`
- Run `npx hardhat run scripts/deploy-upgradeable.js --network sepolia` to deploy contracts

## Key Configuration
- Webpack bundles the app with babel transpilation
- Dev server configured on port 5000 with hot reloading and WebSocket fix
- Hardhat configured for Ethereum development (Sepolia network)
- OpenZeppelin Upgrades plugin for transparent proxy pattern

## Cross-Repository Integration
- **Codex Ecclesia**: Synchronized via ECCLESIA_INTEGRATION_URL and DYNASTY_SHARED_SECRET
- **Nation Sovereign ID**: DYNASTY-BORDERS-001
- **Public Notice URL**: https://codex-ecclesia-public.onrender.com/api/notices

## Compliance
- QFS-Compatible Architecture (v1.0)
- ISO-20022 Ready
- Full Etherscan verification

## Deployment
Static deployment configured - builds with webpack and serves from `dist/` directory.
Render.yaml configured for automated deployment with environment secrets.
