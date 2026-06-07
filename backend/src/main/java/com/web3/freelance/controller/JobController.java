package com.web3.freelance.controller;

import com.web3.freelance.model.Job;
import com.web3.freelance.model.Skill;
import com.web3.freelance.model.SkillTaxonomyNode;
import com.web3.freelance.model.User;
import com.web3.freelance.service.JobService;
import com.web3.freelance.service.SavedJobService;
import com.web3.freelance.service.SkillService;
import com.web3.freelance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final SavedJobService savedJobService;
    private final SkillService skillService;
    private final UserService userService;

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Job> jobs(
            @Argument Job.JobStatus status,
            @Argument Integer limit,
            @Argument Integer offset
    ) {
        return jobService.getJobs(status, limit, offset);
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public JobService.JobSearchResult jobsPage(
            @Argument Job.JobStatus status,
            @Argument String query,
            @Argument Long categoryId,
            @Argument List<Long> categoryIds,
            @Argument List<Long> specialtyIds,
            @Argument List<Job.ExperienceLevel> experienceLevels,
            @Argument List<Job.BudgetType> budgetTypes,
            @Argument Integer page,
            @Argument Integer size,
            @Argument JobService.JobSort sort
    ) {
        return jobService.getJobsPage(new JobService.SearchJobsRequest(
                status,
                query,
                categoryId,
                categoryIds,
                specialtyIds,
                experienceLevels,
                budgetTypes,
                page,
                size,
                sort
        ));
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public Job job(@Argument Long id) {
        return jobService.getJobById(id);
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Job> myJobs(@Argument List<Job.JobStatus> statuses, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return jobService.getMyJobs(currentUser.getId(), statuses);
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Job> mySavedJobs(Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return savedJobService.getSavedJobs(currentUser.getId());
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Long> savedJobIds(Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return savedJobService.getSavedJobIds(currentUser.getId());
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Skill> skills(@Argument String query, @Argument Integer limit) {
        return skillService.searchSkills(query, limit);
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<SkillTaxonomyNode> skillTaxonomy() {
        return skillService.getTaxonomyNodes();
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Job createJob(@Argument Map<String, Object> input, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return jobService.createJob(currentUser.getId(), readCreateJobRequest(input));
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Job publishJob(@Argument Long id, @Argument Map<String, Object> input, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return jobService.publishJob(id, currentUser.getId(), readCreateJobRequest(input));
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Job saveJobDraft(@Argument Long id, @Argument Map<String, Object> input, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());

        JobService.SaveJobDraftRequest request = new JobService.SaveJobDraftRequest(
                (String) input.get("title"),
                (String) input.get("description"),
                readLong(input.get("categoryId")),
                readLong(input.get("specialtyId")),
                input.containsKey("categoryId") && input.get("categoryId") == null,
                input.containsKey("specialtyId") && input.get("specialtyId") == null,
                input.containsKey("skillIds") ? readLongList(input.get("skillIds")) : null,
                input.containsKey("customSkillNames") ? readStringList(input.get("customSkillNames")) : null,
                input.containsKey("skillIds") || input.containsKey("customSkillNames"),
                readEnum(input.get("draftStep"), Job.DraftStep.class),
                readEnum(input.get("scopeSize"), Job.JobScopeSize.class),
                readInteger(input.get("scopeDurationAmount")),
                readEnum(input.get("scopeDurationUnit"), Job.ScopeDurationUnit.class),
                readEnum(input.get("experienceLevel"), Job.ExperienceLevel.class),
                input.containsKey("contractToHire") ? (Boolean) input.get("contractToHire") : null,
                readEnum(input.get("budgetType"), Job.BudgetType.class),
                readBigDecimal(input.get("hourlyRateMin")),
                readBigDecimal(input.get("hourlyRateMax")),
                readBigDecimal(input.get("fixedBudget")),
                input.containsKey("hourlyRateMin") && input.get("hourlyRateMin") == null,
                input.containsKey("hourlyRateMax") && input.get("hourlyRateMax") == null,
                input.containsKey("fixedBudget") && input.get("fixedBudget") == null,
                (String) input.get("currencyCode"),
                readEnum(input.get("paymentModel"), Job.PaymentModel.class)
        );

        return jobService.saveJobDraft(id, currentUser.getId(), request);
    }

    private JobService.CreateJobRequest readCreateJobRequest(Map<String, Object> input) {
        return new JobService.CreateJobRequest(
                (String) input.get("title"),
                (String) input.get("description"),
                readLong(input.get("categoryId")),
                readLong(input.get("specialtyId")),
                readLongList(input.get("skillIds")),
                readStringList(input.get("customSkillNames")),
                readEnum(input.get("scopeSize"), Job.JobScopeSize.class),
                readInteger(input.get("scopeDurationAmount")),
                readEnum(input.get("scopeDurationUnit"), Job.ScopeDurationUnit.class),
                readEnum(input.get("experienceLevel"), Job.ExperienceLevel.class),
                (Boolean) input.get("contractToHire"),
                readEnum(input.get("budgetType"), Job.BudgetType.class),
                readBigDecimal(input.get("hourlyRateMin")),
                readBigDecimal(input.get("hourlyRateMax")),
                readBigDecimal(input.get("fixedBudget")),
                (String) input.get("currencyCode"),
                readEnum(input.get("paymentModel"), Job.PaymentModel.class)
        );
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Job updateJob(@Argument Long id, @Argument Map<String, Object> input, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());

        JobService.UpdateJobRequest request = new JobService.UpdateJobRequest(
                (String) input.get("title"),
                (String) input.get("description"),
                readLong(input.get("categoryId")),
                readLong(input.get("specialtyId")),
                input.containsKey("categoryId") && input.get("categoryId") == null,
                input.containsKey("specialtyId") && input.get("specialtyId") == null,
                input.containsKey("skillIds") ? readLongList(input.get("skillIds")) : null,
                input.containsKey("customSkillNames") ? readStringList(input.get("customSkillNames")) : null,
                readEnum(input.get("scopeSize"), Job.JobScopeSize.class),
                readInteger(input.get("scopeDurationAmount")),
                readEnum(input.get("scopeDurationUnit"), Job.ScopeDurationUnit.class),
                readEnum(input.get("experienceLevel"), Job.ExperienceLevel.class),
                input.containsKey("contractToHire") ? (Boolean) input.get("contractToHire") : null,
                readEnum(input.get("budgetType"), Job.BudgetType.class),
                readBigDecimal(input.get("hourlyRateMin")),
                readBigDecimal(input.get("hourlyRateMax")),
                readBigDecimal(input.get("fixedBudget")),
                input.containsKey("hourlyRateMin") && input.get("hourlyRateMin") == null,
                input.containsKey("hourlyRateMax") && input.get("hourlyRateMax") == null,
                input.containsKey("fixedBudget") && input.get("fixedBudget") == null,
                (String) input.get("currencyCode"),
                readEnum(input.get("paymentModel"), Job.PaymentModel.class),
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

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Job saveJob(@Argument Long id, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return savedJobService.saveJob(currentUser.getId(), id);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Job unsaveJob(@Argument Long id, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return savedJobService.unsaveJob(currentUser.getId(), id);
    }

    private BigDecimal readBigDecimal(Object value) {
        return value == null ? null : new BigDecimal(value.toString());
    }

    private Integer readInteger(Object value) {
        return value == null ? null : Integer.valueOf(value.toString());
    }

    private Long readLong(Object value) {
        return value == null ? null : Long.valueOf(value.toString());
    }

    private List<Long> readLongList(Object value) {
        if (value == null) {
            return null;
        }
        List<?> raw = (List<?>) value;
        return raw.stream()
                .map(item -> Long.valueOf(item.toString()))
                .collect(Collectors.toList());
    }

    private List<String> readStringList(Object value) {
        if (value == null) {
            return null;
        }
        List<?> raw = (List<?>) value;
        return raw.stream()
                .map(Object::toString)
                .collect(Collectors.toList());
    }

    private <E extends Enum<E>> E readEnum(Object value, Class<E> enumType) {
        if (value == null) {
            return null;
        }
        return Enum.valueOf(enumType, value.toString());
    }
}
