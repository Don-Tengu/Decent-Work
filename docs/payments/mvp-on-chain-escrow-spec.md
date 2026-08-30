# Feature Spec: MVP On-Chain Escrow (Fixed-Price)

**Status:** Implemented (MVP) — Foundry toolchain  
**Related plan:** [money-flow-plan.md](./money-flow-plan.md)  
**Stack note:** Smart contracts use **Foundry** (`forge` / `anvil`), not Hardhat.

---

## 1. Summary

Replace simulated “escrow on hire” with a real **client-funded, client-released ETH escrow** using the existing `FreelanceEscrow.sol` contract.

| Today | Target (MVP) |
|-------|----------------|
| `acceptBid` → DB `ESCROWED` (no money) | `acceptBid` → DB `AWAITING_FUNDING` |
| Release flips DB only | Client wallet calls `releasePayment`; backend verifies tx |
| Wallet connect only | Fund + release via MetaMask + ethers Contract |
| Amounts feel like USD | On-chain jobs priced/paid in **ETH** |

**In scope:** fixed-price, single payment per job, **Foundry** (Anvil local + optional Sepolia).  
**Out of scope:** milestones, hourly, auto-release, USDC, fiat, security holds, Upwork-style balance/withdraw.

---

## 2. Personas & goals

| Actor | Goal |
|-------|------|
| **Client** | Hire a freelancer, lock funds in escrow, release when work is done |
| **Freelancer** | See that funds are locked before (or while) working; receive ETH on release |
| **Platform** | Earn 5% fee on release to `platformWallet`; never custody user keys |
| **System** | Keep job/bid marketplace state in Postgres; mirror verified chain state |

---

## 3. User stories

### US-1 — Hire without faking funds
**As a** client  
**I want** to accept a proposal without immediately implying money is held  
**So that** hire choice and funding are separate, honest steps.

**Acceptance**
- After hire, payment status is `AWAITING_FUNDING` (not `ESCROWED`).
- Job is `IN_PROGRESS`, winning bid `ACCEPTED`, others `REJECTED`.
- UI does not say “funds in escrow” until funding is verified.

### US-2 — Fund escrow from wallet
**As a** client  
**I want** to deposit the bid amount into the escrow contract from MetaMask  
**So that** the freelancer has on-chain payment protection.

**Acceptance**
- Client must have a connected/registered wallet matching the funding `msg.sender`.
- Freelancer must have a registered `walletAddress` used as `_freelancer` on-chain.
- Fund amount equals bid amount in wei (see §6 Currency).
- On success: payment → `ESCROWED`, `onChainEscrowId` + `fundTransactionHash` stored.
- Backend rejects confirmations that fail receipt/event checks.

### US-3 — Release payment on-chain
**As a** client  
**I want** to release escrowed funds from MetaMask  
**So that** the freelancer is paid and the platform fee is taken automatically.

**Acceptance**
- Only hiring client; payment must be `ESCROWED`; job `IN_PROGRESS`.
- Client calls `releasePayment(escrowId)` on the contract.
- Backend verifies tx → payment `RELEASED`, job `COMPLETED`, release hash stored.
- Freelancer receives ~95%; platform ~5% (contract fee).

### US-4 — Protection visibility
**As a** freelancer  
**I want** to see whether escrow is funded  
**So that** I know if I have payment protection.

**Acceptance**
- My Bids / job context shows: Awaiting funding | Funded (escrowed) | Released.
- Optional: truncated fund tx hash + link to block explorer (Sepolia).

### US-5 — Off-chain jobs still work (optional dual mode)
**As a** client posting a job  
**I want** to choose off-chain negotiated vs on-chain escrow  
**So that** demos without a wallet still work.

**Acceptance**
- `paymentModel = OFF_CHAIN_NEGOTIATED`: keep current simulated path **or** disable hire-until-wallet (product choice — see §11).
- `paymentModel = ON_CHAIN_ESCROW`: enforce fund/release verification path only.
- **Default recommendation:** for MVP, hard path for `ON_CHAIN_ESCROW`; leave off-chain as today’s simulated behavior until product decides to deprecate it.

---

## 4. Lifecycle state machine

### 4.1 Payment statuses

| Status | Meaning | Terminal? |
|--------|---------|-----------|
| `AWAITING_FUNDING` | Hired; no verified on-chain fund | No |
| `ESCROWED` | Fund tx verified; chain `FUNDED` | No |
| `RELEASED` | Release tx verified; chain `COMPLETED` | Yes |
| `REFUNDED` | Refund/dispute-to-client verified (stub UX in MVP) | Yes |
| `DISPUTED` | Optional in MVP; can defer to Phase 2 | No |

**Migration note:** Existing rows with simulated `ESCROWED` and no `fundTransactionHash` should be treated as legacy. Prefer a `fundingMode = SIMULATED | ON_CHAIN` flag.

### 4.2 Transitions (on-chain job)

```text
acceptBid
  → AWAITING_FUNDING

confirmEscrowFunding (verified createEscrow receipt)
  → ESCROWED

confirmPaymentRelease (verified releasePayment receipt)
  → RELEASED  (+ job COMPLETED)

[Phase 2+] dispute / refund paths
  → DISPUTED / REFUNDED
```

### 4.3 Job status (unchanged for MVP)

`OPEN` → (hire) `IN_PROGRESS` → (release) `COMPLETED`

Funding does **not** change job status; it only changes payment protection status.

---

## 5. Money movement (exact)

```text
Client wallet
    │  createEscrow(jobId, freelancerWallet) payable
    │  value = bidAmountWei
    ▼
FreelanceEscrow contract  (status FUNDED, holds ETH)
    │
    │  releasePayment(escrowId)   [client only]
    ├──────────────────────────► Freelancer wallet  (amount - fee)
    └──────────────────────────► platformWallet     (fee = amount * 5%)
```

**No** intermediate “Pending / 5-day hold / Upwork balance.”  
**No** backend private key transfers.

### Fee display (UI copy)

- Gross escrow: **X ETH** (bid amount)
- Platform fee: **5%** (read from contract or config snapshot)
- Freelancer net on release: **~0.95X ETH**
- Client pays gas for fund and release separately

---

## 6. Currency & amount rules

| Rule | Detail |
|------|--------|
| On-chain jobs | `currencyCode = ETH` (or `NATIVE`); UI labels “ETH” |
| Bid `amount` | Decimal in ETH (e.g. `0.05`), convertible to wei |
| Storage | Keep `amount` (ETH decimal) + store `amountWei` (string) at fund time |
| Conversion | `parseEther(amount)` on FE; backend re-derives and compares to event amount |
| USD jobs | Only for `OFF_CHAIN_NEGOTIATED` until stablecoin phase |

**Validation**

- `amount > 0`
- Fund confirmation: on-chain value == expected wei (exact)
- Reject if freelancer address on tx ≠ payment.freelancer.walletAddress (normalized)

---

## 7. Data model changes

### 7.1 `Payment` entity / table

| Field | Type | Notes |
|-------|------|--------|
| `status` | enum | Add `AWAITING_FUNDING`; keep `ESCROWED`, `RELEASED`, `REFUNDED` |
| `fundingMode` | enum | `SIMULATED` \| `ON_CHAIN` |
| `onChainEscrowId` | string/long | Contract escrow id |
| `chainId` | long | e.g. 31337 local, 11155111 Sepolia |
| `fundTransactionHash` | string | nullable until funded |
| `releaseTransactionHash` | string | nullable; map or replace ambiguous `transactionHash` |
| `amountWei` | string | exact native units |
| `clientWallet` | string | snapshot at fund |
| `freelancerWallet` | string | snapshot at fund |
| `platformFeePercent` | int | snapshot (default 5) |
| `escrowAddress` | string | deployed contract address (already exists) |

**SQL migration:** new file under `backend/sql/`.

### 7.2 GraphQL

```graphql
enum PaymentStatus {
  AWAITING_FUNDING
  ESCROWED
  RELEASED
  REFUNDED
}

enum FundingMode {
  SIMULATED
  ON_CHAIN
}

type Payment {
  id: ID!
  amount: BigDecimal!
  amountWei: String
  status: PaymentStatus!
  fundingMode: FundingMode!
  transactionHash: String
  fundTransactionHash: String
  releaseTransactionHash: String
  onChainEscrowId: String
  chainId: Int
  escrowAddress: String!
  clientWallet: String
  freelancerWallet: String
  platformFeePercent: Int
  job: Job!
  freelancer: User!
  client: User!
  createdAt: DateTime!
}

type Mutation {
  acceptBid(bidId: ID!): Payment!

  """Client submits fund tx hash after MetaMask createEscrow succeeds."""
  confirmEscrowFunding(paymentId: ID!, transactionHash: String!): Payment!

  """Client submits release tx hash after MetaMask releasePayment succeeds."""
  confirmPaymentRelease(paymentId: ID!, transactionHash: String!): Payment!

  """
  Legacy/simulated release for OFF_CHAIN_NEGOTIATED only.
  Must reject for ON_CHAIN payments without a verified hash path.
  """
  releasePayment(paymentId: ID!, transactionHash: String): Payment!
}
```

---

## 8. API / service behavior

### 8.1 `acceptBid(bidId)`

**Unchanged guards:** job owner; job `OPEN`; reject competitors; accept winner; job `IN_PROGRESS`.

**When job.paymentModel == ON_CHAIN_ESCROW:**

1. Soft-warn if wallets missing; **hard-require** wallets before fund.
2. Create `Payment` with `status = AWAITING_FUNDING`, `fundingMode = ON_CHAIN`, `amount = bid.amount`, `escrowAddress = config` (non-zero).
3. Do **not** set `ESCROWED`.

**When OFF_CHAIN_NEGOTIATED (dual mode):**

- Keep simulated `ESCROWED` + `fundingMode = SIMULATED`.

### 8.2 `confirmEscrowFunding(paymentId, transactionHash)`

**Caller:** hiring client (JWT).

1. Payment must be `AWAITING_FUNDING`, `fundingMode = ON_CHAIN`.
2. Fetch receipt via RPC; require success.
3. Verify `to` == configured escrow contract.
4. Decode `EscrowCreated` / `EscrowFunded`: jobId, client, freelancer, amount must match.
5. Persist `onChainEscrowId`, hashes, wallet snapshots, `amountWei`, `chainId`, `status = ESCROWED`.
6. Idempotent on same hash; error if different hash while already funded.

### 8.3 `confirmPaymentRelease(paymentId, transactionHash)`

1. Payment `ESCROWED`, job `IN_PROGRESS`.
2. Verify receipt + `EscrowCompleted` for matching `onChainEscrowId`.
3. Set `RELEASED`, release hash, job `COMPLETED`.
4. Idempotent on same hash.

### 8.4 `releasePayment` (legacy)

- `SIMULATED`: current DB-only release.
- `ON_CHAIN`: reject unless verification path used.

### 8.5 Web3 config

```yaml
web3:
  provider-url: ${WEB3_PROVIDER_URL:http://127.0.0.1:8545}
  escrow-contract-address: ${ESCROW_CONTRACT_ADDRESS}
  chain-id: ${WEB3_CHAIN_ID:31337}
  platform-fee-percent: 5
```

Frontend (Vite):

```bash
VITE_ESCROW_ADDRESS=0x...
VITE_CHAIN_ID=31337
VITE_CHAIN_NAME=Hardhat
VITE_BLOCK_EXPLORER_URL=
```

---

## 9. Smart contract

### 9.1 Use as-is (MVP)

| Function | MVP? |
|----------|------|
| `createEscrow(jobId, freelancer) payable` | Yes — fund |
| `releasePayment(escrowId)` | Yes — release |
| `refundPayment` | Optional later |
| `raiseDispute` / `resolveDispute` | Phase 2 |
| `getEscrow` | Optional UI read |

### 9.2 Prerequisites

1. Fix Hardhat tests (`completeEscrow`/`refundEscrow` → `releasePayment`/`refundPayment`).
2. Deploy + `deployment.json`.
3. Export ABI for frontend.
4. Document: client cannot solo-refund; freelancer/owner refund or dispute (Phase 2).

### 9.3 Prefer zero Solidity changes for first ship.

---

## 10. Frontend specifications

### 10.1 New modules

| Module | Responsibility |
|--------|----------------|
| `frontend/src/contracts/FreelanceEscrow.json` | ABI |
| `frontend/src/utils/escrow.js` | fund/release helpers, chain guard |
| `frontend/src/config/web3.js` | address, chainId from env |

### 10.2 Proposed helpers

```js
ensureCorrectChain(provider) → void | throws
fundEscrow({ signer, jobId, freelancerAddress, amountEth }) → { txHash, escrowId? }
releaseEscrow({ signer, escrowId }) → { txHash }
```

### 10.3 Proposals page CTA matrix

| State | CTA |
|-------|-----|
| Job `OPEN`, bid `PENDING` | **Hire** |
| Payment `AWAITING_FUNDING` | **Fund escrow** → confirm mutation |
| Payment `ESCROWED` | **Release payment** → confirm mutation |
| Payment `RELEASED` | Paid / completed badge |

**Fund dialog:** deposit amount, 5% fee only on release, network name.  
**Release dialog:** net to freelancer, fee to platform, irreversible on-chain.

### 10.4 Errors

| Case | UI |
|------|-----|
| User rejected MetaMask | Toast |
| Wrong network | Prompt switch |
| Insufficient balance | Friendly message |
| Verify mutation fails | Error + retry |
| Missing freelancer wallet | Block fund |

---

## 11. Product decisions to confirm in review

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| D1 | Dual mode off-chain + on-chain? | A) Both B) On-chain only | **A** |
| D2 | Require wallets at hire or fund? | A) Hire B) Fund | **B** |
| D3 | Currency | A) ETH B) USDC | **A** |
| D4 | Legacy simulated rows | A) Migrate B) Flag SIMULATED | **B** |
| D5 | MVP refund UI | A) None B) Freelancer refund | **A** |
| D6 | Block DB-only release for on-chain | Yes/No | **Yes** |

---

## 12. Security requirements

1. Never mark `ESCROWED`/`RELEASED` for `ON_CHAIN` without successful receipt verification.
2. Normalize addresses consistently.
3. Bind JWT user to `payment.client_id`.
4. Reject zero contract address for on-chain ops.
5. Bind tx to the correct payment/job (no cross-payment hash reuse).
6. Unique constraint on `fund_transaction_hash` (nullable unique).
7. No backend private keys for user fund/release.

---

## 13. Testing plan

### Contract
- Green suite: create, release (fee split), refund, dispute/resolve.
- Local deploy smoke.

### Backend
- `acceptBid` → `AWAITING_FUNDING` for on-chain.
- `confirmEscrowFunding` / `confirmPaymentRelease` success, idempotency, mismatch cases.
- Simulated path if dual mode.
- Mocked Web3 receipt decoder tests.

### Frontend
- CTA matrix by payment status.
- Mutations include hashes.
- Mock ethers where feasible.

### Manual E2E
1. Hardhat node + deploy.
2. Config addresses/chain.
3. Client + freelancer wallets.
4. Post `ON_CHAIN_ESCROW` job → bid → hire.
5. Fund → client ↓ contract ↑.
6. Release → freelancer ~95%, platform ~5%, job completed.

---

## 14. Implementation checklist (after approval)

- [ ] Fix contract tests + deploy + export ABI
- [ ] Config: chain id, contract address, provider URL
- [ ] DB migration + Payment model/GraphQL
- [ ] PaymentService: status change + confirm fund/release + verifier
- [ ] Controllers + error codes
- [ ] Frontend escrow utils + env
- [ ] ProposalsPage MetaMask fund/release
- [ ] Tests (backend + contract + FE)
- [ ] Update README / AGENTS
- [ ] Manual E2E on Hardhat

**Non-goals for this ticket:** auto-release, milestones, hourly, dispute UI, USDC, multi-chain, indexer, gas relayer.

---

## 15. Future specs (stubs)

| Spec | Phase | One-liner |
|------|-------|-----------|
| Review window + auto-release | 2 | IN_REVIEW + deadline + keeper |
| Disputes | 2 | raiseDispute + admin resolve |
| Milestones | 3 | N escrows per job |
| Stablecoin escrow | 4 | USDC V2 contract |
| Hourly prepaid | 5 | Weekly buckets; no silent card charge |

Full narrative: [money-flow-plan.md](./money-flow-plan.md).

---

## 16. Open questions for reviewers

1. Keep dual mode (`OFF_CHAIN_NEGOTIATED` simulated) for demos, or force on-chain for all hires?
2. Is 5% fee fixed in UI copy, or always read live `platformFeePercent()` from chain?
3. Notify freelancers on fund/release? (recommend no for MVP)
4. Minimum bid amount in ETH for local testing defaults?
5. Prefer `releasePayment(paymentId, transactionHash!)` only vs separate `confirmPaymentRelease`?

---

## Document history

| Date | Author | Change |
|------|--------|--------|
| 2026-07-15 | Planning session | Initial draft for review |
