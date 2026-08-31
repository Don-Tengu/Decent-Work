/**
 * Network catalog (where settlement happens).
 * Independent of app environment (local|dev|prod) and of payment tokens.
 *
 * family: 'evm' today. Add a non-EVM entry later without reshaping this map.
 */
export const CHAIN_PRESETS = {
  anvil: {
    key: 'anvil',
    family: 'evm',
    chainId: 31337,
    chainName: 'Anvil',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorerUrl: '',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  'base-sepolia': {
    key: 'base-sepolia',
    family: 'evm',
    chainId: 84532,
    chainName: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorerUrl: 'https://sepolia.basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  base: {
    key: 'base',
    family: 'evm',
    chainId: 8453,
    chainName: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorerUrl: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
};

export const resolveChainPreset = (key) =>
  CHAIN_PRESETS[key] || CHAIN_PRESETS.anvil;
