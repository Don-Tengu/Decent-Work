package com.web3.freelance.service;

import com.web3.freelance.model.Bid;
import com.web3.freelance.model.Job;
import com.web3.freelance.model.Payment;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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

    private PaymentService paymentService;
    private User client;
    private User freelancer;
    private Job job;
    private Bid bid;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, bidService, jobService);
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
        bid = Bid.builder()
                .id(50L)
                .amount(BigDecimal.valueOf(1200))
                .proposal("I can complete this audit with a clear report.")
                .deliveryTime(7)
                .status(Bid.BidStatus.PENDING)
                .freelancer(freelancer)
                .job(job)
                .build();
    }

    @Test
    void acceptBidFundsEscrowAndStartsContract() {
        when(bidService.getBidById(50L)).thenReturn(bid);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment payment = paymentService.acceptBid(50L, 1L);

        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.ESCROWED);
        assertThat(payment.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(1200));
        assertThat(payment.getFreelancer()).isEqualTo(freelancer);
        assertThat(payment.getClient()).isEqualTo(client);
        assertThat(payment.getJob()).isEqualTo(job);
        assertThat(bid.getStatus()).isEqualTo(Bid.BidStatus.ACCEPTED);
        assertThat(job.getStatus()).isEqualTo(Job.JobStatus.IN_PROGRESS);
        assertThat(job.getAcceptedBid()).isEqualTo(bid);
        verify(bidService).rejectCompetingBids(job, 50L);
    }

    @Test
    void acceptBidRejectsNonOwner() {
        when(bidService.getBidById(50L)).thenReturn(bid);

        assertThatThrownBy(() -> paymentService.acceptBid(50L, 999L))
                .hasMessageContaining("Only the job owner");

        verify(bidService, never()).rejectCompetingBids(any(Job.class), any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void acceptBidRejectsJobNotOpen() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        when(bidService.getBidById(50L)).thenReturn(bid);

        assertThatThrownBy(() -> paymentService.acceptBid(50L, 1L))
                .hasMessageContaining("no longer open");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void releasePaymentReleasesEscrowAndCompletesJob() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        Payment escrowed = Payment.builder()
                .id(100L)
                .amount(BigDecimal.valueOf(1200))
                .status(Payment.PaymentStatus.ESCROWED)
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
    void releasePaymentRejectsNonOwner() {
        Payment escrowed = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.ESCROWED)
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
    void releasePaymentRejectsWhenNotEscrowed() {
        Payment pending = Payment.builder()
                .id(100L)
                .status(Payment.PaymentStatus.PENDING)
                .escrowAddress("0x0")
                .job(job)
                .freelancer(freelancer)
                .client(client)
                .build();
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> paymentService.releasePayment(100L, null, 1L))
                .hasMessageContaining("escrowed");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void releasePaymentRejectsWhenJobNotInProgress() {
        job.setStatus(Job.JobStatus.CANCELLED);
        Payment escrowed = Payment.builder()
                .id(100L)
                .amount(BigDecimal.valueOf(1200))
                .status(Payment.PaymentStatus.ESCROWED)
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

        assertThatThrownBy(() -> paymentService.getPaymentForJob(10L, 999L))
                .hasMessageContaining("Only the job owner");

        verify(paymentRepository, never()).findByJobId(any());
    }
}
