# Dynasty OS – Extended Token Economics Event Taxonomy

This document extends the Codex event taxonomy for both Token A (utility) and Token B (governance).

---

## 1. Token A – Utility & Rewards (BSC)

### 1.1 Supply & Treasury

- `TOKEN_A_MINTED`
- `TOKEN_A_BURNED`
- `TOKEN_A_TREASURY_DEPOSITED`
- `TOKEN_A_TREASURY_WITHDRAWN`

### 1.2 Rewards & Fees

- `TOKEN_A_REWARD_DISTRIBUTED`
- `TOKEN_A_FEE_COLLECTED`
- `TOKEN_A_STAKED`
- `TOKEN_A_UNSTAKED`
- `TOKEN_A_TRANSFERRED`

---

## 2. Token B – Governance & Alignment (L1)

### 2.1 Governance & Staking

- `TOKEN_B_STAKED`
- `TOKEN_B_UNSTAKED`
- `TOKEN_B_VOTE_CAST`
- `TOKEN_B_GOVERNANCE_DECISION`

### 2.2 Treasury

- `TOKEN_B_TREASURY_DEPOSITED`
- `TOKEN_B_TREASURY_WITHDRAWN`

---

## 3. Cross‑Chain & Treasury Flows

- `CROSS_CHAIN_LOCK`
- `CROSS_CHAIN_MINT`
- `CROSS_CHAIN_BURN`
- `CROSS_CHAIN_RELEASE`
- `TREASURY_SWAP_BSC_TO_MAIN`
- `TREASURY_SWAP_MAIN_TO_BSC`

---

## 4. Event Payload Structure (Conceptual)

Example structure:

```json
{
  "event_id": "uuid",
  "event_type": "TOKEN_A_REWARD_DISTRIBUTED",
  "timestamp": "ISO-8601",
  "chain": "BSC",
  "actor": "treasury_service",
  "entity": "wallet",
  "entity_id": "0x...",
  "amount": "123.45",
  "token_symbol": "DYNA",
  "metadata": {
    "reason": "driver_performance",
    "load_id": "LOAD-12345"
  }
}
