package com.web3.freelance.repository;

import com.web3.freelance.model.Skill;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {

    List<Skill> findByIdInAndIsActiveTrue(List<Long> ids);

    boolean existsByNormalizedName(String normalizedName);

    List<Skill> findByNormalizedNameInAndIsActiveTrue(List<String> normalizedNames);

    @Query("""
            select s from Skill s
            where s.isActive = true
              and (
                lower(s.name) like lower(concat('%', :query, '%'))
                or lower(s.slug) like lower(concat('%', :query, '%'))
              )
            order by
              case when lower(s.name) = lower(:query) then 0 else 1 end,
              s.isVerified desc,
              s.name asc
            """)
    List<Skill> searchActive(@Param("query") String query, Pageable pageable);

    List<Skill> findByIsActiveTrueOrderByNameAsc(Pageable pageable);
}
