import React from "react";
import { Web3Provider } from "./web3/Web3Provider";
import Layout from "./components/layout/Layout";
import WalletPanel from "./components/wallet/WalletPanel";
import TokenPanel from "./components/tokens/TokenPanel";
import StakingPanel from "./components/staking/StakingPanel";
import GovernancePanel from "./components/governance/GovernancePanel";
import TreasuryPanel from "./components/treasury/TreasuryPanel";
import LoadBoardPanel from "./components/loads/LoadBoardPanel";
import CodexEventLog from "./components/codex/CodexEventLog";

export default function App() {
  return (
    <Web3Provider>
      <Layout>
        <WalletPanel />
        <TokenPanel />
        <StakingPanel />
        <GovernancePanel />
        <TreasuryPanel />
        <LoadBoardPanel />
        <CodexEventLog />
      </Layout>
    </Web3Provider>
  );
}
