# Dynasty OS – Dual‑Token Architecture

This document defines the conceptual architecture of the Dynasty OS dual‑token system:

- **Token A – Dynasty Utility (BSC)**  
- **Token B – Dynasty Governance (Major L1)**  

Together they form a unified economic and governance spine for the Logistics Dynasty.

---

## 1. Token A – Dynasty Utility (BSC)

### 1.1 Chain & Standard
- Chain: BNB Smart Chain (BSC)
- Standard: BEP‑20 (EVM‑compatible)

### 1.2 Purpose
- Operational utility
- In‑app economic fuel
- Driver & partner rewards
- Logistics‑native incentives

### 1.3 Core Functions (Conceptual)
- Pay in‑app fees
- Earn for completing loads or contributing to network
- Stake for operational benefits (routing priority, marketplace placement)
- Participate in loyalty and rewards programs

---

## 2. Token B – Dynasty Governance (Major Chain)

### 2.1 Chain & Standard
- Chain: Major L1 (e.g. Ethereum mainnet or similar)
- Standard: ERC‑20‑style governance/reserve asset

### 2.2 Purpose
- Governance & strategic alignment
- Long‑term staking and commitment
- Prestige & status within the Dynasty ecosystem
- Treasury reserve / “crown” asset (conceptual)

### 2.3 Core Functions (Conceptual)
- Signaling preferences on protocol parameters
- Staking to access advanced analytics or decision layers
- Participation in governance processes
- Representing long‑term alignment with the Logistics Dynasty

---

## 3. Role Separation & Harmony

Token A and Token B are intentionally non‑identical:

- **Token A (BSC):** High‑frequency logistics usage, rewards, internal fees.
- **Token B (L1):** Low‑frequency, high‑commitment governance and prestige.

Harmony principles:

1. Clear separation of purpose
2. Shared Codex event spine
3. Shared treasury view
4. Unified narrative and UI presence

---

## 4. Economic Interaction (Conceptual)

### 4.1 Dual Staking (Conceptual)
- Stake Token A → unlock operational perks, enhanced rewards.
- Stake Token B → unlock governance participation, higher‑tier insights, and potential multipliers on Token A actions.

### 4.2 Treasury Co‑Presence
- Treasury logically tracks both Token A and Token B.
- Codex logs all treasury movements, swaps, and allocations.

### 4.3 Logistics Binding
- Token A ties directly to load completion, route success, and driver metrics.
- Token B ties to activation of new regions, modes, and strategic parameters.

---

## 5. Codex Integration

Both tokens emit structured Codex events:

- Token A: operational and reward side
- Token B: governance, staking, and cross‑chain side

Codex provides:

- Auditability
- Narrative continuity
- Intelligence for future decisions

---

# Borders Dynasty Coin (BDC)
## Governance‑Layer Token Specification (Conceptual)

Borders Dynasty Coin (BDC) is the governance‑layer token of the Borders Dynasty ecosystem.  
It is designed to sit above the Borders Sovereign Coin (BSC) Web3 DeFi Core and provide a structured, technical, and conceptual mechanism for long‑term alignment, governance signaling, and protocol‑level decision architecture.

This specification is technical and conceptual only.  
It does not define financial characteristics, guarantees, or legal status.

---

## 1. Token Identity

- **Name:** Borders Dynasty Coin  
- **Symbol:** BDC  
- **Standard:** ERC‑20–compatible  
- **Chain:** Major EVM L1 (e.g., Ethereum, Arbitrum, Avalanche, Polygon)  
- **Deployment Pattern:** Upgradeable proxy (OpenZeppelin Upgrades)  
- **Supply Model:** Fixed or governance‑defined (conceptual)  
- **Primary Role:** Governance, alignment, and protocol‑level signaling  

BDC is not an operational token.  
It is a **governance‑layer asset** that conceptually influences parameters affecting BSC usage, logistics incentives, and Codex‑recorded system behavior.

---

## 2. Functional Domains

### 2.1 Governance Signaling (Conceptual)
BDC holders may participate in governance‑style signaling processes such as:

- expressing preferences on protocol parameters  
- participating in structured governance discussions  
- influencing reward weightings, logistics priorities, or treasury policies (conceptual)  

Codex events:
- `BDC_VOTE_CAST`  
- `BDC_GOVERNANCE_DECISION`  

### 2.2 Staking & Alignment (Conceptual)
BDC may be staked to unlock:

- advanced analytics  
- Dynasty Council dashboards  
- conceptual influence over long‑term system direction  
- enhanced visibility or privileges in the Logistics OS  

Codex events:
- `BDC_STAKED`  
- `BDC_UNSTAKED`  

### 2.3 Prestige & Identity Layer
BDC represents long‑term alignment with the Dynasty OS architecture.  
It may conceptually unlock:

- identity badges  
- ceremonial roles  
- access to advanced system modules  

---

## 3. Relationship to Borders Sovereign Coin (BSC)

BDC sits **above** BSC in the system hierarchy.

### 3.1 BSC = Operational Layer
- logistics rewards  
- internal denominated value  
- driver/partner incentives  
- treasury accounting unit  
- Web3 DeFi Core token  

### 3.2 BDC = Governance Layer
- long‑term alignment  
- protocol direction  
- conceptual influence over BSC reward parameters  
- treasury oversight (conceptual)  

### 3.3 Interaction Patterns (Conceptual)
- BDC staking may unlock BSC reward multipliers  
- BSC usage metrics may inform BDC governance topics  
- Treasury may track both BSC and BDC  
- Codex logs cross‑token interactions  

---

## 4. Smart Contract Features

- ERC‑20–compatible  
- Upgradeable proxy pattern  
- Role‑based access control  
- Optional governance hooks  
- Optional staking module  
- Optional Codex integration hooks  

---

## 5. Codex Integration

All major BDC actions generate Codex events:

- `BDC_STAKED`  
- `BDC_UNSTAKED`  
- `BDC_VOTE_CAST`  
- `BDC_GOVERNANCE_DECISION`  
- `TREASURY_SWAP_BSC_TO_BDC` (conceptual)  
- `TREASURY_SWAP_BDC_TO_BSC` (conceptual)  

Codex provides:

- transparency  
- auditability  
- narrative continuity  
- system‑wide coherence  

---

## 6. Disclaimer

This specification is conceptual and technical only.  
It does not define financial characteristics, legal status, or guarantees.  
All regulatory and legal interpretations depend on external analysis.

# Web3 DeFi Core – Borders Dynasty Architecture

This section defines the Web3 DeFi Core of the Borders Dynasty ecosystem and explains how:

- Borders Sovereign Coin (BSC)
- Borders Dynasty Coin (BDC)
- Codex Event Spine
- Logistics OS

interoperate in a unified, technical, conceptual architecture.

---

## 1. System Layers

### 1.1 Operational Layer – BSC (Borders Sovereign Coin)

BSC is the operational token of the system:

- upgradeable ERC‑20–compatible  
- role‑based minting  
- capped supply (1M)  
- pausable transfers  
- blacklist  
- on‑chain document verification via ScrollHashRegistry  
- MetaMask/Web3 integration  
- real‑time balances and transaction logging  

BSC is used for:

- logistics rewards  
- internal denominated value  
- treasury accounting  
- operational incentives  

---

### 1.2 Governance Layer – BDC (Borders Dynasty Coin)

BDC sits above BSC and provides:

- governance signaling  
- long‑term alignment  
- staking for advanced access  
- conceptual influence over protocol parameters  

BDC is not used for logistics operations.  
It is used for **direction**, not **flow**.

---

### 1.3 Codex Event Spine

Codex is the unified event ledger for:

- BSC operational events  
- BDC governance events  
- treasury movements  
- logistics events  
- document verification events  

Codex ensures:

- transparency  
- auditability  
- narrative continuity  
- system‑wide coherence  

---

### 1.4 Logistics OS

The Logistics OS uses:

- BSC for rewards and denominated value  
- Codex for event logging  
- BDC for governance‑layer signaling  

Logistics actions (e.g., load completion) generate:

- BSC reward events  
- Codex operational events  
- optional governance‑related metrics  

---

## 2. Cross‑Layer Interactions (Conceptual)

### 2.1 BSC → Logistics
- BSC rewards drivers and partners  
- BSC denominates internal value  

### 2.2 Logistics → Codex
- Codex logs operational events  
- Codex links to ScrollHashRegistry for document verification  

### 2.3 Codex → BDC
- Codex provides data for governance discussions  
- BDC holders can conceptually influence parameters  

### 2.4 BDC → BSC
- BDC staking may unlock BSC reward multipliers  
- BDC governance may conceptually influence BSC reward weights  

---

## 3. Treasury Integration (Conceptual)

Treasury tracks:

- BSC (operational reserves)  
- BDC (governance reserves)  

Codex logs:

- `TREASURY_SWAP_BSC_TO_BDC`  
- `TREASURY_SWAP_BDC_TO_BSC`  

These are conceptual, not financial guarantees.

---

## 4. System Summary

- **BSC** = operational, logistics, denominated value  
- **BDC** = governance, alignment, long‑term direction  
- **Codex** = unified event spine  
- **Logistics OS** = real‑world operational layer  

Together, they form the **Borders Dynasty Web3 DeFi Core**.

