package com.web3.freelance.service;

import com.web3.freelance.model.Bid;
import com.web3.freelance.model.Job;
import com.web3.freelance.model.Notification;
import com.web3.freelance.model.Payment;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BidService bidService;

    @Mock
    private JobService jobService;

    @Mock
    private EscrowVerificationService escrowVerificationService;

    @Mock
    private NotificationService notificationService;

    private PaymentService paymentService;
    private User client;
    private User freelancer;
    private Job job;
    private Bid bid;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository, bidService, jobService, escrowVerificationService, notificationService);
        ReflectionTestUtils.setField(paymentService, "escrowContractAddress", "0xEscrow");
        ReflectionTestUtils.setField(paymentService, "platformFeePercent", 5);
        ReflectionTestUtils.setField(paymentService, "chainId", 31337L);
        ReflectionTestUtils.setField(paymentService, "tokenDecimals", 6);

        client = User.builder()
                .id(1L)
                .email("client@example.com")
                .username("client")
                .role(User.UserRole.CLIENT)
                .walletAddress("0xClientWallet")
                .build();
        freelancer = User.builder()
                .id(2L)
                .email("freelancer@example.com")
                .username("freelancer")
                .role(User.UserRole.FREELANCER)
                .walletAddress("0xFreelancerWallet")
                .build();
        job = Job.builder()
                .id(10L)
                .title("Audit")
                .description("A smart contract audit job with enough detail.")
                .status(Job.JobStatus.OPEN)
                .paymentModel(Job.PaymentModel.OFF_CHAIN_NEGOTIATED)
                .client(client)
                .build();
        bid = Bid.builder()
                .id(50L)
                .amount(BigDecimal.valueOf(1.5))
                .proposal("I can complete this audit with a clear report.")
                .deliveryTime(7)
                .status(Bid.BidStatus.OFFERED)
                .freelancer(freelancer)
                .job(job)
                .build();
    }

    @Test
    void acceptOfferSimulatedEscrowForOffChainJobs() {
        when(bidService.getBidById(50L)).thenReturn(bid);
        when(bidService.rejectCompetingBids(job, 50L)).thenReturn(List.of());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment payment = paymentService.acceptOffer(50L, 2L);

        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.ESCROWED);
        assertThat(payment.getFundingMode()).isEqualTo(Payment.FundingMode.SIMULATED);
        assertThat(payment.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(1.5));
        assertThat(payment.getFreelancer()).isEqualTo(freelancer);
        assertThat(payment.getClient()).isEqualTo(client);
        assertThat(payment.getJob()).isEqualTo(job);
        assertThat(bid.getStatus()).isEqualTo(Bid.BidStatus.ACCEPTED);
        assertThat(job.getStatus()).isEqualTo(Job.JobStatus.IN_PROGRESS);
        assertThat(job.getAcceptedBid()).isEqualTo(bid);
        verify(bidService).rejectCompetingBids(job, 50L);
        verify(notificationService).create(
                eq(client),
                eq(Notification.NotificationType.OFFER_ACCEPTED),
                any(),
                any(),
                eq("/jobs/10/proposals"),
                eq(10L),
                eq(50L)
        );
    }

    @Test
    void acceptOfferAwaitsFundingForOnChainJobs() {
        job.setPaymentModel(Job.PaymentModel.ON_CHAIN_ESCROW);
        when(bidService.getBidById(50L)).thenReturn(bid);
        when(bidService.rejectCompetingBids(job, 50L)).thenReturn(List.of());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment payment = paymentService.acceptOffer(50L, 2L);

        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.AWAITING_FUNDING);
        assertThat(payment.getFundingMode()).isEqualTo(Payment.FundingMode.ON_CHAIN);
        assertThat(payment.getChainId()).isEqualTo(31337L);
        verify(escrowVerificationService).requireConfiguredContract();
    }

    @Test
    void acceptOfferNotifiesRejectedCompetitors() {
        User otherFreelancer = User.builder()
                .id(3L)
                .username("other")
                .email("other@example.com")
                .role(User.UserRole.FREELANCER)
                .build();
        Bid rejectedBid = Bid.builder()
                .id(51L)
                .amount(BigDecimal.ONE)
                .proposal("Also interested in this audit work here.")
                .deliveryTime(5)
                .status(Bid.BidStatus.REJECTED)
                .freelancer(otherFreelancer)
                .job(job)
                .build();

        when(bidService.getBidById(50L)).thenReturn(bid);
        when(bidService.rejectCompetingBids(job, 50L)).thenReturn(List.of(rejectedBid));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        paymentService.acceptOffer(50L, 2L);

        verify(notificationService).create(
                eq(otherFreelancer),
                eq(Notification.NotificationType.BID_NOT_SELECTED),
                any(),
                any(),
                eq("/my-bids"),
                eq(10L),
                eq(51L)
        );
    }

    @Test
    void acceptOfferRejectsNonOwner() {
        when(bidService.getBidById(50L)).thenReturn(bid);

        assertThatThrownBy(() -> paymentService.acceptOffer(50L, 999L))
                .hasMessageContaining("Only the proposal owner");

        verify(bidService, never()).rejectCompetingBids(any(Job.class), any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void acceptOfferRejectsWhenNotOffered() {
        bid.setStatus(Bid.BidStatus.PENDING);
        when(bidService.getBidById(50L)).thenReturn(bid);

        assertThatThrownBy(() -> paymentService.acceptOffer(50L, 2L))
                .hasMessageContaining("outstanding offer");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void acceptOfferRejectsJobNotOpen() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        when(bidService.getBidById(50L)).thenReturn(bid);

        assertThatThrownBy(() -> paymentService.acceptOffer(50L, 2L))
                .hasMessageContaining("no longer open");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void releasePaymentSimulatedReleasesEscrowAndCompletesJob() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        Payment escrowed = Payment.builder()
                .id(100L)
                .amount(BigDecimal.valueOf(1.5))
                .status(Payment.PaymentStatus.ESCROWED)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(escrowed));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment released = paymentService.releasePayment(100L, null, 1L);

        assertThat(released.getStatus()).isEqualTo(Payment.PaymentStatus.RELEASED);
        assertThat(job.getStatus()).isEqualTo(Job.JobStatus.COMPLETED);
    }

    @Test
    void releasePaymentOnChainRequiresTransactionHash() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        Payment escrowed = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.ESCROWED)
                .fundingMode(Payment.FundingMode.ON_CHAIN)
                .escrowAddress("0xEscrow")
                .onChainEscrowId("1")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(escrowed));

        assertThatThrownBy(() -> paymentService.releasePayment(100L, null, 1L))
                .hasMessageContaining("transaction hash");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void confirmEscrowFundingVerifiesAndEscrows() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        job.setPaymentModel(Job.PaymentModel.ON_CHAIN_ESCROW);
        Payment awaiting = Payment.builder()
                .id(100L)
                .amount(new BigDecimal("1.5"))
                .status(Payment.PaymentStatus.AWAITING_FUNDING)
                .fundingMode(Payment.FundingMode.ON_CHAIN)
                .escrowAddress("0xEscrow")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(awaiting));
        when(paymentRepository.findByFundTransactionHash("0xfund")).thenReturn(Optional.empty());
        when(escrowVerificationService.verifyFunding(
                eq("0xfund"),
                eq(10L),
                eq("0xClientWallet"),
                eq("0xFreelancerWallet"),
                eq(PaymentService.toWeiString(new BigDecimal("1.5")))
        )).thenReturn(new EscrowVerificationService.FundVerification(
                "7",
                10L,
                "0xclientwallet",
                "0xfreelancerwallet",
                PaymentService.toWeiString(new BigDecimal("1.5")),
                31337L,
                "0xescrow"
        ));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment funded = paymentService.confirmEscrowFunding(100L, "0xfund", 1L);

        assertThat(funded.getStatus()).isEqualTo(Payment.PaymentStatus.ESCROWED);
        assertThat(funded.getOnChainEscrowId()).isEqualTo("7");
        assertThat(funded.getFundTransactionHash()).isEqualTo("0xfund");
    }

    @Test
    void confirmPaymentReleaseVerifiesAndCompletes() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        Payment escrowed = Payment.builder()
                .id(100L)
                .amount(new BigDecimal("1.5"))
                .status(Payment.PaymentStatus.ESCROWED)
                .fundingMode(Payment.FundingMode.ON_CHAIN)
                .escrowAddress("0xEscrow")
                .onChainEscrowId("7")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(escrowed));
        when(escrowVerificationService.verifyRelease("0xrelease", "7"))
                .thenReturn(new EscrowVerificationService.ReleaseVerification(
                        "7", "1425000000000000000", "75000000000000000", 31337L, "0xescrow"));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment released = paymentService.confirmPaymentRelease(100L, "0xrelease", 1L);

        assertThat(released.getStatus()).isEqualTo(Payment.PaymentStatus.RELEASED);
        assertThat(released.getReleaseTransactionHash()).isEqualTo("0xrelease");
        assertThat(job.getStatus()).isEqualTo(Job.JobStatus.COMPLETED);
    }

    @Test
    void releasePaymentRejectsNonOwner() {
        Payment escrowed = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.ESCROWED)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(escrowed));

        assertThatThrownBy(() -> paymentService.releasePayment(100L, null, 999L))
                .hasMessageContaining("Only the hiring client");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void releasePaymentRejectsWhenAlreadyReleased() {
        Payment released = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.RELEASED)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(released));

        assertThatThrownBy(() -> paymentService.releasePayment(100L, null, 1L))
                .hasMessageContaining("escrowed or in-review");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void releasePaymentRejectsWhenJobNotInProgress() {
        job.setStatus(Job.JobStatus.CANCELLED);
        Payment escrowed = Payment.builder()
                .id(100L)
                .amount(BigDecimal.valueOf(1.5))
                .status(Payment.PaymentStatus.ESCROWED)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(escrowed));

        assertThatThrownBy(() -> paymentService.releasePayment(100L, null, 1L))
                .hasMessageContaining("in-progress");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void getPaymentForJobReturnsPaymentForOwner() {
        Payment payment = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.ESCROWED)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(jobService.getJobById(10L)).thenReturn(job);
        when(paymentRepository.findByJobId(10L)).thenReturn(Optional.of(payment));

        assertThat(paymentService.getPaymentForJob(10L, 1L)).isEqualTo(payment);
    }

    @Test
    void getPaymentForJobRejectsNonOwner() {
        when(jobService.getJobById(10L)).thenReturn(job);
        when(paymentRepository.findByJobId(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPaymentForJob(10L, 999L))
                .hasMessageContaining("job owner or hired freelancer");
    }

    @Test
    void getPaymentForJobReturnsPaymentForHiredFreelancer() {
        Payment payment = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.ESCROWED)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(jobService.getJobById(10L)).thenReturn(job);
        when(paymentRepository.findByJobId(10L)).thenReturn(Optional.of(payment));

        assertThat(paymentService.getPaymentForJob(10L, 2L)).isEqualTo(payment);
    }

    @Test
    void submitWorkMovesEscrowedPaymentToInReview() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        Payment escrowed = Payment.builder()
                .id(100L)
                .amount(BigDecimal.valueOf(1.5))
                .status(Payment.PaymentStatus.ESCROWED)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findByJobId(10L)).thenReturn(Optional.of(escrowed));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment submitted = paymentService.submitWork(10L, "  Deliverables are in the repo.  ", 2L);

        assertThat(submitted.getStatus()).isEqualTo(Payment.PaymentStatus.IN_REVIEW);
        assertThat(submitted.getWorkSubmissionMessage()).isEqualTo("Deliverables are in the repo.");
        assertThat(submitted.getWorkSubmittedAt()).isNotNull();
        assertThat(submitted.getChangesRequestedAt()).isNull();
        verify(notificationService).create(
                eq(client),
                eq(Notification.NotificationType.WORK_SUBMITTED),
                any(),
                any(),
                eq("/jobs/10/proposals"),
                eq(10L),
                isNull()
        );
    }

    @Test
    void submitWorkRejectsWhenAlreadyInReview() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        Payment inReview = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.IN_REVIEW)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findByJobId(10L)).thenReturn(Optional.of(inReview));

        assertThatThrownBy(() -> paymentService.submitWork(10L, "again", 2L))
                .hasMessageContaining("already submitted");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void submitWorkRejectsWhenAwaitingFunding() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        Payment awaiting = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.AWAITING_FUNDING)
                .fundingMode(Payment.FundingMode.ON_CHAIN)
                .escrowAddress("0xEscrow")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findByJobId(10L)).thenReturn(Optional.of(awaiting));

        assertThatThrownBy(() -> paymentService.submitWork(10L, null, 2L))
                .hasMessageContaining("after funds are in escrow");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void submitWorkRejectsNonHiredFreelancer() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        Payment escrowed = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.ESCROWED)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findByJobId(10L)).thenReturn(Optional.of(escrowed));

        assertThatThrownBy(() -> paymentService.submitWork(10L, "done", 1L))
                .hasMessageContaining("hired freelancer");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void requestChangesReturnsPaymentToEscrowed() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        Payment inReview = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.IN_REVIEW)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .workSubmissionMessage("First pass")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findByJobId(10L)).thenReturn(Optional.of(inReview));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment updated = paymentService.requestChanges(10L, "Please add the test report.", 1L);

        assertThat(updated.getStatus()).isEqualTo(Payment.PaymentStatus.ESCROWED);
        assertThat(updated.getChangesRequestedMessage()).isEqualTo("Please add the test report.");
        assertThat(updated.getChangesRequestedAt()).isNotNull();
        assertThat(updated.getWorkSubmissionMessage()).isEqualTo("First pass");
        verify(notificationService).create(
                eq(freelancer),
                eq(Notification.NotificationType.CHANGES_REQUESTED),
                any(),
                any(),
                eq("/my-bids"),
                eq(10L),
                isNull()
        );
    }

    @Test
    void requestChangesRejectsWhenNotInReview() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        Payment escrowed = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.ESCROWED)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findByJobId(10L)).thenReturn(Optional.of(escrowed));

        assertThatThrownBy(() -> paymentService.requestChanges(10L, "nits", 1L))
                .hasMessageContaining("after the freelancer submits");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void releasePaymentFromInReviewCompletesJob() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        Payment inReview = Payment.builder()
                .id(100L)
                .amount(BigDecimal.valueOf(1.5))
                .status(Payment.PaymentStatus.IN_REVIEW)
                .fundingMode(Payment.FundingMode.SIMULATED)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(inReview));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment released = paymentService.releasePayment(100L, null, 1L);

        assertThat(released.getStatus()).isEqualTo(Payment.PaymentStatus.RELEASED);
        assertThat(job.getStatus()).isEqualTo(Job.JobStatus.COMPLETED);
    }

    @Test
    void toAtomicStringConvertsUsdcDecimal() {
        assertThat(PaymentService.toAtomicString(new BigDecimal("1"), 6))
                .isEqualTo("1000000");
        assertThat(PaymentService.toAtomicString(new BigDecimal("1.5"), 6))
                .isEqualTo("1500000");
        assertThat(PaymentService.toWeiString(new BigDecimal("1500")))
                .isEqualTo("1500000000");
    }
}
