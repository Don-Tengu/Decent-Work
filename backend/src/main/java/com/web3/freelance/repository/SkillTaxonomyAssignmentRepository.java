package com.web3.freelance.repository;

import com.web3.freelance.model.SkillTaxonomyAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillTaxonomyAssignmentRepository extends JpaRepository<SkillTaxonomyAssignment, Long> {

    List<SkillTaxonomyAssignment> findByTaxonomyNodeIdIn(List<Long> taxonomyNodeIds);
}
