package com.web3.freelance.service;

import com.web3.freelance.model.Skill;
import com.web3.freelance.model.SkillTaxonomyNode;
import com.web3.freelance.repository.SkillRepository;
import com.web3.freelance.repository.SkillTaxonomyNodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;
    private final SkillTaxonomyNodeRepository skillTaxonomyNodeRepository;

    public List<Skill> searchSkills(String query, Integer limit) {
        Pageable pageable = PageRequest.of(0, limit != null ? Math.min(limit, 20) : 10);

        if (query == null || query.isBlank()) {
            return skillRepository.findByIsActiveTrueOrderByNameAsc(pageable);
        }

        return skillRepository.searchActive(query.trim(), pageable);
    }

    public List<SkillTaxonomyNode> getTaxonomyNodes() {
        return skillTaxonomyNodeRepository.findByIsActiveTrueOrderByLevelAscDisplayOrderAscNameAsc();
    }
}
