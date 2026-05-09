package com.web3.freelance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private JobStatus status = JobStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private JobScopeSize scopeSize;

    @Deprecated
    @Enumerated(EnumType.STRING)
    @Column(name = "scope_duration", nullable = false, length = 24)
    @Builder.Default
    private JobDuration scopeDuration = JobDuration.ONE_TO_THREE_MONTHS;

    @Column(nullable = false, columnDefinition = "integer default 1")
    @Builder.Default
    private Integer scopeDurationAmount = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16, columnDefinition = "varchar(16) default 'MONTH'")
    @Builder.Default
    private ScopeDurationUnit scopeDurationUnit = ScopeDurationUnit.MONTH;

    @Column(nullable = false, columnDefinition = "integer default 30")
    @Builder.Default
    private Integer scopeDurationDays = 30;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ExperienceLevel experienceLevel;

    @Column(nullable = false)
    @Builder.Default
    private Boolean contractToHire = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private BudgetType budgetType;

    @Column(precision = 12, scale = 2)
    private BigDecimal hourlyRateMin;

    @Column(precision = 12, scale = 2)
    private BigDecimal hourlyRateMax;

    @Column(precision = 12, scale = 2)
    private BigDecimal fixedBudget;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currencyCode = "USD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private PaymentModel paymentModel = PaymentModel.OFF_CHAIN_NEGOTIATED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL)
    private List<Bid> bids = new ArrayList<>();

    @OneToOne
    @JoinColumn(name = "accepted_bid_id")
    private Bid acceptedBid;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<JobSkill> jobSkills = new ArrayList<>();

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<JobAttachment> attachments = new ArrayList<>();

    private String escrowAddress;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime publishedAt;

    @Transient
    public List<Skill> getSkills() {
        return jobSkills.stream()
                .map(JobSkill::getSkill)
                .filter(skill -> skill != null)
                .collect(Collectors.toList());
    }

    @Transient
    public List<JobSkill> getJobSkillTags() {
        return jobSkills;
    }

    public void replaceSkills(List<JobSkill> selections) {
        jobSkills.clear();
        if (selections == null) {
            return;
        }
        selections.forEach(selection -> {
            selection.setJob(this);
            jobSkills.add(selection);
        });
    }

    public enum JobStatus {
        DRAFT,
        OPEN,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    public enum JobScopeSize {
        SMALL,
        MEDIUM,
        LARGE
    }

    public enum ScopeDurationUnit {
        DAY,
        WEEK,
        MONTH,
        YEAR
    }

    public enum JobDuration {
        LESS_THAN_1_MONTH,
        ONE_TO_THREE_MONTHS,
        THREE_TO_SIX_MONTHS,
        MORE_THAN_6_MONTHS
    }

    public enum ExperienceLevel {
        ENTRY,
        INTERMEDIATE,
        EXPERT
    }

    public enum BudgetType {
        HOURLY,
        FIXED,
        NOT_READY
    }

    public enum PaymentModel {
        OFF_CHAIN_NEGOTIATED,
        ON_CHAIN_ESCROW,
        ON_CHAIN_MILESTONE_ESCROW
    }
}
