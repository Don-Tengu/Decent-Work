import { describe, expect, it } from 'vitest';
import { requireSignerAddress } from '@/utils/escrow.js';

describe('requireSignerAddress', () => {
  it('throws when no bound wallet is configured', () => {
    expect(() => requireSignerAddress('0xabc', '')).toThrow(/dashboard/i);
  });

  it('throws when MetaMask account does not match the bound wallet', () => {
    expect(() =>
      requireSignerAddress(
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
      )
    ).toThrow(/must be signed by/i);
  });

  it('accepts checksum vs lowercase of the same address', () => {
    expect(() =>
      requireSignerAddress(
        '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
      )
    ).not.toThrow();
  });
});
