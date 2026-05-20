package com.web3.freelance.service;

import com.web3.freelance.model.Job;
import com.web3.freelance.model.JobSkill;
import com.web3.freelance.model.Skill;
import com.web3.freelance.model.SkillTaxonomyNode;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.JobRepository;
import com.web3.freelance.repository.SkillRepository;
import com.web3.freelance.repository.SkillTaxonomyNodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class JobService {
    private static final int MIN_DESCRIPTION_LENGTH = 50;
    private static final int MAX_DESCRIPTION_LENGTH = 50000;

    private final JobRepository jobRepository;
    private final SkillRepository skillRepository;
    private final SkillTaxonomyNodeRepository skillTaxonomyNodeRepository;
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

    public List<Job> getMyJobs(Long userId, List<Job.JobStatus> statuses) {
        User user = userService.getUserById(userId);
        if (statuses != null && !statuses.isEmpty()) {
            return jobRepository.findByClientAndStatusInOrderByCreatedAtDesc(user, statuses);
        }
        return jobRepository.findByClientOrderByCreatedAtDesc(user);
    }

    @Transactional
    public Job createJob(Long clientId, CreateJobRequest request) {
        return publishJob(null, clientId, request);
    }

    @Transactional
    public Job publishJob(Long jobId, Long clientId, CreateJobRequest request) {
        User client = getClientUser(clientId);
        Job job = jobId == null ? newPublishableJob(client) : getOwnedJob(jobId, clientId);

        if (jobId != null && job.getStatus() != Job.JobStatus.DRAFT) {
            throw new RuntimeException("Only draft jobs can be published through this operation");
        }

        validateTitle(request.title());
        validateDescription(request.description());
        SkillTaxonomyNode category = validateTaxonomyNode(
                request.categoryId(),
                SkillTaxonomyNode.TaxonomyLevel.CATEGORY,
                "Category"
        );
        SkillTaxonomyNode specialty = validateTaxonomyNode(
                request.specialtyId(),
                SkillTaxonomyNode.TaxonomyLevel.SPECIALTY,
                "Specialty"
        );
        validateCategorySpecialty(category, specialty);
        int scopeDurationDays = validateScopeAndGetDays(
                request.scopeSize(),
                request.scopeDurationAmount(),
                request.scopeDurationUnit()
        );
        validateBudget(request.budgetType(), request.hourlyRateMin(), request.hourlyRateMax(), request.fixedBudget());

        job.setTitle(request.title().trim());
        job.setDescription(request.description().trim());
        job.setCategory(category);
        job.setSpecialty(specialty);
        job.setScopeSize(request.scopeSize());
        job.setScopeDuration(toLegacyDuration(scopeDurationDays));
        job.setScopeDurationAmount(request.scopeDurationAmount());
        job.setScopeDurationUnit(request.scopeDurationUnit());
        job.setScopeDurationDays(scopeDurationDays);
        job.setExperienceLevel(request.experienceLevel());
        job.setContractToHire(Boolean.TRUE.equals(request.contractToHire()));
        job.setBudgetType(request.budgetType());
        job.setHourlyRateMin(normalizeMoney(request.hourlyRateMin()));
        job.setHourlyRateMax(normalizeMoney(request.hourlyRateMax()));
        job.setFixedBudget(normalizeMoney(request.fixedBudget()));
        job.setCurrencyCode(normalizeCurrency(request.currencyCode()));
        job.setPaymentModel(request.paymentModel() != null ? request.paymentModel() : Job.PaymentModel.OFF_CHAIN_NEGOTIATED);
        job.setDraftStep(null);
        job.setStatus(Job.JobStatus.OPEN);
        job.setClient(client);
        job.setPublishedAt(LocalDateTime.now());

        replaceJobSkills(job, buildJobSkills(job, request.skillIds(), request.customSkillNames(), true));
        return jobRepository.save(job);
    }

    @Transactional
    public Job saveJobDraft(Long jobId, Long clientId, SaveJobDraftRequest request) {
        User client = getClientUser(clientId);
        Job job = jobId == null ? newDraftJob(client) : getOwnedJob(jobId, clientId);

        if (job.getStatus() != Job.JobStatus.DRAFT) {
            throw new RuntimeException("Only draft jobs can be saved as drafts");
        }

        applyDraftRequest(job, request);
        return jobRepository.save(job);
    }

    @Transactional
    public Job updateJob(Long jobId, Long clientId, UpdateJobRequest request) {
        Job job = getJobById(jobId);

        if (!job.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Only job owner can update the job");
        }

        if (request.title() != null) {
            validateTitle(request.title());
            job.setTitle(request.title());
        }
        if (request.description() != null) {
            validateDescription(request.description());
            job.setDescription(request.description());
        }
        if (request.categoryId() != null || request.clearCategory()) {
            job.setCategory(request.clearCategory() ? null : validateTaxonomyNode(
                    request.categoryId(),
                    SkillTaxonomyNode.TaxonomyLevel.CATEGORY,
                    "Category"
            ));
        }
        if (request.specialtyId() != null || request.clearSpecialty()) {
            job.setSpecialty(request.clearSpecialty() ? null : validateTaxonomyNode(
                    request.specialtyId(),
                    SkillTaxonomyNode.TaxonomyLevel.SPECIALTY,
                    "Specialty"
            ));
        }
        if (request.scopeSize() != null) {
            job.setScopeSize(request.scopeSize());
        }
        if (request.scopeDurationAmount() != null) {
            job.setScopeDurationAmount(request.scopeDurationAmount());
        }
        if (request.scopeDurationUnit() != null) {
            job.setScopeDurationUnit(request.scopeDurationUnit());
        }
        if (request.experienceLevel() != null) {
            job.setExperienceLevel(request.experienceLevel());
        }
        if (request.contractToHire() != null) {
            job.setContractToHire(request.contractToHire());
        }
        if (request.budgetType() != null) {
            job.setBudgetType(request.budgetType());
        }
        if (request.hourlyRateMin() != null || request.clearHourlyRateMin()) {
            job.setHourlyRateMin(request.clearHourlyRateMin() ? null : normalizeMoney(request.hourlyRateMin()));
        }
        if (request.hourlyRateMax() != null || request.clearHourlyRateMax()) {
            job.setHourlyRateMax(request.clearHourlyRateMax() ? null : normalizeMoney(request.hourlyRateMax()));
        }
        if (request.fixedBudget() != null || request.clearFixedBudget()) {
            job.setFixedBudget(request.clearFixedBudget() ? null : normalizeMoney(request.fixedBudget()));
        }
        if (request.currencyCode() != null) {
            job.setCurrencyCode(normalizeCurrency(request.currencyCode()));
        }
        if (request.paymentModel() != null) {
            job.setPaymentModel(request.paymentModel());
        }
        if (request.skillIds() != null || request.customSkillNames() != null) {
            replaceJobSkills(job, buildJobSkills(job, request.skillIds(), request.customSkillNames(), true));
        }
        if (request.status() != null) {
            job.setStatus(request.status());
            if (request.status() == Job.JobStatus.OPEN && job.getPublishedAt() == null) {
                job.setPublishedAt(LocalDateTime.now());
            }
        }
        if (job.getStatus() != Job.JobStatus.DRAFT) {
            job.setDraftStep(null);
        }

        int scopeDurationDays = validateScopeAndGetDays(
                job.getScopeSize(),
                job.getScopeDurationAmount(),
                job.getScopeDurationUnit()
        );
        job.setScopeDurationDays(scopeDurationDays);
        job.setScopeDuration(toLegacyDuration(scopeDurationDays));
        if (job.getStatus() == Job.JobStatus.OPEN) {
            validateCategorySpecialty(job.getCategory(), job.getSpecialty());
        } else if (job.getCategory() != null && job.getSpecialty() != null) {
            validateCategorySpecialty(job.getCategory(), job.getSpecialty());
        }
        validateBudget(job.getBudgetType(), job.getHourlyRateMin(), job.getHourlyRateMax(), job.getFixedBudget());
        return jobRepository.save(job);
    }

    @Transactional
    public Job cancelJob(Long jobId, Long clientId) {
        Job job = getJobById(jobId);

        if (!job.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Only job owner can cancel the job");
        }

        job.setStatus(Job.JobStatus.CANCELLED);
        job.setDraftStep(null);
        return jobRepository.save(job);
    }

    private User getClientUser(Long clientId) {
        User client = userService.getUserById(clientId);

        if (client.getRole() != User.UserRole.CLIENT) {
            throw new RuntimeException("Only clients can create jobs");
        }

        return client;
    }

    private Job getOwnedJob(Long jobId, Long clientId) {
        Job job = getJobById(jobId);

        if (!job.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Only job owner can update the job");
        }

        return job;
    }

    private Job newPublishableJob(User client) {
        Job job = newDraftJob(client);
        job.setStatus(Job.JobStatus.OPEN);
        return job;
    }

    private Job newDraftJob(User client) {
        return Job.builder()
                .title("")
                .description("")
                .scopeSize(Job.JobScopeSize.MEDIUM)
                .scopeDuration(Job.JobDuration.ONE_TO_THREE_MONTHS)
                .scopeDurationAmount(1)
                .scopeDurationUnit(Job.ScopeDurationUnit.MONTH)
                .scopeDurationDays(30)
                .experienceLevel(Job.ExperienceLevel.INTERMEDIATE)
                .contractToHire(false)
                .budgetType(Job.BudgetType.HOURLY)
                .currencyCode("USD")
                .paymentModel(Job.PaymentModel.OFF_CHAIN_NEGOTIATED)
                .draftStep(Job.DraftStep.SKILLS)
                .status(Job.JobStatus.DRAFT)
                .client(client)
                .build();
    }

    private void applyDraftRequest(Job job, SaveJobDraftRequest request) {
        if (request.title() != null) {
            validateDraftTitle(request.title());
            job.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            validateDraftDescription(request.description());
            job.setDescription(request.description().trim());
        }
        if (request.categoryId() != null || request.clearCategory()) {
            job.setCategory(request.clearCategory() ? null : validateTaxonomyNode(
                    request.categoryId(),
                    SkillTaxonomyNode.TaxonomyLevel.CATEGORY,
                    "Category"
            ));
        }
        if (request.specialtyId() != null || request.clearSpecialty()) {
            job.setSpecialty(request.clearSpecialty() ? null : validateTaxonomyNode(
                    request.specialtyId(),
                    SkillTaxonomyNode.TaxonomyLevel.SPECIALTY,
                    "Specialty"
            ));
        }
        if (job.getCategory() != null && job.getSpecialty() != null) {
            validateCategorySpecialty(job.getCategory(), job.getSpecialty());
        }
        if (request.scopeSize() != null) {
            job.setScopeSize(request.scopeSize());
        }
        if (request.draftStep() != null) {
            job.setDraftStep(request.draftStep());
        }
        if (request.scopeDurationAmount() != null) {
            validateDraftDurationAmount(request.scopeDurationAmount());
            job.setScopeDurationAmount(request.scopeDurationAmount());
        }
        if (request.scopeDurationUnit() != null) {
            job.setScopeDurationUnit(request.scopeDurationUnit());
        }
        int scopeDurationDays = validateScopeAndGetDays(
                job.getScopeSize(),
                job.getScopeDurationAmount(),
                job.getScopeDurationUnit()
        );
        job.setScopeDurationDays(scopeDurationDays);
        job.setScopeDuration(toLegacyDuration(scopeDurationDays));
        if (request.experienceLevel() != null) {
            job.setExperienceLevel(request.experienceLevel());
        }
        if (request.contractToHire() != null) {
            job.setContractToHire(request.contractToHire());
        }
        if (request.budgetType() != null) {
            job.setBudgetType(request.budgetType());
        }
        if (request.hourlyRateMin() != null || request.clearHourlyRateMin()) {
            job.setHourlyRateMin(request.clearHourlyRateMin() ? null : normalizeMoney(request.hourlyRateMin()));
        }
        if (request.hourlyRateMax() != null || request.clearHourlyRateMax()) {
            job.setHourlyRateMax(request.clearHourlyRateMax() ? null : normalizeMoney(request.hourlyRateMax()));
        }
        if (request.fixedBudget() != null || request.clearFixedBudget()) {
            job.setFixedBudget(request.clearFixedBudget() ? null : normalizeMoney(request.fixedBudget()));
        }
        if (request.currencyCode() != null) {
            job.setCurrencyCode(normalizeCurrency(request.currencyCode()));
        }
        if (request.paymentModel() != null) {
            job.setPaymentModel(request.paymentModel());
        }
        validateDraftBudget(job.getBudgetType(), job.getHourlyRateMin(), job.getHourlyRateMax(), job.getFixedBudget());
        if (request.skillFieldsProvided()) {
            replaceJobSkills(job, buildJobSkills(job, request.skillIds(), request.customSkillNames(), false));
        }
    }

    private void replaceJobSkills(Job job, List<JobSkill> selections) {
        if (job.getId() != null && !job.getJobSkillTags().isEmpty()) {
            job.replaceSkills(List.of());
            jobRepository.flush();
        }

        job.replaceSkills(selections);
    }

    private List<JobSkill> buildJobSkills(
            Job job,
            List<Long> skillIds,
            List<String> customSkillNames,
            boolean requireSkills
    ) {
        List<Long> safeSkillIds = skillIds != null ? skillIds : List.of();
        List<String> safeCustomSkillNames = customSkillNames != null ? customSkillNames : List.of();

        if (requireSkills && safeSkillIds.isEmpty() && safeCustomSkillNames.isEmpty()) {
            throw new RuntimeException("At least one skill is required");
        }
        if (safeSkillIds.size() + safeCustomSkillNames.size() > 10) {
            throw new RuntimeException("A job can have at most 10 skills");
        }

        Set<Long> uniqueIds = new HashSet<>(safeSkillIds);
        if (uniqueIds.size() != safeSkillIds.size()) {
            throw new RuntimeException("Duplicate skills are not allowed");
        }

        List<Skill> skills = safeSkillIds.isEmpty()
                ? List.of()
                : new ArrayList<>(skillRepository.findByIdInAndIsActiveTrue(safeSkillIds));
        if (skills.size() != safeSkillIds.size()) {
            throw new RuntimeException("One or more selected skills are invalid");
        }

        Map<Long, Skill> skillsById = new LinkedHashMap<>();
        for (Skill skill : skills) {
            skillsById.put(skill.getId(), skill);
        }

        List<CustomSkillSelection> customSelections = validateCustomSkills(safeCustomSkillNames);
        Map<String, Skill> builtInSkillsByNormalizedName = new LinkedHashMap<>();
        if (!customSelections.isEmpty()) {
            List<String> customNormalizedNames = customSelections.stream()
                    .map(CustomSkillSelection::normalizedName)
                    .toList();
            List<Skill> matchingBuiltInSkills = skillRepository.findByNormalizedNameInAndIsActiveTrue(customNormalizedNames);
            for (Skill skill : matchingBuiltInSkills) {
                builtInSkillsByNormalizedName.put(skill.getNormalizedName(), skill);
            }
        }

        List<JobSkill> selections = new ArrayList<>();
        Set<Long> selectedBuiltInSkillIds = new HashSet<>();
        for (Long skillId : safeSkillIds) {
            Skill skill = skillsById.get(skillId);
            if (skill == null) {
                throw new RuntimeException("One or more selected skills are invalid");
            }
            selectedBuiltInSkillIds.add(skillId);
            selections.add(JobSkill.builder()
                    .job(job)
                    .skill(skill)
                    .displayOrder(selections.size() + 1)
                    .build());
        }

        for (CustomSkillSelection customSelection : customSelections) {
            Skill builtInSkill = builtInSkillsByNormalizedName.get(customSelection.normalizedName());
            if (builtInSkill != null) {
                if (!selectedBuiltInSkillIds.add(builtInSkill.getId())) {
                    throw new RuntimeException("Duplicate skills are not allowed");
                }
                selections.add(JobSkill.builder()
                        .job(job)
                        .skill(builtInSkill)
                        .displayOrder(selections.size() + 1)
                        .build());
                continue;
            }

            selections.add(JobSkill.builder()
                    .job(job)
                    .skillName(customSelection.displayName())
                    .normalizedSkillName(customSelection.normalizedName())
                    .displayOrder(selections.size() + 1)
                    .build());
        }
        return selections;
    }

    private List<CustomSkillSelection> validateCustomSkills(List<String> customSkillNames) {
        List<CustomSkillSelection> customSelections = new ArrayList<>();
        Set<String> uniqueCustomNames = new HashSet<>();

        for (String customSkillName : customSkillNames) {
            String normalizedName = normalizeSkillName(customSkillName);
            if (normalizedName.isBlank()) {
                throw new RuntimeException("Skill name is required");
            }
            if (normalizedName.length() > 100) {
                throw new RuntimeException("Skill name must be at most 100 characters");
            }
            if (!uniqueCustomNames.add(normalizedName)) {
                throw new RuntimeException("Duplicate skills are not allowed");
            }

            customSelections.add(new CustomSkillSelection(cleanSkillName(customSkillName), normalizedName));
        }

        return customSelections;
    }

    private String normalizeSkillName(String input) {
        if (input == null) {
            return "";
        }
        String collapsed = cleanSkillName(input);
        String normalized = Normalizer.normalize(collapsed, Normalizer.Form.NFKC);
        return normalized.toLowerCase(Locale.ROOT);
    }

    private String cleanSkillName(String input) {
        return input == null ? "" : input.trim().replaceAll("\\s+", " ");
    }

    private void validateTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new RuntimeException("Job title is required");
        }
        if (title.length() > 200) {
            throw new RuntimeException("Job title must be at most 200 characters");
        }
    }

    private void validateDraftTitle(String title) {
        if (title.length() > 200) {
            throw new RuntimeException("Job title must be at most 200 characters");
        }
    }

    private void validateDescription(String description) {
        if (description == null || description.isBlank()) {
            throw new RuntimeException("Job description is required");
        }
        if (description.trim().length() < MIN_DESCRIPTION_LENGTH) {
            throw new RuntimeException("Job description must be more than 50 characters");
        }
        if (description.length() > MAX_DESCRIPTION_LENGTH) {
            throw new RuntimeException("Job description must be at most 50,000 characters");
        }
    }

    private void validateDraftDescription(String description) {
        if (description.length() > MAX_DESCRIPTION_LENGTH) {
            throw new RuntimeException("Job description must be at most 50,000 characters");
        }
    }

    private void validateDraftDurationAmount(Integer scopeDurationAmount) {
        if (scopeDurationAmount == null || scopeDurationAmount < 1) {
            throw new RuntimeException("Scope duration must be a positive whole number");
        }
    }

    private SkillTaxonomyNode validateTaxonomyNode(
            Long taxonomyNodeId,
            SkillTaxonomyNode.TaxonomyLevel expectedLevel,
            String label
    ) {
        if (taxonomyNodeId == null) {
            throw new RuntimeException(label + " is required");
        }

        SkillTaxonomyNode node = skillTaxonomyNodeRepository.findById(taxonomyNodeId)
                .orElseThrow(() -> new RuntimeException(label + " is invalid"));

        if (!Boolean.TRUE.equals(node.getIsActive()) || node.getLevel() != expectedLevel) {
            throw new RuntimeException(label + " is invalid");
        }

        return node;
    }

    private void validateCategorySpecialty(SkillTaxonomyNode category, SkillTaxonomyNode specialty) {
        if (category == null) {
            throw new RuntimeException("Category is required");
        }
        if (specialty == null) {
            throw new RuntimeException("Specialty is required");
        }
        SkillTaxonomyNode subcategory = specialty.getParent();
        SkillTaxonomyNode specialtyCategory = subcategory != null ? subcategory.getParent() : null;

        if (specialtyCategory == null || !specialtyCategory.getId().equals(category.getId())) {
            throw new RuntimeException("Specialty does not belong to the selected category");
        }
    }

    private int validateScopeAndGetDays(
            Job.JobScopeSize scopeSize,
            Integer scopeDurationAmount,
            Job.ScopeDurationUnit scopeDurationUnit
    ) {
        if (scopeSize == null || scopeDurationAmount == null || scopeDurationUnit == null) {
            throw new RuntimeException("Scope size and duration are required");
        }

        if (scopeDurationAmount < 1) {
            throw new RuntimeException("Scope duration must be a positive whole number");
        }

        try {
            return Math.multiplyExact(scopeDurationAmount, getDurationUnitDays(scopeDurationUnit));
        } catch (ArithmeticException exception) {
            throw new RuntimeException("Scope duration is too large");
        }
    }

    private int getDurationUnitDays(Job.ScopeDurationUnit scopeDurationUnit) {
        return switch (scopeDurationUnit) {
            case DAY -> 1;
            case WEEK -> 7;
            case MONTH -> 30;
            case YEAR -> 365;
        };
    }

    private Job.JobDuration toLegacyDuration(int scopeDurationDays) {
        if (scopeDurationDays < 30) {
            return Job.JobDuration.LESS_THAN_1_MONTH;
        }
        if (scopeDurationDays <= 90) {
            return Job.JobDuration.ONE_TO_THREE_MONTHS;
        }
        if (scopeDurationDays <= 180) {
            return Job.JobDuration.THREE_TO_SIX_MONTHS;
        }
        return Job.JobDuration.MORE_THAN_6_MONTHS;
    }

    private void validateBudget(
            Job.BudgetType budgetType,
            BigDecimal hourlyRateMin,
            BigDecimal hourlyRateMax,
            BigDecimal fixedBudget
    ) {
        if (budgetType == null) {
            throw new RuntimeException("Budget type is required");
        }

        switch (budgetType) {
            case HOURLY -> {
                if (hourlyRateMin == null || hourlyRateMax == null) {
                    throw new RuntimeException("Hourly jobs require both min and max hourly rates");
                }
                if (fixedBudget != null) {
                    throw new RuntimeException("Hourly jobs cannot define a fixed budget");
                }
                if (hourlyRateMin.signum() < 0 || hourlyRateMax.signum() < 0 || hourlyRateMin.compareTo(hourlyRateMax) > 0) {
                    throw new RuntimeException("Hourly rate range is invalid");
                }
            }
            case FIXED -> {
                if (fixedBudget == null) {
                    throw new RuntimeException("Fixed-price jobs require a budget");
                }
                if (fixedBudget.signum() < 0) {
                    throw new RuntimeException("Fixed budget must be zero or greater");
                }
                if (hourlyRateMin != null || hourlyRateMax != null) {
                    throw new RuntimeException("Fixed-price jobs cannot define hourly rates");
                }
            }
            case NOT_READY -> {
                if (hourlyRateMin != null || hourlyRateMax != null || fixedBudget != null) {
                    throw new RuntimeException("Not-ready budget mode cannot contain budget amounts");
                }
            }
        }
    }

    private void validateDraftBudget(
            Job.BudgetType budgetType,
            BigDecimal hourlyRateMin,
            BigDecimal hourlyRateMax,
            BigDecimal fixedBudget
    ) {
        if (budgetType == null) {
            throw new RuntimeException("Budget type is required");
        }

        if (hourlyRateMin != null && hourlyRateMin.signum() < 0) {
            throw new RuntimeException("Hourly rate range is invalid");
        }
        if (hourlyRateMax != null && hourlyRateMax.signum() < 0) {
            throw new RuntimeException("Hourly rate range is invalid");
        }
        if (hourlyRateMin != null && hourlyRateMax != null && hourlyRateMin.compareTo(hourlyRateMax) > 0) {
            throw new RuntimeException("Hourly rate range is invalid");
        }
        if (fixedBudget != null && fixedBudget.signum() < 0) {
            throw new RuntimeException("Fixed budget must be zero or greater");
        }
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        return value == null ? null : value.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private String normalizeCurrency(String currencyCode) {
        if (currencyCode == null || currencyCode.isBlank()) {
            return "USD";
        }
        return currencyCode.trim().toUpperCase(Locale.ROOT);
    }

    public record CreateJobRequest(
            String title,
            String description,
            Long categoryId,
            Long specialtyId,
            List<Long> skillIds,
            List<String> customSkillNames,
            Job.JobScopeSize scopeSize,
            Integer scopeDurationAmount,
            Job.ScopeDurationUnit scopeDurationUnit,
            Job.ExperienceLevel experienceLevel,
            Boolean contractToHire,
            Job.BudgetType budgetType,
            BigDecimal hourlyRateMin,
            BigDecimal hourlyRateMax,
            BigDecimal fixedBudget,
            String currencyCode,
            Job.PaymentModel paymentModel
    ) {}

    public record SaveJobDraftRequest(
            String title,
            String description,
            Long categoryId,
            Long specialtyId,
            boolean clearCategory,
            boolean clearSpecialty,
            List<Long> skillIds,
            List<String> customSkillNames,
            boolean skillFieldsProvided,
            Job.DraftStep draftStep,
            Job.JobScopeSize scopeSize,
            Integer scopeDurationAmount,
            Job.ScopeDurationUnit scopeDurationUnit,
            Job.ExperienceLevel experienceLevel,
            Boolean contractToHire,
            Job.BudgetType budgetType,
            BigDecimal hourlyRateMin,
            BigDecimal hourlyRateMax,
            BigDecimal fixedBudget,
            boolean clearHourlyRateMin,
            boolean clearHourlyRateMax,
            boolean clearFixedBudget,
            String currencyCode,
            Job.PaymentModel paymentModel
    ) {}

    private record CustomSkillSelection(String displayName, String normalizedName) {}

    public record UpdateJobRequest(
            String title,
            String description,
            Long categoryId,
            Long specialtyId,
            boolean clearCategory,
            boolean clearSpecialty,
            List<Long> skillIds,
            List<String> customSkillNames,
            Job.JobScopeSize scopeSize,
            Integer scopeDurationAmount,
            Job.ScopeDurationUnit scopeDurationUnit,
            Job.ExperienceLevel experienceLevel,
            Boolean contractToHire,
            Job.BudgetType budgetType,
            BigDecimal hourlyRateMin,
            BigDecimal hourlyRateMax,
            BigDecimal fixedBudget,
            boolean clearHourlyRateMin,
            boolean clearHourlyRateMax,
            boolean clearFixedBudget,
            String currencyCode,
            Job.PaymentModel paymentModel,
            Job.JobStatus status
    ) {}
}
