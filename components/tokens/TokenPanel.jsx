import React, { useEffect, useState } from "react";
import SectionCard from "../layout/SectionCard";
import { useWeb3 } from "../../web3/useWeb3";
import { ethers } from "ethers";

function BalanceRow({ label, amount, symbol }) {
  return (
    <div
      style={{
        background: "#f8f9fa",
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <span style={{ color: "#7f8c8d", fontSize: "0.85em" }}>{label}</span>
      <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>
        {amount ?? "--"} {symbol}
      </div>
    </div>
  );
}

export default function TokenPanel() {
  const { address, bscToken, bdcToken, isOnBSC, isOnArbitrum } = useWeb3();
  const [bscBalance, setBscBalance] = useState(null);
  const [bdcBalance, setBdcBalance] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (address && bscToken) {
        const [bal, dec] = await Promise.all([
          bscToken.balanceOf(address),
          bscToken.decimals(),
        ]);
        setBscBalance(parseFloat(ethers.formatUnits(bal, dec)).toFixed(4));
      } else {
        setBscBalance(null);
      }
    };
    load().catch(console.error);
  }, [address, bscToken]);

  useEffect(() => {
    const load = async () => {
      if (address && bdcToken) {
        const [bal, dec] = await Promise.all([
          bdcToken.balanceOf(address),
          bdcToken.decimals(),
        ]);
        setBdcBalance(parseFloat(ethers.formatUnits(bal, dec)).toFixed(4));
      } else {
        setBdcBalance(null);
      }
    };
    load().catch(console.error);
  }, [address, bdcToken]);

  return (
    <SectionCard title="Token Balances (BSC + BDC)" accentColor="#27ae60">
      {!address ? (
        <p style={{ color: "#7f8c8d" }}>Connect wallet to view balances.</p>
      ) : (
        <>
          <BalanceRow
            label={`Borders Sovereign Coin (BSC) ${
              isOnBSC ? "(current network)" : ""
            }`}
            amount={bscBalance}
            symbol="BSC"
          />
          <BalanceRow
            label={`Borders Dynasty Coin (BDC) ${
              isOnArbitrum ? "(current network)" : ""
            }`}
            amount={bdcBalance}
            symbol="BDC"
          />
        </>
      )}
    </SectionCard>
  );
}
