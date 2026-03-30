# Decent Work

A decentralized freelance marketplace with smart contract-based payments, built with Spring Boot, React, and Ethereum.

## Project Structure

```
web3-freelance-marketplace/
├── backend/           # Spring Boot + GraphQL API
├── frontend/          # React frontend
├── smart-contracts/   # Solidity smart contracts
├── docs/             # Documentation
└── docker-compose.yml # Local development infrastructure
```

## Tech Stack

### Backend
- Spring Boot 3.x
- Spring for GraphQL
- PostgreSQL (main database)
- Redis (caching & sessions)
- Web3j (Ethereum integration)

### Frontend
- React 18
- Apollo Client (GraphQL)
- ethers.js (Web3 wallet integration)
- TailwindCSS

### Blockchain
- Solidity (smart contracts)
- Hardhat (development framework)
- OpenZeppelin (contract libraries)

## Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- Docker & Docker Compose
- MetaMask or compatible Web3 wallet

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Run Backend
```bash
cd backend
./mvnw spring-boot:run
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Deploy Smart Contracts (Testnet)
```bash
cd smart-contracts
npm install
npx hardhat run scripts/deploy.js --network sepolia
```

## Features (MVP)

- [ ] User registration & authentication
- [ ] Freelancer & client profiles
- [ ] Job posting & browsing
- [ ] Bidding system
- [ ] Smart contract escrow payments
- [ ] Basic search functionality

## Development Roadmap

### Phase 1: MVP (Current)
- Core marketplace functionality
- Single escrow smart contract
- Monolithic architecture

### Phase 2: Scale
- Microservices architecture
- Elasticsearch for search
- RabbitMQ for async processing
- Enhanced features (reviews, messaging)

### Phase 3: Production
- Kubernetes deployment
- ELK stack for logging
- Kafka for event streaming
- Multi-chain support

## License

MIT
