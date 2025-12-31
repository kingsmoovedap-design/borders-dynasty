import { ethers } from 'ethers';
import bscAbi from '../abi/bsc-abi.json';

const contractAddress = '0xYourDeployedContractAddress'; // Replace with actual deployed address

// Initialize provider and signer
async function getContract() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' });

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(contractAddress, bscAbi, signer);
}

// Example: Mint tokens
export async function mintTokens(toAddress, amount) {
  try {
    const contract = await getContract();
    const tx = await contract.mint(toAddress, ethers.utils.parseUnits(amount, 18));
    console.log('Mint transaction sent:', tx.hash);
    await tx.wait();
    console.log('Mint confirmed!');
  } catch (error) {
    console.error('Minting failed:', error);
  }
}
