package com.web3.freelance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "skill_taxonomy_nodes",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_skill_taxonomy_nodes_slug", columnNames = "slug"),
                @UniqueConstraint(name = "uk_skill_taxonomy_nodes_normalized_name", columnNames = "normalized_name")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class SkillTaxonomyNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 120)
    private String slug;

    @Column(nullable = false, length = 100)
    private String normalizedName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TaxonomyLevel level;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private SkillTaxonomyNode parent;

    @OneToMany(mappedBy = "parent")
    @Builder.Default
    private List<SkillTaxonomyNode> children = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum TaxonomyLevel {
        CATEGORY,
        SUBCATEGORY,
        SPECIALTY
    }
}
