package com.web3.freelance.service;

import com.web3.freelance.model.Bid;
import com.web3.freelance.model.Job;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.BidRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BidService {

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

    public List<Bid> getJobBids(Long jobId) {
        Job job = jobService.getJobById(jobId);
        return bidRepository.findByJob(job);
    }

    @Transactional
    public Bid placeBid(Long freelancerId, PlaceBidRequest request) {
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

        Bid bid = Bid.builder()
                .amount(request.amount())
                .proposal(request.proposal())
                .deliveryTime(request.deliveryTime())
                .status(Bid.BidStatus.PENDING)
                .freelancer(freelancer)
                .job(job)
                .build();

        return bidRepository.save(bid);
    }

    public record PlaceBidRequest(Long jobId, BigDecimal amount, String proposal, Integer deliveryTime) {}
}
