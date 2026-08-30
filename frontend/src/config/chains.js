/**
 * Supported escrow networks. Payment token is USDC (6 decimals).
 * Native ETH is only for gas. USDT is allowlisted on-chain later; not in the app yet.
 */
export const CHAIN_PRESETS = {
  anvil: {
    key: 'anvil',
    chainId: 31337,
    chainName: 'Anvil',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorerUrl: '',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    tokenSymbol: 'USDC',
    tokenDecimals: 6,
    tokenAddress: '',
  },
  'base-sepolia': {
    key: 'base-sepolia',
    chainId: 84532,
    chainName: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorerUrl: 'https://sepolia.basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    tokenSymbol: 'USDC',
    tokenDecimals: 6,
    tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  base: {
    key: 'base',
    chainId: 8453,
    chainName: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorerUrl: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    tokenSymbol: 'USDC',
    tokenDecimals: 6,
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
};

export const resolveChainPreset = (key) =>
  CHAIN_PRESETS[key] || CHAIN_PRESETS.anvil;
