package com.web3.freelance.repository;

import com.web3.freelance.model.Job;
import com.web3.freelance.model.SavedJob;
import com.web3.freelance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    boolean existsByFreelancerAndJob(User freelancer, Job job);

    void deleteByFreelancerAndJob(User freelancer, Job job);

    @Query("""
            select sj.job
            from SavedJob sj
            where sj.freelancer = :freelancer
            order by sj.createdAt desc
            """)
    List<Job> findJobsByFreelancerOrderByCreatedAtDesc(@Param("freelancer") User freelancer);

    @Query("""
            select sj.job.id
            from SavedJob sj
            where sj.freelancer = :freelancer
            """)
    List<Long> findJobIdsByFreelancer(@Param("freelancer") User freelancer);
}
