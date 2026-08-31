-include .env
export

.PHONY: all build test install deploy-local deploy-sepolia

# Anvil account #0 (node-unlocked; no private key in the repo).
ANVIL_SENDER ?= 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Encrypted Foundry keystore name: `cast wallet import evm-dev --interactive`
ACCOUNT ?= evm-dev

build:
	forge build

test:
	forge test

install:
	forge install

# Uses [rpc_endpoints].localhost. Anvil already unlocks the default accounts.
deploy-local:
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url localhost \
		--broadcast \
		--unlocked \
		--sender $(ANVIL_SENDER) \
		-vvvv

# Uses [rpc_endpoints].base_sepolia. Prompts for the keystore password.
deploy-sepolia:
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url base_sepolia \
		--account $(ACCOUNT) \
		--broadcast \
		--verify \
		--chain base_sepolia \
		-vvvv
