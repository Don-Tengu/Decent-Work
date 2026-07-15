export const JOBS_PAGE_SIZE = 8;

export const JOB_SORT_OPTIONS = [
  { value: 'BEST_MATCH', label: 'Best Matches' },
  { value: 'MOST_RECENT', label: 'Most Recent' },
];

export const EXPERIENCE_FILTERS = [
  { value: 'ENTRY', label: 'Entry level' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'EXPERT', label: 'Expert' },
];

export const BUDGET_TYPE_FILTERS = [
  { value: 'HOURLY', label: 'Hourly' },
  { value: 'FIXED', label: 'Fixed price' },
  { value: 'NOT_READY', label: 'Budget TBD' },
];

export const SCOPE_SIZE_LABELS = {
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
};

export const EXPERIENCE_LABELS = {
  ENTRY: 'Entry level',
  INTERMEDIATE: 'Intermediate',
  EXPERT: 'Expert',
};

export const SEARCH_PARAM_KEYS = {
  query: 'q',
  categories: 'categories',
  specialties: 'specialties',
  experience: 'experience',
  budgetType: 'budget',
  page: 'page',
  sort: 'sort',
};
