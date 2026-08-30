/**
 * Derive offer / fund / release CTAs from job + bid + payment state.
 */
export const getPaymentActionFlags = ({ bid, jobStatus, payment, hasOutstandingOffer = false }) => {
  const isOffered = bid?.status === 'OFFERED';
  const isAccepted = bid?.status === 'ACCEPTED';
  const canOffer =
    jobStatus === 'OPEN' && bid?.status === 'PENDING' && !hasOutstandingOffer;
  const canWithdrawOffer = jobStatus === 'OPEN' && isOffered;
  const offerBlockedByOther =
    jobStatus === 'OPEN' && bid?.status === 'PENDING' && hasOutstandingOffer;
  const isOnChain = payment?.fundingMode === 'ON_CHAIN';
  const canFund =
    isAccepted &&
    jobStatus === 'IN_PROGRESS' &&
    payment?.status === 'AWAITING_FUNDING' &&
    isOnChain;
  const canRelease =
    isAccepted && jobStatus === 'IN_PROGRESS' && payment?.status === 'ESCROWED';
  const isPaid =
    isAccepted && (payment?.status === 'RELEASED' || jobStatus === 'COMPLETED');

  let paymentNote = null;
  if (isPaid) {
    paymentNote = 'Paid · completed';
  } else if (canRelease) {
    paymentNote = isOnChain ? 'Funds in on-chain escrow' : 'Funds in escrow';
  } else if (canFund) {
    paymentNote = 'Awaiting escrow funding';
  } else if (isOffered) {
    paymentNote = 'Offer sent — waiting for freelancer';
  } else if (offerBlockedByOther) {
    paymentNote = 'Withdraw the current offer before offering someone else';
  }

  return {
    canOffer,
    canWithdrawOffer,
    offerBlockedByOther,
    canFund,
    canRelease,
    isPaid,
    paymentNote,
    isOnChain,
    isOffered,
    isAccepted,
  };
};
