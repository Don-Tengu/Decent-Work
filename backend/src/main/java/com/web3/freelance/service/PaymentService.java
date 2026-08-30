package com.web3.freelance.service;

import com.web3.freelance.exception.ErrorCode;
import com.web3.freelance.exception.ResourceNotFoundException;
import com.web3.freelance.exception.UnauthorizedException;
import com.web3.freelance.exception.ValidationException;
import com.web3.freelance.model.Bid;
import com.web3.freelance.model.Job;
import com.web3.freelance.model.Notification;
import com.web3.freelance.model.Payment;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final int MAX_WORK_MESSAGE_LENGTH = 2000;

    private final PaymentRepository paymentRepository;
    private final BidService bidService;
    private final JobService jobService;
    private final EscrowVerificationService escrowVerificationService;
    private final NotificationService notificationService;

    @Value("${web3.escrow-contract-address}")
    private String escrowContractAddress;

    @Value("${web3.platform-fee-percent:5}")
    private int platformFeePercent;

    @Value("${web3.chain-id:31337}")
    private long chainId;

    @Value("${web3.token-decimals:6}")
    private int tokenDecimals;

    /**
     * Freelancer accepts an outstanding offer. Rejects competing pending bids,
     * starts the job, and creates the payment row (simulated or awaiting on-chain funding).
     */
    @Transactional
    public Payment acceptOffer(Long bidId, Long freelancerId) {
        Bid bid = bidService.getBidById(bidId);
        Job job = bid.getJob();

        if (!bid.getFreelancer().getId().equals(freelancerId)) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the proposal owner can accept this offer");
        }

        if (bid.getStatus() != Bid.BidStatus.OFFERED) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Only an outstanding offer can be accepted");
        }

        if (job.getStatus() != Job.JobStatus.OPEN) {
            throw new ValidationException(
                    ErrorCode.JOB_ALREADY_ASSIGNED,
                    "This job is no longer open for hiring");
        }

        List<Bid> rejected = bidService.rejectCompetingBids(job, bid.getId());

        bid.setStatus(Bid.BidStatus.ACCEPTED);
        job.setAcceptedBid(bid);
        job.setStatus(Job.JobStatus.IN_PROGRESS);

        boolean onChain = job.getPaymentModel() == Job.PaymentModel.ON_CHAIN_ESCROW
                || job.getPaymentModel() == Job.PaymentModel.ON_CHAIN_MILESTONE_ESCROW;

        if (onChain) {
            escrowVerificationService.requireConfiguredContract();
        }

        Payment.PaymentStatus initialStatus = onChain
                ? Payment.PaymentStatus.AWAITING_FUNDING
                : Payment.PaymentStatus.ESCROWED;

        Payment.FundingMode fundingMode = onChain
                ? Payment.FundingMode.ON_CHAIN
                : Payment.FundingMode.SIMULATED;

        Payment payment = Payment.builder()
                .amount(bid.getAmount())
                .status(initialStatus)
                .fundingMode(fundingMode)
                .escrowAddress(escrowContractAddress)
                .platformFeePercent(platformFeePercent)
                .chainId(onChain ? chainId : null)
                .job(job)
                .freelancer(bid.getFreelancer())
                .client(job.getClient())
                .build();

        Payment saved = paymentRepository.save(payment);

        String freelancerName = bid.getFreelancer().getUsername();
        String jobTitle = job.getTitle() != null ? job.getTitle() : "your job";
        notificationService.create(
                job.getClient(),
                Notification.NotificationType.OFFER_ACCEPTED,
                "Offer accepted",
                freelancerName + " accepted your offer on \"" + jobTitle + "\". The contract is now in progress.",
                "/jobs/" + job.getId() + "/proposals",
                job.getId(),
                bid.getId()
        );

        for (Bid rejectedBid : rejected) {
            notificationService.create(
                    rejectedBid.getFreelancer(),
                    Notification.NotificationType.BID_NOT_SELECTED,
                    "Proposal not selected",
                    "Another freelancer was hired for \"" + jobTitle + "\".",
                    "/my-bids",
                    job.getId(),
                    rejectedBid.getId()
            );
        }

        return saved;
    }

    /**
     * Confirm on-chain createEscrow after the client wallet funded the contract.
     */
    @Transactional
    public Payment confirmEscrowFunding(Long paymentId, String transactionHash, Long clientId) {
        Payment payment = requirePaymentOwnedByClient(paymentId, clientId);

        if (payment.getFundingMode() != Payment.FundingMode.ON_CHAIN) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "This payment is not an on-chain escrow");
        }

        if (payment.getStatus() == Payment.PaymentStatus.ESCROWED
                && transactionHash != null
                && transactionHash.equalsIgnoreCase(payment.getFundTransactionHash())) {
            return payment;
        }

        if (payment.getStatus() != Payment.PaymentStatus.AWAITING_FUNDING) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Only awaiting-funding payments can be funded");
        }

        User client = payment.getClient();
        User freelancer = payment.getFreelancer();

        if (client.getWalletAddress() == null || client.getWalletAddress().isBlank()) {
            throw new ValidationException(
                    ErrorCode.INVALID_WALLET_ADDRESS,
                    "Client must connect a wallet before funding escrow");
        }
        if (freelancer.getWalletAddress() == null || freelancer.getWalletAddress().isBlank()) {
            throw new ValidationException(
                    ErrorCode.INVALID_WALLET_ADDRESS,
                    "Freelancer must connect a wallet before escrow can be funded");
        }

        paymentRepository.findByFundTransactionHash(transactionHash).ifPresent(existing -> {
            if (!existing.getId().equals(paymentId)) {
                throw new ValidationException(
                        ErrorCode.INVALID_TRANSACTION,
                        "This transaction hash is already linked to another payment");
            }
        });

        String expectedWei = toAtomicString(payment.getAmount(), tokenDecimals);

        EscrowVerificationService.FundVerification verified = escrowVerificationService.verifyFunding(
                transactionHash,
                payment.getJob().getId(),
                client.getWalletAddress(),
                freelancer.getWalletAddress(),
                expectedWei
        );

        payment.setStatus(Payment.PaymentStatus.ESCROWED);
        payment.setFundTransactionHash(transactionHash.trim());
        payment.setOnChainEscrowId(verified.escrowId());
        payment.setAmountWei(verified.amountWei());
        payment.setClientWallet(verified.clientWallet());
        payment.setFreelancerWallet(verified.freelancerWallet());
        payment.setChainId(verified.chainId());
        payment.setEscrowAddress(verified.contractAddress());
        payment.setPlatformFeePercent(platformFeePercent);

        return paymentRepository.save(payment);
    }

    /**
     * Confirm on-chain releasePayment after the client wallet released funds.
     */
    @Transactional
    public Payment confirmPaymentRelease(Long paymentId, String transactionHash, Long clientId) {
        Payment payment = requirePaymentOwnedByClient(paymentId, clientId);

        if (payment.getFundingMode() != Payment.FundingMode.ON_CHAIN) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Use releasePayment for simulated (off-chain) payments");
        }

        if (payment.getStatus() == Payment.PaymentStatus.RELEASED
                && transactionHash != null
                && transactionHash.equalsIgnoreCase(payment.getReleaseTransactionHash())) {
            return payment;
        }

        requireReleasable(payment);
        Job job = payment.getJob();
        requireJobInProgress(job);

        if (payment.getOnChainEscrowId() == null || payment.getOnChainEscrowId().isBlank()) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Payment is missing on-chain escrow id");
        }

        EscrowVerificationService.ReleaseVerification verified =
                escrowVerificationService.verifyRelease(transactionHash, payment.getOnChainEscrowId());

        payment.setStatus(Payment.PaymentStatus.RELEASED);
        payment.setReleaseTransactionHash(transactionHash.trim());
        payment.setTransactionHash(transactionHash.trim());
        job.setStatus(Job.JobStatus.COMPLETED);

        // silence unused if compiler complains in older toolchains
        if (verified == null) {
            throw new ValidationException(ErrorCode.WEB3_ERROR, "Verification failed");
        }

        return paymentRepository.save(payment);
    }

    /**
     * Simulated (off-chain) release only. On-chain payments must use confirmPaymentRelease.
     */
    @Transactional
    public Payment releasePayment(Long paymentId, String transactionHash, Long clientId) {
        Payment payment = requirePaymentOwnedByClient(paymentId, clientId);

        if (payment.getFundingMode() == Payment.FundingMode.ON_CHAIN) {
            if (transactionHash == null || transactionHash.isBlank()) {
                throw new ValidationException(
                        ErrorCode.INVALID_TRANSACTION,
                        "On-chain payments require a release transaction hash — use confirmPaymentRelease");
            }
            return confirmPaymentRelease(paymentId, transactionHash, clientId);
        }

        requireReleasable(payment);
        Job job = payment.getJob();
        requireJobInProgress(job);

        payment.setTransactionHash(transactionHash);
        payment.setReleaseTransactionHash(transactionHash);
        payment.setStatus(Payment.PaymentStatus.RELEASED);
        job.setStatus(Job.JobStatus.COMPLETED);

        return paymentRepository.save(payment);
    }

    /**
     * Hired freelancer marks the contract as ready for client review.
     * Payment stays funded; job stays in progress until the client releases.
     */
    @Transactional
    public Payment submitWork(Long jobId, String message, Long freelancerId) {
        Payment payment = requirePaymentForJob(jobId);

        if (!payment.getFreelancer().getId().equals(freelancerId)) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the hired freelancer can submit work for this job");
        }

        requireJobInProgress(payment.getJob());

        if (payment.getStatus() == Payment.PaymentStatus.IN_REVIEW) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Work is already submitted and awaiting client review");
        }

        if (payment.getStatus() != Payment.PaymentStatus.ESCROWED) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Work can only be submitted after funds are in escrow");
        }

        payment.setStatus(Payment.PaymentStatus.IN_REVIEW);
        payment.setWorkSubmittedAt(LocalDateTime.now());
        payment.setWorkSubmissionMessage(normalizeOptionalMessage(message));
        payment.setChangesRequestedAt(null);
        payment.setChangesRequestedMessage(null);

        Payment saved = paymentRepository.save(payment);

        Job job = payment.getJob();
        String jobTitle = job.getTitle() != null ? job.getTitle() : "your job";
        String freelancerName = payment.getFreelancer().getUsername();
        notificationService.create(
                payment.getClient(),
                Notification.NotificationType.WORK_SUBMITTED,
                "Work submitted",
                freelancerName + " submitted work on \"" + jobTitle + "\". Review it and approve & release, or request changes.",
                "/jobs/" + job.getId() + "/proposals",
                job.getId(),
                null
        );

        return saved;
    }

    /**
     * Client sends submitted work back to the freelancer. Funds stay in escrow.
     */
    @Transactional
    public Payment requestChanges(Long jobId, String message, Long clientId) {
        Payment payment = requirePaymentForJob(jobId);

        if (!payment.getClient().getId().equals(clientId)) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the hiring client can request changes");
        }

        requireJobInProgress(payment.getJob());

        if (payment.getStatus() != Payment.PaymentStatus.IN_REVIEW) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Changes can only be requested after the freelancer submits work");
        }

        payment.setStatus(Payment.PaymentStatus.ESCROWED);
        payment.setChangesRequestedAt(LocalDateTime.now());
        payment.setChangesRequestedMessage(normalizeOptionalMessage(message));

        Payment saved = paymentRepository.save(payment);

        Job job = payment.getJob();
        String jobTitle = job.getTitle() != null ? job.getTitle() : "the job";
        notificationService.create(
                payment.getFreelancer(),
                Notification.NotificationType.CHANGES_REQUESTED,
                "Changes requested",
                "The client requested changes on \"" + jobTitle + "\". Update your work and submit again.",
                "/my-bids",
                job.getId(),
                null
        );

        return saved;
    }

    public Payment getPaymentForJob(Long jobId, Long userId) {
        Job job = jobService.getJobById(jobId);
        boolean isClient = job.getClient().getId().equals(userId);
        Payment payment = paymentRepository.findByJobId(jobId).orElse(null);
        boolean isHiredFreelancer = payment != null && payment.getFreelancer().getId().equals(userId);

        if (!isClient && !isHiredFreelancer) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the job owner or hired freelancer can view this payment");
        }

        return payment;
    }

    public Payment findByJobId(Long jobId) {
        return paymentRepository.findByJobId(jobId).orElse(null);
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.PAYMENT_NOT_FOUND,
                        "Payment with ID " + id + " not found"));
    }

    private Payment requirePaymentOwnedByClient(Long paymentId, Long clientId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.PAYMENT_NOT_FOUND,
                        "Payment with ID " + paymentId + " not found"));

        if (!payment.getClient().getId().equals(clientId)) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the hiring client can release this payment");
        }
        return payment;
    }

    private Payment requirePaymentForJob(Long jobId) {
        return paymentRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.PAYMENT_NOT_FOUND,
                        "No payment found for job " + jobId));
    }

    private static void requireReleasable(Payment payment) {
        if (payment.getStatus() != Payment.PaymentStatus.ESCROWED
                && payment.getStatus() != Payment.PaymentStatus.IN_REVIEW) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Only escrowed or in-review payments can be released");
        }
    }

    private static void requireJobInProgress(Job job) {
        if (job.getStatus() != Job.JobStatus.IN_PROGRESS) {
            throw new ValidationException(
                    ErrorCode.INVALID_JOB_STATUS,
                    "This action requires an in-progress job");
        }
    }

    private static String normalizeOptionalMessage(String message) {
        if (message == null) {
            return null;
        }
        String trimmed = message.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > MAX_WORK_MESSAGE_LENGTH) {
            throw new ValidationException(
                    ErrorCode.VALIDATION_ERROR,
                    "Message must be " + MAX_WORK_MESSAGE_LENGTH + " characters or fewer");
        }
        return trimmed;
    }

    /**
     * Convert a human token amount (e.g. 1500 USDC) to integer atomic units (6 decimals for USDC).
     */
    static String toAtomicString(BigDecimal amount, int decimals) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException(ErrorCode.VALIDATION_ERROR, "Amount must be positive");
        }
        if (decimals < 0 || decimals > 18) {
            throw new ValidationException(ErrorCode.VALIDATION_ERROR, "Unsupported token decimals");
        }
        BigDecimal factor = BigDecimal.TEN.pow(decimals);
        BigInteger atomic = amount
                .multiply(factor)
                .setScale(0, RoundingMode.HALF_UP)
                .toBigIntegerExact();
        return atomic.toString();
    }

    /** @deprecated USDC uses {@link #toAtomicString(BigDecimal, int)}; kept for older tests. */
    static String toWeiString(BigDecimal amount) {
        return toAtomicString(amount, 6);
    }
}
