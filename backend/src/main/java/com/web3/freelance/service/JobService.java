package com.web3.freelance.service;

import com.web3.freelance.model.Job;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final UserService userService;

    public Job getJobById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));
    }

    public List<Job> getJobs(Job.JobStatus status, Integer limit, Integer offset) {
        Pageable pageable = PageRequest.of(
                offset != null ? offset / (limit != null ? limit : 10) : 0,
                limit != null ? limit : 10
        );

        if (status != null) {
            return jobRepository.findByStatus(status, pageable);
        }
        return jobRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public List<Job> getMyJobs(Long userId) {
        User user = userService.getUserById(userId);
        return jobRepository.findByClient(user);
    }

    @Transactional
    public Job createJob(Long clientId, CreateJobRequest request) {
        User client = userService.getUserById(clientId);

        if (client.getRole() != User.UserRole.CLIENT) {
            throw new RuntimeException("Only clients can create jobs");
        }

        Job job = Job.builder()
                .title(request.title())
                .description(request.description())
                .budget(request.budget())
                .status(Job.JobStatus.OPEN)
                .client(client)
                .build();

        return jobRepository.save(job);
    }

    @Transactional
    public Job updateJob(Long jobId, Long clientId, UpdateJobRequest request) {
        Job job = getJobById(jobId);

        if (!job.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Only job owner can update the job");
        }

        if (request.title() != null) {
            job.setTitle(request.title());
        }
        if (request.description() != null) {
            job.setDescription(request.description());
        }
        if (request.budget() != null) {
            job.setBudget(request.budget());
        }
        if (request.status() != null) {
            job.setStatus(request.status());
        }

        return jobRepository.save(job);
    }

    @Transactional
    public Job cancelJob(Long jobId, Long clientId) {
        Job job = getJobById(jobId);

        if (!job.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Only job owner can cancel the job");
        }

        job.setStatus(Job.JobStatus.CANCELLED);
        return jobRepository.save(job);
    }

    public record CreateJobRequest(String title, String description, Double budget) {}

    public record UpdateJobRequest(String title, String description, Double budget, Job.JobStatus status) {}
}
