package com.web3.freelance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "payments",
        indexes = {
                @Index(name = "idx_payments_fund_tx", columnList = "fundTransactionHash", unique = true),
                @Index(name = "idx_payments_release_tx", columnList = "releaseTransactionHash", unique = true)
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 36, scale = 18)
    private BigDecimal amount;

    /**
     * Exact native amount in wei (string to avoid float precision issues).
     * Set when funding is confirmed on-chain.
     */
    @Column(length = 78)
    private String amountWei;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.AWAITING_FUNDING;

    /**
     * DB default + ColumnDefault so Hibernate ddl-auto can add this NOT NULL column
     * on tables that already have payment rows (legacy simulated escrow).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @ColumnDefault("'SIMULATED'")
    @Builder.Default
    private FundingMode fundingMode = FundingMode.SIMULATED;

    /** Legacy alias; prefer releaseTransactionHash for on-chain releases. */
    private String transactionHash;

    @Column(length = 80)
    private String fundTransactionHash;

    @Column(length = 80)
    private String releaseTransactionHash;

    /** On-chain escrow id from FreelanceEscrow.createEscrow. */
    @Column(length = 78)
    private String onChainEscrowId;

    private Long chainId;

    @Column(nullable = false)
    private String escrowAddress;

    @Column(length = 42)
    private String clientWallet;

    @Column(length = 42)
    private String freelancerWallet;

    private Integer platformFeePercent;

    private LocalDateTime workSubmittedAt;

    @Column(length = 2000)
    private String workSubmissionMessage;

    private LocalDateTime changesRequestedAt;

    @Column(length = 2000)
    private String changesRequestedMessage;

    @OneToOne
    @JoinColumn(name = "job_id", nullable = false, unique = true)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_id", nullable = false)
    private User freelancer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Payment lifecycle:
     * AWAITING_FUNDING — hired; on-chain fund pending (ON_CHAIN only)
     * ESCROWED — funds held (simulated or verified on-chain); freelancer may submit work
     * IN_REVIEW — freelancer submitted work; client may approve/release or request changes
     * RELEASED — client released; job completed
     * REFUNDED — refund path (on-chain or future simulated)
     */
    public enum PaymentStatus {
        AWAITING_FUNDING,
        ESCROWED,
        IN_REVIEW,
        RELEASED,
        REFUNDED
    }

    public enum FundingMode {
        SIMULATED,
        ON_CHAIN
    }
}
