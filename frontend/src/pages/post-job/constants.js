export const JOB_POST_STEPS = [
  {
    id: 'title',
    shortLabel: 'Title',
    title: 'Let\'s start with a strong title',
    description: 'This helps your job post stand out to the right candidates. It’s the first thing they’ll see, so make it count!',
  },
  {
    id: 'skills',
    shortLabel: 'Skills',
    title: 'Add related skill tags',
    description: 'Select platform skills or create custom ones to attract the right specialists.',
    helper: 'Infrastructure is ready for built-in and custom skills.',
  },
  {
    id: 'scope',
    shortLabel: 'Scope',
    title: 'Estimate the scope of work',
    description: 'Capture project size, duration, experience level, and contract-to-hire intent.',
    helper: 'This step maps to the new `jobs` table scope fields.',
  },
  {
    id: 'budget',
    shortLabel: 'Budget',
    title: 'Tell us about your budget.',
    description: 'This will help us match you to talent within your range.',
    helper: 'Budget shape is aligned with the backend enums and constraints.',
  },
  {
    id: 'details',
    shortLabel: 'Details',
    title: 'Start the conversation.',
    description: 'Talent are looking for:',
    guidanceItems: [
      'Clear expectations about your task or deliverables',
      'The skills required for your work',
      'Good communication',
      'Details about how you or your team like to work',
    ],
  },
];

export const JOB_DRAFT_STEPS = {
  SKILLS: 'SKILLS',
  SCOPE: 'SCOPE',
  BUDGET: 'BUDGET',
  DETAILS: 'DETAILS',
  REVIEW: 'REVIEW',
};

export const JOB_DRAFT_STEP_ACTIVE_INDEX = {
  [JOB_DRAFT_STEPS.SKILLS]: 1,
  [JOB_DRAFT_STEPS.SCOPE]: 2,
  [JOB_DRAFT_STEPS.BUDGET]: 3,
  [JOB_DRAFT_STEPS.DETAILS]: 4,
  [JOB_DRAFT_STEPS.REVIEW]: 4,
};

export const JOB_DRAFT_STEP_ORDER = {
  [JOB_DRAFT_STEPS.SKILLS]: 1,
  [JOB_DRAFT_STEPS.SCOPE]: 2,
  [JOB_DRAFT_STEPS.BUDGET]: 3,
  [JOB_DRAFT_STEPS.DETAILS]: 4,
  [JOB_DRAFT_STEPS.REVIEW]: 5,
};

export const DEFAULT_HOURLY_RATE_MIN = '17.00';
export const DEFAULT_HOURLY_RATE_MAX = '49.00';

export const JOB_POST_INITIAL_DRAFT = {
  draftStep: JOB_DRAFT_STEPS.SKILLS,
  title: '',
  categoryId: '',
  categoryName: '',
  specialtyId: '',
  specialtyName: '',
  skillIds: [],
  skillNamesById: {},
  customSkillNames: [],
  scopeSize: 'MEDIUM',
  scopeDurationAmount: '1',
  scopeDurationUnit: 'MONTH',
  scopeDurationDays: 30,
  experienceLevel: 'INTERMEDIATE',
  contractToHire: false,
  budgetType: 'HOURLY',
  budgetNotReadyConfirmed: false,
  budgetNotReadyType: '',
  hourlyRateMin: DEFAULT_HOURLY_RATE_MIN,
  hourlyRateMax: DEFAULT_HOURLY_RATE_MAX,
  fixedBudget: '',
  currencyCode: 'USD',
  paymentModel: 'OFF_CHAIN_NEGOTIATED',
  description: '',
  attachments: [],
};

export const MIN_JOB_SKILLS = 1;
export const MAX_JOB_SKILLS = 10;
export const MIN_HOURLY_RATE = 3;
export const MIN_FIXED_BUDGET = 5;
export const MIN_JOB_DESCRIPTION_LENGTH = 50;
export const MAX_JOB_DESCRIPTION_LENGTH = 50000;
export const MAX_JOB_ATTACHMENT_BYTES = 100 * 1024 * 1024;
export const MAX_JOB_ATTACHMENTS = 5;
export const JOB_DESCRIPTION_MIN_LENGTH_ERROR = `Must be more than ${MIN_JOB_DESCRIPTION_LENGTH} characters`;

export const SCOPE_DURATION_UNIT_DAYS = {
  DAY: 1,
  WEEK: 7,
  MONTH: 30,
  YEAR: 365,
};

export const SCOPE_SIZE_LABELS = {
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
};

export const SCOPE_SIZE_DESCRIPTIONS = {
  SMALL: 'Quick and straightforward tasks with a focused outcome.',
  MEDIUM: 'Well-defined projects with clear requirements and milestones.',
  LARGE: 'Longer term or complex initiatives, such as building a full product.',
};

export const EXPERIENCE_LEVEL_LABELS = {
  ENTRY: 'Entry level',
  INTERMEDIATE: 'Intermediate',
  EXPERT: 'Expert',
};

export const EXPERIENCE_LEVEL_DESCRIPTIONS = {
  ENTRY: 'Looking for someone relatively new to this field.',
  INTERMEDIATE: 'Looking for substantial experience in this field.',
  EXPERT: 'Looking for comprehensive and deep expertise in this field.',
};

export const SCOPE_DURATION_UNIT_LABELS = {
  DAY: { singular: 'day', plural: 'days' },
  WEEK: { singular: 'week', plural: 'weeks' },
  MONTH: { singular: 'month', plural: 'months' },
  YEAR: { singular: 'year', plural: 'years' },
};

export const normalizeSkillName = (value = '') => value.trim().replace(/\s+/g, ' ');

export const getNormalizedCustomSkillNames = (skillNames, customSkillLimit = MAX_JOB_SKILLS) => {
  const seenSkillNames = new Set();
  const customSkillNames = [];

  skillNames.forEach((skillName) => {
    const normalizedSkillName = normalizeSkillName(skillName);
    const skillKey = normalizedSkillName.toLowerCase();

    if (
      normalizedSkillName &&
      !seenSkillNames.has(skillKey) &&
      customSkillNames.length < customSkillLimit
    ) {
      seenSkillNames.add(skillKey);
      customSkillNames.push(normalizedSkillName);
    }
  });

  return customSkillNames;
};

export const getPositiveIntegerInputValue = (value) =>
  String(value ?? '')
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '');

export const getMoneyInputValue = (value) => {
  const sanitizedValue = String(value ?? '').replace(/[^\d.]/g, '');
  const [wholePart = '', ...decimalParts] = sanitizedValue.split('.');
  const normalizedWholePart = wholePart.replace(/^0+(?=\d)/, '');

  if (decimalParts.length === 0) {
    return normalizedWholePart;
  }

  return `${normalizedWholePart || '0'}.${decimalParts.join('').slice(0, 2)}`;
};

export const formatMoneyInputValue = (value) => {
  const normalizedValue = getMoneyInputValue(value);
  const amount = Number.parseFloat(normalizedValue);

  return Number.isFinite(amount) ? amount.toFixed(2) : '';
};

export const formatCurrencyAmount = (value) => {
  const amount = parseBudgetAmount(value);

  if (amount === null) {
    return '';
  }

  return `$${amount.toFixed(2)}`;
};

export const getAttachmentDraftId = (file) => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${file.name}-${file.lastModified}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const formatAttachmentSize = (bytes = 0) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
};

export const getAttachmentDisplayName = (attachment) =>
  attachment?.file?.name ?? attachment?.fileName ?? 'Attachment';

export const getAttachmentSizeBytes = (attachment) =>
  attachment?.file?.size ?? attachment?.fileSizeBytes ?? 0;

export const isPersistedAttachment = (attachment) => !attachment?.file && !!attachment?.id;

export const getSelectedSkillCount = (draft) =>
  (draft.skillIds?.length ?? 0) + (draft.customSkillNames?.length ?? 0);

export const isSkillsStepComplete = (draft) => {
  const selectedSkillCount = getSelectedSkillCount(draft);

  return !!draft.categoryId &&
    !!draft.specialtyId &&
    selectedSkillCount >= MIN_JOB_SKILLS &&
    selectedSkillCount <= MAX_JOB_SKILLS;
};

export const getScopeDurationDays = (amount, unit) => {
  const multiplier = SCOPE_DURATION_UNIT_DAYS[unit];
  const numericAmount = Number.parseInt(String(amount ?? ''), 10);

  if (!multiplier || !Number.isInteger(numericAmount) || numericAmount < 1) {
    return 0;
  }

  const durationDays = numericAmount * multiplier;

  return Number.isSafeInteger(durationDays) ? durationDays : 0;
};

export const isScopeStepComplete = (draft) =>
  !!draft.scopeSize &&
  getScopeDurationDays(draft.scopeDurationAmount, draft.scopeDurationUnit) > 0 &&
  !!draft.experienceLevel &&
  typeof draft.contractToHire === 'boolean';

export const formatDurationSummary = (amount, unit) => {
  const numericAmount = Number.parseInt(String(amount ?? ''), 10);
  const unitLabel = SCOPE_DURATION_UNIT_LABELS[unit] ?? SCOPE_DURATION_UNIT_LABELS.DAY;

  if (!Number.isInteger(numericAmount) || numericAmount < 1) {
    return 'Choose duration';
  }

  return `${numericAmount} ${numericAmount === 1 ? unitLabel.singular : unitLabel.plural}`;
};

export const getScopeSummary = (draft) =>
  [
    SCOPE_SIZE_LABELS[draft.scopeSize] ?? 'Choose scope',
    formatDurationSummary(draft.scopeDurationAmount, draft.scopeDurationUnit),
    EXPERIENCE_LEVEL_LABELS[draft.experienceLevel] ?? 'Choose experience level',
    draft.contractToHire ? 'Planning to hire full time' : 'Not planning to hire full time',
  ].join(', ');

export const parseBudgetAmount = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = Number.parseFloat(String(value));

  return Number.isFinite(amount) ? amount : null;
};

export const getBudgetValidationError = (draft) => {
  if (draft.budgetType === 'HOURLY') {
    const hourlyRateMin = parseBudgetAmount(draft.hourlyRateMin);
    const hourlyRateMax = parseBudgetAmount(draft.hourlyRateMax);

    if (hourlyRateMin === null || hourlyRateMax === null) {
      return 'Enter both ends of the hourly rate range before moving to the next step.';
    }

    if (hourlyRateMin < MIN_HOURLY_RATE || hourlyRateMax < MIN_HOURLY_RATE) {
      return 'The minimum hourly rate is $3.00. Please update your range.';
    }

    if (hourlyRateMin > hourlyRateMax) {
      return "Your maximum rate can't be lower than your minimum. Please update your range.";
    }

    return '';
  }

  if (draft.budgetType === 'FIXED') {
    const fixedBudget = parseBudgetAmount(draft.fixedBudget);

    if (fixedBudget === null) {
      return 'Enter a fixed project budget before moving to the next step.';
    }

    if (fixedBudget < MIN_FIXED_BUDGET) {
      return 'The minimum fixed-price budget is $5.00. Please update your budget.';
    }

    return '';
  }

  if (draft.budgetType === 'NOT_READY' && draft.budgetNotReadyConfirmed) {
    return '';
  }

  return 'Choose a budget type before moving to the next step.';
};

export const isBudgetStepComplete = (draft) => !getBudgetValidationError(draft);

export const getBudgetSummary = (draft) => {
  if (draft.budgetType === 'HOURLY') {
    const minLabel = formatCurrencyAmount(draft.hourlyRateMin);
    const maxLabel = formatCurrencyAmount(draft.hourlyRateMax);

    return minLabel && maxLabel ? `${minLabel} - ${maxLabel} /hr` : 'Hourly rate not set';
  }

  if (draft.budgetType === 'FIXED') {
    const fixedBudgetLabel = formatCurrencyAmount(draft.fixedBudget);

    return fixedBudgetLabel ? `${fixedBudgetLabel} fixed price` : 'Fixed budget not set';
  }

  if (draft.budgetType === 'NOT_READY') {
    return draft.budgetNotReadyType === 'FIXED'
      ? 'Fixed budget not ready'
      : 'Hourly rate not ready';
  }

  return 'Budget not set';
};

export const getDescriptionValidationError = (descriptionValue = '') => {
  const description = descriptionValue.trim();

  if (description.length < MIN_JOB_DESCRIPTION_LENGTH) {
    return JOB_DESCRIPTION_MIN_LENGTH_ERROR;
  }

  if (descriptionValue.length > MAX_JOB_DESCRIPTION_LENGTH) {
    return `Keep the description under ${MAX_JOB_DESCRIPTION_LENGTH.toLocaleString()} characters.`;
  }

  return '';
};

export const isDescriptionErrorMessage = (message = '') =>
  message === JOB_DESCRIPTION_MIN_LENGTH_ERROR || message.startsWith('Keep the description under');

export const getDetailsValidationError = (draft) => {
  const descriptionError = getDescriptionValidationError(draft.description ?? '');

  if (descriptionError) {
    return descriptionError;
  }

  const oversizedAttachment = draft.attachments?.find(
    (attachment) => attachment.file?.size > MAX_JOB_ATTACHMENT_BYTES
  );

  if (oversizedAttachment) {
    return `Remove ${oversizedAttachment.file.name} or choose a file under 100MB.`;
  }

  return '';
};

export const isDetailsStepComplete = (draft) => !getDetailsValidationError(draft);

export const getJobPostValidationError = (draft) => {
  if (!draft.title.trim()) {
    return 'Add a job title before publishing.';
  }

  if (!draft.categoryId || !draft.specialtyId) {
    return 'Select a category and specialty before publishing.';
  }

  const selectedSkillCount = getSelectedSkillCount(draft);

  if (selectedSkillCount < MIN_JOB_SKILLS) {
    return 'Add at least one skill before publishing.';
  }

  if (selectedSkillCount > MAX_JOB_SKILLS) {
    return `Add no more than ${MAX_JOB_SKILLS} skills.`;
  }

  if (!isScopeStepComplete(draft)) {
    return 'Complete the scope details before publishing.';
  }

  const budgetValidationError = getBudgetValidationError(draft);

  if (budgetValidationError) {
    return budgetValidationError;
  }

  return getDetailsValidationError(draft);
};

export const STEP_PLACEHOLDER_FIELDS = {
  skills: ['Recommended skills', 'Custom skills', 'Search and pick experience tags'],
  scope: ['Project size', 'Timeline', 'Experience level', 'Contract-to-hire'],
  budget: ['Price type', 'Hourly range', 'Fixed budget', 'Budget optionality'],
  details: ['Job description', 'Attachments', 'Deliverables and expectations'],
};

export const getStepProgressValue = (stepIndex) =>
  Math.round(((stepIndex + 1) / JOB_POST_STEPS.length) * 100);

export const getCompletedStepCount = (draft) => {
  if (!draft.title.trim()) {
    return 0;
  }

  if (!isSkillsStepComplete(draft)) {
    return 1;
  }

  if (!isScopeStepComplete(draft)) {
    return 2;
  }

  if (!isBudgetStepComplete(draft)) {
    return 3;
  }

  if (!isDetailsStepComplete(draft)) {
    return 4;
  }

  return 5;
};

export const getDraftStepActiveStepIndex = (draftStep, draft) =>
  JOB_DRAFT_STEP_ACTIVE_INDEX[draftStep] ??
  Math.min(getCompletedStepCount(draft), JOB_POST_STEPS.length - 1);

export const getDraftStepRank = (draftStep) => JOB_DRAFT_STEP_ORDER[draftStep] ?? 0;

export const getFurthestDraftStep = (...draftSteps) =>
  draftSteps.reduce((furthestDraftStep, draftStep) => {
    if (getDraftStepRank(draftStep) > getDraftStepRank(furthestDraftStep)) {
      return draftStep;
    }

    return furthestDraftStep;
  }, JOB_DRAFT_STEPS.SKILLS);

export const getDraftStepCandidateForSave = (draft, activeStepIndex) => {
  if (!draft.title.trim() || activeStepIndex <= 0) {
    return JOB_DRAFT_STEPS.SKILLS;
  }

  if (activeStepIndex === 1) {
    return isSkillsStepComplete(draft) ? JOB_DRAFT_STEPS.SCOPE : JOB_DRAFT_STEPS.SKILLS;
  }

  if (activeStepIndex === 2) {
    return isScopeStepComplete(draft) ? JOB_DRAFT_STEPS.BUDGET : JOB_DRAFT_STEPS.SCOPE;
  }

  if (activeStepIndex === 3) {
    return isBudgetStepComplete(draft) ? JOB_DRAFT_STEPS.DETAILS : JOB_DRAFT_STEPS.BUDGET;
  }

  if (activeStepIndex >= 4) {
    return isDetailsStepComplete(draft) ? JOB_DRAFT_STEPS.REVIEW : JOB_DRAFT_STEPS.DETAILS;
  }

  return JOB_DRAFT_STEPS.SKILLS;
};

export const getDraftStepForSave = (draft, activeStepIndex, currentDraftStep = null) =>
  getFurthestDraftStep(currentDraftStep, getDraftStepCandidateForSave(draft, activeStepIndex));

export const isActiveDraftStepValidForSave = (draft, activeStepIndex) => {
  if (!draft.title.trim()) {
    return false;
  }

  if (activeStepIndex <= 0) {
    return true;
  }

  if (activeStepIndex === 1) {
    return isSkillsStepComplete(draft);
  }

  if (activeStepIndex === 2) {
    return isScopeStepComplete(draft);
  }

  if (activeStepIndex === 3) {
    return isBudgetStepComplete(draft);
  }

  if (activeStepIndex >= 4) {
    return isDetailsStepComplete(draft);
  }

  return true;
};
