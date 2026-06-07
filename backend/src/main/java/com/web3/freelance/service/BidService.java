package com.web3.freelance.service;

import com.web3.freelance.model.Bid;
import com.web3.freelance.model.Job;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.BidRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BidService {

    private static final int MIN_PROPOSAL_LENGTH = 50;
    private static final int MAX_PROPOSAL_LENGTH = 2000;
    private static final int MAX_RELEVANT_EXPERIENCE_LENGTH = 2000;
    private static final int MAX_DELIVERY_DAYS = 3650;

    private final BidRepository bidRepository;
    private final JobService jobService;
    private final UserService userService;

    public Bid getBidById(Long id) {
        return bidRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bid not found"));
    }

    public List<Bid> getMyBids(Long userId) {
        User user = userService.getUserById(userId);
        return bidRepository.findByFreelancer(user);
    }

    public Bid getMyBidForJob(Long jobId, Long userId) {
        User user = userService.getUserById(userId);
        if (user.getRole() != User.UserRole.FREELANCER) {
            return null;
        }

        Job job = jobService.getJobById(jobId);
        return bidRepository.findByJobAndFreelancer(job, user).orElse(null);
    }

    public List<Bid> getJobBids(Long jobId, Long clientId) {
        Job job = jobService.getJobById(jobId);

        if (!job.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Only the job owner can view proposals");
        }

        return bidRepository.findByJob(job);
    }

    @Transactional
    public Bid placeBid(Long freelancerId, PlaceBidRequest request) {
        if (request == null || request.jobId() == null) {
            throw new RuntimeException("Job is required");
        }

        User freelancer = userService.getUserById(freelancerId);
        Job job = jobService.getJobById(request.jobId());

        if (freelancer.getRole() != User.UserRole.FREELANCER) {
            throw new RuntimeException("Only freelancers can place bids");
        }

        if (job.getStatus() != Job.JobStatus.OPEN) {
            throw new RuntimeException("Job is not open for bidding");
        }

        if (job.getClient().getId().equals(freelancerId)) {
            throw new RuntimeException("Cannot bid on your own job");
        }

        if (bidRepository.existsByJobAndFreelancer(job, freelancer)) {
            throw new RuntimeException("You have already submitted a proposal for this job");
        }

        BigDecimal normalizedAmount = validateAndNormalizeAmount(request.amount());
        String normalizedProposal = validateAndNormalizeProposal(request.proposal());
        String normalizedRelevantExperience = validateAndNormalizeRelevantExperience(request.relevantExperience());
        Integer deliveryTime = validateDeliveryTime(request.deliveryTime());

        Bid bid = Bid.builder()
                .amount(normalizedAmount)
                .proposal(normalizedProposal)
                .relevantExperience(normalizedRelevantExperience)
                .deliveryTime(deliveryTime)
                .status(Bid.BidStatus.PENDING)
                .freelancer(freelancer)
                .job(job)
                .build();

        return bidRepository.save(bid);
    }

    private BigDecimal validateAndNormalizeAmount(BigDecimal amount) {
        if (amount == null) {
            throw new RuntimeException("Proposal amount is required");
        }
        if (amount.signum() <= 0) {
            throw new RuntimeException("Proposal amount must be greater than zero");
        }
        if (amount.stripTrailingZeros().scale() > 2) {
            throw new RuntimeException("Proposal amount can have at most 2 decimal places");
        }

        return amount.setScale(2, RoundingMode.UNNECESSARY);
    }

    private String validateAndNormalizeProposal(String proposal) {
        if (proposal == null || proposal.isBlank()) {
            throw new RuntimeException("Proposal is required");
        }

        String normalizedProposal = proposal.trim();
        if (normalizedProposal.length() < MIN_PROPOSAL_LENGTH) {
            throw new RuntimeException("Proposal must be at least 50 characters");
        }
        if (normalizedProposal.length() > MAX_PROPOSAL_LENGTH) {
            throw new RuntimeException("Proposal must be at most 2000 characters");
        }

        return normalizedProposal;
    }

    private String validateAndNormalizeRelevantExperience(String relevantExperience) {
        if (relevantExperience == null) {
            return null;
        }

        String normalized = relevantExperience.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > MAX_RELEVANT_EXPERIENCE_LENGTH) {
            throw new RuntimeException("Relevant experience must be at most 2000 characters");
        }

        return normalized;
    }

    private Integer validateDeliveryTime(Integer deliveryTime) {
        if (deliveryTime == null) {
            throw new RuntimeException("Delivery time is required");
        }
        if (deliveryTime < 1 || deliveryTime > MAX_DELIVERY_DAYS) {
            throw new RuntimeException("Delivery time must be between 1 and 3650 days");
        }

        return deliveryTime;
    }

    public record PlaceBidRequest(Long jobId, BigDecimal amount, String proposal, Integer deliveryTime,
                                  String relevantExperience) {}
}
