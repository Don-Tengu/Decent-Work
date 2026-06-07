package com.web3.freelance.repository;

import com.web3.freelance.model.Job;
import com.web3.freelance.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    List<Job> findByStatus(Job.JobStatus status, Pageable pageable);

    List<Job> findByClientOrderByCreatedAtDesc(User client);

    List<Job> findByClientAndStatusInOrderByCreatedAtDesc(User client, List<Job.JobStatus> statuses);

    List<Job> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
