// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {FreelanceEscrow} from "../src/FreelanceEscrow.sol";

contract FreelanceEscrowTest is Test {
    FreelanceEscrow public escrow;

    address public owner = makeAddr("owner");
    address public platform = makeAddr("platform");
    address public client = makeAddr("client");
    address public freelancer = makeAddr("freelancer");
    address public other = makeAddr("other");

    uint256 public constant JOB_ID = 42;
    uint256 public constant AMOUNT = 1 ether;

    event EscrowCreated(
        uint256 indexed escrowId,
        uint256 indexed jobId,
        address client,
        address freelancer,
        uint256 amount
    );
    event EscrowFunded(uint256 indexed escrowId, uint256 amount);
    event EscrowCompleted(uint256 indexed escrowId, uint256 amount, uint256 fee);
    event EscrowRefunded(uint256 indexed escrowId, uint256 amount);
    event EscrowDisputed(uint256 indexed escrowId);

    function setUp() public {
        vm.prank(owner);
        escrow = new FreelanceEscrow(platform);

        vm.deal(client, 100 ether);
        vm.deal(freelancer, 1 ether);
    }

    function test_InitialState() public view {
        assertEq(escrow.platformWallet(), platform);
        assertEq(escrow.platformFeePercent(), 5);
        assertEq(escrow.escrowCount(), 0);
        assertEq(escrow.owner(), owner);
    }

    function test_CreateEscrow_FundsAndEmits() public {
        vm.prank(client);
        vm.expectEmit(true, true, false, true);
        emit EscrowCreated(1, JOB_ID, client, freelancer, AMOUNT);
        vm.expectEmit(true, false, false, true);
        emit EscrowFunded(1, AMOUNT);

        uint256 escrowId = escrow.createEscrow{value: AMOUNT}(JOB_ID, freelancer);

        assertEq(escrowId, 1);
        assertEq(escrow.escrowCount(), 1);
        assertEq(address(escrow).balance, AMOUNT);

        FreelanceEscrow.Escrow memory e = escrow.getEscrow(1);
        assertEq(e.jobId, JOB_ID);
        assertEq(e.client, client);
        assertEq(e.freelancer, freelancer);
        assertEq(e.amount, AMOUNT);
        assertEq(uint256(e.status), uint256(FreelanceEscrow.EscrowStatus.FUNDED));
    }

    function test_CreateEscrow_RevertsZeroValue() public {
        vm.prank(client);
        vm.expectRevert("Amount must be greater than 0");
        escrow.createEscrow{value: 0}(JOB_ID, freelancer);
    }

    function test_CreateEscrow_RevertsZeroFreelancer() public {
        vm.prank(client);
        vm.expectRevert("Invalid freelancer address");
        escrow.createEscrow{value: AMOUNT}(JOB_ID, address(0));
    }

    function test_CreateEscrow_RevertsSelfAsFreelancer() public {
        vm.prank(client);
        vm.expectRevert("Client and freelancer cannot be the same");
        escrow.createEscrow{value: AMOUNT}(JOB_ID, client);
    }

    function test_ReleasePayment_PaysFreelancerAndPlatform() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow{value: AMOUNT}(JOB_ID, freelancer);

        uint256 fee = (AMOUNT * 5) / 100;
        uint256 net = AMOUNT - fee;

        uint256 freBefore = freelancer.balance;
        uint256 platBefore = platform.balance;

        vm.prank(client);
        vm.expectEmit(true, false, false, true);
        emit EscrowCompleted(escrowId, net, fee);
        escrow.releasePayment(escrowId);

        assertEq(freelancer.balance - freBefore, net);
        assertEq(platform.balance - platBefore, fee);
        assertEq(address(escrow).balance, 0);

        FreelanceEscrow.Escrow memory e = escrow.getEscrow(escrowId);
        assertEq(uint256(e.status), uint256(FreelanceEscrow.EscrowStatus.COMPLETED));
        assertGt(e.completedAt, 0);
    }

    function test_ReleasePayment_OnlyClient() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow{value: AMOUNT}(JOB_ID, freelancer);

        vm.prank(freelancer);
        vm.expectRevert("Only client can release payment");
        escrow.releasePayment(escrowId);
    }

    function test_RefundPayment_ByFreelancer() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow{value: AMOUNT}(JOB_ID, freelancer);

        uint256 clientBefore = client.balance;

        vm.prank(freelancer);
        vm.expectEmit(true, false, false, true);
        emit EscrowRefunded(escrowId, AMOUNT);
        escrow.refundPayment(escrowId);

        assertEq(client.balance - clientBefore, AMOUNT);
        assertEq(uint256(escrow.getEscrow(escrowId).status), uint256(FreelanceEscrow.EscrowStatus.REFUNDED));
    }

    function test_RefundPayment_ByOwner() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow{value: AMOUNT}(JOB_ID, freelancer);

        vm.prank(owner);
        escrow.refundPayment(escrowId);

        assertEq(uint256(escrow.getEscrow(escrowId).status), uint256(FreelanceEscrow.EscrowStatus.REFUNDED));
    }

    function test_RefundPayment_ClientCannot() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow{value: AMOUNT}(JOB_ID, freelancer);

        vm.prank(client);
        vm.expectRevert("Not authorized");
        escrow.refundPayment(escrowId);
    }

    function test_DisputeAndResolveToFreelancer() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow{value: AMOUNT}(JOB_ID, freelancer);

        vm.prank(client);
        vm.expectEmit(true, false, false, false);
        emit EscrowDisputed(escrowId);
        escrow.raiseDispute(escrowId);

        assertEq(uint256(escrow.getEscrow(escrowId).status), uint256(FreelanceEscrow.EscrowStatus.DISPUTED));

        uint256 fee = (AMOUNT * 5) / 100;
        uint256 net = AMOUNT - fee;
        uint256 freBefore = freelancer.balance;

        vm.prank(owner);
        escrow.resolveDispute(escrowId, true);

        assertEq(freelancer.balance - freBefore, net);
        assertEq(uint256(escrow.getEscrow(escrowId).status), uint256(FreelanceEscrow.EscrowStatus.COMPLETED));
    }

    function test_DisputeAndResolveToClient() public {
        vm.prank(client);
        uint256 escrowId = escrow.createEscrow{value: AMOUNT}(JOB_ID, freelancer);

        vm.prank(freelancer);
        escrow.raiseDispute(escrowId);

        uint256 clientBefore = client.balance;
        vm.prank(owner);
        escrow.resolveDispute(escrowId, false);

        assertEq(client.balance - clientBefore, AMOUNT);
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

    function test_MultipleEscrows() public {
        vm.startPrank(client);
        uint256 id1 = escrow.createEscrow{value: 1 ether}(1, freelancer);
        uint256 id2 = escrow.createEscrow{value: 2 ether}(2, freelancer);
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(escrow.escrowCount(), 2);
        assertEq(address(escrow).balance, 3 ether);
    }
}
