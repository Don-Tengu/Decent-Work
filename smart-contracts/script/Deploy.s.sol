// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {FreelanceEscrow} from "../src/FreelanceEscrow.sol";

/**
 * @dev Deploy FreelanceEscrow.
 *
 * Local Anvil (default key 0):
 *   forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
 *
 * Sepolia:
 *   forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --broadcast --private-key $PRIVATE_KEY
 *
 * Optional: set PLATFORM_WALLET env; defaults to deployer.
 */
contract Deploy is Script {
    function run() external returns (FreelanceEscrow) {
        address platformWallet = vm.envOr("PLATFORM_WALLET", msg.sender);

        // When using --private-key, msg.sender in script context before broadcast
        // is not the deployer; use the broadcaster address after startBroadcast.
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(deployerKey);

        if (platformWallet == address(0) || platformWallet == msg.sender) {
            // Prefer explicit env; else use deployer as platform treasury for local.
            try vm.envAddress("PLATFORM_WALLET") returns (address pw) {
                platformWallet = pw;
            } catch {
                platformWallet = deployer;
            }
        }

        vm.startBroadcast(deployerKey);
        FreelanceEscrow escrow = new FreelanceEscrow(platformWallet);
        vm.stopBroadcast();

        console2.log("FreelanceEscrow deployed to:", address(escrow));
        console2.log("Platform wallet:", platformWallet);
        console2.log("Deployer:", deployer);
        console2.log("Chain id:", block.chainid);

        return escrow;
    }
}
