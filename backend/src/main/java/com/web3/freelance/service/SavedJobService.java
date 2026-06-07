package com.web3.freelance.service;

import com.web3.freelance.model.Job;
import com.web3.freelance.model.SavedJob;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.JobRepository;
import com.web3.freelance.repository.SavedJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SavedJobService {

    private final SavedJobRepository savedJobRepository;
    private final JobRepository jobRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<Job> getSavedJobs(Long freelancerId) {
        User freelancer = getFreelancer(freelancerId);
        return savedJobRepository.findJobsByFreelancerOrderByCreatedAtDesc(freelancer);
    }

    @Transactional(readOnly = true)
    public List<Long> getSavedJobIds(Long freelancerId) {
        User freelancer = getFreelancer(freelancerId);
        return savedJobRepository.findJobIdsByFreelancer(freelancer);
    }

    @Transactional
    public Job saveJob(Long freelancerId, Long jobId) {
        User freelancer = getFreelancer(freelancerId);
        Job job = getOpenJob(jobId);

        if (!savedJobRepository.existsByFreelancerAndJob(freelancer, job)) {
            savedJobRepository.save(SavedJob.builder()
                    .freelancer(freelancer)
                    .job(job)
                    .build());
        }

        return job;
    }

    @Transactional
    public Job unsaveJob(Long freelancerId, Long jobId) {
        User freelancer = getFreelancer(freelancerId);
        Job job = getOpenJob(jobId);
        savedJobRepository.deleteByFreelancerAndJob(freelancer, job);
        return job;
    }

    private User getFreelancer(Long userId) {
        User user = userService.getUserById(userId);

        if (user.getRole() != User.UserRole.FREELANCER) {
            throw new RuntimeException("Only freelancers can save jobs");
        }

        return user;
    }

    private Job getOpenJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        if (job.getStatus() != Job.JobStatus.OPEN) {
            throw new RuntimeException("Only open jobs can be saved");
        }

        return job;
    }
}
