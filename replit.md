# Borders Dynasty - CodexChain Frontend

## Overview
A blockchain-related frontend application for the CodexChain/Borders Dynasty project. Built with webpack and includes Hardhat for smart contract development.

## Project Structure
- `src/` - Frontend source files (index.js, index.html)
- `contracts/` - Solidity smart contracts
- `scripts/` - Deployment and utility scripts
- `test/` - Test files
- `dist/` - Built output (generated)

## Development
- Run `npm run dev` to start the webpack dev server on port 5000
- Run `npm run build` to create production bundle in `dist/`

## Key Configuration
- Webpack bundles the app with babel transpilation
- Dev server configured on port 5000 with hot reloading
- Hardhat configured for Ethereum development (Sepolia network)

## Deployment
Static deployment configured - builds with webpack and serves from `dist/` directory.
