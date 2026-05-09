package com.web3.freelance.repository;

import com.web3.freelance.model.JobAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JobAttachmentRepository extends JpaRepository<JobAttachment, Long> {

    Optional<JobAttachment> findByIdAndJobId(Long id, Long jobId);
}
