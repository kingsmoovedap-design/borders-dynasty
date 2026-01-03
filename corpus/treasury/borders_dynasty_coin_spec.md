# Borders Dynasty Coin (BDC)
## Governance-Layer Token Specification (Conceptual, Non-Financial)

Borders Dynasty Coin (BDC) is the governance-layer token of the Borders Dynasty ecosystem.  
It is designed to sit above the Borders Sovereign Coin (BSC) Web3 DeFi Core and provide a technical, conceptual mechanism for long-term alignment, governance signaling, and protocol-level control.

This specification is technical and conceptual only.  
It does not define financial characteristics, guarantees, or legal status.

---

## 1. Token Identity

- **Name:** Borders Dynasty Coin  
- **Symbol:** BDC  
- **Standard:** ERC-20–compatible  
- **Chain:** Arbitrum One (Layer 2, EVM-compatible)  
- **Deployment Pattern:** Upgradeable proxy (OpenZeppelin Upgrades)  
- **Supply Model:** Fixed or governance-defined (implementation-specific; this spec describes structure, not numbers)  
- **Primary Role:** Governance, alignment, and protocol-level signaling

BDC is not an operational currency.  
It represents a governance/alignment layer above the BSC operational token.

---

## 2. Functional Domains (Conceptual)

### 2.1 Governance Signaling

BDC holders may participate in governance-style signaling processes such as:

- Expressing preferences on protocol parameters (e.g., reward weights, region priorities)
- Participating in structured governance discussions (off-chain or on-chain frameworks)
- Influencing treasury policy at a conceptual specification level

Codex events (examples):

- `BDC_VOTE_CAST`
- `BDC_GOVERNANCE_DECISION`

This spec does not mandate a specific voting mechanism; it defines integration points.

---

### 2.2 Staking & Alignment

BDC may be staked to unlock:

- Access to advanced analytics or dashboards
- Participation in higher-tier governance discussions (e.g., “Council” level)
- Visibility privileges or role flags inside administration tools

Codex events (examples):

- `BDC_STAKED`
- `BDC_UNSTAKED`

The staking mechanism can be implemented as a separate smart contract with references back to BDC.

---

### 2.3 Prestige & Identity Layer

Holding or staking BDC may conceptually unlock:

- Identity badges or flags in user profiles
- Access to certain configuration panels or proposal views
- Eligibility to participate in specific governance or advisory processes

These behaviors are implemented at the application layer and recorded via Codex.

---

## 3. Relationship to Borders Sovereign Coin (BSC)

### 3.1 BSC – Operational / Web3 DeFi Core

- Chain: BNB Smart Chain (BSC)
- Token: Borders Sovereign Coin (BSC)
- Role:
  - Logistics rewards
  - Internal denominated value (conceptual accounting unit)
  - Driver/partner incentives
  - Treasury base unit

### 3.2 BDC – Governance/Alignment Layer on Arbitrum

- Chain: Arbitrum One
- Token: Borders Dynasty Coin (BDC)
- Role:
  - Long-term alignment
  - Governance signaling
  - Conceptual influence over BSC parameters

### 3.3 Interaction Patterns (Conceptual)

Non-binding, non-financial examples:

- BDC staking may unlock:
  - Multipliers on BSC reward calculations (application-level logic)
  - Access to configuration panels that influence protocol parameters
- BSC usage metrics (e.g., total rewards, volume) may be surfaced to BDC holders for governance evaluation.
- Treasury modules may track both BSC and BDC and log conceptual swaps in Codex.

---

## 4. Smart Contract Features (BDC)

### 4.1 ERC-20 Compatibility

- Implements standard ERC-20 interface:
  - `totalSupply`, `balanceOf`, `transfer`, `transferFrom`, `approve`, `allowance`
- Compatible with:
  - MetaMask (Arbitrum network)
  - Ethers.js, Web3.js
  - Standard EVM tooling

### 4.2 Upgradeable Proxy Pattern

- BDC is deployed behind a proxy using OpenZeppelin Upgrades.
- Storage is preserved across logic upgrades.
- Upgrades are controlled by an admin role (see 4.3).

### 4.3 Role-Based Access Control

Recommended roles:

- `ADMIN_ROLE`
  - Proxy upgrades
  - Role assignment/revocation
- `TREASURY_ROLE` (optional)
  - Treasury-specific functions, if any
- `HOOK_ROLE` (optional)
  - Authorized systems that may call governance hooks

BDC itself does not require minting beyond initial supply unless specified; any such extensions should be documented separately.

---

## 5. Codex Integration

All major BDC actions are mirrored into Codex for auditability and analysis.

Example events:

- `BDC_STAKED`
- `BDC_UNSTAKED`
- `BDC_VOTE_CAST`
- `BDC_GOVERNANCE_DECISION`
- `TREASURY_SWAP_BSC_TO_BDC` (conceptual)
- `TREASURY_SWAP_BDC_TO_BSC` (conceptual)

BDC contracts may expose event data; application services convert blockchain events into Codex records with additional metadata.

---

## 6. Disclaimer

This specification describes technical architecture and conceptual roles only.  
It does not define financial characteristics, legal rights, guarantees, or regulatory status.  
All legal and regulatory interpretations are external to this document.

                         +---------------------------+
                         |   Arbitrum One (L2)       |
                         |   (EVM, L2 over ETH)      |
                         +---------------------------+
                                   |
                            [Borders Dynasty Coin]
                                   BDC
                                   |
                      Governance / Alignment Layer
                                   |
            +----------------------+----------------------+
            |                                             |
    Governance topics,                        Council access,
   parameter preferences,                     analytics access,
 long-term alignment signals                  staking mechanics
            |                                             |
            +----------------------+----------------------+
                                   |
                             [Codex Spine]
                    Cross-chain event and state log
           (BSC events, BDC events, treasury, logistics, docs)
                                   |
                         +---------------------------+
                         |  BNB Smart Chain (BSC)    |
                         |  (EVM, BEP-20)            |
                         +---------------------------+
                                   |
                       [Borders Sovereign Coin]
                                   BSC
                                   |
                    Operational / Web3 DeFi Core Layer
                                   |
            +----------------------+----------------------+
            |                                             |
    Logistics OS                                Treasury / DeFi
 (loads, routes, driver/                     (reserves, swaps,
 partner rewards)                             accounting unit)
