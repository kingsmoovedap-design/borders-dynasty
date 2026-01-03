import React, { useEffect, useState } from "react";
import SectionCard from "../layout/SectionCard";
import { useWeb3 } from "../../web3/useWeb3";

export default function GovernancePanel() {
  const { address } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/governance/proposals`);
        const data = await res.json();
        setProposals(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <SectionCard title="Governance (BDC Layer)" accentColor="#e67e22">
      {!address ? (
        <p style={{ color: "#7f8c8d" }}>Connect wallet to participate in governance.</p>
      ) : loading ? (
        <p style={{ color: "#7f8c8d" }}>Loading proposals...</p>
      ) : proposals.length === 0 ? (
        <p style={{ color: "#7f8c8d" }}>No active proposals.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {proposals.map((p) => (
            <GovernanceProposal key={p.id} proposal={p} apiBase={API_BASE} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function GovernanceProposal({ proposal, apiBase }) {
  const { address } = useWeb3();
  const [choice, setChoice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async () => {
    if (!choice) return;
    setSubmitting(true);
    try {
      await fetch(`${apiBase}/governance/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: proposal.id, choice, voter: address }),
      });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  return (
    <div
      style={{
        background: "#fafafa",
        padding: 12,
        borderRadius: 8,
        borderLeft: "4px solid #e67e22",
      }}
    >
      <div style={{ fontWeight: "bold" }}>{proposal.title}</div>
      <div style={{ fontSize: "0.9em", color: "#7f8c8d", marginTop: 4 }}>
        {proposal.description}
      </div>
      <div style={{ marginTop: 8 }}>
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        >
          <option value="">Select a choice...</option>
          {proposal.choices.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          className="btn"
          style={{ background: "#e67e22", color: "white" }}
          disabled={submitting || !choice}
          onClick={handleVote}
        >
          {submitting ? "Submitting..." : "Vote (off‑chain, Codex‑logged)"}
        </button>
      </div>
    </div>
  );
}
