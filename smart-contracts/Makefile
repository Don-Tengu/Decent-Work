-include .env
export

.PHONY: all build test install deploy-local deploy-sepolia

build:
	forge build

test:
	forge test

install:
	forge install

# Uses [rpc_endpoints].localhost
deploy-local:
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url localhost \
		--broadcast \
		--private-key $(ANVIL_PRIVATE_KEY) \
		-vvvv

# Uses [rpc_endpoints].sepolia + [etherscan].sepolia for --verify
deploy-sepolia:
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url sepolia \
		--account evm-dev \
		--broadcast \
		--verify \
		--chain sepolia \
		-vvvv
