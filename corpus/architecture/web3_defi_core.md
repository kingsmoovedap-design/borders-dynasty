# Web3 DeFi Core – Borders Dynasty Architecture

This chapter describes how the Borders Sovereign Coin (BSC), Borders Dynasty Coin (BDC), Codex, and the Logistics OS interoperate as a Web3 DeFi–aware system. All descriptions are technical and conceptual only.

---

## 1. Components

### 1.1 Borders Sovereign Coin (BSC) – Operational Token

- **Chain:** BNB Smart Chain (BSC)
- **Standard:** BEP-20 (ERC-20–compatible)
- **Pattern:** Upgradeable ERC-20 with:
  - 1,000,000 token cap
  - Role-based minting
  - Pausable transfers
  - Address blacklist
  - Integration with `ScrollHashRegistry` for document hash anchoring

**Role:**

- Operational Web3 DeFi core token for the Logistics OS
- Conceptual internal denomination unit for rewards and accounting
- Token used in application-level incentive mechanisms (rewards, promotions)

---

### 1.2 Borders Dynasty Coin (BDC) – Governance Token

- **Chain:** Arbitrum One (EVM-compatible L2)
- **Standard:** ERC-20–compatible, upgradeable
- **Role:**
  - Governance and alignment layer
  - Long-term system orientation and protocol-level signaling
  - Provides a structured framework for parameter discussions and conceptual influence

---

### 1.3 Codex Event Spine

Codex is an application-level event log and state reference that:

- Ingests:
  - BSC token events (rewards, transfers, treasury ops)
  - BDC token events (staking, governance)
  - Logistics OS events (loads, routes, performance)
  - Document hash references via `ScrollHashRegistry`
- Serves as:
  - A unified analysis and audit layer
  - A cross-chain narrative of system behavior

---

### 1.4 Logistics OS

The Logistics OS encompasses operational systems such as:

- Load board and dispatch logic
- Driver and partner records
- Performance metrics and scoring
- Payout and settlement logic (conceptual, not financial)

The OS:

- Uses BSC as a token of reference for rewards and incentives.
- Records key events into Codex.
- May consume BDC governance signals via configuration modules.

---

## 2. Cross-Layer Flows

### 2.1 Operational Flow (BSC-Centric)

1. A logistics event occurs (e.g., load completed).
2. Application computes a conceptual reward in BSC units.
3. BSC transfer (on-chain) is executed or recorded as a pending payout.
4. Codex logs:
   - `BSC_REWARD_GRANTED`
   - Associated logistic IDs (e.g., load ID, driver ID)
   - Optional hash reference in `ScrollHashRegistry`

### 2.2 Governance Flow (BDC-Centric)

1. A governance topic is created (e.g., adjustment of reward factors).
2. BDC holders participate via a governance UI (off-chain or on-chain).
3. Governance results are summarized into a Codex event:
   - `BDC_GOVERNANCE_DECISION`
4. Application consumes decision outcomes and may update configuration.

---

## 3. Conceptual Direct Impact Between Tokens

- BSC usage and performance metrics inform BDC governance:
  - High or low utilization can trigger governance topics.
  - Historical Codex data supports governance evaluation.

- BDC staking and decisions inform BSC application-level usage:
  - Staked BDC may unlock reward multipliers or advanced features (application logic).
  - Governance decisions may adjust how BSC-based incentives are calculated.

No automatic financial mechanisms are implied; all impact is mediated by application services and Codex.

---

## 4. DeFi Considerations (Conceptual Only)

BSC and BDC are designed so that:

- Both are compatible with ERC-20–based DeFi infrastructure.
- Treasury modules can conceptually hold BSC and BDC.
- Any DeFi usage (e.g., liquidity provision, staking) is implemented separately and must be documented in its own specification.

This chapter does not define or recommend any specific DeFi strategy.

---

## 5. Summary

- BSC is the Web3 DeFi core and operational token.
- BDC is the governance and alignment token on Arbitrum.
- Codex is the cross-chain event and analysis spine.
- Logistics OS is the real-world operational engine.

All components are EVM-compatible and can be integrated using standard Web3 tooling.

