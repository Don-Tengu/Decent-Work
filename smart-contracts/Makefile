-include .env
export

.PHONY: all build test install anvil anvil-fresh deploy-local deploy-sepolia inspect-escrow

# Anvil account #0 (node-unlocked; no private key in the repo).
ANVIL_SENDER ?= 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Persisted chain state (load on start, dump on exit + every 30s).
ANVIL_STATE ?= .anvil-state.json

# Encrypted Foundry keystore name: `cast wallet import evm-dev --interactive`
ACCOUNT ?= evm-dev

# Fresh `make deploy-local` addresses. Override if you redeployed.
RPC ?= http://127.0.0.1:8545
ESCROW ?= 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
USDC ?= 0x5FbDB2315678afecb367f032d93F642f64180aa3
ESCROW_ID ?= 1

build:
	forge build

test:
	forge test

install:
	forge install

# Persist accounts, nonces, storage, and deployed contracts across restarts.
# Ctrl+C dumps state. Do not re-run deploy-local unless you want new addresses.
anvil:
	anvil --host 127.0.0.1 --state $(ANVIL_STATE) --state-interval 30

# Wipe the snapshot and start a blank chain (then make deploy-local again).
anvil-fresh:
	rm -f $(ANVIL_STATE)
	$(MAKE) anvil

# Uses [rpc_endpoints].localhost. Anvil already unlocks the default accounts.
deploy-local:
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url localhost \
		--broadcast \
		--unlocked \
		--sender $(ANVIL_SENDER) \
		-vvvv

# Read-only: print escrowCount, getEscrow(ESCROW_ID), and USDC locked in the contract.
#   make inspect-escrow
#   make inspect-escrow ESCROW_ID=2
inspect-escrow:
	@echo "RPC     $(RPC)"
	@echo "ESCROW  $(ESCROW)"
	@echo "USDC    $(USDC)"
	@echo ""
	@echo "escrowCount:"
	@cast call $(ESCROW) "escrowCount()(uint256)" --rpc-url $(RPC)
	@echo ""
	@echo "getEscrow($(ESCROW_ID)) tuple:"
	@echo "  (jobId, client, freelancer, token, amount, status, createdAt, completedAt)"
	@echo "  status: 0=PENDING 1=FUNDED 2=COMPLETED 3=REFUNDED 4=DISPUTED"
	@echo "  amount: 6-decimal USDC (10000000 = 10 USDC)"
	@cast call $(ESCROW) \
		"getEscrow(uint256)((uint256,address,address,address,uint256,uint8,uint256,uint256))" \
		$(ESCROW_ID) --rpc-url $(RPC)
	@echo ""
	@echo "USDC balanceOf(escrow) [atomic]:"
	@cast call $(USDC) "balanceOf(address)(uint256)" $(ESCROW) --rpc-url $(RPC)

# Uses [rpc_endpoints].base_sepolia. Prompts for the keystore password.
deploy-sepolia:
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url base_sepolia \
		--account $(ACCOUNT) \
		--broadcast \
		--verify \
		--chain base_sepolia \
		-vvvv
