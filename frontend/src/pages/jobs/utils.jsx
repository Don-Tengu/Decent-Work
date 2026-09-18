import React from 'react';
import { Box } from '@chakra-ui/react';
import { EXPERIENCE_LABELS, SCOPE_SIZE_LABELS } from './constants.js';

export const getParamList = (searchParams, key) =>
  (searchParams.get(key) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const setParamList = (searchParams, key, values) => {
  if (values.length) {
    searchParams.set(key, values.join(','));
    return;
  }

  searchParams.delete(key);
};

/** Intl.NumberFormat only accepts ISO 4217 (USD). Stablecoins use USD formatting. */
const intlCurrencyFor = (currency) => {
  const code = String(currency || 'USD').trim().toUpperCase();
  if (code === 'USDC' || code === 'USDT' || code.length !== 3) {
    return 'USD';
  }
  return code;
};

export const formatCurrency = (value, currency = 'USD') => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '';
  }

  const code = String(currency || 'USD').trim().toUpperCase();

  if (code === 'ETH') {
    return `${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)} ETH`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: intlCurrencyFor(code),
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
};

export const formatBudgetLabel = (job) => {
  const currency = job.currencyCode || 'USD';

  if (job.budgetType === 'HOURLY') {
    const min = formatCurrency(job.hourlyRateMin, currency);
    const max = formatCurrency(job.hourlyRateMax, currency);
    return min && max ? `Hourly: ${min} - ${max}` : 'Hourly rate not set';
  }

  if (job.budgetType === 'FIXED') {
    return formatCurrency(job.fixedBudget, currency) || 'Fixed budget not set';
  }

  return 'Budget TBD';
};

export const formatDuration = (amount, unit) => {
  const numericAmount = Number(amount);
  const unitLabel = String(unit ?? 'MONTH').toLowerCase();

  if (!Number.isFinite(numericAmount) || numericAmount < 1) {
    return 'Flexible duration';
  }

  return `${numericAmount} ${numericAmount === 1 ? unitLabel : `${unitLabel}s`}`;
};

const formatSummaryBudget = (job) => {
  const currency = job.currencyCode || 'USD';

  if (job.budgetType === 'HOURLY') {
    const min = formatCurrency(job.hourlyRateMin, currency);
    const max = formatCurrency(job.hourlyRateMax, currency);
    return min && max ? `${min}–${max} /hr` : null;
  }

  if (job.budgetType === 'FIXED') {
    const amount = formatCurrency(job.fixedBudget, currency);
    return amount ? `${amount} fixed` : null;
  }

  if (job.budgetType === 'NOT_READY') {
    return 'Budget TBD';
  }

  return null;
};

export const getWorkSummaryParts = (job) => {
  const duration = formatDuration(job.scopeDurationAmount, job.scopeDurationUnit);

  return [
    formatSummaryBudget(job),
    EXPERIENCE_LABELS[job.experienceLevel] ?? null,
    duration === 'Flexible duration' ? null : `Est. ${duration}`,
    SCOPE_SIZE_LABELS[job.scopeSize] ? `${SCOPE_SIZE_LABELS[job.scopeSize]} project` : null,
  ].filter(Boolean);
};

export const formatWorkSummary = (job) => getWorkSummaryParts(job).join(' · ');

export const formatDeliveryTime = (days) => {
  const numeric = Number(days);

  if (!Number.isFinite(numeric) || numeric < 1) {
    return 'Delivery time flexible';
  }

  return `${numeric} ${numeric === 1 ? 'day' : 'days'} delivery`;
};

export const formatPostedTime = (value) => {
  if (!value) {
    return 'Posted recently';
  }

  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) {
    return 'Posted recently';
  }

  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 1) {
    return 'Posted less than an hour ago';
  }

  if (diffHours < 24) {
    return `Posted ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? 'Posted yesterday' : `Posted ${diffDays} days ago`;
};

export const getJobTags = (job) => {
  const tags = (job.jobSkillTags ?? [])
    .map((tag) => tag.skill?.name ?? tag.name)
    .filter(Boolean);

  if (job.specialty?.name) {
    tags.unshift(job.specialty.name);
  }

  return [...new Set(tags)].slice(0, 6);
};

export const formatFileSize = (bytes) => {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size <= 0) {
    return 'Unknown size';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / (1024 ** unitIndex);

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const HighlightedText = ({ children, query, as = 'span', ...props }) => {
  const text = String(children ?? '');
  const cleanQuery = String(query ?? '').trim();

  if (!cleanQuery) {
    return <Box as={as} {...props}>{text}</Box>;
  }

  const matcher = new RegExp(`(${escapeRegExp(cleanQuery)})`, 'ig');
  const parts = text.split(matcher);

  return (
    <Box as={as} {...props}>
      {parts.map((part, index) =>
        part.toLowerCase() === cleanQuery.toLowerCase() ? (
          <Box
            as="mark"
            key={`${part}-${index}`}
            bg="rgba(132, 204, 22, 0.78)"
            color="paper.100"
            px="1"
            borderRadius="4px"
          >
            {part}
          </Box>
        ) : (
          <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
        )
      )}
    </Box>
  );
};
