# Inspect local Anvil escrow state

Read-only `cast call` / `cast logs` against a running Anvil node. No transactions are sent.

Run from `smart-contracts/` (or pass absolute addresses). Anvil must be up on `http://127.0.0.1:8545`.

Shortcut:

```bash
cd smart-contracts
make inspect-escrow              # escrow id 1
make inspect-escrow ESCROW_ID=2
```

## Default addresses

These match `make deploy-local` on a **fresh** Anvil (account #0, MockUSDC is the first CREATE, escrow is CREATE after three mints).

If you redeployed or loaded a different snapshot, use the addresses printed by the last `make deploy-local` (and `frontend/.env.development` / `application-local.yml`).

```bash
RPC=http://127.0.0.1:8545
ESCROW=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
USDC=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Anvil default accounts (private keys are public test keys)
# #0 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  deployer / default platform wallet
# #1 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
# #2 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

USDC uses **6 decimals**: `10000000` on-chain = **10 USDC**.

## Chain

```bash
cast chain-id --rpc-url $RPC          # expect 31337
cast block-number --rpc-url $RPC
```

## Escrow contract

```bash
# How many escrow records exist (ids are 1..N)
cast call $ESCROW "escrowCount()(uint256)" --rpc-url $RPC

# Full struct for id N
# (jobId, client, freelancer, token, amount, status, createdAt, completedAt)
cast call $ESCROW \
  "getEscrow(uint256)((uint256,address,address,address,uint256,uint8,uint256,uint256))" \
  1 --rpc-url $RPC

# Same data via the public mapping
cast call $ESCROW \
  "escrows(uint256)(uint256,address,address,address,uint256,uint8,uint256,uint256)" \
  1 --rpc-url $RPC

cast call $ESCROW "platformFeePercent()(uint256)" --rpc-url $RPC
cast call $ESCROW "platformWallet()(address)" --rpc-url $RPC
cast call $ESCROW "owner()(address)" --rpc-url $RPC
cast call $ESCROW "allowedTokens(address)(bool)" $USDC --rpc-url $RPC
```

### `EscrowStatus`

| Value | Name |
|-------|------|
| 0 | PENDING |
| 1 | FUNDED |
| 2 | COMPLETED |
| 3 | REFUNDED |
| 4 | DISPUTED |

After **Fund escrow**, expect `status = 1`, `completedAt = 0`.  
After **Approve & release**, expect `status = 2` and a non-zero `completedAt`.

`jobId` is the Postgres job id. `client` is the MetaMask account that signed `createEscrow` (`msg.sender`).

## MockUSDC balances

```bash
# Locked in the escrow contract
cast call $USDC "balanceOf(address)(uint256)" $ESCROW --rpc-url $RPC

# A specific wallet (client / freelancer / platform)
cast call $USDC "balanceOf(address)(uint256)" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url $RPC

cast call $USDC "decimals()(uint8)" --rpc-url $RPC
cast call $USDC "symbol()(string)" --rpc-url $RPC
```

After a successful fund of 10 USDC, escrow `balanceOf` should be `10000000`.  
After release: escrow ≈ 0, freelancer ≈ 95%, `platformWallet` ≈ 5%.

## Events

```bash
cast logs --from-block 1 --to-block latest \
  --address $ESCROW \
  "EscrowCreated(uint256,uint256,address,address,address,uint256)" \
  --rpc-url $RPC

cast logs --from-block 1 --to-block latest \
  --address $ESCROW \
  "EscrowFunded(uint256,uint256)" \
  --rpc-url $RPC

cast logs --from-block 1 --to-block latest \
  --address $ESCROW \
  "EscrowCompleted(uint256,uint256,uint256)" \
  --rpc-url $RPC
```

For `EscrowCreated`: `topics[1]` = escrow id, `topics[2]` = job id (both 32-byte padded).

Look up a transaction:

```bash
cast receipt 0x<txhash> --rpc-url $RPC
cast tx 0x<txhash> --rpc-url $RPC
```

## Persist Anvil across restarts

Default `anvil` is in-memory. This repo:

```bash
make anvil          # load/dump .anvil-state.json (Ctrl+C to save)
make anvil-fresh    # delete snapshot, blank chain — then make deploy-local
```

Do **not** run `make deploy-local` on a chain that already has these contracts unless you want new addresses.

## Align with the app

Postgres `payments` is separate from chain state.

| App field | On-chain |
|-----------|----------|
| `payments.on_chain_escrow_id` | `escrowCount` / `getEscrow` id |
| `payments.client_wallet` | `getEscrow.client` |
| `payments.freelancer_wallet` | `getEscrow.freelancer` |
| `payments.amount` (human) | `amount / 1e6` USDC |
| `AWAITING_FUNDING` | no row yet, or fund not confirmed |
| `ESCROWED` / `IN_REVIEW` | `status = FUNDED` |
| `RELEASED` | `status = COMPLETED` |
