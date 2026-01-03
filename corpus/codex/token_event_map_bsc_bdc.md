# Codex Event Map – BSC and BDC Interactions

This document defines key Codex event types related to Borders Sovereign Coin (BSC) and Borders Dynasty Coin (BDC).

---

## 1. BSC-Related Events (Operational Layer)

### 1.1 Supply and Treasury

- `BSC_MINTED`
- `BSC_BURNED`
- `BSC_TREASURY_DEPOSITED`
- `BSC_TREASURY_WITHDRAWN`

### 1.2 Rewards and Transfers

- `BSC_REWARD_GRANTED`
- `BSC_REWARD_CLAIMED`
- `BSC_TRANSFER_RECORDED`
- `BSC_FEE_RECORDED` (application-level fees, if any)

Each event should include:

- `chain: "BSC"`
- `token: "BSC"`
- `amount`
- `from` / `to` (as applicable)
- References to logistics entities (e.g., driver, load, route IDs) if relevant.

---

## 2. BDC-Related Events (Governance Layer)

### 2.1 Staking and Alignment

- `BDC_STAKED`
- `BDC_UNSTAKED`

Payload includes:

- `chain: "Arbitrum"`
- `token: "BDC"`
- `staker_address`
- `amount`
- Optional: `stake_purpose`, `stake_tier`

### 2.2 Governance

- `BDC_VOTE_CAST`
- `BDC_GOVERNANCE_DECISION`

Payload includes:

- `proposal_id`
- `voter_address` (for `BDC_VOTE_CAST`)
- `decision_outcome` (for `BDC_GOVERNANCE_DECISION`)
- Optional: references to affected configuration keys in the Logistics OS.

---

## 3. Cross-Token / Treasury Events

### 3.1 Conceptual Treasury Swaps

- `TREASURY_SWAP_BSC_TO_BDC`
- `TREASURY_SWAP_BDC_TO_BSC`

These events do not define on-chain mechanics; they describe conceptual accounting movements decided at the application/treasury layer.

Payload includes:

- `source_token` / `target_token`
- `source_chain` / `target_chain`
- `notional_amount`
- `reason` (e.g., "rebalance", "governance_decision_reference")
- `treasury_entity_id`

---

## 4. Document and Policy Link Events

When governance or treasury actions are tied to documents:

- `DOC_HASH_REGISTERED`
  - Associated with `ScrollHashRegistry` entries
- `POLICY_DOC_LINKED_TO_DECISION`
  - Associates a governance decision (`BDC_GOVERNANCE_DECISION`) with a specific document hash

Payload includes:

- `doc_hash`
- `registry_contract_address`
- `related_event_id` (e.g., decision event)

---

## 5. Event Payload Example

Example `BSC_REWARD_GRANTED`:

```json
{
  "event_id": "uuid",
  "event_type": "BSC_REWARD_GRANTED",
  "timestamp": "ISO-8601",
  "chain": "BSC",
  "token": "BSC",
  "actor": "logistics_reward_service",
  "entity": "wallet",
  "entity_id": "0xDriverWallet",
  "amount": "150.0",
  "metadata": {
    "load_id": "LOAD-12345",
    "driver_id": "DRIVER-987",
    "reason": "load_completion"
  }
}
