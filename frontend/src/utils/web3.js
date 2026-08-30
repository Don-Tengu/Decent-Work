import { BrowserProvider } from 'ethers';

const requireEthereum = () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  return window.ethereum;
};

export const normalizeAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return '';
  }
  return address.trim().toLowerCase();
};

export const addressesEqual = (a, b) => {
  const left = normalizeAddress(a);
  const right = normalizeAddress(b);
  return Boolean(left) && left === right;
};

/**
 * Ask MetaMask to (re)open the account permission UI.
 * Needed when the site is already connected — eth_requestAccounts alone is silent.
 */
const requestAccountPermission = async (ethereum) => {
  // wallet_requestPermissions re-prompts even if the site already has access,
  // so the user can pick / switch the active account.
  if (typeof ethereum.request === 'function') {
    try {
      await ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      return;
    } catch (error) {
      // Some providers only support eth_requestAccounts; fall through.
      const code = error?.code ?? error?.error?.code;
      if (code === 4001 || /user rejected|denied|ACTION_REJECTED/i.test(error?.message || '')) {
        throw error;
      }
    }
  }
};

/**
 * Connect or re-connect a browser wallet (MetaMask).
 *
 * @param {{ forcePermissionPrompt?: boolean }} [options]
 *   forcePermissionPrompt — true when switching / reconnecting so MetaMask
 *   always shows its dialog (matches first-time connect UX).
 */
export const connectWallet = async ({ forcePermissionPrompt = false } = {}) => {
  const ethereum = requireEthereum();

  try {
    if (forcePermissionPrompt) {
      await requestAccountPermission(ethereum);
    }

    const provider = new BrowserProvider(ethereum);
    // Always request accounts after (optional) permission prompt so we get the
    // currently selected account.
    const accounts = await provider.send('eth_requestAccounts', []);
    if (!accounts?.length) {
      throw new Error('No wallet account was selected');
    }

    const address = accounts[0];
    const signer = await provider.getSigner();

    return {
      address,
      provider,
      signer,
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const getWalletAddress = async () => {
  if (!window.ethereum) {
    return null;
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_accounts', []);
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
};

/**
 * Subscribe to MetaMask account changes. Returns an unsubscribe function.
 * @param {(address: string | null) => void} onAccountsChanged
 */
export const subscribeToWalletAccounts = (onAccountsChanged) => {
  const ethereum = window.ethereum;
  if (!ethereum?.on || !ethereum?.removeListener) {
    return () => {};
  }

  const handler = (accounts) => {
    const next = Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
    onAccountsChanged(next);
  };

  ethereum.on('accountsChanged', handler);
  return () => {
    try {
      ethereum.removeListener('accountsChanged', handler);
    } catch {
      // Provider may have been replaced.
    }
  };
};
