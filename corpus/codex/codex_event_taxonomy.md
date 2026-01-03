# Dynasty OS — Codex Event Taxonomy
## The Structured Event Dictionary for the Dynasty OS

Codex is the event spine of the Dynasty OS.  
Every action in the system emits a structured event that becomes part of the permanent operational record.

This document defines the **event categories**, **event names**, and **intended usage**.

---

# 1. Event Categories

Codex events are grouped into seven major categories:

1. **Load Events**  
2. **Dispatch Events**  
3. **Driver Events**  
4. **Compliance Events**  
5. **Treasury Events**  
6. **Governance Events**  
7. **Codex Events**  

Each category contains multiple event types.

---

# 2. Load Events

| Event Name | Description |
|-----------|-------------|
| `LOAD_CREATED` | A new load is created by shipper or ops. |
| `LOAD_UPDATED` | Load details are modified. |
| `LOAD_CANCELLED` | Load is cancelled before assignment. |
| `LOAD_IN_TRANSIT` | Load is actively moving. |
| `LOAD_DELIVERED` | Delivery completed. |
| `LOAD_EXCEPTION` | Delay, damage, or operational issue. |

---

# 3. Dispatch Events

| Event Name | Description |
|-----------|-------------|
| `DISPATCH_SUGGESTED` | AI provides driver suggestions. |
| `DISPATCH_ASSIGNED` | Driver is assigned to load. |
| `DISPATCH_OVERRIDE` | Human overrides AI suggestion. |
| `DISPATCH_ESCALATED` | Dispatch requires higher-level review. |

---

# 4. Driver Events

| Event Name | Description |
|-----------|-------------|
| `DRIVER_ARRIVED_PICKUP` | Driver reaches pickup location. |
| `DRIVER_LOADED` | Cargo loaded. |
| `DRIVER_DEPARTED` | Driver leaves pickup. |
| `DRIVER_ARRIVED_DELIVERY` | Driver reaches delivery location. |
| `POD_UPLOADED` | Proof of delivery submitted. |

---

# 5. Compliance Events

| Event Name | Description |
|-----------|-------------|
| `COMPLIANCE_CHECKED` | Compliance rules evaluated. |
| `DOCUMENTATION_VERIFIED` | Required documents validated. |
| `SAFETY_FLAGGED` | Safety issue detected. |
| `RISK_SCORE_UPDATED` | Risk score recalculated. |

---

# 6. Treasury Events

| Event Name | Description |
|-----------|-------------|
| `PAYOUT_PREVIEWED` | Treasury calculates expected payout. |
| `PAYOUT_ISSUED` | Driver payout executed. |
| `CREDIT_ADJUSTED` | Credit balance updated. |
| `REWARD_GRANTED` | Loyalty or performance reward issued. |

---

# 7. Governance Events

| Event Name | Description |
|-----------|-------------|
| `MODE_ACTIVATED` | A mode (GROUND/AIR/OCEAN/COURIER) is activated. |
| `REGION_ACTIVATED` | A region becomes operational. |
| `NODE_ACTIVATED` | A city/port/airport node is activated. |
| `GLOBAL_LAUNCH_TRIGGERED` | A major expansion milestone. |

---

# 8. Codex Events

| Event Name | Description |
|-----------|-------------|
| `CODEX_RECORD_CREATED` | A new event is stored. |
| `CODEX_ANCHORED` | A batch of events is anchored for integrity. |

---

# 9. Event Structure (Recommended)

Each event should follow a consistent structure:

```json
{
  "event_id": "uuid",
  "event_type": "LOAD_CREATED",
  "timestamp": "ISO-8601",
  "actor": "user/service",
  "entity": "load/driver/etc",
  "entity_id": "id",
  "payload": { ... },
  "metadata": { ... }
}
0. Purpose of the Taxonomy
This taxonomy ensures:

consistency

auditability

transparency

AI training quality

operational clarity

Codex is the memory of the Dynasty OS.
