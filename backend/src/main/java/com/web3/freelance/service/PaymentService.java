package com.web3.freelance.service;

import com.web3.freelance.exception.ErrorCode;
import com.web3.freelance.exception.ResourceNotFoundException;
import com.web3.freelance.exception.UnauthorizedException;
import com.web3.freelance.exception.ValidationException;
import com.web3.freelance.model.Bid;
import com.web3.freelance.model.Job;
import com.web3.freelance.model.Payment;
import com.web3.freelance.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BidService bidService;
    private final JobService jobService;

    @Value("${web3.provider-url}")
    private String providerUrl;

    @Value("${web3.escrow-contract-address}")
    private String escrowContractAddress;

    @Transactional
    public Payment acceptBid(Long bidId, Long clientId) {
        Bid bid = bidService.getBidById(bidId);
        Job job = bid.getJob();

        if (!job.getClient().getId().equals(clientId)) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the job owner can accept proposals");
        }

        if (job.getStatus() != Job.JobStatus.OPEN) {
            throw new ValidationException(
                    ErrorCode.JOB_ALREADY_ASSIGNED,
                    "This job is no longer open for hiring");
        }

        // Decline every other still-pending proposal on this job.
        bidService.rejectCompetingBids(job, bid.getId());

        // Accept the winning proposal and move the job into progress.
        bid.setStatus(Bid.BidStatus.ACCEPTED);
        job.setAcceptedBid(bid);
        job.setStatus(Job.JobStatus.IN_PROGRESS);

        // Off-chain MVP: fund the escrow immediately (simulated). Real on-chain
        // funding will replace ESCROWED-on-accept in a later iteration.
        Payment payment = Payment.builder()
                .amount(bid.getAmount())
                .status(Payment.PaymentStatus.ESCROWED)
                .escrowAddress(escrowContractAddress)
                .job(job)
                .freelancer(bid.getFreelancer())
                .client(job.getClient())
                .build();

        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment releasePayment(Long paymentId, String transactionHash, Long clientId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.PAYMENT_NOT_FOUND,
                        "Payment with ID " + paymentId + " not found"));

        if (!payment.getClient().getId().equals(clientId)) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the hiring client can release this payment");
        }

        if (payment.getStatus() != Payment.PaymentStatus.ESCROWED) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Only escrowed funds can be released");
        }

        Job job = payment.getJob();
        if (job.getStatus() != Job.JobStatus.IN_PROGRESS) {
            throw new ValidationException(
                    ErrorCode.INVALID_JOB_STATUS,
                    "Only an in-progress job can be completed");
        }

        // Off-chain MVP: transactionHash stays optional until on-chain escrow lands.
        payment.setTransactionHash(transactionHash);
        payment.setStatus(Payment.PaymentStatus.RELEASED);
        job.setStatus(Job.JobStatus.COMPLETED);

        return paymentRepository.save(payment);
    }

    public Payment getPaymentForJob(Long jobId, Long clientId) {
        Job job = jobService.getJobById(jobId);

        if (!job.getClient().getId().equals(clientId)) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the job owner can view this payment");
        }

        return paymentRepository.findByJobId(jobId).orElse(null);
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.PAYMENT_NOT_FOUND,
                        "Payment with ID " + id + " not found"));
    }

    // Helper method to initialize Web3j (for future use)
    private Web3j getWeb3j() {
        return Web3j.build(new HttpService(providerUrl));
    }
}
