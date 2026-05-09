package com.web3.freelance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "skill_taxonomy_assignments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_skill_taxonomy_assignments_node_skill", columnNames = {"taxonomy_node_id", "skill_id"})
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillTaxonomyAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxonomy_node_id", nullable = false)
    private SkillTaxonomyNode taxonomyNode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;
}
