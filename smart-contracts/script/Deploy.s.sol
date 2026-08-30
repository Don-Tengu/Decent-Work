// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {FreelanceEscrow} from "../src/FreelanceEscrow.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/**
 * Deploy FreelanceEscrow for USDC.
 *
 * Anvil (deploys MockUSDC and mints to default accounts):
 *   forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast \
 *     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
 *
 * Base Sepolia / Base (set USDC_ADDRESS to Circle's USDC):
 *   forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY
 *
 * Optional: PLATFORM_WALLET. Defaults to deployer.
 */
contract Deploy is Script {
    // Canonical Circle USDC (6 decimals).
    address constant USDC_BASE = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external returns (FreelanceEscrow, address token) {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(deployerKey);
        address platformWallet = vm.envOr("PLATFORM_WALLET", deployer);

        vm.startBroadcast(deployerKey);

        if (block.chainid == 31337) {
            MockUSDC mock = new MockUSDC();
            token = address(mock);
            // Anvil account #0–9 so local wallets can fund escrow without a faucet.
            mock.mint(deployer, 1_000_000e6);
            mock.mint(0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 1_000_000e6);
            mock.mint(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC, 1_000_000e6);
        } else if (block.chainid == 84532) {
            token = vm.envOr("USDC_ADDRESS", USDC_BASE_SEPOLIA);
        } else if (block.chainid == 8453) {
            token = vm.envOr("USDC_ADDRESS", USDC_BASE);
        } else {
            token = vm.envAddress("USDC_ADDRESS");
        }

        FreelanceEscrow escrow = new FreelanceEscrow(platformWallet, token);

        vm.stopBroadcast();

        console2.log("FreelanceEscrow deployed to:", address(escrow));
        console2.log("Payment token (USDC):", token);
        console2.log("Platform wallet:", platformWallet);
        console2.log("Deployer:", deployer);
        console2.log("Chain id:", block.chainid);

        return (escrow, token);
    }
}
