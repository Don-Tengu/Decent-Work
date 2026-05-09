package com.web3.freelance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "job_skills",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_job_skills_job_order", columnNames = {"job_id", "display_order"})
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id")
    private Skill skill;

    @Column(length = 100)
    private String skillName;

    @Column(length = 100)
    private String normalizedSkillName;

    @Column(nullable = false)
    private Integer displayOrder;

    @Transient
    public Long getSkillId() {
        return skill != null ? skill.getId() : null;
    }

    @Transient
    public String getName() {
        return skill != null ? skill.getName() : skillName;
    }

    @Transient
    public boolean isCustom() {
        return skill == null;
    }
}
