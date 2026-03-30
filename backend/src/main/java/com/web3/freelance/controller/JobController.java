package com.web3.freelance.controller;

import com.web3.freelance.model.Job;
import com.web3.freelance.model.User;
import com.web3.freelance.service.JobService;
import com.web3.freelance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final UserService userService;

    @QueryMapping
    public List<Job> jobs(
            @Argument Job.JobStatus status,
            @Argument Integer limit,
            @Argument Integer offset
    ) {
        return jobService.getJobs(status, limit, offset);
    }

    @QueryMapping
    public Job job(@Argument Long id) {
        return jobService.getJobById(id);
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Job> myJobs(Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return jobService.getMyJobs(currentUser.getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Job createJob(@Argument Map<String, Object> input, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());

        JobService.CreateJobRequest request = new JobService.CreateJobRequest(
                (String) input.get("title"),
                (String) input.get("description"),
                ((Number) input.get("budget")).doubleValue()
        );

        return jobService.createJob(currentUser.getId(), request);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Job updateJob(@Argument Long id, @Argument Map<String, Object> input, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());

        JobService.UpdateJobRequest request = new JobService.UpdateJobRequest(
                (String) input.get("title"),
                (String) input.get("description"),
                input.get("budget") != null ? ((Number) input.get("budget")).doubleValue() : null,
                input.get("status") != null ? Job.JobStatus.valueOf((String) input.get("status")) : null
        );

        return jobService.updateJob(id, currentUser.getId(), request);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Job cancelJob(@Argument Long id, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return jobService.cancelJob(id, currentUser.getId());
    }
}
