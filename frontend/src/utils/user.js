// Shared helpers for rendering a user/freelancer identity consistently across
// the proposals list, the freelancer drawer, and the full profile page.

export const getDisplayName = (user) =>
  user?.profile?.fullName?.trim() || user?.username?.trim() || 'Freelancer';

const ROLE_LABELS = {
  FREELANCER: 'Freelancer',
  CLIENT: 'Client',
};

export const formatRole = (role) => ROLE_LABELS[role] ?? 'Member';

export const shortenAddress = (address) => {
  const value = String(address ?? '').trim();

  if (!value) {
    return '';
  }

  return value.length <= 12 ? value : `${value.slice(0, 6)}…${value.slice(-4)}`;
};

export const formatMemberSince = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const label = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);

  return `Member since ${label}`;
};

export const formatHourlyRate = (rate, currency = 'USD') => {
  const amount = Number(rate);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const isoCurrency = currency === 'USDC' || currency === 'USDT' || String(currency).length !== 3
    ? 'USD'
    : currency;

  let formatted;
  try {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: isoCurrency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    formatted = `${amount} ${currency}`;
  }

  return `${formatted}/hr`;
};
