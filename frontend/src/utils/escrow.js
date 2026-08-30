import { BrowserProvider, Contract, Interface, parseEther, formatEther } from 'ethers';
import escrowArtifact from '@/contracts/FreelanceEscrow.json';
import { WEB3_CONFIG, isEscrowConfigured } from '@/config/web3.js';

const ESCROW_CREATED = 'EscrowCreated(uint256,uint256,address,address,uint256)';

const getEscrowInterface = () => new Interface(escrowArtifact.abi);

export const getEscrowContract = (signerOrProvider) => {
  if (!isEscrowConfigured()) {
    throw new Error(
      'Escrow contract address is not configured. Set VITE_ESCROW_ADDRESS after forge deploy.'
    );
  }
  return new Contract(WEB3_CONFIG.escrowAddress, escrowArtifact.abi, signerOrProvider);
};

export const ensureCorrectChain = async (provider) => {
  const network = await provider.getNetwork();
  const current = Number(network.chainId);
  if (current === WEB3_CONFIG.chainId) {
    return;
  }

  const chainIdHex = `0x${WEB3_CONFIG.chainId.toString(16)}`;
  try {
    await provider.send('wallet_switchEthereumChain', [{ chainId: chainIdHex }]);
  } catch (err) {
    // 4902 = chain not added to MetaMask
    if (err?.code === 4902 || err?.error?.code === 4902) {
      await provider.send('wallet_addEthereumChain', [
        {
          chainId: chainIdHex,
          chainName: WEB3_CONFIG.chainName,
          rpcUrls: [WEB3_CONFIG.rpcUrl],
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          blockExplorerUrls: WEB3_CONFIG.blockExplorerUrl
            ? [WEB3_CONFIG.blockExplorerUrl]
            : undefined,
        },
      ]);
      return;
    }
    throw new Error(
      `Wrong network. Switch MetaMask to ${WEB3_CONFIG.chainName} (chainId ${WEB3_CONFIG.chainId}).`
    );
  }
};

export const getBrowserSigner = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  const provider = new BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  await ensureCorrectChain(provider);
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
};

/**
 * Fund escrow via createEscrow(jobId, freelancer) payable.
 * @returns {{ txHash: string, escrowId: string|null }}
 */
export const fundEscrow = async ({ jobId, freelancerAddress, amountEth }) => {
  const { signer } = await getBrowserSigner();
  const contract = getEscrowContract(signer);
  const value = parseEther(String(amountEth));

  const tx = await contract.createEscrow(BigInt(jobId), freelancerAddress, { value });
  const receipt = await tx.wait();

  let escrowId = null;
  try {
    const iface = getEscrowInterface();
    for (const log of receipt.logs || []) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === 'EscrowCreated') {
          escrowId = parsed.args[0].toString();
          break;
        }
      } catch {
        // not our event
      }
    }
  } catch {
    // best-effort parse
  }

  return { txHash: receipt.hash || tx.hash, escrowId };
};

/**
 * Release escrow funds to freelancer (client only).
 */
export const releaseEscrow = async ({ escrowId }) => {
  const { signer } = await getBrowserSigner();
  const contract = getEscrowContract(signer);
  const tx = await contract.releasePayment(BigInt(escrowId));
  const receipt = await tx.wait();
  return { txHash: receipt.hash || tx.hash };
};

export const netAfterFee = (amountEth, feePercent = WEB3_CONFIG.platformFeePercent) => {
  const gross = Number(amountEth);
  if (Number.isNaN(gross)) {
    return null;
  }
  const net = gross * (1 - feePercent / 100);
  return net;
};

export const formatEthAmount = (amount) => {
  if (amount == null) {
    return '';
  }
  try {
    // if already eth decimal string/number
    const n = Number(amount);
    if (!Number.isNaN(n)) {
      return `${n} ETH`;
    }
  } catch {
    /* fall through */
  }
  return `${amount} ETH`;
};

export { formatEther, parseEther, ESCROW_CREATED };
