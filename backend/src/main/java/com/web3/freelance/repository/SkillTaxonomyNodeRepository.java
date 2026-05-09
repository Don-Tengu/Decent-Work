package com.web3.freelance.repository;

import com.web3.freelance.model.SkillTaxonomyNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillTaxonomyNodeRepository extends JpaRepository<SkillTaxonomyNode, Long> {

    List<SkillTaxonomyNode> findByIsActiveTrueOrderByLevelAscDisplayOrderAscNameAsc();

    List<SkillTaxonomyNode> findByParentIdAndIsActiveTrueOrderByDisplayOrderAscNameAsc(Long parentId);
}
