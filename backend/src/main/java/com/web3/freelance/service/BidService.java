package com.web3.freelance.service;

import com.web3.freelance.exception.ErrorCode;
import com.web3.freelance.exception.ResourceNotFoundException;
import com.web3.freelance.exception.UnauthorizedException;
import com.web3.freelance.exception.ValidationException;
import com.web3.freelance.model.Bid;
import com.web3.freelance.model.Job;
import com.web3.freelance.model.Notification;
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
    private final NotificationService notificationService;

    public Bid getBidById(Long id) {
        return bidRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.BID_NOT_FOUND,
                        "Bid with ID " + id + " not found"));
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

    /**
     * Rejects every still-pending proposal on the job except the accepted one.
     * Invoked when a freelancer accepts an offer.
     */
    @Transactional
    public List<Bid> rejectCompetingBids(Job job, Long acceptedBidId) {
        List<Bid> rejected = bidRepository.findByJobAndStatus(job, Bid.BidStatus.PENDING).stream()
                .filter(bid -> !bid.getId().equals(acceptedBidId))
                .toList();

        if (rejected.isEmpty()) {
            return List.of();
        }

        rejected.forEach(bid -> bid.setStatus(Bid.BidStatus.REJECTED));
        return bidRepository.saveAll(rejected);
    }

    /**
     * Client sends an offer for a pending proposal. Does not reject competitors or create payment.
     */
    @Transactional
    public Bid offerBid(Long bidId, Long clientId) {
        Bid bid = getBidById(bidId);
        Job job = bid.getJob();

        if (!job.getClient().getId().equals(clientId)) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the job owner can send an offer");
        }

        if (job.getStatus() != Job.JobStatus.OPEN) {
            throw new ValidationException(
                    ErrorCode.JOB_ALREADY_ASSIGNED,
                    "This job is no longer open for hiring");
        }

        if (bid.getStatus() != Bid.BidStatus.PENDING) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Only pending proposals can receive an offer");
        }

        List<Bid> outstandingOffers = bidRepository.findByJobAndStatus(job, Bid.BidStatus.OFFERED);
        if (!outstandingOffers.isEmpty()) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "This job already has an outstanding offer. Withdraw it before offering someone else");
        }

        bid.setStatus(Bid.BidStatus.OFFERED);
        Bid saved = bidRepository.save(bid);

        String jobTitle = job.getTitle() != null ? job.getTitle() : "a job";
        notificationService.create(
                bid.getFreelancer(),
                Notification.NotificationType.OFFER_RECEIVED,
                "You received a job offer",
                "A client offered you \"" + jobTitle + "\". Review and accept or decline in My proposals.",
                "/my-bids",
                job.getId(),
                bid.getId()
        );

        return saved;
    }

    /**
     * Freelancer declines an offer; proposal returns to PENDING so the client can hire someone else.
     */
    @Transactional
    public Bid declineOffer(Long bidId, Long freelancerId) {
        Bid bid = getBidById(bidId);
        Job job = bid.getJob();

        if (!bid.getFreelancer().getId().equals(freelancerId)) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the proposal owner can decline this offer");
        }

        if (bid.getStatus() != Bid.BidStatus.OFFERED) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Only an outstanding offer can be declined");
        }

        bid.setStatus(Bid.BidStatus.PENDING);
        Bid saved = bidRepository.save(bid);

        String freelancerName = bid.getFreelancer().getUsername();
        String jobTitle = job.getTitle() != null ? job.getTitle() : "your job";
        notificationService.create(
                job.getClient(),
                Notification.NotificationType.OFFER_DECLINED,
                "Offer declined",
                freelancerName + " declined your offer on \"" + jobTitle + "\". You can offer another proposal.",
                "/jobs/" + job.getId() + "/proposals",
                job.getId(),
                bid.getId()
        );

        return saved;
    }

    /**
     * Client withdraws an outstanding offer; proposal returns to PENDING.
     */
    @Transactional
    public Bid withdrawOffer(Long bidId, Long clientId) {
        Bid bid = getBidById(bidId);
        Job job = bid.getJob();

        if (!job.getClient().getId().equals(clientId)) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the job owner can withdraw an offer");
        }

        if (bid.getStatus() != Bid.BidStatus.OFFERED) {
            throw new ValidationException(
                    ErrorCode.BUSINESS_LOGIC_ERROR,
                    "Only an outstanding offer can be withdrawn");
        }

        bid.setStatus(Bid.BidStatus.PENDING);
        Bid saved = bidRepository.save(bid);

        String jobTitle = job.getTitle() != null ? job.getTitle() : "a job";
        notificationService.create(
                bid.getFreelancer(),
                Notification.NotificationType.OFFER_WITHDRAWN,
                "Offer withdrawn",
                "The client withdrew their offer on \"" + jobTitle + "\". Your proposal is still pending.",
                "/my-bids",
                job.getId(),
                bid.getId()
        );

        return saved;
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
