import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Badge, Button, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import {
  ACCEPT_BID,
  GET_JOB,
  GET_JOB_BIDS,
  GET_PAYMENT_FOR_JOB,
  RELEASE_PAYMENT,
} from '@/graphql/queries.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { quietPillButtonStyles, subtlePillButtonStyles } from '../../components/ui/buttonStyles.js';
import PageShell from '../../components/ui/PageShell.jsx';
import SectionEyebrow from '../../components/ui/SectionEyebrow.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import JobsPageState from './components/JobsPageState.jsx';
import ProposalCard from './components/ProposalCard.jsx';
import FreelancerDrawer from './components/FreelancerDrawer.jsx';
import { formatBudgetLabel, formatCurrency } from './utils.jsx';
import { getDisplayName } from '@/utils/user.js';

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
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const JOB_STATUS_PALETTE = {
  IN_PROGRESS: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const getBackTarget = (state) => (typeof state?.from === 'string' ? state.from : '/dashboard');

const ProposalsPage = () => {
  const { jobId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const backTarget = getBackTarget(location.state);
  const [selectedBidId, setSelectedBidId] = React.useState(null);
  const [pendingAction, setPendingAction] = React.useState(null);
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

  const { data: paymentData } = useQuery(GET_PAYMENT_FOR_JOB, {
    variables: { jobId },
    skip: !jobId || !isOwner,
    fetchPolicy: 'cache-and-network',
  });

  const bids = bidsData?.jobBids ?? [];
  const payment = paymentData?.paymentForJob ?? null;
  const currencyCode = job?.currencyCode || 'USD';
  const jobTitle = job?.title?.trim() || 'this job';
  const proposalCount = bids.length;

  const refetchQueries = [
    { query: GET_JOB, variables: { id: jobId } },
    { query: GET_JOB_BIDS, variables: { jobId } },
    { query: GET_PAYMENT_FOR_JOB, variables: { jobId } },
  ];

  const [acceptBid, { loading: hiring, error: hireError, reset: resetHire }] = useMutation(ACCEPT_BID, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  const [releasePayment, { loading: releasing, error: releaseError, reset: resetRelease }] = useMutation(
    RELEASE_PAYMENT,
    {
      refetchQueries,
      awaitRefetchQueries: true,
    }
  );

  // Resolve the open drawer against the latest bid data so a refetch keeps it
  // in sync, and so a stale selection closes itself if the bid disappears.
  const selectedBid = React.useMemo(
    () => (selectedBidId ? bids.find((bid) => bid.id === selectedBidId) ?? null : null),
    [bids, selectedBidId]
  );

  const openHire = (bid) => {
    resetHire?.();
    setPendingAction({ type: 'hire', bid });
  };

  const openRelease = (bid) => {
    resetRelease?.();
    setPendingAction({ type: 'release', bid });
  };

  const closeConfirm = () => setPendingAction(null);

  // Keep the dialog copy stable while it animates closed (pendingAction clears
  // the instant the action resolves, which would otherwise flash the other variant).
  if (pendingAction) {
    lastActionRef.current = pendingAction;
  }
  const dialogAction = pendingAction ?? lastActionRef.current;
  const isHire = dialogAction?.type === 'hire';
  const actionLoading = isHire ? hiring : releasing;
  const actionError = isHire ? hireError : releaseError;
  const pendingName = dialogAction ? getDisplayName(dialogAction.bid.freelancer) : '';
  const pendingAmount = dialogAction ? formatCurrency(dialogAction.bid.amount, currencyCode) : '';

  const handleConfirm = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      if (pendingAction.type === 'hire') {
        await acceptBid({ variables: { bidId: pendingAction.bid.id } });
      } else if (payment?.id) {
        await releasePayment({ variables: { paymentId: payment.id } });
      }
      setPendingAction(null);
    } catch {
      // The error is surfaced inside the confirm dialog via actionError.
    }
  };

  const jobStatusLabel = job ? JOB_STATUS_LABEL[job.status] : null;

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
              <SectionEyebrow label="Proposals" />
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
              Proposals for {jobTitle}
            </Heading>
            <HStack color="rgba(226, 232, 240, 0.6)" fontSize="sm" gap={2} flexWrap="wrap">
              <Text>
                {proposalCount} {proposalCount === 1 ? 'proposal' : 'proposals'}
              </Text>
              <Text aria-hidden>·</Text>
              <Text>{formatBudgetLabel(job)}</Text>
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
                title="Loading proposals"
                description="Fetching the latest offers from freelancers."
              />
            ) : null}

            {bidsError && proposalCount === 0 ? (
              <JobsPageState title="Unable to load proposals" description={bidsError.message} tone="error" />
            ) : null}

            {!loadingBids && !bidsError && proposalCount === 0 ? (
              <JobsPageState
                title="No proposals yet"
                description="When freelancers submit proposals for this job, they will appear here."
              />
            ) : null}

            {proposalCount > 0 ? (
              <VStack align="stretch" gap={4}>
                {bids.map((bid) => (
                  <ProposalCard
                    key={bid.id}
                    bid={bid}
                    currencyCode={currencyCode}
                    jobStatus={job.status}
                    payment={payment}
                    onOpenFreelancer={(selected) => setSelectedBidId(selected.id)}
                    onHire={openHire}
                    onRelease={openRelease}
                  />
                ))}
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
        onClose={() => setSelectedBidId(null)}
        onHire={openHire}
        onRelease={openRelease}
      />

      <ConfirmDialog
        open={!!pendingAction}
        title={isHire ? `Hire ${pendingName}?` : 'Release payment?'}
        description={
          isHire
            ? `Accepting ${pendingName}'s proposal declines every other proposal and moves ${pendingAmount} into escrow.`
            : `This releases ${pendingAmount} to ${pendingName} and marks the job complete. This cannot be undone.`
        }
        confirmLabel={isHire ? 'Hire' : 'Release payment'}
        colorPalette="green"
        loading={actionLoading}
        error={actionError}
        onConfirm={handleConfirm}
        onClose={closeConfirm}
      />
    </PageShell>
  );
};

export default ProposalsPage;
