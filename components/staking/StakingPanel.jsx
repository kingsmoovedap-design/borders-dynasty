import React, { useEffect, useState } from "react";
import SectionCard from "../layout/SectionCard";
import { useWeb3 } from "../../web3/useWeb3";
import { ethers } from "ethers";

export default function StakingPanel() {
  const { address, isOnArbitrum, bdcToken, bdcStaking } = useWeb3();
  const [amount, setAmount] = useState("");
  const [staked, setStaked] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStaked = async () => {
    if (!address || !bdcStaking) return;
    const bal = await bdcStaking.stakedBalanceOf(address);
    setStaked(ethers.formatUnits(bal, 18));
  };

  useEffect(() => {
    loadStaked().catch(console.error);
  }, [address, bdcStaking]);

  const handleStake = async () => {
    if (!bdcToken || !bdcStaking || !amount) return;
    setLoading(true);
    try {
      const value = ethers.parseUnits(amount, 18);
      const tx1 = await bdcToken.approve(await bdcStaking.getAddress(), value);
      await tx1.wait();
      const tx2 = await bdcStaking.stake(value);
      await tx2.wait();
      await loadStaked();
      setAmount("");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleUnstake = async () => {
    if (!bdcStaking || !amount) return;
    setLoading(true);
    try {
      const value = ethers.parseUnits(amount, 18);
      const tx = await bdcStaking.unstake(value);
      await tx.wait();
      await loadStaked();
      setAmount("");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <SectionCard title="BDC Staking (Governance Alignment)" accentColor="#9b59b6">
      {!address ? (
        <p style={{ color: "#7f8c8d" }}>Connect wallet to stake BDC.</p>
      ) : !isOnArbitrum ? (
        <p style={{ color: "#e67e22" }}>Switch to Arbitrum to manage BDC staking.</p>
      ) : (
        <>
          <p style={{ color: "#7f8c8d", fontSize: "0.85em" }}>
            Staking BDC conceptually signals long‑term alignment and unlocks
            governance visibility/features.
          </p>
          <p style={{ marginTop: 8 }}>
            Staked BDC:{" "}
            <strong>{staked !== null ? `${staked} BDC` : "--"}</strong>
          </p>
          <input
            type="number"
            placeholder="Amount BDC"
            value={amount}
            min="0"
            step="0.01"
            onChange={(e) => setAmount(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn"
              style={{
                background: "linear-gradient(135deg, #9b59b6, #8e44ad)",
                color: "white",
              }}
              onClick={handleStake}
              disabled={loading}
            >
              {loading ? "Processing..." : "Stake"}
            </button>
            <button
              className="btn"
              style={{ background: "#ecf0f1", color: "#2c3e50" }}
              onClick={handleUnstake}
              disabled={loading}
            >
              {loading ? "Processing..." : "Unstake"}
            </button>
          </div>
        </>
      )}
    </SectionCard>
  );
}
