package com.web3.freelance.service;

import com.web3.freelance.model.Job;
import com.web3.freelance.model.SavedJob;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.JobRepository;
import com.web3.freelance.repository.SavedJobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SavedJobServiceTest {

    private static final Long FREELANCER_ID = 2L;
    private static final Long JOB_ID = 10L;

    @Mock
    private SavedJobRepository savedJobRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserService userService;

    private SavedJobService savedJobService;
    private User freelancer;
    private Job job;

    @BeforeEach
    void setUp() {
        savedJobService = new SavedJobService(savedJobRepository, jobRepository, userService);
        freelancer = User.builder()
                .id(FREELANCER_ID)
                .email("freelancer@example.com")
                .username("freelancer")
                .role(User.UserRole.FREELANCER)
                .build();
        job = Job.builder()
                .id(JOB_ID)
                .title("Audit")
                .description("A smart contract audit job with enough detail.")
                .status(Job.JobStatus.OPEN)
                .build();
    }

    @Test
    void saveJobRejectsJobsThatAreNotOpen() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        when(userService.getUserById(FREELANCER_ID)).thenReturn(freelancer);
        when(jobRepository.findById(JOB_ID)).thenReturn(Optional.of(job));

        assertThatThrownBy(() -> savedJobService.saveJob(FREELANCER_ID, JOB_ID))
                .hasMessageContaining("Only open jobs can be saved");
        verify(savedJobRepository, never()).save(any(SavedJob.class));
    }

    @Test
    void unsaveJobRemovesBookmarkEvenWhenJobIsNoLongerOpen() {
        job.setStatus(Job.JobStatus.IN_PROGRESS);
        when(userService.getUserById(FREELANCER_ID)).thenReturn(freelancer);
        when(jobRepository.findById(JOB_ID)).thenReturn(Optional.of(job));

        Job unsaved = savedJobService.unsaveJob(FREELANCER_ID, JOB_ID);

        verify(savedJobRepository).deleteByFreelancerAndJob(freelancer, job);
        assertThat(unsaved.getId()).isEqualTo(JOB_ID);
    }
}
