import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { CHAINS, CONTRACTS } from "./chains";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);

  // Contract instances
  const [bscToken, setBscToken] = useState(null);
  const [bdcToken, setBdcToken] = useState(null);
  const [bdcStaking, setBdcStaking] = useState(null);

  const isOnBSC = chainId === CHAINS.BSC.id;
  const isOnArbitrum = chainId === CHAINS.ARBITRUM.id;

  useEffect(() => {
    if (!window.ethereum) return;
    const eth = window.ethereum;

    const handleChainChanged = (hexId) => {
      setChainId(parseInt(hexId, 16));
      window.location.reload();
    };

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setSigner(null);
      } else {
        setAddress(accounts[0]);
      }
    };

    eth.on("chainChanged", handleChainChanged);
    eth.on("accountsChanged", handleAccountsChanged);

    return () => {
      eth.removeListener("chainChanged", handleChainChanged);
      eth.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) throw new Error("No wallet found");
    const eth = window.ethereum;
    const accounts = await eth.request({ method: "eth_requestAccounts" });
    const network = await eth.request({ method: "eth_chainId" });

    const nextProvider = new ethers.BrowserProvider(eth);
    const nextSigner = await nextProvider.getSigner();

    setProvider(nextProvider);
    setSigner(nextSigner);
    setAddress(accounts[0]);
    setChainId(parseInt(network, 16));
  };

  const switchNetwork = async (target) => {
    if (!window.ethereum) return;
    const { hexId, name, rpcUrl } = target;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexId }],
      });
    } catch (err) {
      if (err.code === 4902 && rpcUrl) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexId,
              chainName: name,
              rpcUrls: [rpcUrl],
              nativeCurrency: { name, symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } else {
        throw err;
      }
    }
  };

  // Setup contracts whenever provider/chainId changes
  useEffect(() => {
    if (!provider) return;

    const setupContracts = async () => {
      const network = await provider.getNetwork();
      const id = Number(network.chainId);

      if (id === CHAINS.BSC.id) {
        const bsc = CONTRACTS.BSC.sovereignCoin;
        setBscToken(new ethers.Contract(bsc.address, bsc.abi, signer || provider));
      } else {
        setBscToken(null);
      }

      if (id === CHAINS.ARBITRUM.id) {
        const dyn = CONTRACTS.ARBITRUM.dynastyCoin;
        const stake = CONTRACTS.ARBITRUM.staking;
        setBdcToken(new ethers.Contract(dyn.address, dyn.abi, signer || provider));
        setBdcStaking(new ethers.Contract(stake.address, stake.abi, signer || provider));
      } else {
        setBdcToken(null);
        setBdcStaking(null);
      }
    };

    setupContracts().catch(console.error);
  }, [provider, signer]);

  const value = {
    provider,
    signer,
    address,
    chainId,
    isOnBSC,
    isOnArbitrum,
    connectWallet,
    switchToBSC: () => switchNetwork(CHAINS.BSC),
    switchToArbitrum: () => switchNetwork(CHAINS.ARBITRUM),
    bscToken,
    bdcToken,
    bdcStaking,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  return useContext(Web3Context);
}
