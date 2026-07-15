package com.web3.freelance.service;

import com.web3.freelance.model.Bid;
import com.web3.freelance.model.Job;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.BidRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BidServiceTest {

    @Mock
    private BidRepository bidRepository;

    @Mock
    private JobService jobService;

    @Mock
    private UserService userService;

    private BidService bidService;
    private User client;
    private User freelancer;
    private Job job;

    @BeforeEach
    void setUp() {
        bidService = new BidService(bidRepository, jobService, userService);
        client = User.builder()
                .id(1L)
                .email("client@example.com")
                .username("client")
                .role(User.UserRole.CLIENT)
                .build();
        freelancer = User.builder()
                .id(2L)
                .email("freelancer@example.com")
                .username("freelancer")
                .role(User.UserRole.FREELANCER)
                .build();
        job = Job.builder()
                .id(10L)
                .title("Audit")
                .description("A smart contract audit job with enough detail.")
                .status(Job.JobStatus.OPEN)
                .client(client)
                .build();
    }

    @Test
    void getJobBidsReturnsBidsForJobOwner() {
        Bid bid = Bid.builder()
                .id(50L)
                .amount(BigDecimal.valueOf(1200))
                .proposal("I can audit this.")
                .deliveryTime(7)
                .job(job)
                .build();

        when(jobService.getJobById(10L)).thenReturn(job);
        when(bidRepository.findByJob(job)).thenReturn(List.of(bid));

        assertThat(bidService.getJobBids(10L, 1L)).containsExactly(bid);
    }

    @Test
    void getJobBidsRejectsNonOwner() {
        when(jobService.getJobById(10L)).thenReturn(job);

        assertThatThrownBy(() -> bidService.getJobBids(10L, 2L))
                .hasMessageContaining("Only the job owner");
    }

    @Test
    void placeBidSavesValidFreelancerProposal() {
        String proposal = "  I can complete this smart contract audit with a clear findings report and remediation notes.  ";
        String relevantExperience = "  Audited 12 Solidity protocols over the past two years.  ";

        when(userService.getUserById(2L)).thenReturn(freelancer);
        when(jobService.getJobById(10L)).thenReturn(job);
        when(bidRepository.existsByJobAndFreelancer(job, freelancer)).thenReturn(false);
        when(bidRepository.save(any(Bid.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Bid savedBid = bidService.placeBid(
                2L,
                new BidService.PlaceBidRequest(10L, new BigDecimal("1200.5"), proposal, 14, relevantExperience)
        );

        assertThat(savedBid.getAmount()).isEqualByComparingTo(new BigDecimal("1200.50"));
        assertThat(savedBid.getProposal()).isEqualTo(proposal.trim());
        assertThat(savedBid.getRelevantExperience()).isEqualTo(relevantExperience.trim());
        assertThat(savedBid.getDeliveryTime()).isEqualTo(14);
        assertThat(savedBid.getStatus()).isEqualTo(Bid.BidStatus.PENDING);
        assertThat(savedBid.getFreelancer()).isEqualTo(freelancer);
        assertThat(savedBid.getJob()).isEqualTo(job);
    }

    @Test
    void placeBidNormalizesBlankRelevantExperienceToNull() {
        when(userService.getUserById(2L)).thenReturn(freelancer);
        when(jobService.getJobById(10L)).thenReturn(job);
        when(bidRepository.existsByJobAndFreelancer(job, freelancer)).thenReturn(false);
        when(bidRepository.save(any(Bid.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Bid savedBid = bidService.placeBid(
                2L,
                new BidService.PlaceBidRequest(10L, new BigDecimal("1200"), validProposal(), 14, "   ")
        );

        assertThat(savedBid.getRelevantExperience()).isNull();
    }

    @Test
    void placeBidRejectsClients() {
        when(userService.getUserById(1L)).thenReturn(client);
        when(jobService.getJobById(10L)).thenReturn(job);

        assertThatThrownBy(() -> bidService.placeBid(1L, validRequest()))
                .hasMessageContaining("Only freelancers");

        verify(bidRepository, never()).save(any());
    }

    @Test
    void placeBidRejectsClosedJobs() {
        job.setStatus(Job.JobStatus.CANCELLED);
        when(userService.getUserById(2L)).thenReturn(freelancer);
        when(jobService.getJobById(10L)).thenReturn(job);

        assertThatThrownBy(() -> bidService.placeBid(2L, validRequest()))
                .hasMessageContaining("Job is not open");

        verify(bidRepository, never()).save(any());
    }

    @Test
    void placeBidRejectsOwnJob() {
        job.setClient(freelancer);
        when(userService.getUserById(2L)).thenReturn(freelancer);
        when(jobService.getJobById(10L)).thenReturn(job);

        assertThatThrownBy(() -> bidService.placeBid(2L, validRequest()))
                .hasMessageContaining("Cannot bid on your own job");

        verify(bidRepository, never()).save(any());
    }

    @Test
    void placeBidRejectsDuplicateProposal() {
        when(userService.getUserById(2L)).thenReturn(freelancer);
        when(jobService.getJobById(10L)).thenReturn(job);
        when(bidRepository.existsByJobAndFreelancer(job, freelancer)).thenReturn(true);

        assertThatThrownBy(() -> bidService.placeBid(2L, validRequest()))
                .hasMessageContaining("already submitted");

        verify(bidRepository, never()).save(any());
    }

    @Test
    void placeBidRejectsInvalidAmount() {
        when(userService.getUserById(2L)).thenReturn(freelancer);
        when(jobService.getJobById(10L)).thenReturn(job);
        when(bidRepository.existsByJobAndFreelancer(job, freelancer)).thenReturn(false);

        assertThatThrownBy(() -> bidService.placeBid(
                2L,
                new BidService.PlaceBidRequest(10L, new BigDecimal("1200.555"), validProposal(), 14, null)
        )).hasMessageContaining("at most 2 decimal");

        verify(bidRepository, never()).save(any());
    }

    @Test
    void placeBidRejectsInvalidDeliveryTime() {
        when(userService.getUserById(2L)).thenReturn(freelancer);
        when(jobService.getJobById(10L)).thenReturn(job);
        when(bidRepository.existsByJobAndFreelancer(job, freelancer)).thenReturn(false);

        assertThatThrownBy(() -> bidService.placeBid(
                2L,
                new BidService.PlaceBidRequest(10L, new BigDecimal("1200"), validProposal(), 0, null)
        )).hasMessageContaining("between 1 and 3650 days");

        verify(bidRepository, never()).save(any());
    }

    @Test
    void placeBidRejectsInvalidProposalText() {
        when(userService.getUserById(2L)).thenReturn(freelancer);
        when(jobService.getJobById(10L)).thenReturn(job);
        when(bidRepository.existsByJobAndFreelancer(job, freelancer)).thenReturn(false);

        assertThatThrownBy(() -> bidService.placeBid(
                2L,
                new BidService.PlaceBidRequest(10L, new BigDecimal("1200"), "Too short", 14, null)
        )).hasMessageContaining("at least 50 characters");

        verify(bidRepository, never()).save(any());
    }

    private BidService.PlaceBidRequest validRequest() {
        return new BidService.PlaceBidRequest(10L, new BigDecimal("1200"), validProposal(), 14, null);
    }

    private String validProposal() {
        return "I can complete this audit with a clear report, remediation notes, and final verification.";
    }
}
