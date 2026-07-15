export const MIN_PROPOSAL_LENGTH = 50;
export const MAX_PROPOSAL_LENGTH = 2000;
export const MAX_RELEVANT_EXPERIENCE_LENGTH = 2000;
export const MAX_DELIVERY_DAYS = 3650;

export const MAX_PROPOSAL_ATTACHMENTS = 5;
export const MAX_PROPOSAL_ATTACHMENT_BYTES = 100 * 1024 * 1024;

export const getAmountLabel = (job) => {
  if (job?.budgetType === 'FIXED') {
    return 'Your fixed-price bid';
  }

  if (job?.budgetType === 'HOURLY') {
    return 'Your hourly rate';
  }

  return 'Your proposed amount';
};

export const getInitialAmount = (job) => {
  const value = job?.budgetType === 'FIXED' ? job.fixedBudget : job?.hourlyRateMin;
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return '';
  }

  return amount % 1 === 0 ? String(amount) : amount.toFixed(2);
};

export const validateProposalForm = (form) => {
  const nextErrors = {};
  const amount = form.amount.trim();
  const deliveryTime = form.deliveryTime.trim();
  const proposal = form.proposal.trim();
  const relevantExperience = (form.relevantExperience ?? '').trim();

  if (!amount) {
    nextErrors.amount = 'Proposal amount is required.';
  } else if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    nextErrors.amount = 'Enter a positive amount with up to 2 decimal places.';
  }

  if (!deliveryTime) {
    nextErrors.deliveryTime = 'Delivery time is required.';
  } else if (!/^\d+$/.test(deliveryTime) || Number(deliveryTime) < 1 || Number(deliveryTime) > MAX_DELIVERY_DAYS) {
    nextErrors.deliveryTime = 'Enter a whole number between 1 and 3650.';
  }

  if (!proposal) {
    nextErrors.proposal = 'Proposal is required.';
  } else if (proposal.length < MIN_PROPOSAL_LENGTH) {
    nextErrors.proposal = 'Proposal must be at least 50 characters.';
  } else if (proposal.length > MAX_PROPOSAL_LENGTH) {
    nextErrors.proposal = 'Proposal must be at most 2000 characters.';
  }

  if (relevantExperience.length > MAX_RELEVANT_EXPERIENCE_LENGTH) {
    nextErrors.relevantExperience = 'Recent experience must be at most 2000 characters.';
  }

  return nextErrors;
};

export const getAttachmentDraftId = (file) => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${file.name}-${file.lastModified}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};
