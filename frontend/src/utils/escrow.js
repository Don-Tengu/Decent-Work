import { BrowserProvider, Contract, Interface, parseUnits, formatUnits } from 'ethers';
import escrowArtifact from '@/contracts/FreelanceEscrow.json';
import erc20Artifact from '@/contracts/erc20.json';
import { WEB3_CONFIG, isEscrowConfigured } from '@/config/web3.js';

const getEscrowInterface = () => new Interface(escrowArtifact.abi);

export const getEscrowContract = (signerOrProvider) => {
  if (!isEscrowConfigured()) {
    throw new Error(
      'Escrow is not configured. Set VITE_ESCROW_ADDRESS and VITE_TOKEN_ADDRESS after forge deploy.'
    );
  }
  return new Contract(WEB3_CONFIG.escrowAddress, escrowArtifact.abi, signerOrProvider);
};

export const getPaymentToken = (signerOrProvider) => {
  if (!WEB3_CONFIG.tokenAddress) {
    throw new Error('Payment token address is not configured (VITE_TOKEN_ADDRESS).');
  }
  return new Contract(WEB3_CONFIG.tokenAddress, erc20Artifact.abi, signerOrProvider);
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
    if (err?.code === 4902 || err?.error?.code === 4902) {
      await provider.send('wallet_addEthereumChain', [
        {
          chainId: chainIdHex,
          chainName: WEB3_CONFIG.chainName,
          rpcUrls: [WEB3_CONFIG.rpcUrl],
          nativeCurrency: WEB3_CONFIG.nativeCurrency,
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

const toAtomic = (amount) => parseUnits(String(amount), WEB3_CONFIG.tokenDecimals);

/**
 * Approve USDC then createEscrow(jobId, freelancer, token, amount).
 */
export const fundEscrow = async ({ jobId, freelancerAddress, amount }) => {
  const { signer } = await getBrowserSigner();
  const escrow = getEscrowContract(signer);
  const token = getPaymentToken(signer);
  const atomic = toAtomic(amount);

  const approveTx = await token.approve(WEB3_CONFIG.escrowAddress, atomic);
  await approveTx.wait();

  const tx = await escrow.createEscrow(
    BigInt(jobId),
    freelancerAddress,
    WEB3_CONFIG.tokenAddress,
    atomic
  );
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

export const releaseEscrow = async ({ escrowId }) => {
  const { signer } = await getBrowserSigner();
  const contract = getEscrowContract(signer);
  const tx = await contract.releasePayment(BigInt(escrowId));
  const receipt = await tx.wait();
  return { txHash: receipt.hash || tx.hash };
};

export const netAfterFee = (amount, feePercent = WEB3_CONFIG.platformFeePercent) => {
  const gross = Number(amount);
  if (Number.isNaN(gross)) {
    return null;
  }
  return gross * (1 - feePercent / 100);
};

export { formatUnits, parseUnits };
