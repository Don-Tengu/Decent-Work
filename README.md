# Decent Work

A decentralized freelance marketplace with smart-contract escrow as the end goal. Today it is a working **off-chain marketplace** (post jobs, bid, hire, release payment) with a Web3-shaped skeleton; on-chain escrow is not wired into the app yet.

## Project structure

```
decent-work/
├── backend/           # Spring Boot + GraphQL API (+ REST for file attachments)
├── frontend/          # React SPA
├── smart-contracts/   # Solidity escrow (Hardhat)
├── docs/              # Misc tooling / docs
└── docker-compose.yml # Local Postgres + Redis
```

## Tech stack

| Layer | Stack |
|-------|--------|
| Backend | Spring Boot 3.2, Java 17, Spring for GraphQL (schema-first), JPA/Hibernate, PostgreSQL, Web3j, JWT |
| Frontend | React 19, Vite 7, Apollo Client, Chakra UI v3, React Router, ethers.js v6, lucide-react, Vitest |
| Blockchain | Solidity, Hardhat, OpenZeppelin (`FreelanceEscrow.sol`) |

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
| Client hire (`acceptBid`) + reject competing bids | Done **off-chain** (working tree) |
| Release payment → complete job | Done **off-chain** (working tree) |
| Freelancer profile page | Scaffold (many sections “coming soon”) |
| On-chain escrow fund / release | **Not wired** |

### Off-chain payment loop (current)

1. Freelancer places a bid on an `OPEN` job.
2. Client hires from `/jobs/:jobId/proposals` → `acceptBid`.
3. Backend rejects other pending bids, marks the winner `ACCEPTED`, sets job `IN_PROGRESS`, creates a `Payment` with status **`ESCROWED`** (simulated funding).
4. Client releases payment → payment `RELEASED`, job `COMPLETED`.

Real MetaMask → smart-contract funding will replace the simulated `ESCROWED-on-accept` step later.

## Quick start

### Prerequisites

- Java 17+
- **Node.js 20.19+ or 22.12+** (Node 18 is too old for the frontend toolchain)
- Docker & Docker Compose
- MetaMask (optional until on-chain escrow lands)

### 1. Align database credentials

`docker-compose.yml` and `backend/src/main/resources/application.yml` currently disagree:

| | Docker Compose | `application.yml` |
|--|----------------|-------------------|
| DB name | `freelance_marketplace` | `decent_work` |
| User | `admin` | `jean` |
| Password | `admin123` | (local secret in file) |

Align them before `docker-compose up` + `./mvnw spring-boot:run`, or point the app at an existing local Postgres that matches `application.yml`.

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

### 5. Smart contracts (optional / future)

```bash
cd smart-contracts
npm install
npm run compile
npm test
npx hardhat run scripts/deploy.js --network sepolia
```

After deploy, set `web3.escrow-contract-address` in `application.yml` (still the zero address today).

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
- [ ] Commit the hire/marketplace frontend slice + un-ignore backend tests/SQL
- [ ] Wire `FreelanceEscrow.sol` into accept / release (wallet fund + tx hash)
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
