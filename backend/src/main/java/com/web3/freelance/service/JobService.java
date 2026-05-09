package com.web3.freelance.service;

import com.web3.freelance.model.JobSkill;
import com.web3.freelance.model.Job;
import com.web3.freelance.model.Skill;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.JobRepository;
import com.web3.freelance.repository.SkillRepository;
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

        validateTitle(request.title());
        validateDescription(request.description());
        int scopeDurationDays = validateScopeAndGetDays(
                request.scopeSize(),
                request.scopeDurationAmount(),
                request.scopeDurationUnit()
        );
        validateBudget(request.budgetType(), request.hourlyRateMin(), request.hourlyRateMax(), request.fixedBudget());

        Job job = Job.builder()
                .title(request.title())
                .description(request.description())
                .scopeSize(request.scopeSize())
                .scopeDuration(toLegacyDuration(scopeDurationDays))
                .scopeDurationAmount(request.scopeDurationAmount())
                .scopeDurationUnit(request.scopeDurationUnit())
                .scopeDurationDays(scopeDurationDays)
                .experienceLevel(request.experienceLevel())
                .contractToHire(Boolean.TRUE.equals(request.contractToHire()))
                .budgetType(request.budgetType())
                .hourlyRateMin(normalizeMoney(request.hourlyRateMin()))
                .hourlyRateMax(normalizeMoney(request.hourlyRateMax()))
                .fixedBudget(normalizeMoney(request.fixedBudget()))
                .currencyCode(normalizeCurrency(request.currencyCode()))
                .paymentModel(request.paymentModel() != null ? request.paymentModel() : Job.PaymentModel.OFF_CHAIN_NEGOTIATED)
                .status(Job.JobStatus.OPEN)
                .client(client)
                .publishedAt(LocalDateTime.now())
                .build();

        job.replaceSkills(buildJobSkills(job, request.skillIds(), request.customSkillNames()));
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
            job.replaceSkills(buildJobSkills(job, request.skillIds(), request.customSkillNames()));
        }
        if (request.status() != null) {
            job.setStatus(request.status());
            if (request.status() == Job.JobStatus.OPEN && job.getPublishedAt() == null) {
                job.setPublishedAt(LocalDateTime.now());
            }
        }

        int scopeDurationDays = validateScopeAndGetDays(
                job.getScopeSize(),
                job.getScopeDurationAmount(),
                job.getScopeDurationUnit()
        );
        job.setScopeDurationDays(scopeDurationDays);
        job.setScopeDuration(toLegacyDuration(scopeDurationDays));
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
        return jobRepository.save(job);
    }

    private List<JobSkill> buildJobSkills(Job job, List<Long> skillIds, List<String> customSkillNames) {
        List<Long> safeSkillIds = skillIds != null ? skillIds : List.of();
        List<String> safeCustomSkillNames = customSkillNames != null ? customSkillNames : List.of();

        if (safeSkillIds.isEmpty() && safeCustomSkillNames.isEmpty()) {
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

    private record CustomSkillSelection(String displayName, String normalizedName) {}

    public record UpdateJobRequest(
            String title,
            String description,
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
