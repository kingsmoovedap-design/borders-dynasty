# Web3 DeFi Core – Borders Sovereign Coin (BSC)

## 1. Overview

Borders Sovereign Coin (BSC) is an upgradeable, governance‑ready ERC‑20–compatible token designed as the Web3 DeFi core of the Borders Dynasty ecosystem. It is architected for compatibility with EVM chains, DeFi integrations, and Dynasty OS Codex logging.

> This specification is conceptual and technical; it is not financial, legal, or investment advice.

---

## 2. Token properties

- **Name:** Borders Sovereign Coin  
- **Symbol:** BSC  
- **Total Supply Cap:** 1,000,000 BSC  
- **Standard:** ERC‑20–compatible (OpenZeppelin base)  
- **Deployment Pattern:** Upgradeable proxy (Hardhat + OpenZeppelin Upgrades)  
- **Initial Network(s):**  
  - Testnet: Sepolia (verification via Etherscan)  
  - Target Production: EVM‑compatible chains (e.g. BNB Smart Chain / others as configured)

---

## 3. Core smart contract features

### 3.1 Upgradeable ERC‑20

- Implemented as an upgradeable contract using a proxy pattern.
- Logic is deployed separately from storage, allowing controlled upgrades via admin roles.
- Uses OpenZeppelin Upgrades tooling, managed via Hardhat.

### 3.2 Role‑based access control

- Distinct roles for:
  - **ADMIN_ROLE:** upgrade control, role management, emergency controls.
  - **MINTER_ROLE:** authorized entities allowed to mint within the cap.
  - **PAUSER_ROLE:** authorized entities allowed to pause/unpause transfers (if separated).
- Roles are assignable and revocable via governance or operational policy (off‑chain).

### 3.3 Capped supply

- Maximum total supply: 1,000,000 BSC.
- Minting operations are blocked once cap is reached.
- Cap defined in contract and enforced at mint time.

### 3.4 Pausable transfers

- Transfers can be globally paused by authorized role(s).
- Intended use:
  - incident response
  - migration scenarios
  - system maintenance
- While paused, transfer/transferFrom operations revert; mint/burn behavior is defined per implementation.

### 3.5 Blacklist

- Contract maintains a blacklist for individual addresses.
- Blacklisted addresses are prevented from transferring tokens (and possibly from receiving, depending on implementation).
- Blacklisting operations are restricted to authorized governance/ops roles.

---

## 4. ScrollHashRegistry – On‑chain document verification

Borders Sovereign Coin integrates with a `ScrollHashRegistry` contract (or equivalent) to support:

- On‑chain storage of document content hashes.
- Verification that a given off‑chain document (e.g. PDF, charter, Codex chapter) matches a registered hash.
- Association between token ecosystem actions and referenced documents.

Typical usage:

1. Compute hash of a document off‑chain (e.g. SHA‑256).
2. Register hash on‑chain via `ScrollHashRegistry`.
3. Store reference to the registry entry in:
   - Codex events
   - Certificates
   - Audit records
4. Later, re‑hash the document and compare to the on‑chain value.

This enables integrity verification of Dynasty OS documents and records conceptually linked to BSC.

---

## 5. Wallet and Web3 integration

### 5.1 MetaMask / Web3 compatibility

- Token is fully ERC‑20–compatible:
  - Standard `balanceOf`, `transfer`, `transferFrom`, `approve`, `allowance`.
- Works with:
  - MetaMask
  - Any EVM wallet that supports custom tokens
  - Web3.js / Ethers.js integrations

### 5.2 Network detection

Frontends can:

- Detect connected network (e.g. Sepolia testnet, BNB Smart Chain, etc.).
- Prompt user to switch to the expected network.
- Show:
  - correct token address per network
  - warnings when connected to an unsupported network

---

## 6. Application‑level features

### 6.1 Real‑time balances

- Frontend polls or subscribes (via provider or indexer) to:
  - `balanceOf(userAddress)`
- UI displays:
  - current BSC balance
  - historical transaction list (via on‑chain logs or indexer API)

### 6.2 Transaction logging

- Transfers and mints/burns are visible via standard ERC‑20 `Transfer` events.
- Additional internal logging can be routed to:
  - Application database
  - Codex event stream (conceptually)
- Codex entries can reference:
  - transaction hash
  - block number
  - ScrollHashRegistry entries for associated documents, if relevant

### 6.3 Multi‑token trading (frontend layer)

- UI can support viewing and interacting with multiple tokens:
  - BSC (Borders Sovereign Coin)
  - Additional ERC‑20 tokens used in the ecosystem
- Backend can:
  - aggregate balances across tokens
  - provide unified transaction history
- Any trading functionality is mediated by external DeFi infrastructure and is out of scope of this spec; this document only notes compatibility.

---

## 7. Tooling and deployment

### 7.1 Hardhat

- Used for:
  - contract compilation
  - deployment
  - testing
  - scripting upgrades

### 7.2 OpenZeppelin Upgrades

- Used to:
  - manage proxy deployments
  - handle admin/upgrade transactions
  - ensure safety checks on new implementation contracts

### 7.3 Contract verification

- Example test deployment:
  - Network: Sepolia
  - Verification: Etherscan
- Production deployments should likewise be verified on relevant explorers for transparency.

---

## 8. Position in the Borders Dynasty dual‑token system

In a dual‑token architecture:

- **BSC (Borders Sovereign Coin)** acts as:
  - the operational and accounting token inside the Dynasty OS
  - the base unit for logistics rewards and internal denominated value (conceptually)

- A second token (e.g. **Borders Dynasty Coin – BDC**, specified elsewhere) can act as:
  - governance and long‑term alignment token
  - higher‑layer control over parameters affecting BSC usage and distribution (conceptually)

Relations, constraints, and governance links between BSC and any secondary token are defined in a separate dual‑token architecture document.

---

## 9. Disclaimer

This specification describes technical architecture and conceptual roles only.  
It does not define any financial characteristics, legal status, guarantees, or rights associated with BSC.  
All regulatory, tax, and legal interpretations depend on external jurisdiction‑specific analysis and are outside the scope of this document.

