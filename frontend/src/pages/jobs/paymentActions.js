/**
 * Derive offer / fund / release / review CTAs from job + bid + payment state.
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
  const workInReview =
    isAccepted && jobStatus === 'IN_PROGRESS' && payment?.status === 'IN_REVIEW';
  const canRelease =
    isAccepted &&
    jobStatus === 'IN_PROGRESS' &&
    (payment?.status === 'ESCROWED' || payment?.status === 'IN_REVIEW');
  const canRequestChanges = workInReview;
  const isPaid =
    isAccepted && (payment?.status === 'RELEASED' || jobStatus === 'COMPLETED');
  const releaseLabel = workInReview ? 'Approve & release' : 'Release payment';

  let paymentNote = null;
  if (isPaid) {
    paymentNote = 'Paid · completed';
  } else if (workInReview) {
    paymentNote = 'Work submitted · review to release';
  } else if (payment?.status === 'ESCROWED' && payment?.changesRequestedAt) {
    paymentNote = 'Changes requested · freelancer updating work';
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
    canRequestChanges,
    workInReview,
    releaseLabel,
    isPaid,
    paymentNote,
    isOnChain,
    isOffered,
    isAccepted,
  };
};

export const getFreelancerWorkFlags = (bid) => {
  const payment = bid?.payment;
  const jobStatus = bid?.job?.status;
  const isHired = bid?.status === 'ACCEPTED';
  const canSubmitWork =
    isHired && jobStatus === 'IN_PROGRESS' && payment?.status === 'ESCROWED';
  const awaitingReview = isHired && payment?.status === 'IN_REVIEW';
  const awaitingFunding = isHired && payment?.status === 'AWAITING_FUNDING';
  const changesRequested = canSubmitWork && Boolean(payment?.changesRequestedAt);
  const isPaid = isHired && (payment?.status === 'RELEASED' || jobStatus === 'COMPLETED');

  let contractCopy = null;
  if (isHired) {
    if (isPaid) {
      contractCopy = 'Completed · paid';
    } else if (awaitingFunding) {
      contractCopy = 'Hired · waiting for the client to fund escrow';
    } else if (awaitingReview) {
      contractCopy = 'Work submitted · waiting for the client to review';
    } else if (changesRequested) {
      contractCopy = 'Client requested changes · update and submit again';
    } else if (canSubmitWork) {
      contractCopy = 'Active contract · submit work when you are done';
    } else {
      contractCopy = 'Active contract · in progress';
    }
  }

  return {
    canSubmitWork,
    awaitingReview,
    awaitingFunding,
    changesRequested,
    isPaid,
    contractCopy,
  };
};
