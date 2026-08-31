/**
 * Payment-token catalog (what the job is priced in).
 * Addresses are per chain. MVP: USDC only. Add USDT as another key later.
 *
 * anvil USDC is MockUSDC from `make deploy-local` (first CREATE on a fresh Anvil).
 */
export const DEFAULT_TOKEN_SYMBOL = 'USDC';

export const TOKEN_CATALOG = {
  USDC: {
    symbol: 'USDC',
    decimals: 6,
    standard: 'erc20',
    addresses: {
      anvil: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
  },
  // USDT: {
  //   symbol: 'USDT',
  //   decimals: 6,
  //   standard: 'erc20',
  //   addresses: { 'base-sepolia': '0x...', base: '0x...' },
  // },
};

export const resolveToken = (symbol, chainKey) => {
  const token = TOKEN_CATALOG[symbol] || TOKEN_CATALOG[DEFAULT_TOKEN_SYMBOL];
  return {
    symbol: token.symbol,
    decimals: token.decimals,
    standard: token.standard,
    address: token.addresses[chainKey] || '',
  };
};
