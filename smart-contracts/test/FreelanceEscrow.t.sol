// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {FreelanceEscrow} from "../src/FreelanceEscrow.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract FreelanceEscrowTest is Test {
    FreelanceEscrow public escrow;
    MockUSDC public usdc;

    address public owner = makeAddr("owner");
    address public platform = makeAddr("platform");
    address public client = makeAddr("client");
    address public freelancer = makeAddr("freelancer");
    address public other = makeAddr("other");

    uint256 public constant JOB_ID = 42;
    uint256 public constant AMOUNT = 1_500_000; // 1.5 USDC (6 decimals)

    event EscrowCreated(
        uint256 indexed escrowId,
        uint256 indexed jobId,
        address client,
        address freelancer,
        address token,
        uint256 amount
    );
    event EscrowFunded(uint256 indexed escrowId, uint256 amount);
    event EscrowCompleted(uint256 indexed escrowId, uint256 amount, uint256 fee);
    event EscrowRefunded(uint256 indexed escrowId, uint256 amount);
    event EscrowDisputed(uint256 indexed escrowId);

    function setUp() public {
        usdc = new MockUSDC();
        vm.prank(owner);
        escrow = new FreelanceEscrow(platform, address(usdc));

        usdc.mint(client, 1_000_000e6);
        vm.prank(client);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function test_InitialState() public view {
        assertEq(escrow.platformWallet(), platform);
        assertEq(escrow.platformFeePercent(), 5);
        assertEq(escrow.escrowCount(), 0);
        assertEq(escrow.owner(), owner);
        assertTrue(escrow.allowedTokens(address(usdc)));
    }

    function test_CreateEscrow_FundsAndEmits() public {
        vm.prank(client);
        vm.expectEmit(true, true, false, true);
        emit EscrowCreated(1, JOB_ID, client, freelancer, address(usdc), AMOUNT);
        vm.expectEmit(true, false, false, true);
        emit EscrowFunded(1, AMOUNT);

        uint256 escrowId = escrow.createEscrow(JOB_ID, freelancer, address(usdc), AMOUNT);

        assertEq(escrowId, 1);
        assertEq(escrow.escrowCount(), 1);
        assertEq(usdc.balanceOf(address(escrow)), AMOUNT);

        FreelanceEscrow.Escrow memory e = escrow.getEscrow(1);
        assertEq(e.jobId, JOB_ID);
        assertEq(e.client, client);
        assertEq(e.freelancer, freelancer);
        assertEq(e.token, address(usdc));
        assertEq(e.amount, AMOUNT);
        assertEq(uint256(e.status), uint256(FreelanceEscrow.EscrowStatus.FUNDED));
    }

    function test_CreateEscrow_RevertsZeroAmount() public {
        vm.prank(client);
        vm.expectRevert("Amount must be greater than 0");
        escrow.createEscrow(JOB_ID, freelancer, address(usdc), 0);
    }

    function test_CreateEscrow_RevertsUnknownToken() public {
        MockUSDC otherToken = new MockUSDC();
        otherToken.mint(client, AMOUNT);
        vm.startPrank(client);
        otherToken.approve(address(escrow), AMOUNT);
        vm.expectRevert("Token not allowed");
        escrow.createEscrow(JOB_ID, freelancer, address(otherToken), AMOUNT);
        vm.stopPrank();
    }

    function test_CreateEscrow_RevertsZeroFreelancer() public {
        vm.prank(client);
        vm.expectRevert("Invalid freelancer address");
        escrow.createEscrow(JOB_ID, address(0), address(usdc), AMOUNT);
    }

    function test_CreateEscrow_RevertsSelfAsFreelancer() public {
        vm.prank(client);
        vm.expectRevert("Client and freelancer cannot be the same");
        escrow.createEscrow(JOB_ID, client, address(usdc), AMOUNT);
    }

    function test_ReleasePayment_PaysFreelancerAndPlatform() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow(JOB_ID, freelancer, address(usdc), AMOUNT);

        uint256 fee = (AMOUNT * 5) / 100;
        uint256 net = AMOUNT - fee;

        vm.prank(client);
        vm.expectEmit(true, false, false, true);
        emit EscrowCompleted(escrowId, net, fee);
        escrow.releasePayment(escrowId);

        assertEq(usdc.balanceOf(freelancer), net);
        assertEq(usdc.balanceOf(platform), fee);
        assertEq(usdc.balanceOf(address(escrow)), 0);

        FreelanceEscrow.Escrow memory e = escrow.getEscrow(escrowId);
        assertEq(uint256(e.status), uint256(FreelanceEscrow.EscrowStatus.COMPLETED));
        assertGt(e.completedAt, 0);
    }

    function test_ReleasePayment_OnlyClient() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow(JOB_ID, freelancer, address(usdc), AMOUNT);

        vm.prank(freelancer);
        vm.expectRevert("Only client can release payment");
        escrow.releasePayment(escrowId);
    }

    function test_RefundPayment_ByFreelancer() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow(JOB_ID, freelancer, address(usdc), AMOUNT);

        uint256 clientBefore = usdc.balanceOf(client);

        vm.prank(freelancer);
        vm.expectEmit(true, false, false, true);
        emit EscrowRefunded(escrowId, AMOUNT);
        escrow.refundPayment(escrowId);

        assertEq(usdc.balanceOf(client) - clientBefore, AMOUNT);
        assertEq(uint256(escrow.getEscrow(escrowId).status), uint256(FreelanceEscrow.EscrowStatus.REFUNDED));
    }

    function test_RefundPayment_ByOwner() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow(JOB_ID, freelancer, address(usdc), AMOUNT);

        vm.prank(owner);
        escrow.refundPayment(escrowId);

        assertEq(uint256(escrow.getEscrow(escrowId).status), uint256(FreelanceEscrow.EscrowStatus.REFUNDED));
    }

    function test_RefundPayment_ClientCannot() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow(JOB_ID, freelancer, address(usdc), AMOUNT);

        vm.prank(client);
        vm.expectRevert("Not authorized");
        escrow.refundPayment(escrowId);
    }

    function test_DisputeAndResolveToFreelancer() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow(JOB_ID, freelancer, address(usdc), AMOUNT);

        vm.prank(client);
        vm.expectEmit(true, false, false, false);
        emit EscrowDisputed(escrowId);
        escrow.raiseDispute(escrowId);

        uint256 fee = (AMOUNT * 5) / 100;
        uint256 net = AMOUNT - fee;

        vm.prank(owner);
        escrow.resolveDispute(escrowId, true);

        assertEq(usdc.balanceOf(freelancer), net);
        assertEq(uint256(escrow.getEscrow(escrowId).status), uint256(FreelanceEscrow.EscrowStatus.COMPLETED));
    }

    function test_DisputeAndResolveToClient() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow(JOB_ID, freelancer, address(usdc), AMOUNT);

        vm.prank(freelancer);
        escrow.raiseDispute(escrowId);

        uint256 clientBefore = usdc.balanceOf(client);
        vm.prank(owner);
        escrow.resolveDispute(escrowId, false);

        assertEq(usdc.balanceOf(client) - clientBefore, AMOUNT);
        assertEq(uint256(escrow.getEscrow(escrowId).status), uint256(FreelanceEscrow.EscrowStatus.REFUNDED));
    }

    function test_UpdatePlatformFee() public {
        vm.prank(owner);
        escrow.updatePlatformFee(10);
        assertEq(escrow.platformFeePercent(), 10);

        vm.prank(owner);
        vm.expectRevert("Fee cannot exceed 10%");
        escrow.updatePlatformFee(11);
    }

    function test_OwnerCanAllowlistUsdtLater() public {
        MockUSDC usdt = new MockUSDC();
        vm.prank(owner);
        escrow.setAllowedToken(address(usdt), true);
        assertTrue(escrow.allowedTokens(address(usdt)));
    }

    function test_MultipleEscrows() public {
        vm.startPrank(client);
        uint256 id1 = escrow.createEscrow(1, freelancer, address(usdc), 1_000_000);
        uint256 id2 = escrow.createEscrow(2, freelancer, address(usdc), 2_000_000);
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(escrow.escrowCount(), 2);
        assertEq(usdc.balanceOf(address(escrow)), 3_000_000);
    }
}
