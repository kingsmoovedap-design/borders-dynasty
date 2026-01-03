import React, { useEffect, useState } from "react";
import SectionCard from "../layout/SectionCard";
import { useWeb3 } from "../../web3/useWeb3";
import { CHAINS } from "../../web3/chains";

export default function WalletPanel() {
  const {
    address,
    chainId,
    connectWallet,
    switchToBSC,
    switchToArbitrum,
  } = useWeb3();
  const [loading, setLoading] = useState(false);

  const networkLabel =
    chainId === CHAINS.BSC.id
      ? "BNB Smart Chain"
      : chainId === CHAINS.ARBITRUM.id
      ? "Arbitrum One"
      : "Unknown";

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connectWallet();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <SectionCard title="Wallet & Network" accentColor="#3498db">
      {!address ? (
        <button
          onClick={handleConnect}
          className="btn"
          style={{
            background: "linear-gradient(135deg, #3498db, #2980b9)",
            color: "white",
          }}
          disabled={loading}
        >
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        <>
          <div
            style={{
              background: "#f8f9fa",
              padding: 15,
              borderRadius: 8,
              marginBottom: 15,
            }}
          >
            <p
              style={{
                margin: 0,
                marginBottom: 8,
                color: "#7f8c8d",
                fontSize: "0.85em",
              }}
            >
              Connected Address
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "0.9em",
                color: "#2980b9",
                wordBreak: "break-all",
                fontFamily: "monospace",
              }}
            >
              {address}
            </p>
          </div>

          <p style={{ marginBottom: 8, color: "#7f8c8d", fontSize: "0.85em" }}>
            Current Network:{" "}
            <strong style={{ color: "#2c3e50" }}>{networkLabel}</strong>
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn"
              onClick={switchToBSC}
              style={{ background: "#f1c40f", color: "#2c3e50" }}
            >
              Switch to BSC
            </button>
            <button
              className="btn"
              onClick={switchToArbitrum}
              style={{
                background: "linear-gradient(135deg, #9b59b6, #8e44ad)",
                color: "white",
              }}
            >
              Switch to Arbitrum (BDC)
            </button>
          </div>
        </>
      )}
    </SectionCard>
  );
}
