// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FreelanceEscrow
 * @dev Simple native-ETH escrow for a freelance marketplace.
 *      Client funds on hire acceptance; client releases to freelancer (minus platform fee).
 */
contract FreelanceEscrow is ReentrancyGuard, Ownable {
    enum EscrowStatus {
        PENDING,
        FUNDED,
        COMPLETED,
        REFUNDED,
        DISPUTED
    }

    struct Escrow {
        uint256 jobId;
        address client;
        address freelancer;
        uint256 amount;
        EscrowStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    mapping(uint256 => Escrow) public escrows;
    uint256 public escrowCount;

    uint256 public platformFeePercent = 5; // 5% platform fee
    address public platformWallet;

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

    constructor(address _platformWallet) Ownable(msg.sender) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
    }

    /**
     * @dev Create and fund a new escrow in one step.
     * @return escrowId The newly created escrow id
     */
    function createEscrow(uint256 _jobId, address _freelancer)
        external
        payable
        nonReentrant
        returns (uint256)
    {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_freelancer != msg.sender, "Client and freelancer cannot be the same");

        escrowCount++;

        escrows[escrowCount] = Escrow({
            jobId: _jobId,
            client: msg.sender,
            freelancer: _freelancer,
            amount: msg.value,
            status: EscrowStatus.FUNDED,
            createdAt: block.timestamp,
            completedAt: 0
        });

        emit EscrowCreated(escrowCount, _jobId, msg.sender, _freelancer, msg.value);
        emit EscrowFunded(escrowCount, msg.value);

        return escrowCount;
    }

    /**
     * @dev Release payment to freelancer (client only). Platform fee is deducted.
     */
    function releasePayment(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];

        require(escrow.status == EscrowStatus.FUNDED, "Escrow not funded");
        require(msg.sender == escrow.client, "Only client can release payment");

        uint256 fee = (escrow.amount * platformFeePercent) / 100;
        uint256 freelancerAmount = escrow.amount - fee;

        escrow.status = EscrowStatus.COMPLETED;
        escrow.completedAt = block.timestamp;

        (bool successFreelancer,) = escrow.freelancer.call{value: freelancerAmount}("");
        require(successFreelancer, "Transfer to freelancer failed");

        (bool successPlatform,) = platformWallet.call{value: fee}("");
        require(successPlatform, "Transfer to platform failed");

        emit EscrowCompleted(_escrowId, freelancerAmount, fee);
    }

    /**
     * @dev Full refund to client. Callable by freelancer (mutual) or platform owner.
     */
    function refundPayment(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];

        require(escrow.status == EscrowStatus.FUNDED, "Escrow not funded");
        require(msg.sender == escrow.freelancer || msg.sender == owner(), "Not authorized");

        escrow.status = EscrowStatus.REFUNDED;

        (bool success,) = escrow.client.call{value: escrow.amount}("");
        require(success, "Refund failed");

        emit EscrowRefunded(_escrowId, escrow.amount);
    }

    /**
     * @dev Raise a dispute and lock funds until platform resolves.
     */
    function raiseDispute(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];

        require(escrow.status == EscrowStatus.FUNDED, "Escrow not funded");
        require(
            msg.sender == escrow.client || msg.sender == escrow.freelancer,
            "Only client or freelancer can raise dispute"
        );

        escrow.status = EscrowStatus.DISPUTED;

        emit EscrowDisputed(_escrowId);
    }

    /**
     * @dev Resolve dispute (only owner). true = pay freelancer; false = refund client.
     */
    function resolveDispute(uint256 _escrowId, bool releaseToFreelancer)
        external
        onlyOwner
        nonReentrant
    {
        Escrow storage escrow = escrows[_escrowId];

        require(escrow.status == EscrowStatus.DISPUTED, "Escrow not disputed");

        if (releaseToFreelancer) {
            uint256 fee = (escrow.amount * platformFeePercent) / 100;
            uint256 freelancerAmount = escrow.amount - fee;

            escrow.status = EscrowStatus.COMPLETED;
            escrow.completedAt = block.timestamp;

            (bool successFreelancer,) = escrow.freelancer.call{value: freelancerAmount}("");
            require(successFreelancer, "Transfer to freelancer failed");

            (bool successPlatform,) = platformWallet.call{value: fee}("");
            require(successPlatform, "Transfer to platform failed");

            emit EscrowCompleted(_escrowId, freelancerAmount, fee);
        } else {
            escrow.status = EscrowStatus.REFUNDED;

            (bool success,) = escrow.client.call{value: escrow.amount}("");
            require(success, "Refund failed");

            emit EscrowRefunded(_escrowId, escrow.amount);
        }
    }

    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 10, "Fee cannot exceed 10%");
        platformFeePercent = _newFeePercent;
    }

    function updatePlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid wallet address");
        platformWallet = _newWallet;
    }

    function getEscrow(uint256 _escrowId) external view returns (Escrow memory) {
        return escrows[_escrowId];
    }
}
