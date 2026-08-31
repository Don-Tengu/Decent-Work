import { resolveChainPreset } from './chains.js';
import { DEFAULT_TOKEN_SYMBOL, resolveToken } from './tokens.js';

const chainKey = import.meta.env.VITE_CHAIN_KEY || 'anvil';
const preset = resolveChainPreset(chainKey);
const tokenSymbol = import.meta.env.VITE_TOKEN_SYMBOL || DEFAULT_TOKEN_SYMBOL;
const token = resolveToken(tokenSymbol, preset.key);

/**
 * Runtime web3 binding for this frontend build.
 * Chain comes from VITE_CHAIN_KEY; token from VITE_TOKEN_SYMBOL (default USDC).
 * Escrow address is per deployment — always set via env after forge deploy.
 */
export const WEB3_CONFIG = {
  chainKey: preset.key,
  family: preset.family,
  escrowAddress: import.meta.env.VITE_ESCROW_ADDRESS || '',
  chainId: Number(import.meta.env.VITE_CHAIN_ID || preset.chainId),
  chainName: import.meta.env.VITE_CHAIN_NAME || preset.chainName,
  rpcUrl: import.meta.env.VITE_RPC_URL || preset.rpcUrl,
  blockExplorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL || preset.blockExplorerUrl,
  nativeCurrency: preset.nativeCurrency,
  tokenAddress: import.meta.env.VITE_TOKEN_ADDRESS || token.address,
  tokenSymbol: import.meta.env.VITE_TOKEN_SYMBOL || token.symbol,
  tokenDecimals: Number(import.meta.env.VITE_TOKEN_DECIMALS || token.decimals),
  platformFeePercent: Number(import.meta.env.VITE_PLATFORM_FEE_PERCENT || 5),
};

export const isEscrowConfigured = () =>
  Boolean(WEB3_CONFIG.escrowAddress) &&
  WEB3_CONFIG.escrowAddress !== '0x0000000000000000000000000000000000000000' &&
  Boolean(WEB3_CONFIG.tokenAddress) &&
  WEB3_CONFIG.tokenAddress !== '0x0000000000000000000000000000000000000000';
