// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FreelanceEscrow
 * @dev ERC-20 escrow for a freelance marketplace (MVP: USDC; extra tokens via allowlist).
 *      Client approves + createEscrow; client releasePayment splits freelancer / platform fee.
 */
contract FreelanceEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

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
        address token;
        uint256 amount;
        EscrowStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    mapping(uint256 => Escrow) public escrows;
    uint256 public escrowCount;

    mapping(address => bool) public allowedTokens;

    uint256 public platformFeePercent = 5;
    address public platformWallet;

    event TokenAllowlistUpdated(address indexed token, bool allowed);
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

    constructor(address _platformWallet, address _paymentToken) Ownable(msg.sender) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_paymentToken != address(0), "Invalid payment token");
        platformWallet = _platformWallet;
        allowedTokens[_paymentToken] = true;
        emit TokenAllowlistUpdated(_paymentToken, true);
    }

    function setAllowedToken(address token, bool allowed) external onlyOwner {
        require(token != address(0), "Invalid token");
        allowedTokens[token] = allowed;
        emit TokenAllowlistUpdated(token, allowed);
    }

    /**
     * @dev Pull `amount` of `token` from the client (must be allowlisted; client must approve first).
     */
    function createEscrow(uint256 _jobId, address _freelancer, address _token, uint256 _amount)
        external
        nonReentrant
        returns (uint256)
    {
        require(allowedTokens[_token], "Token not allowed");
        require(_amount > 0, "Amount must be greater than 0");
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_freelancer != msg.sender, "Client and freelancer cannot be the same");

        escrowCount++;

        escrows[escrowCount] = Escrow({
            jobId: _jobId,
            client: msg.sender,
            freelancer: _freelancer,
            token: _token,
            amount: _amount,
            status: EscrowStatus.FUNDED,
            createdAt: block.timestamp,
            completedAt: 0
        });

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        emit EscrowCreated(escrowCount, _jobId, msg.sender, _freelancer, _token, _amount);
        emit EscrowFunded(escrowCount, _amount);

        return escrowCount;
    }

    function releasePayment(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];

        require(escrow.status == EscrowStatus.FUNDED, "Escrow not funded");
        require(msg.sender == escrow.client, "Only client can release payment");

        uint256 fee = (escrow.amount * platformFeePercent) / 100;
        uint256 freelancerAmount = escrow.amount - fee;

        escrow.status = EscrowStatus.COMPLETED;
        escrow.completedAt = block.timestamp;

        IERC20 token = IERC20(escrow.token);
        token.safeTransfer(escrow.freelancer, freelancerAmount);
        token.safeTransfer(platformWallet, fee);

        emit EscrowCompleted(_escrowId, freelancerAmount, fee);
    }

    function refundPayment(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];

        require(escrow.status == EscrowStatus.FUNDED, "Escrow not funded");
        require(msg.sender == escrow.freelancer || msg.sender == owner(), "Not authorized");

        escrow.status = EscrowStatus.REFUNDED;

        IERC20(escrow.token).safeTransfer(escrow.client, escrow.amount);

        emit EscrowRefunded(_escrowId, escrow.amount);
    }

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

    function resolveDispute(uint256 _escrowId, bool releaseToFreelancer)
        external
        onlyOwner
        nonReentrant
    {
        Escrow storage escrow = escrows[_escrowId];

        require(escrow.status == EscrowStatus.DISPUTED, "Escrow not disputed");

        IERC20 token = IERC20(escrow.token);

        if (releaseToFreelancer) {
            uint256 fee = (escrow.amount * platformFeePercent) / 100;
            uint256 freelancerAmount = escrow.amount - fee;

            escrow.status = EscrowStatus.COMPLETED;
            escrow.completedAt = block.timestamp;

            token.safeTransfer(escrow.freelancer, freelancerAmount);
            token.safeTransfer(platformWallet, fee);

            emit EscrowCompleted(_escrowId, freelancerAmount, fee);
        } else {
            escrow.status = EscrowStatus.REFUNDED;

            token.safeTransfer(escrow.client, escrow.amount);

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
