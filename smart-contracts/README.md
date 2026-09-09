# Smart Contracts (Foundry)

ERC-20 escrow for Decent Work: `FreelanceEscrow` + Anvil `MockUSDC`.

**MVP payment token:** USDC (6 decimals).  
**USDT:** contract allowlist is ready (`setAllowedToken`); the app is USDC-only until the next phase.

## Networks

| Env | Chain | Chain ID | USDC |
|-----|--------|----------|------|
| Local | Anvil | 31337 | `MockUSDC` (deployed with escrow, 1M minted to Anvil #0–2) |
| Dev | Base Sepolia | 84532 | Circle `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Prod | Base | 8453 | Circle `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

Gas is still ETH (or Anvil ETH). USDC is what clients lock and freelancers receive.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`, `anvil`)

## Commands

```bash
forge install
forge build
forge test -vv

# Local chain (state saved to .anvil-state.json; Ctrl+C to dump)
make anvil
make deploy-local          # only on a blank chain / after `make anvil-fresh`

# Inspect escrow / MockUSDC on Anvil (cast call + logs)
# See anvil-inspect.md

# One-time: encrypt a deployer key into the OS keystore (not the repo)
cast wallet import evm-dev --interactive
cast wallet list

# Base Sepolia / Base — prompts for keystore password
make deploy-sepolia        # ACCOUNT=evm-dev
```

Do not pass `--private-key` or put keys in `.env`. Hardware wallet: `forge script ... --ledger --sender 0x...`.

Optional: `PLATFORM_WALLET=0x...` for the fee recipient (defaults to deployer).  
Optional: `USDC_ADDRESS=0x...` to override Circle defaults on Base / Base Sepolia.

## Wire into the app

After deploy, set the **escrow** and **token** addresses (Anvil prints both):

**Backend:**

```bash
export ESCROW_CONTRACT_ADDRESS=0x...
export WEB3_TOKEN_ADDRESS=0x...
export WEB3_PROVIDER_URL=http://127.0.0.1:8545   # or Base RPC
export WEB3_CHAIN_ID=31337                       # 84532 Base Sepolia, 8453 Base
export WEB3_TOKEN_SYMBOL=USDC
export WEB3_TOKEN_DECIMALS=6
```

**Frontend** (`frontend/.env.local`):

```bash
VITE_CHAIN_KEY=anvil          # or base-sepolia | base
VITE_ESCROW_ADDRESS=0x...
VITE_TOKEN_ADDRESS=0x...      # MockUSDC on Anvil; Circle USDC on Base
```

Preset RPCs/chain IDs come from `VITE_CHAIN_KEY`. Override with `VITE_CHAIN_ID` / `VITE_RPC_URL` if needed. Restart Vite after env changes.

Export ABI after contract changes (from repo root):

```bash
python3 -c "
import json
with open('smart-contracts/out/FreelanceEscrow.sol/FreelanceEscrow.json') as f:
    data = json.load(f)
with open('frontend/src/contracts/FreelanceEscrow.json', 'w') as f:
    json.dump({'abi': data['abi'], 'contractName': 'FreelanceEscrow'}, f, indent=2)
"
```

## Contract surface

| Function | Who | Effect |
|----------|-----|--------|
| `createEscrow(jobId, freelancer, token, amount)` | Client (after `token.approve`) | Pull USDC into escrow |
| `releasePayment(escrowId)` | Client | Pay freelancer − 5% fee in the same token |
| `refundPayment(escrowId)` | Freelancer or owner | Full refund to client |
| `setAllowedToken(token, allowed)` | Owner | Enable USDT (or another ERC-20) later |
| `raiseDispute` / `resolveDispute` | Parties / owner | Dispute flow |

Fee default: **5%** to `platformWallet` (owner can update ≤ 10%).
