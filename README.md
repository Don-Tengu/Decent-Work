# Decent Work

A decentralized freelance marketplace with smart-contract escrow as the end goal. Today it is a working **off-chain marketplace** (post jobs, bid, hire, release payment) with a Web3-shaped skeleton; on-chain escrow is not wired into the app yet.

## Project structure

```
decent-work/
├── backend/           # Spring Boot + GraphQL API (+ REST for file attachments)
├── frontend/          # React SPA
├── smart-contracts/   # Solidity escrow (Foundry)
├── docs/              # Misc tooling / docs
└── docker-compose.yml # Local Postgres + Redis
```

## Tech stack

| Layer | Stack |
|-------|--------|
| Backend | Spring Boot 3.2, Java 17, Spring for GraphQL (schema-first), JPA/Hibernate, PostgreSQL, Web3j, JWT |
| Frontend | React 19, Vite 7, Apollo Client, Chakra UI v3, React Router, ethers.js v6, lucide-react, Vitest |
| Blockchain | Solidity, Foundry (forge/anvil), OpenZeppelin (`FreelanceEscrow.sol`) |

Redis is provisioned in Docker and configured in Spring, but is not used by application code yet.

## Features (MVP)

| Feature | Status |
|---------|--------|
| User registration & authentication (JWT) | Done |
| Role-aware dashboard (client / freelancer) | Done |
| Multi-step job posting (draft → publish → edit → cancel) | Done |
| Job attachments (REST upload/download/delete) | Done |
| Job marketplace (search, filter, sort, pagination) | Done (working tree; largely uncommitted) |
| Place bid / proposal form + bid attachments | Done |
| Save / unsave jobs | Done |
| Client offer → freelancer accept (`offerBid` / `acceptOffer`) | Done |
| In-app notifications (offer / accept / decline / not selected) | Done |
| Release payment → complete job | Done (simulated or on-chain) |
| Freelancer profile page | Scaffold (many sections “coming soon”) |
| On-chain escrow fund / release | **MVP wired** (Foundry + MetaMask + RPC verify) |

### Hire & payment loops

**Hiring (both payment models)**

1. Client **Offer** (`offerBid`) → bid `OFFERED`, job stays `OPEN`, other proposals stay pending, freelancer notified in-app.
2. Freelancer **Accept** (`acceptOffer`) → bid `ACCEPTED`, competing `PENDING` → `REJECTED`, job `IN_PROGRESS`, payment created; **or Decline** → bid returns to `PENDING`.
3. Client may **Withdraw offer** before accept.

Offered/hired jobs are found via **My proposals**, dashboard offers/active contracts, and notifications — not marketplace search (which stays `OPEN`-only).

**Off-chain (`paymentModel = OFF_CHAIN_NEGOTIATED`, default)**

1. After accept → payment `ESCROWED` (simulated) → Release → `RELEASED` / job `COMPLETED`.

**On-chain (`paymentModel = ON_CHAIN_ESCROW`)**

1. After accept → payment `AWAITING_FUNDING`.
2. Client **Fund escrow** (MetaMask `createEscrow`) → backend verifies → `ESCROWED`.
3. Client **Release payment** (MetaMask `releasePayment`) → backend verifies → `RELEASED` / job `COMPLETED` (freelancer ~95%, platform 5%).

See `docs/payments/` and `smart-contracts/README.md`.

## Quick start

### Prerequisites

- Java 17+
- **Node.js 20.19+ or 22.12+** (Node 18 is too old for the frontend toolchain)
- Docker & Docker Compose
- MetaMask (optional until on-chain escrow lands)

### 1. Align database credentials

`docker-compose.yml` and `backend/src/main/resources/application-local.yml` currently disagree:

| | Docker Compose | `application-local.yml` |
|--|----------------|-------------------|
| DB name | `freelance_marketplace` | `decent_work` |
| User | `admin` | `jean` |
| Password | `admin123` | (local secret in file) |

Align them before `docker-compose up` + `./mvnw spring-boot:run`, or point the app at an existing local Postgres that matches `application-local.yml`.

Backend config is split:

| File | Role |
|------|------|
| `application.yml` | Shared base (env placeholders, safe defaults) |
| `application-local.yml` | Local profile: DB credentials, JWT secret, GraphiQL, verbose security logs, Anvil web3 defaults |

`local` is active by default (`SPRING_PROFILES_ACTIVE` defaults to `local`). Override with e.g. `SPRING_PROFILES_ACTIVE=prod`.

### 2. Start infrastructure

```bash
docker-compose up -d
```

### 3. Run backend (`http://localhost:8080`)

```bash
cd backend
./mvnw spring-boot:run
```

- GraphQL: `http://localhost:8080/graphql`
- GraphiQL: `http://localhost:8080/graphiql`
- Job attachments: `/api/jobs/{jobId}/attachments`
- Bid attachments: `/api/bids/{bidId}/attachments`

### 4. Run frontend (`http://localhost:5173`)

```bash
cd frontend
npm install
npm run dev
```

Optional: set `VITE_API_BASE_URL` (default `http://localhost:8080`).

### 5. Smart contracts (Foundry)

```bash
# Install Foundry: https://book.getfoundry.sh/getting-started/installation
cd smart-contracts
forge build
forge test

# Terminal A — local chain
anvil

# Terminal B — deploy
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Then set env (backend + frontend) to the deployed address:

```bash
export ESCROW_CONTRACT_ADDRESS=0x...   # forge script output
export WEB3_PROVIDER_URL=http://127.0.0.1:8545
export WEB3_CHAIN_ID=31337

# frontend/.env.local
VITE_ESCROW_ADDRESS=0x...
VITE_CHAIN_ID=31337
VITE_CHAIN_NAME=Anvil
VITE_RPC_URL=http://127.0.0.1:8545
```

## Main app routes

| Path | Purpose |
|------|---------|
| `/login`, `/register` | Public auth |
| `/dashboard` | Role-aware client / freelancer home |
| `/jobs` | Marketplace search |
| `/jobs/:jobId` | Job detail |
| `/jobs/:jobId/proposal` | Freelancer submit proposal |
| `/jobs/:jobId/proposals` | Client view / hire / release payment |
| `/freelancers/:userId` | Freelancer profile (partial) |
| `/my-bids` | Freelancer’s submitted bids |
| `/post-job`, `/post-job/:jobId` | Job wizard / resume draft / edit posting |

## Tests

```bash
# Backend (JUnit) — JobService, BidService, PaymentService
cd backend && ./mvnw test

# Frontend (Vitest)
cd frontend && npx vitest run
```

Frontend tests live under `frontend/src/test/`. Note: `.gitignore` currently ignores `**/test` and `backend/sql`, so backend tests and SQL upgrade scripts may not be tracked in git until that is fixed.

## Development roadmap

### Phase 1 — MVP (current)

- [x] Core off-chain marketplace (post, bid, hire, release)
- [x] Wire `FreelanceEscrow.sol` fund / release (Foundry + MetaMask + RPC verify)
- [ ] Commit remaining working-tree slices + un-ignore backend tests/SQL
- [ ] Harden authz (attachment download ownership, consistent role checks)

### Phase 2 — Scale

- Richer freelancer profiles (portfolio, work history, reviews)
- Messaging / milestones
- Real search ranking (`BEST_MATCH` is currently an alias for most recent)
- Async / cache usage (Redis is unused today)

### Phase 3 — Production

- Externalize secrets; prod config profile
- Deployment, observability, multi-chain support as needed

## Agent / contributor docs

Local agent guidance (often gitignored): `AGENTS.md` (Codex) and `CLAUDE.md` (Claude Code). Prefer those for architecture detail when present; keep them in sync with this README’s status section.

## License

MIT
