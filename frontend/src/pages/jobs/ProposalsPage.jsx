import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Badge, Button, Field, Heading, HStack, Text, Textarea, VStack } from '@chakra-ui/react';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import {
  CONFIRM_ESCROW_FUNDING,
  CONFIRM_PAYMENT_RELEASE,
  GET_JOB,
  GET_JOB_BIDS,
  GET_PAYMENT_FOR_JOB,
  OFFER_BID,
  RELEASE_PAYMENT,
  REQUEST_CHANGES,
  WITHDRAW_OFFER,
} from '@/graphql/queries.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { quietPillButtonStyles, subtlePillButtonStyles } from '../../components/ui/buttonStyles.js';
import PageShell from '../../components/ui/PageShell.jsx';
import SectionEyebrow from '../../components/ui/SectionEyebrow.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import GlassPanel from '../../components/ui/GlassPanel.jsx';
import JobsPageState from './components/JobsPageState.jsx';
import ProposalCard from './components/ProposalCard.jsx';
import FreelancerDrawer from './components/FreelancerDrawer.jsx';
import { inputStyles } from '../post-job/styles.js';
import { formatBudgetLabel, formatCurrency } from './utils.jsx';
import { getDisplayName } from '@/utils/user.js';
import { fundEscrow, netAfterFee, releaseEscrow } from '@/utils/escrow.js';
import { WEB3_CONFIG } from '@/config/web3.js';

const pageAccents = [
  {
    top: '-140px',
    left: '-120px',
    w: '360px',
    h: '360px',
    bg: 'rgba(6, 182, 212, 0.12)',
    filter: 'blur(34px)',
  },
  {
    top: '220px',
    right: '-120px',
    w: '340px',
    h: '340px',
    bg: 'rgba(16, 185, 129, 0.12)',
    filter: 'blur(32px)',
  },
];

const JOB_STATUS_LABEL = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const JOB_STATUS_PALETTE = {
  OPEN: 'green',
  IN_PROGRESS: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const BID_SORT_RANK = {
  ACCEPTED: 0,
  OFFERED: 1,
  PENDING: 2,
  REJECTED: 3,
};

const getBackTarget = (state) => (typeof state?.from === 'string' ? state.from : '/dashboard');

const sortBidsForDisplay = (bids) =>
  [...bids].sort((a, b) => {
    const rankA = BID_SORT_RANK[a.status] ?? 9;
    const rankB = BID_SORT_RANK[b.status] ?? 9;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

const graphqlErrorMessage = (err) =>
  err?.graphQLErrors?.[0]?.message || err?.message || 'Something went wrong';

const ProposalsPage = () => {
  const { jobId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const backTarget = getBackTarget(location.state);
  const [selectedBidId, setSelectedBidId] = React.useState(null);
  const [pendingAction, setPendingAction] = React.useState(null);
  const [actionError, setActionError] = React.useState(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState('');
  const lastActionRef = React.useRef(null);

  const { data: jobData, loading: loadingJob, error: jobError } = useQuery(GET_JOB, {
    variables: { id: jobId },
    skip: !jobId,
    fetchPolicy: 'cache-and-network',
  });

  const job = jobData?.job;
  const isOwner = job && user ? String(job.client?.id) === String(user.id) : false;

  const {
    data: bidsData,
    loading: loadingBids,
    error: bidsError,
  } = useQuery(GET_JOB_BIDS, {
    variables: { jobId },
    skip: !jobId || !isOwner,
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: paymentData,
    loading: loadingPayment,
    error: paymentError,
  } = useQuery(GET_PAYMENT_FOR_JOB, {
    variables: { jobId },
    skip: !jobId || !isOwner,
    fetchPolicy: 'cache-and-network',
  });

  const bids = React.useMemo(
    () => sortBidsForDisplay(bidsData?.jobBids ?? []),
    [bidsData?.jobBids]
  );
  const payment = paymentData?.paymentForJob ?? null;
  const currencyCode = job?.currencyCode || 'USD';
  const jobTitle = job?.title?.trim() || 'this job';
  const proposalCount = bids.length;

  const isHiring = job?.status === 'OPEN';
  const isContract = job?.status === 'IN_PROGRESS' || job?.status === 'COMPLETED';
  const offeredBid = bids.find((bid) => bid.status === 'OFFERED') ?? null;
  const hiredBid = bids.find((bid) => bid.status === 'ACCEPTED') ?? null;
  const otherBids = isContract ? bids.filter((bid) => bid.status !== 'ACCEPTED') : bids;
  const hasOutstandingOffer = Boolean(offeredBid);
  const isOnChainPayment = payment?.fundingMode === 'ON_CHAIN';
  const canFund =
    job?.status === 'IN_PROGRESS' && hiredBid && payment?.status === 'AWAITING_FUNDING' && isOnChainPayment;
  const canRelease =
    job?.status === 'IN_PROGRESS' &&
    hiredBid &&
    (payment?.status === 'ESCROWED' || payment?.status === 'IN_REVIEW');
  const canRequestChanges =
    job?.status === 'IN_PROGRESS' && hiredBid && payment?.status === 'IN_REVIEW';

  const refetchQueries = [
    { query: GET_JOB, variables: { id: jobId } },
    { query: GET_JOB_BIDS, variables: { jobId } },
    { query: GET_PAYMENT_FOR_JOB, variables: { jobId } },
  ];

  const [offerBid] = useMutation(OFFER_BID, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  const [withdrawOffer] = useMutation(WITHDRAW_OFFER, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  const [confirmEscrowFunding] = useMutation(CONFIRM_ESCROW_FUNDING, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  const [confirmPaymentRelease] = useMutation(CONFIRM_PAYMENT_RELEASE, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  const [releasePayment] = useMutation(RELEASE_PAYMENT, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  const [requestChanges] = useMutation(REQUEST_CHANGES, {
    refetchQueries,
    awaitRefetchQueries: true,
  });

  const selectedBid = React.useMemo(
    () => (selectedBidId ? bids.find((bid) => bid.id === selectedBidId) ?? null : null),
    [bids, selectedBidId]
  );

  const openOffer = (bid) => {
    setActionError(null);
    setPendingAction({ type: 'offer', bid });
  };

  const openWithdraw = (bid) => {
    setActionError(null);
    setPendingAction({ type: 'withdraw', bid });
  };

  const openFund = (bid) => {
    setActionError(null);
    setPendingAction({ type: 'fund', bid });
  };

  const openRelease = (bid) => {
    setActionError(null);
    setActionMessage('');
    setPendingAction({ type: 'release', bid });
  };

  const openRequestChanges = (bid) => {
    setActionError(null);
    setActionMessage('');
    setPendingAction({ type: 'requestChanges', bid });
  };

  const closeConfirm = () => {
    if (!actionLoading) {
      setPendingAction(null);
      setActionError(null);
      setActionMessage('');
    }
  };

  if (pendingAction) {
    lastActionRef.current = pendingAction;
  }
  const dialogAction = pendingAction ?? lastActionRef.current;
  const actionType = dialogAction?.type || 'offer';
  const pendingName = dialogAction ? getDisplayName(dialogAction.bid.freelancer) : '';
  const pendingAmount = dialogAction ? formatCurrency(dialogAction.bid.amount, currencyCode) : '';
  const feePercent = payment?.platformFeePercent ?? WEB3_CONFIG.platformFeePercent;
  const netAmount =
    dialogAction?.bid?.amount != null
      ? formatCurrency(netAfterFee(dialogAction.bid.amount, feePercent), currencyCode)
      : '';

  const dialogTitle =
    actionType === 'offer'
      ? `Send offer to ${pendingName}?`
      : actionType === 'withdraw'
        ? 'Withdraw offer?'
        : actionType === 'fund'
          ? 'Fund escrow?'
          : actionType === 'requestChanges'
            ? 'Request changes?'
            : payment?.status === 'IN_REVIEW'
              ? 'Approve & release payment?'
              : 'Release payment?';

  const dialogDescription =
    actionType === 'offer'
      ? `This sends an offer to ${pendingName} for ${pendingAmount}. Other proposals stay open until they accept. They will be notified in-app.`
      : actionType === 'withdraw'
        ? `This withdraws your offer to ${pendingName}. Their proposal returns to pending so you can offer someone else.`
        : actionType === 'fund'
          ? `You will deposit ${pendingAmount} into the escrow contract for ${pendingName} on ${WEB3_CONFIG.chainName}. Platform fee (${feePercent}%) is taken only when you release.`
          : actionType === 'requestChanges'
            ? `${pendingName} will be asked to update the work. Funds stay in escrow until you approve & release.`
            : isOnChainPayment
              ? `This releases escrow on-chain. ${pendingName} receives ~${netAmount || pendingAmount}; platform takes ${feePercent}%. The job will be marked complete.`
              : `This releases ${pendingAmount} to ${pendingName} and marks the job complete. This cannot be undone.`;

  const confirmLabel =
    actionType === 'offer'
      ? 'Send offer'
      : actionType === 'withdraw'
        ? 'Withdraw offer'
        : actionType === 'fund'
          ? 'Fund escrow'
          : actionType === 'requestChanges'
            ? 'Request changes'
            : payment?.status === 'IN_REVIEW'
              ? 'Approve & release'
              : 'Release payment';

  const handleConfirm = async () => {
    if (!pendingAction) {
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      if (pendingAction.type === 'offer') {
        await offerBid({ variables: { bidId: pendingAction.bid.id } });
      } else if (pendingAction.type === 'withdraw') {
        await withdrawOffer({ variables: { bidId: pendingAction.bid.id } });
      } else if (pendingAction.type === 'fund') {
        if (!payment?.id) {
          throw new Error('No payment record found for this contract');
        }
        const freelancerWallet = pendingAction.bid.freelancer?.walletAddress;
        if (!freelancerWallet) {
          throw new Error('Freelancer must connect a wallet before escrow can be funded');
        }
        const { txHash } = await fundEscrow({
          jobId,
          freelancerAddress: freelancerWallet,
          amount: pendingAction.bid.amount,
        });
        await confirmEscrowFunding({
          variables: { paymentId: payment.id, transactionHash: txHash },
        });
      } else if (pendingAction.type === 'release') {
        if (!payment?.id) {
          throw new Error('No payment record found for this contract');
        }
        if (payment.fundingMode === 'ON_CHAIN') {
          if (!payment.onChainEscrowId) {
            throw new Error('Missing on-chain escrow id — fund escrow first');
          }
          const { txHash } = await releaseEscrow({ escrowId: payment.onChainEscrowId });
          await confirmPaymentRelease({
            variables: { paymentId: payment.id, transactionHash: txHash },
          });
        } else {
          await releasePayment({ variables: { paymentId: payment.id } });
        }
      } else if (pendingAction.type === 'requestChanges') {
        await requestChanges({
          variables: { jobId, message: actionMessage.trim() || null },
        });
      }
      setPendingAction(null);
      setActionMessage('');
    } catch (err) {
      setActionError({ message: graphqlErrorMessage(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const jobStatusLabel = job ? JOB_STATUS_LABEL[job.status] : null;
  const pageEyebrow = isContract ? 'Contract' : 'Proposals';
  const pageTitle = isContract
    ? job?.status === 'COMPLETED'
      ? `Completed · ${jobTitle}`
      : `Manage contract · ${jobTitle}`
    : `Proposals for ${jobTitle}`;
  const pageSubtitle = isContract
    ? job?.status === 'COMPLETED'
      ? 'Payment released. Review the hired freelancer and proposal history below.'
      : payment?.status === 'AWAITING_FUNDING'
        ? 'Freelancer hired. Fund the on-chain escrow to lock payment protection.'
        : payment?.status === 'IN_REVIEW'
          ? 'The freelancer submitted work. Approve & release, or request changes.'
          : 'A freelancer is hired. They can submit work when done. You can also release payment without a submission.'
    : offeredBid
      ? `Offer sent to ${getDisplayName(offeredBid.freelancer)}. Waiting for them to accept or decline.`
      : 'Send an offer to a freelancer. They must accept before the job starts and other proposals are closed.';

  const cardHandlers = {
    onOpenFreelancer: (selected) => setSelectedBidId(selected.id),
    onOffer: openOffer,
    onWithdrawOffer: openWithdraw,
    onFund: openFund,
    onRelease: openRelease,
    onRequestChanges: openRequestChanges,
    hasOutstandingOffer,
  };

  return (
    <PageShell accents={pageAccents} maxW="1180px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }}>
      <VStack align="stretch" gap={6}>
        <HStack
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={4}
          flexWrap="wrap"
        >
          <Button as={Link} to={backTarget} alignSelf="start" px={3} {...quietPillButtonStyles}>
            <ArrowLeft size={18} />
            Back
          </Button>
          <Button as={Link} to="/dashboard" px={6} {...subtlePillButtonStyles}>
            <LayoutDashboard size={17} />
            Dashboard
          </Button>
        </HStack>

        {job && isOwner ? (
          <VStack align="stretch" gap={3}>
            <HStack gap={3} align="center" flexWrap="wrap">
              <SectionEyebrow label={pageEyebrow} />
              {jobStatusLabel ? (
                <Badge
                  colorPalette={JOB_STATUS_PALETTE[job.status]}
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontWeight="semibold"
                >
                  {jobStatusLabel}
                </Badge>
              ) : null}
            </HStack>
            <Heading color="white" size={{ base: 'xl', md: '2xl' }} letterSpacing="-0.02em">
              {pageTitle}
            </Heading>
            {pageSubtitle ? (
              <Text color="rgba(226, 232, 240, 0.68)" maxW="720px" lineHeight="1.6">
                {pageSubtitle}
              </Text>
            ) : null}
            <HStack color="rgba(226, 232, 240, 0.6)" fontSize="sm" gap={2} flexWrap="wrap">
              {isHiring ? (
                <Text>
                  {proposalCount} {proposalCount === 1 ? 'proposal' : 'proposals'}
                </Text>
              ) : hiredBid ? (
                <Text>
                  Hired · {getDisplayName(hiredBid.freelancer)}
                  {hiredBid.amount != null
                    ? ` · ${formatCurrency(hiredBid.amount, currencyCode) || hiredBid.amount}`
                    : ''}
                </Text>
              ) : (
                <Text>
                  {proposalCount} {proposalCount === 1 ? 'proposal' : 'proposals'}
                </Text>
              )}
              <Text aria-hidden>·</Text>
              <Text>{formatBudgetLabel(job)}</Text>
              {payment?.status === 'AWAITING_FUNDING' ? (
                <>
                  <Text aria-hidden>·</Text>
                  <Text color="rgba(252, 211, 77, 0.95)" fontWeight="medium">
                    Awaiting escrow funding
                  </Text>
                </>
              ) : null}
              {payment?.status === 'ESCROWED' ? (
                <>
                  <Text aria-hidden>·</Text>
                  <Text color="rgba(134, 239, 172, 0.92)" fontWeight="medium">
                    {payment.changesRequestedAt
                      ? 'Changes requested'
                      : isOnChainPayment
                        ? 'Funds in on-chain escrow'
                        : 'Funds in escrow'}
                  </Text>
                </>
              ) : null}
              {payment?.status === 'IN_REVIEW' ? (
                <>
                  <Text aria-hidden>·</Text>
                  <Text color="rgba(125, 211, 252, 0.95)" fontWeight="medium">
                    Work submitted · in review
                  </Text>
                </>
              ) : null}
              {payment?.status === 'RELEASED' ? (
                <>
                  <Text aria-hidden>·</Text>
                  <Text color="rgba(134, 239, 172, 0.92)" fontWeight="medium">
                    Payment released
                  </Text>
                </>
              ) : null}
            </HStack>
          </VStack>
        ) : null}

        {loadingJob && !job ? (
          <JobsPageState
            title="Loading proposals"
            description="We are gathering the incoming offers from freelancers for this posted job."
          />
        ) : null}

        {jobError ? (
          <JobsPageState title="Unable to load job" description={jobError.message} tone="error" />
        ) : null}

        {!loadingJob && !jobError && !job ? (
          <JobsPageState
            title="Job not found"
            description="This posting may have been removed or is no longer available."
          />
        ) : null}

        {job && !isOwner ? (
          <JobsPageState
            title="Proposals are private"
            description="Only the client who posted this job can review its proposals."
          />
        ) : null}

        {job && isOwner ? (
          <>
            {loadingBids && proposalCount === 0 ? (
              <JobsPageState
                title={isContract ? 'Loading contract' : 'Loading proposals'}
                description={
                  isContract
                    ? 'Fetching the hired freelancer and proposal history.'
                    : 'Fetching the latest offers from freelancers.'
                }
              />
            ) : null}

            {bidsError && proposalCount === 0 ? (
              <JobsPageState title="Unable to load proposals" description={bidsError.message} tone="error" />
            ) : null}

            {paymentError ? (
              <JobsPageState
                title="Unable to load payment"
                description={paymentError.message}
                tone="error"
              />
            ) : null}

            {!loadingBids && !bidsError && proposalCount === 0 ? (
              <JobsPageState
                title="No proposals yet"
                description="When freelancers submit proposals for this job, they will appear here."
              />
            ) : null}

            {isContract && hiredBid ? (
              <VStack align="stretch" gap={3}>
                <Text
                  color="rgba(125, 211, 252, 0.9)"
                  fontSize="sm"
                  fontWeight="bold"
                  letterSpacing="0.04em"
                  textTransform="uppercase"
                >
                  Hired freelancer
                </Text>
                <ProposalCard
                  bid={hiredBid}
                  currencyCode={currencyCode}
                  jobStatus={job.status}
                  payment={payment}
                  emphasis
                  {...cardHandlers}
                />
                {job.status === 'IN_PROGRESS' && !loadingPayment && !payment && !paymentError ? (
                  <GlassPanel variant="soft" borderRadius="18px" p={4}>
                    <Text color="rgba(252, 211, 77, 0.95)" fontSize="sm" lineHeight="1.6">
                      No payment record was found for this contract. Hire may have completed without
                      creating escrow — try hiring again on a new open job, or check the backend logs.
                    </Text>
                  </GlassPanel>
                ) : null}
                {canFund ? (
                  <Text color="rgba(226, 232, 240, 0.55)" fontSize="sm">
                    Use <strong>Fund escrow</strong> to lock {pendingAmount || 'funds'} on-chain before
                    work starts. Both wallets must be connected.
                  </Text>
                ) : null}
                {payment?.status === 'IN_REVIEW' || payment?.workSubmissionMessage || payment?.changesRequestedMessage ? (
                  <GlassPanel variant="soft" borderRadius="18px" p={4}>
                    <VStack align="stretch" gap={2}>
                      {payment.status === 'IN_REVIEW' ? (
                        <Text color="rgba(125, 211, 252, 0.95)" fontSize="sm" fontWeight="semibold">
                          Work submitted for review
                        </Text>
                      ) : payment.changesRequestedMessage ? (
                        <Text color="rgba(252, 211, 77, 0.95)" fontSize="sm" fontWeight="semibold">
                          You requested changes
                        </Text>
                      ) : null}
                      {payment.workSubmissionMessage ? (
                        <Text color="rgba(226, 232, 240, 0.78)" fontSize="sm" lineHeight="1.6" whiteSpace="pre-line">
                          {payment.workSubmissionMessage}
                        </Text>
                      ) : payment.status === 'IN_REVIEW' ? (
                        <Text color="rgba(226, 232, 240, 0.62)" fontSize="sm">
                          The freelancer submitted work without a note.
                        </Text>
                      ) : null}
                      {payment.changesRequestedMessage ? (
                        <Text color="rgba(226, 232, 240, 0.68)" fontSize="sm" lineHeight="1.6" whiteSpace="pre-line">
                          {payment.changesRequestedMessage}
                        </Text>
                      ) : null}
                    </VStack>
                  </GlassPanel>
                ) : null}
                {canRequestChanges ? (
                  <Text color="rgba(226, 232, 240, 0.55)" fontSize="sm">
                    Use <strong>Approve &amp; release</strong> if the work is done, or{' '}
                    <strong>Request changes</strong> to send it back. Funds stay in escrow until you release.
                  </Text>
                ) : null}
                {canRelease && !canRequestChanges ? (
                  <Text color="rgba(226, 232, 240, 0.55)" fontSize="sm">
                    The freelancer can submit work from My proposals. You can still{' '}
                    <strong>Release payment</strong> without waiting.
                  </Text>
                ) : null}
              </VStack>
            ) : null}

            {isHiring && proposalCount > 0 ? (
              <VStack align="stretch" gap={4}>
                {bids.map((bid) => (
                  <ProposalCard
                    key={bid.id}
                    bid={bid}
                    currencyCode={currencyCode}
                    jobStatus={job.status}
                    payment={payment}
                    {...cardHandlers}
                  />
                ))}
              </VStack>
            ) : null}

            {isContract && otherBids.length > 0 ? (
              <VStack align="stretch" gap={3} pt={2}>
                <Text
                  color="rgba(226, 232, 240, 0.55)"
                  fontSize="sm"
                  fontWeight="bold"
                  letterSpacing="0.04em"
                  textTransform="uppercase"
                >
                  Other proposals ({otherBids.length})
                </Text>
                <Text color="rgba(226, 232, 240, 0.48)" fontSize="sm" mb={1}>
                  These freelancers were not selected for this job.
                </Text>
                <VStack align="stretch" gap={3}>
                  {otherBids.map((bid) => (
                    <ProposalCard
                      key={bid.id}
                      bid={bid}
                      currencyCode={currencyCode}
                      jobStatus={job.status}
                      payment={payment}
                      subdued
                      {...cardHandlers}
                    />
                  ))}
                </VStack>
              </VStack>
            ) : null}
          </>
        ) : null}
      </VStack>

      <FreelancerDrawer
        bid={selectedBid}
        currencyCode={currencyCode}
        jobStatus={job?.status}
        payment={payment}
        hasOutstandingOffer={hasOutstandingOffer}
        onClose={() => setSelectedBidId(null)}
        onOffer={openOffer}
        onWithdrawOffer={openWithdraw}
        onFund={openFund}
        onRelease={openRelease}
        onRequestChanges={openRequestChanges}
      />

      <ConfirmDialog
        open={!!pendingAction}
        title={dialogTitle}
        description={dialogDescription}
        confirmLabel={confirmLabel}
        colorPalette={actionType === 'requestChanges' ? 'orange' : 'green'}
        loading={actionLoading}
        error={actionError}
        onConfirm={handleConfirm}
        onClose={closeConfirm}
      >
        {actionType === 'requestChanges' ? (
          <Field.Root>
            <Field.Label color="rgba(226, 232, 240, 0.72)" fontSize="sm">
              What should they change? (optional)
            </Field.Label>
            <Textarea
              value={actionMessage}
              onChange={(event) => setActionMessage(event.target.value)}
              placeholder="Describe the changes you need."
              minH="110px"
              resize="vertical"
              maxLength={2000}
              {...inputStyles}
            />
          </Field.Root>
        ) : null}
      </ConfirmDialog>
    </PageShell>
  );
};

export default ProposalsPage;
