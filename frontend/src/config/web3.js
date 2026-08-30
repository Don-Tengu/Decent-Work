/**
 * On-chain escrow configuration (Foundry Anvil defaults).
 * Override via Vite env for Sepolia / custom local deploys.
 */
export const WEB3_CONFIG = {
  escrowAddress: import.meta.env.VITE_ESCROW_ADDRESS || '',
  chainId: Number(import.meta.env.VITE_CHAIN_ID || 31337),
  chainName: import.meta.env.VITE_CHAIN_NAME || 'Anvil',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545',
  blockExplorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL || '',
  platformFeePercent: Number(import.meta.env.VITE_PLATFORM_FEE_PERCENT || 5),
};

export const isEscrowConfigured = () =>
  Boolean(WEB3_CONFIG.escrowAddress) &&
  WEB3_CONFIG.escrowAddress !== '0x0000000000000000000000000000000000000000';
