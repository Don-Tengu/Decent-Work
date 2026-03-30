package com.web3.freelance.service;

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
            throw new RuntimeException("Only job owner can accept bids");
        }

        if (job.getStatus() != Job.JobStatus.OPEN) {
            throw new RuntimeException("Job is not open");
        }

        // Update bid status
        bid.setStatus(Bid.BidStatus.ACCEPTED);
        job.setAcceptedBid(bid);
        job.setStatus(Job.JobStatus.IN_PROGRESS);

        // Create payment record
        Payment payment = Payment.builder()
                .amount(bid.getAmount())
                .status(Payment.PaymentStatus.PENDING)
                .escrowAddress(escrowContractAddress)
                .job(job)
                .freelancer(bid.getFreelancer())
                .client(job.getClient())
                .build();

        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment releasePayment(Long paymentId, String transactionHash) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() != Payment.PaymentStatus.ESCROWED) {
            throw new RuntimeException("Payment is not in escrow");
        }

        // In a real implementation, verify the transaction on-chain
        // For MVP, we'll just update the status
        payment.setTransactionHash(transactionHash);
        payment.setStatus(Payment.PaymentStatus.RELEASED);

        // Update job status
        Job job = payment.getJob();
        job.setStatus(Job.JobStatus.COMPLETED);

        return paymentRepository.save(payment);
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
    }

    // Helper method to initialize Web3j (for future use)
    private Web3j getWeb3j() {
        return Web3j.build(new HttpService(providerUrl));
    }
}
