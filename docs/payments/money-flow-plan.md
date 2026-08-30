# Plan: Money Flow for Decent Work (Web3 Upwork Clone)

## Goal

Design how money moves in this platform by mapping Upwork’s escrow/release model onto a **non-custodial Web3 escrow**, using what already exists (`Payment` state machine + `FreelanceEscrow.sol`), and sequencing **MVP → product-grade** phases without boiling the ocean.

---

## 1. Core principle: Upwork vs Web3 money

| Upwork (custodial fiat) | Decent Work (Web3) |
|-------------------------|--------------------|
| Client pays card/PayPal → **Upwork holds** | Client signs wallet tx → **smart contract holds** |
| “Work in Progress” ledger entry | On-chain escrow `FUNDED` + DB `ESCROWED` |
| Approve / auto-release after 14 days | Client `releasePayment` / later timed auto-release |
| 5-day security hold + withdrawal rails | **Usually unnecessary** — release pays freelancer wallet **immediately** |
| Platform + freelancer service fees | **On-chain platform fee** (already 5% in contract) |
| Dispute team / chargebacks | `raiseDispute` + platform owner `resolveDispute` (no card chargebacks) |
| Hourly tracker + weekly invoice | **Future** — harder; keep fixed-price first |

**What we deliberately do *not* copy for MVP**

- Fiat rails, ACH, PayPal, “Upwork balance,” 5-day hold, contract initiation fee
- Hourly Work Diary / random screenshots
- Client marketplace fee as a separate fiat line item (encode as platform fee on release)
- Off-platform payment encouragement — product rule stays: **protected work only via escrow**

**Trust model for MVP**

- Prefer **client-signed txs** (MetaMask) for fund + release.
- Backend is **source of marketplace truth** (who hired whom, job status) and **indexer/verifier** of chain events — not a custodian of user funds.
- Avoid a backend private key that moves user money (that re-centralizes like Upwork).

---

## 2. Map Upwork fixed-price flow → our system

```text
UPWORK                              DECENT WORK (target)
──────                              ────────────────────
Client funds milestone              Client createEscrow{value} (or fundEscrow)
  → “Work in Progress”                → chain FUNDED + DB ESCROWED

Freelancer submits work             Off-chain submit / message (later)
  → “In Review”                       → DB IN_REVIEW (later)

Client approve                      Client releasePayment(escrowId)
  → release                           → chain COMPLETED + DB RELEASED
                                      → ETH to freelancer + fee to platform

Request changes                     Off-chain only (no money move)

No action 14 days                   Optional: auto-release (Phase 2+)

Request refund / dispute            raiseDispute → owner resolveDispute
                                    or mutual refundPayment

5-day hold → withdraw               Skip: wallet already paid on release
```

Hourly Upwork cycle is **out of MVP scope**. Leave job `BudgetType.HOURLY` as pricing metadata only until a later “logged hours → invoice → fund/release” design.

---

## 3. What already exists (baseline)

| Layer | Today | Gap |
|-------|--------|-----|
| Hire UI + GraphQL | `acceptBid` creates `Payment ESCROWED` immediately | No real fund step |
| Release UI | Client flips DB to `RELEASED` | No chain call / no verify |
| Contract | ETH lump-sum escrow, 5% fee, refund, dispute | Not deployed into app; tests name-mismatched |
| Wallets | MetaMask connect → `User.walletAddress` | Not required for hire/pay |
| Amounts | Bid `BigDecimal` + job `currencyCode` (USD) | Chain is **native ETH** — unit mismatch |
| Data model | 1 payment per job; no `escrowId` | Need chain IDs + fund/release hashes |
| Payment models on Job | `OFF_CHAIN_*` / `ON_CHAIN_*` enums | Hire ignores them |

---

## 4. Recommended architecture (target money path)

```text
┌─────────────┐  JWT GraphQL   ┌──────────────────┐
│ React +     │ ─────────────► │ Spring backend   │
│ MetaMask    │                │ hire / verify /  │
│ ethers      │ ◄── ABI+addr ──│ index payments   │
└──────┬──────┘                └────────┬─────────┘
       │ wallet txs                     │ read RPC / events
       ▼                                ▼
┌──────────────────────────────────────────────┐
│ FreelanceEscrow (Sepolia / local Anvil)      │
│ createEscrow → FUNDED                        │
│ releasePayment → freelancer + platform fee   │
│ refund / dispute / resolve                   │
└──────────────────────────────────────────────┘
```

**Source of truth split**

| Concern | Owner |
|---------|--------|
| Marketplace identity, job, bid winner | Backend DB |
| Custody of funds | Smart contract |
| Payment status after funding | **Chain first**, DB mirrors after verification |
| UI enablement (Hire / Fund / Release) | Backend + chain status |

---

## 5. MVP money flow (Phase 1) — “Fixed-price single escrow”

Goal: one protected hire path end-to-end on testnet/local, still fixed-price only.

### 5.1 User journey

```text
1. Freelancer + client both connect wallets (required before fund/release)
2. Client hires winner (acceptBid) — job IN_PROGRESS, payment AWAITING_FUNDING
3. Client clicks Fund escrow → MetaMask createEscrow(jobId, freelancerWallet) { value }
4. Frontend/backend records fund tx → verify → payment ESCROWED + onChainEscrowId
5. Work off-platform / off-app (MVP)
6. Client Release → MetaMask releasePayment(escrowId)
7. Verify release tx → payment RELEASED, job COMPLETED
```

**Why split Hire and Fund?**

- Matches contract: escrow needs known `freelancer` address + `msg.value`
- Avoids “accept without money” looking like Upwork WIP while unpaid
- Clear UX: Hire chooses person; Fund locks money; Release pays

Alternative (not recommended for v1): fund-first then hire — fights current bid lifecycle.

### 5.2 Status model changes

**Payment (DB)**

| Status | Meaning |
|--------|---------|
| `AWAITING_FUNDING` | Hired; no on-chain fund yet (**new**) |
| `ESCROWED` | Fund tx verified (`FUNDED` on chain) |
| `RELEASED` | Release tx verified |
| `REFUNDED` | Refund/dispute-to-client verified |
| `DISPUTED` | Optional mirror of chain dispute (**Phase 1.5**) |

Keep job statuses: `OPEN → IN_PROGRESS → COMPLETED` (and later `DISPUTED` if needed).

**New Payment fields (MVP)**

- `onChainEscrowId` (uint / string)
- `fundTransactionHash`, `releaseTransactionHash` (or reuse `transactionHash` + add fund hash)
- `chainId`
- `freelancerWallet`, `clientWallet` snapshots at fund time
- `amountWei` (or `amountNative`) alongside display `amount`
- `platformFeePercent` snapshot

### 5.3 Amount / currency strategy (MVP decision)

**MVP recommendation: treat bid amount as native ETH (or “ETH-denominated units”), not USD.**

| Option | Pros | Cons |
|--------|------|------|
| **A. Bid amount = ETH** (recommended MVP) | Matches contract; simple | UI must say ETH not USD |
| B. Bid USD + oracle conversion at fund | Familiar pricing | Oracle complexity, slippage |
| C. USDC escrow contract | Stable “dollar” jobs | Contract rewrite + token approvals |

**MVP product rule:** for `paymentModel = ON_CHAIN_ESCROW`, force `currencyCode = ETH` (or `native`) and show amounts as ETH. Leave USD jobs on `OFF_CHAIN_NEGOTIATED` until stablecoins.

### 5.4 Fee model (MVP)

Map Upwork’s dual fees into **one platform fee already on-chain**:

- Client deposits **gross** bid amount into escrow
- On release: `fee = amount * platformFeePercent / 100` → `platformWallet`
- Freelancer receives `amount - fee` **in wallet** (no withdraw step)
- Document clearly in UI: “Freelancer receives 95% · Platform 5%” (configurable ≤ 10%)

Do **not** implement client marketplace fee + initiation fee + freelancer variable ladder in MVP.

### 5.5 Authorization rules

| Action | Who | Checks |
|--------|-----|--------|
| `acceptBid` | Job owner | Job `OPEN`; both parties **have wallets** (or require wallets only before fund) |
| Fund | Client wallet **must** be job client’s registered `walletAddress` | `msg.sender` == client; freelancer address == registered freelancer wallet; amount == bid |
| Release | Client wallet | Only if DB `ESCROWED` + chain `FUNDED` |
| Work without fund | Allowed but unprotected | UI banner: “Escrow not funded — no payment protection” |

**Strict MVP:** block “start work” messaging later; for now, show funding required banner and disable Release until funded.

### 5.6 Verification strategy (MVP)

**Client-submitted tx hash + backend RPC verify** (simplest):

1. FE sends `fundEscrow(paymentId, txHash)` / includes hash on release mutation
2. Backend (Web3j): fetch receipt, decode `EscrowCreated`/`EscrowFunded` or `EscrowCompleted`
3. Assert: contract address, client, freelancer, amount, jobId match payment
4. Then flip DB status

**Later:** optional event indexer / listener for resilience if user closes browser mid-tx.

Do **not** trust client “I funded” without receipt verification.

### 5.7 Contract work for MVP

Existing `FreelanceEscrow.sol` is **enough for MVP** with small fixes:

1. Align Hardhat tests with `releasePayment` / `refundPayment` (tests currently call old names)
2. Deploy local + Sepolia; write address to `application.yml` + frontend env
3. Export ABI to `frontend/src/contracts/FreelanceEscrow.json` (+ optional backend wrappers)
4. Consider: `refundPayment` today is **freelancer or owner only** — document as “freelancer agrees to refund”; client path is **dispute → platform resolve**
5. Optional small improvements (only if needed before ship):
   - Store `amount` checks vs off-chain expected (backend verifies; contract stays dumb)
   - Emit clearer events (already good)

**Do not** add milestones/hourly into the contract for MVP.

### 5.8 Backend API shape (MVP)

```graphql
# Existing (adjust behavior)
acceptBid(bidId: ID!): Payment!          # → AWAITING_FUNDING (not ESCROWED)
releasePayment(...)                        # prefer verify-then-update OR deprecate pure DB flip

# New / adjusted
confirmEscrowFunding(paymentId: ID!, transactionHash: String!): Payment!
confirmPaymentRelease(paymentId: ID!, transactionHash: String!): Payment!
# Optional later:
confirmRefund(...), raiseDispute(...)
```

**Frontend tx helpers** (`frontend/src/utils/escrow.js`):

- `fundEscrow({ jobId, freelancerAddress, amountWei })`
- `releaseEscrow({ escrowId })`
- read `getEscrow(escrowId)` for UI status

**Hire UI flow on ProposalsPage:**

1. Hire (if open)  
2. Fund escrow (if `AWAITING_FUNDING`) — MetaMask  
3. Release (if `ESCROWED`) — MetaMask  

### 5.9 MVP non-goals

- Auto-release timers  
- Partial release / bonuses  
- Hourly billing  
- Multi-milestone  
- Fiat on/off ramps  
- Multi-chain  
- Platform custodial balance  
- Chargeback-style 5-day hold  

### 5.10 Concrete implementation order (MVP)

1. **Commit current off-chain hire work** + fix `.gitignore` for tests (ops hygiene)
2. **Contract hygiene:** fix tests, deploy Hardhat/local, export ABI, set config
3. **Data model:** payment statuses/fields + GraphQL
4. **Change `acceptBid`:** create `AWAITING_FUNDING` (stop faking `ESCROWED`)
5. **FE fund path:** MetaMask `createEscrow` + `confirmEscrowFunding`
6. **FE release path:** MetaMask `releasePayment` + verified `confirmPaymentRelease`
7. **Wallet gates:** require client + freelancer wallets before fund
8. **UI copy/currency:** ETH amounts, fee disclosure, protection banner
9. **Tests:** PaymentService verification with mocked Web3j; contract tests green
10. **E2E script:** local Hardhat + two MetaMask accounts (or Hardhat accounts)

---

## 6. Phase 2 — Upwork-like protection without fiat

Still fixed-price; add trust features freelancers care about.

| Upwork feature | Web3 implementation |
|----------------|---------------------|
| Submit work → In Review | `Submission` entity + job `IN_REVIEW`; no money move |
| 14-day auto-release | Off-chain scheduler **or** contract `autoReleaseAfter` timestamp; relayer/anyone calls `autoRelease` when due |
| Request changes | Reset review deadline on resubmit (DB only) |
| Request refund | Client `raiseDispute` or propose refund; freelancer `refundPayment` |
| Platform dispute resolution | Owner `resolveDispute(releaseToFreelancer)` — platform multisig later |
| Bonuses / tip | Second small `createEscrow` or `tip(freelancer)` payable helper |
| Payment protection badge | UI: funded on-chain ✓ |

**Suggested contract upgrades (Phase 2)**

- `reviewDeadline` / `autoReleaseAt` on escrow
- `autoRelease(escrowId)` callable after deadline if still `FUNDED`
- Optional mutual-consent refund (both signatures or client+freelancer flags)

**Backend**

- Cron/worker: notify upcoming auto-release; optional keeper bot that submits `autoRelease` txs (gas paid by platform)
- Dispute UI + admin resolve console

---

## 7. Phase 3 — Milestones (Upwork fixed-price contracts)

Maps multi-milestone escrow.

```text
Job (parent)
  Milestone 1 — fund → work → release
  Milestone 2 — fund → work → release
  ...
```

**Model**

- Drop unique `payment.job_id` one-to-one; become `Payment`/`Milestone` many per job
- Each milestone: amount, order, status, `onChainEscrowId`
- Contract: either N× `createEscrow(jobId, freelancer)` (works today) **or** v2 contract with milestone index

**UX**

- Client defines milestones at hire or post-hire
- Freelancer only starts a milestone when funded (“cannot proceed without funding” = Upwork rule)

**PaymentModel:** finally wire `ON_CHAIN_MILESTONE_ESCROW`.

---

## 8. Phase 4 — Stable value + better fees

| Item | Approach |
|------|----------|
| USD-like pricing | Escrow in **USDC** (ERC-20) — approve + `deposit` |
| FX | Avoid platform FX; price and pay in same stablecoin |
| Freelancer fee tiers | Snapshot `feeBps` at contract creation per job |
| Client fee | Extra bps on fund (`msg.value` includes fee) or separate invoice — prefer single clear fee |
| Receipts | On-chain events + DB ledger for tax exports |

New contract: `FreelanceEscrowV2` (ERC-20, milestones, deadlines). Keep V1 for ETH demos.

---

## 9. Phase 5 — Hourly (Upwork weekly cycle) — hard mode

Only after fixed-price escrow is solid.

| Upwork | Web3 approach |
|--------|----------------|
| Time tracker / Work Diary | Off-chain time entries (screenshots optional) — **trust + dispute**, not perfect proof |
| Monday auto-invoice | Backend creates `Invoice` for week’s hours × rate |
| Client charged automatically | **No card ACH** — client must **pre-fund weekly escrow** or fund invoice within N days |
| Dispute hours by Friday | Dispute window on invoice before release |
| Pay Wednesday | Release after window; optional auto-release |

**Critical difference:** crypto cannot silently charge a card. Hourly needs either:

1. **Prepaid hour bucket** (client funds N hours in advance — closest to protection), or  
2. **Postpaid invoice** (freelancer risk until client funds) — weaker protection  

Recommend prepaid buckets for any “payment protection” claim.

---

## 10. What “wires” money at each stage (summary)

| Stage | Money path |
|-------|------------|
| **Today** | Nothing wires — DB status only |
| **MVP** | Client wallet → Escrow contract → (on release) Freelancer wallet + Platform wallet |
| **Phase 2** | Same + dispute/refund paths + optional auto-release keeper |
| **Phase 3** | Same per milestone escrowId |
| **Phase 4** | Client USDC → Escrow → Freelancer USDC + fee |
| **Phase 5** | Weekly/prepaid escrow top-ups → release per invoice |
| **Never for Web3 brand** | Platform holds user private keys / silent card chargebacks (unless you later add a **custodial fiat product** — separate business) |

---

## 11. Risks & decisions locked for MVP

| Risk | Mitigation |
|------|------------|
| User closes browser after fund tx | `confirmEscrowFunding` recoverable by re-submitting tx hash; later event indexer |
| Wrong network | FE checks `chainId` before send; backend rejects wrong chain |
| Freelancer wallet wrong | Require `walletAddress` before hire/fund; show confirmation |
| USD/ETH confusion | Force ETH labeling for on-chain jobs |
| Double hire | Keep job `OPEN` guard + unique payment constraints |
| Backend marks RELEASED without chain | Remove pure DB release for on-chain jobs; verify only |
| Contract test drift | Fix Hardhat suite before deploy |
| Refund auth asymmetry | UX: “Freelancer refund” vs “Client dispute” |

**Open product choices (defaults recommended)**

1. **Hire without immediate fund allowed?** → Yes, status `AWAITING_FUNDING` (Recommended)  
2. **Currency MVP?** → ETH-native (Recommended) over USDC rewrite  
3. **Who pays gas for release?** → Client (matches contract `only client`)  
4. **Platform fee display?** → Show net to freelancer at fund and release  

---

## 12. Success criteria (MVP)

- [ ] Deployed escrow on local Hardhat (and optionally Sepolia)
- [ ] Hire creates payment **not** already `ESCROWED`
- [ ] Fund requires MetaMask tx; DB becomes `ESCROWED` only after verified receipt
- [ ] Release requires MetaMask tx; freelancer balance increases; platform receives ~5%
- [ ] `transactionHash` / escrow id stored and visible in UI
- [ ] Off-chain-only path can remain for `OFF_CHAIN_NEGOTIATED` jobs if desired
- [ ] Unit + contract tests green; one documented E2E happy path

---

## 13. Suggested sequencing relative to current repo

```text
Now ──► Commit off-chain hire + docs ──► MVP on-chain fund/release (this plan §5)
       ──► Phase 2 review/dispute/auto-release
       ──► Phase 3 milestones
       ──► Phase 4 stablecoin
       ──► Phase 5 hourly prepaid
```

---

## Key files to touch (MVP)

| Area | Files |
|------|--------|
| Contract | `smart-contracts/contracts/FreelanceEscrow.sol`, tests, `scripts/deploy.js` |
| Backend model | `Payment.java`, GraphQL schema, migrations under `backend/sql/` |
| Backend logic | `PaymentService.java`, `PaymentController`, Web3 verification helper |
| Config | `application.yml` (`provider-url`, `escrow-contract-address`, chain id) |
| Frontend | `web3.js` → `escrow.js`, `ProposalsPage.jsx`, GraphQL ops, env contract address |
| Docs | README / AGENTS money-flow section |

---

## Bottom line

- **Upwork wires money through a company ledger + bank rails.**  
- **Decent Work should wire money through a smart-contract escrow**, with the backend as marketplace + verifier.  
- **MVP = fixed-price, single escrow, ETH, client-funded, client-released, 5% platform fee on release** — map Upwork’s fund → work → approve path, skip holds/withdrawals/hourly.  
- **Future phases** reintroduce Upwork’s sophistication (review windows, auto-release, milestones, stablecoins, hourly) **on top of** that escrow primitive—not by re-centralizing funds in the Spring app.
