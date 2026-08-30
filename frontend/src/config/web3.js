import { resolveChainPreset } from './chains.js';

const preset = resolveChainPreset(import.meta.env.VITE_CHAIN_KEY || 'anvil');

/**
 * On-chain USDC escrow. Pick a preset with VITE_CHAIN_KEY=anvil|base-sepolia|base.
 * Override address/RPC after deploy.
 */
export const WEB3_CONFIG = {
  chainKey: preset.key,
  escrowAddress: import.meta.env.VITE_ESCROW_ADDRESS || '',
  chainId: Number(import.meta.env.VITE_CHAIN_ID || preset.chainId),
  chainName: import.meta.env.VITE_CHAIN_NAME || preset.chainName,
  rpcUrl: import.meta.env.VITE_RPC_URL || preset.rpcUrl,
  blockExplorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL || preset.blockExplorerUrl,
  nativeCurrency: preset.nativeCurrency,
  tokenAddress: import.meta.env.VITE_TOKEN_ADDRESS || preset.tokenAddress,
  tokenSymbol: import.meta.env.VITE_TOKEN_SYMBOL || preset.tokenSymbol,
  tokenDecimals: Number(import.meta.env.VITE_TOKEN_DECIMALS || preset.tokenDecimals),
  platformFeePercent: Number(import.meta.env.VITE_PLATFORM_FEE_PERCENT || 5),
};

export const isEscrowConfigured = () =>
  Boolean(WEB3_CONFIG.escrowAddress) &&
  WEB3_CONFIG.escrowAddress !== '0x0000000000000000000000000000000000000000' &&
  Boolean(WEB3_CONFIG.tokenAddress) &&
  WEB3_CONFIG.tokenAddress !== '0x0000000000000000000000000000000000000000';
