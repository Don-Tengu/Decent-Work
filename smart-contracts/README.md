# Smart Contracts (Foundry)

Native-ETH escrow for Decent Work: `FreelanceEscrow`.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`, `anvil`)

## Commands

```bash
# Install deps (if needed)
forge install

# Build
forge build

# Test
forge test -vv

# Local chain
anvil

# Deploy to Anvil (default Anvil account #0)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Sepolia
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY
```

Optional: `PLATFORM_WALLET=0x...` for the fee recipient (defaults to deployer).

## Wire into the app

After deploy, set:

**Backend** (`application.yml` or env):

```bash
export ESCROW_CONTRACT_ADDRESS=0x...   # from forge script output
export WEB3_PROVIDER_URL=http://127.0.0.1:8545
export WEB3_CHAIN_ID=31337
```

**Frontend** (`.env` / `.env.local`):

```bash
VITE_ESCROW_ADDRESS=0x...
VITE_CHAIN_ID=31337
VITE_CHAIN_NAME=Anvil
VITE_RPC_URL=http://127.0.0.1:8545
```

Export ABI after contract changes:

```bash
# from repo root
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
| `createEscrow(jobId, freelancer) payable` | Client | Fund escrow |
| `releasePayment(escrowId)` | Client | Pay freelancer − 5% fee |
| `refundPayment(escrowId)` | Freelancer or owner | Full refund to client |
| `raiseDispute` / `resolveDispute` | Parties / owner | Dispute flow |

Fee default: **5%** to `platformWallet` (owner can update ≤ 10%).
