package com.web3.freelance.service;

import com.web3.freelance.model.Job;
import com.web3.freelance.model.JobSkill;
import com.web3.freelance.model.Skill;
import com.web3.freelance.model.SkillTaxonomyNode;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.JobRepository;
import com.web3.freelance.repository.SkillRepository;
import com.web3.freelance.repository.SkillTaxonomyNodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    private static final Long CLIENT_ID = 1L;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private SkillTaxonomyNodeRepository skillTaxonomyNodeRepository;

    @Mock
    private UserService userService;

    private JobService jobService;
    private User client;
    private SkillTaxonomyNode category;
    private SkillTaxonomyNode specialty;

    @BeforeEach
    void setUp() {
        jobService = new JobService(jobRepository, skillRepository, skillTaxonomyNodeRepository, userService);
        client = User.builder()
                .id(CLIENT_ID)
                .email("client@example.com")
                .username("client")
                .password("password")
                .role(User.UserRole.CLIENT)
                .build();
        category = taxonomyNode(1L, "Development", SkillTaxonomyNode.TaxonomyLevel.CATEGORY, null);
        SkillTaxonomyNode subcategory = taxonomyNode(2L, "Blockchain", SkillTaxonomyNode.TaxonomyLevel.SUBCATEGORY, category);
        specialty = taxonomyNode(3L, "Smart Contracts", SkillTaxonomyNode.TaxonomyLevel.SPECIALTY, subcategory);

        lenient().when(skillTaxonomyNodeRepository.findById(1L)).thenReturn(Optional.of(category));
        lenient().when(skillTaxonomyNodeRepository.findById(3L)).thenReturn(Optional.of(specialty));
    }

    @Test
    void searchFilterKeepsEmptyTaxonomySelectionsEmpty() {
        JobService.TaxonomyFilterIds filterIds = jobService.getTaxonomyFilterIds(
                searchRequest(null, List.of(), List.of())
        );

        assertThat(filterIds.categoryIds()).isEmpty();
        assertThat(filterIds.specialtyIds()).isEmpty();
    }

    @Test
    void searchFilterMapsLegacyCategoryIdToCategorySelection() {
        JobService.TaxonomyFilterIds filterIds = jobService.getTaxonomyFilterIds(
                searchRequest(1L, List.of(), List.of())
        );

        assertThat(filterIds.categoryIds()).containsExactly(1L);
        assertThat(filterIds.specialtyIds()).isEmpty();
    }

    @Test
    void searchFilterKeepsCategoryAndSpecialtySelectionsForOrPredicate() {
        JobService.TaxonomyFilterIds filterIds = jobService.getTaxonomyFilterIds(
                searchRequest(null, List.of(1L, 2L), List.of(10L, 11L))
        );

        assertThat(filterIds.categoryIds()).containsExactly(1L, 2L);
        assertThat(filterIds.specialtyIds()).containsExactly(10L, 11L);
    }

    @Test
    void searchFilterDeduplicatesAndDropsInvalidTaxonomyIds() {
        JobService.TaxonomyFilterIds filterIds = jobService.getTaxonomyFilterIds(
                searchRequest(1L, Arrays.asList(1L, null, 0L, 2L), List.of(10L, 10L, -1L))
        );

        assertThat(filterIds.categoryIds()).containsExactly(1L, 2L);
        assertThat(filterIds.specialtyIds()).containsExactly(10L);
    }

    @Test
    void createJobStoresCustomSkillsOnJobSkillRows() {
        when(userService.getUserById(CLIENT_ID)).thenReturn(client);
        when(skillRepository.findByNormalizedNameInAndIsActiveTrue(List.of("solidity"))).thenReturn(List.of());
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job job = jobService.createJob(CLIENT_ID, createRequest(List.of(), List.of("  Solidity  ")));

        assertThat(job.getSkills()).isEmpty();
        assertThat(job.getJobSkillTags()).hasSize(1);

        JobSkill customSkill = job.getJobSkillTags().get(0);
        assertThat(customSkill.isCustom()).isTrue();
        assertThat(customSkill.getSkill()).isNull();
        assertThat(customSkill.getSkillId()).isNull();
        assertThat(customSkill.getSkillName()).isEqualTo("Solidity");
        assertThat(customSkill.getNormalizedSkillName()).isEqualTo("solidity");
        assertThat(customSkill.getName()).isEqualTo("Solidity");
        assertThat(customSkill.getDisplayOrder()).isEqualTo(1);
    }

    @Test
    void createJobPreservesBuiltInAndCustomSkillOrder() {
        Skill react = skill(10L, "React", "react");

        when(userService.getUserById(CLIENT_ID)).thenReturn(client);
        when(skillRepository.findByIdInAndIsActiveTrue(List.of(10L))).thenReturn(List.of(react));
        when(skillRepository.findByNormalizedNameInAndIsActiveTrue(List.of("smart contracts"))).thenReturn(List.of());
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job job = jobService.createJob(CLIENT_ID, createRequest(List.of(10L), List.of("Smart Contracts")));

        assertThat(job.getSkills()).containsExactly(react);
        assertThat(job.getJobSkillTags()).extracting(JobSkill::getName)
                .containsExactly("React", "Smart Contracts");
        assertThat(job.getJobSkillTags()).extracting(JobSkill::getDisplayOrder)
                .containsExactly(1, 2);
    }

    @Test
    void createJobResolvesKnownSkillNamesAndStoresOnlyUnknownNamesAsCustom() {
        Skill react = skill(10L, "React", "react");
        Skill solidity = skill(11L, "Solidity", "solidity");
        Skill typeScript = skill(12L, "TypeScript", "typescript");
        Skill ethereum = skill(13L, "Ethereum", "ethereum");

        when(userService.getUserById(CLIENT_ID)).thenReturn(client);
        when(skillRepository.findByNormalizedNameInAndIsActiveTrue(List.of(
                "react",
                "solidity",
                "typescript",
                "ethereum",
                "zk proof"
        ))).thenReturn(List.of(react, solidity, typeScript, ethereum));
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job job = jobService.createJob(
                CLIENT_ID,
                createRequest(
                        List.of(),
                        List.of("React", "Solidity", "Typescript", "Ethereum", "ZK Proof")
                )
        );

        assertThat(job.getJobSkillTags()).extracting(JobSkill::getName)
                .containsExactly("React", "Solidity", "TypeScript", "Ethereum", "ZK Proof");
        assertThat(job.getJobSkillTags()).extracting(JobSkill::isCustom)
                .containsExactly(false, false, false, false, true);
        assertThat(job.getJobSkillTags().get(4).getSkillId()).isNull();
        assertThat(job.getJobSkillTags().get(4).getSkillName()).isEqualTo("ZK Proof");
    }

    @Test
    void createJobRejectsDuplicateCustomSkills() {
        when(userService.getUserById(CLIENT_ID)).thenReturn(client);

        assertThatThrownBy(() -> jobService.createJob(
                CLIENT_ID,
                createRequest(List.of(), List.of("Solidity", " solidity "))
        )).hasMessageContaining("Duplicate skills");
    }

    @Test
    void createJobResolvesCustomSkillNameThatMatchesBuiltInSkill() {
        Skill solidity = skill(20L, "Solidity", "solidity");

        when(userService.getUserById(CLIENT_ID)).thenReturn(client);
        when(skillRepository.findByNormalizedNameInAndIsActiveTrue(List.of("solidity"))).thenReturn(List.of(solidity));
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job job = jobService.createJob(
                CLIENT_ID,
                createRequest(List.of(), List.of("Solidity"))
        );

        assertThat(job.getJobSkillTags()).hasSize(1);
        assertThat(job.getJobSkillTags().get(0).isCustom()).isFalse();
        assertThat(job.getJobSkillTags().get(0).getSkill()).isEqualTo(solidity);
        assertThat(job.getJobSkillTags().get(0).getSkillId()).isEqualTo(20L);
        assertThat(job.getJobSkillTags().get(0).getSkillName()).isNull();
        assertThat(job.getJobSkillTags().get(0).getNormalizedSkillName()).isNull();
    }

    @Test
    void createJobRejectsBuiltInSkillSentByIdAndName() {
        Skill solidity = skill(20L, "Solidity", "solidity");

        when(userService.getUserById(CLIENT_ID)).thenReturn(client);
        when(skillRepository.findByIdInAndIsActiveTrue(List.of(20L))).thenReturn(List.of(solidity));
        when(skillRepository.findByNormalizedNameInAndIsActiveTrue(List.of("solidity"))).thenReturn(List.of(solidity));

        assertThatThrownBy(() -> jobService.createJob(
                CLIENT_ID,
                createRequest(List.of(20L), List.of("Solidity"))
        )).hasMessageContaining("Duplicate skills");
    }

    @Test
    void createJobRejectsInvalidBuiltInSkillIds() {
        when(userService.getUserById(CLIENT_ID)).thenReturn(client);
        when(skillRepository.findByIdInAndIsActiveTrue(List.of(10L, 11L)))
                .thenReturn(List.of(skill(10L, "React", "react")));

        assertThatThrownBy(() -> jobService.createJob(
                CLIENT_ID,
                createRequest(List.of(10L, 11L), List.of())
        )).hasMessageContaining("selected skills are invalid");
    }

    @Test
    void createJobRejectsMoreThanTenSkills() {
        when(userService.getUserById(CLIENT_ID)).thenReturn(client);

        assertThatThrownBy(() -> jobService.createJob(
                CLIENT_ID,
                createRequest(List.of(), List.of(
                        "Skill 1",
                        "Skill 2",
                        "Skill 3",
                        "Skill 4",
                        "Skill 5",
                        "Skill 6",
                        "Skill 7",
                        "Skill 8",
                        "Skill 9",
                        "Skill 10",
                        "Skill 11"
                ))
        )).hasMessageContaining("at most 10 skills");
    }

    @Test
    void saveJobDraftCreatesPartialDraftWithoutPublishedAt() {
        when(userService.getUserById(CLIENT_ID)).thenReturn(client);
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job draft = jobService.saveJobDraft(null, CLIENT_ID, emptyDraftRequest());

        assertThat(draft.getStatus()).isEqualTo(Job.JobStatus.DRAFT);
        assertThat(draft.getPublishedAt()).isNull();
        assertThat(draft.getTitle()).isEmpty();
        assertThat(draft.getDescription()).isEmpty();
        assertThat(draft.getDraftStep()).isEqualTo(Job.DraftStep.SKILLS);
        assertThat(draft.getClient()).isEqualTo(client);
    }

    @Test
    void saveJobDraftUpdatesDraftFieldsAndSkills() {
        Job existingDraft = existingJob();
        existingDraft.setStatus(Job.JobStatus.DRAFT);
        Skill react = skill(10L, "React", "react");

        when(userService.getUserById(CLIENT_ID)).thenReturn(client);
        when(jobRepository.findById(99L)).thenReturn(Optional.of(existingDraft));
        when(skillRepository.findByIdInAndIsActiveTrue(List.of(10L))).thenReturn(List.of(react));
        when(skillRepository.findByNormalizedNameInAndIsActiveTrue(List.of("technical writing"))).thenReturn(List.of());
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job draft = jobService.saveJobDraft(
                99L,
                CLIENT_ID,
                draftRequest(List.of(10L), List.of("Technical Writing"))
        );

        assertThat(draft.getStatus()).isEqualTo(Job.JobStatus.DRAFT);
        assertThat(draft.getTitle()).isEqualTo("Draft job");
        assertThat(draft.getDescription()).contains("partially saved");
        assertThat(draft.getCategory()).isEqualTo(category);
        assertThat(draft.getSpecialty()).isEqualTo(specialty);
        assertThat(draft.getBudgetType()).isEqualTo(Job.BudgetType.FIXED);
        assertThat(draft.getFixedBudget()).isEqualByComparingTo("1500.00");
        assertThat(draft.getDraftStep()).isEqualTo(Job.DraftStep.DETAILS);
        assertThat(draft.getJobSkillTags()).extracting(JobSkill::getName)
                .containsExactly("React", "Technical Writing");
    }

    @Test
    void saveJobDraftFlushesExistingSkillRowsBeforeReplacingDraftSkills() {
        Job existingDraft = existingJob();
        existingDraft.setStatus(Job.JobStatus.DRAFT);
        existingDraft.replaceSkills(List.of(JobSkill.builder()
                .id(501L)
                .skill(skill(9L, "Old Skill", "old-skill"))
                .displayOrder(1)
                .build()));
        Skill react = skill(10L, "React", "react");

        when(userService.getUserById(CLIENT_ID)).thenReturn(client);
        when(jobRepository.findById(99L)).thenReturn(Optional.of(existingDraft));
        when(skillRepository.findByIdInAndIsActiveTrue(List.of(10L))).thenReturn(List.of(react));
        when(skillRepository.findByNormalizedNameInAndIsActiveTrue(List.of("technical writing"))).thenReturn(List.of());
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job draft = jobService.saveJobDraft(
                99L,
                CLIENT_ID,
                draftRequest(List.of(10L), List.of("Technical Writing"))
        );

        var jobRepositoryCalls = inOrder(jobRepository);
        jobRepositoryCalls.verify(jobRepository).flush();
        jobRepositoryCalls.verify(jobRepository).save(existingDraft);
        assertThat(draft.getJobSkillTags()).extracting(JobSkill::getName)
                .containsExactly("React", "Technical Writing");
    }

    @Test
    void publishJobPublishesOwnedDraftAfterValidation() {
        Job existingDraft = existingJob();
        existingDraft.setStatus(Job.JobStatus.DRAFT);

        when(userService.getUserById(CLIENT_ID)).thenReturn(client);
        when(jobRepository.findById(99L)).thenReturn(Optional.of(existingDraft));
        when(skillRepository.findByNormalizedNameInAndIsActiveTrue(List.of("solidity"))).thenReturn(List.of());
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job publishedJob = jobService.publishJob(
                99L,
                CLIENT_ID,
                createRequest(List.of(), List.of("Solidity"))
        );

        assertThat(publishedJob.getStatus()).isEqualTo(Job.JobStatus.OPEN);
        assertThat(publishedJob.getPublishedAt()).isNotNull();
        assertThat(publishedJob.getCategory()).isEqualTo(category);
        assertThat(publishedJob.getSpecialty()).isEqualTo(specialty);
        assertThat(publishedJob.getDraftStep()).isNull();
    }

    @Test
    void cancelJobSoftDeletesOwnedJob() {
        Job existingDraft = existingJob();

        when(jobRepository.findById(99L)).thenReturn(Optional.of(existingDraft));
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job cancelledJob = jobService.cancelJob(99L, CLIENT_ID);

        assertThat(cancelledJob.getStatus()).isEqualTo(Job.JobStatus.CANCELLED);
        assertThat(cancelledJob.getDraftStep()).isNull();
    }

    @Test
    void updateJobReplacesBuiltInAndCustomSkillsTogether() {
        Job existingJob = existingJob();
        Skill react = skill(10L, "React", "react");

        when(jobRepository.findById(99L)).thenReturn(Optional.of(existingJob));
        when(skillRepository.findByIdInAndIsActiveTrue(List.of(10L))).thenReturn(List.of(react));
        when(skillRepository.findByNormalizedNameInAndIsActiveTrue(List.of("technical writing"))).thenReturn(List.of());
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job updatedJob = jobService.updateJob(
                99L,
                CLIENT_ID,
                updateSkillsRequest(List.of(10L), List.of("Technical Writing"))
        );

        assertThat(updatedJob.getJobSkillTags()).extracting(JobSkill::getName)
                .containsExactly("React", "Technical Writing");
        assertThat(updatedJob.getSkills()).containsExactly(react);
    }

    private JobService.CreateJobRequest createRequest(List<Long> skillIds, List<String> customSkillNames) {
        return new JobService.CreateJobRequest(
                "Build a smart contract escrow",
                "We need a reliable engineer to build and test a smart contract escrow workflow for freelance jobs.",
                1L,
                3L,
                skillIds,
                customSkillNames,
                Job.JobScopeSize.MEDIUM,
                1,
                Job.ScopeDurationUnit.MONTH,
                Job.ExperienceLevel.INTERMEDIATE,
                false,
                Job.BudgetType.HOURLY,
                BigDecimal.valueOf(25),
                BigDecimal.valueOf(50),
                null,
                "USD",
                Job.PaymentModel.OFF_CHAIN_NEGOTIATED
        );
    }

    private JobService.UpdateJobRequest updateSkillsRequest(List<Long> skillIds, List<String> customSkillNames) {
        return new JobService.UpdateJobRequest(
                null,
                null,
                null,
                null,
                false,
                false,
                skillIds,
                customSkillNames,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                false,
                false,
                false,
                null,
                null,
                null
        );
    }

    private Job existingJob() {
        return Job.builder()
                .id(99L)
                .title("Existing job")
                .description("Existing job description that is long enough to pass validation if it is checked.")
                .scopeSize(Job.JobScopeSize.MEDIUM)
                .scopeDurationAmount(1)
                .scopeDurationUnit(Job.ScopeDurationUnit.MONTH)
                .scopeDurationDays(30)
                .scopeDuration(Job.JobDuration.ONE_TO_THREE_MONTHS)
                .experienceLevel(Job.ExperienceLevel.INTERMEDIATE)
                .contractToHire(false)
                .budgetType(Job.BudgetType.HOURLY)
                .hourlyRateMin(BigDecimal.valueOf(25))
                .hourlyRateMax(BigDecimal.valueOf(50))
                .currencyCode("USD")
                .paymentModel(Job.PaymentModel.OFF_CHAIN_NEGOTIATED)
                .category(category)
                .specialty(specialty)
                .client(client)
                .build();
    }

    private JobService.SaveJobDraftRequest emptyDraftRequest() {
        return new JobService.SaveJobDraftRequest(
                "",
                "",
                null,
                null,
                true,
                true,
                List.of(),
                List.of(),
                true,
                Job.DraftStep.SKILLS,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                true,
                true,
                true,
                null,
                null
        );
    }

    private JobService.SaveJobDraftRequest draftRequest(List<Long> skillIds, List<String> customSkillNames) {
        return new JobService.SaveJobDraftRequest(
                "Draft job",
                "This is a partially saved draft with enough context for later editing.",
                1L,
                3L,
                false,
                false,
                skillIds,
                customSkillNames,
                true,
                Job.DraftStep.DETAILS,
                Job.JobScopeSize.LARGE,
                2,
                Job.ScopeDurationUnit.MONTH,
                Job.ExperienceLevel.EXPERT,
                true,
                Job.BudgetType.FIXED,
                null,
                null,
                BigDecimal.valueOf(1500),
                true,
                true,
                false,
                "USD",
                Job.PaymentModel.ON_CHAIN_ESCROW
        );
    }

    private Skill skill(Long id, String name, String normalizedName) {
        return Skill.builder()
                .id(id)
                .name(name)
                .slug(normalizedName.replace(" ", "-"))
                .normalizedName(normalizedName)
                .isActive(true)
                .isVerified(true)
                .build();
    }

    private JobService.SearchJobsRequest searchRequest(
            Long legacyCategoryId,
            List<Long> categoryIds,
            List<Long> specialtyIds
    ) {
        return new JobService.SearchJobsRequest(
                Job.JobStatus.OPEN,
                null,
                legacyCategoryId,
                categoryIds,
                specialtyIds,
                List.of(),
                List.of(),
                0,
                10,
                JobService.JobSort.BEST_MATCH
        );
    }

    private SkillTaxonomyNode taxonomyNode(
            Long id,
            String name,
            SkillTaxonomyNode.TaxonomyLevel level,
            SkillTaxonomyNode parent
    ) {
        return SkillTaxonomyNode.builder()
                .id(id)
                .name(name)
                .slug(name.toLowerCase().replace(" ", "-"))
                .normalizedName(name.toLowerCase())
                .level(level)
                .parent(parent)
                .isActive(true)
                .build();
    }
}
