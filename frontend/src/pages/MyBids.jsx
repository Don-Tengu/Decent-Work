import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { Badge, Box, Button, Field, HStack, Heading, SimpleGrid, Text, Textarea, VStack } from '@chakra-ui/react';
import { ArrowLeft, BriefcaseBusiness, Clock3, SendHorizontal } from 'lucide-react';
import {
  ACCEPT_OFFER,
  DECLINE_OFFER,
  GET_MY_BIDS,
  GET_MY_NOTIFICATIONS,
  SUBMIT_WORK,
  UNREAD_NOTIFICATION_COUNT,
} from '../graphql/queries';
import GlassPanel from '../components/ui/GlassPanel.jsx';
import PageShell from '../components/ui/PageShell.jsx';
import AttachmentDownloadList from '../components/ui/AttachmentDownloadList.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import NotificationBell from '../components/ui/NotificationBell.jsx';
import {
  greenSolidButtonStyles,
  quietPillButtonStyles,
  subtlePillButtonStyles,
} from '../components/ui/buttonStyles.js';
import { inputStyles } from './post-job/styles.js';
import { getFreelancerWorkFlags } from './jobs/paymentActions.js';
import { formatCurrency } from './jobs/utils.jsx';

const pageAccents = [
  {
    top: '-150px',
    left: '-120px',
    w: '360px',
    h: '360px',
    bg: 'rgba(6, 182, 212, 0.12)',
    filter: 'blur(34px)',
  },
  {
    top: '180px',
    right: '-110px',
    w: '320px',
    h: '320px',
    bg: 'rgba(16, 185, 129, 0.12)',
    filter: 'blur(32px)',
  },
];

const BID_SORT_RANK = {
  OFFERED: 0,
  ACCEPTED: 1,
  PENDING: 2,
  REJECTED: 3,
};

const formatJobBudget = (job) => {
  const currency = job.currencyCode || 'USD';

  if (job.budgetType === 'HOURLY') {
    const min = formatCurrency(job.hourlyRateMin, currency);
    const max = formatCurrency(job.hourlyRateMax, currency);
    return min && max ? `${min} - ${max}/hr` : 'Hourly budget not set';
  }

  if (job.budgetType === 'FIXED') {
    return formatCurrency(job.fixedBudget, currency) || 'Fixed budget not set';
  }

  return 'Budget not set';
};

const getStatusPalette = (status) => {
  if (status === 'OFFERED') {
    return 'cyan';
  }
  if (status === 'ACCEPTED') {
    return 'green';
  }
  if (status === 'REJECTED') {
    return 'red';
  }
  return 'yellow';
};

const getStatusLabel = (status) => {
  if (status === 'OFFERED') {
    return 'Offer received';
  }
  if (status === 'ACCEPTED') {
    return 'Hired';
  }
  if (status === 'REJECTED') {
    return 'Not selected';
  }
  return 'Pending';
};

const graphqlErrorMessage = (err) =>
  err?.graphQLErrors?.[0]?.message || err?.message || 'Something went wrong';

const MyBidCard = ({ bid, onAccept, onDecline, onSubmitWork }) => {
  const isOffered = bid.status === 'OFFERED';
  const isAccepted = bid.status === 'ACCEPTED';
  const { canSubmitWork, awaitingReview, changesRequested, contractCopy } = getFreelancerWorkFlags(bid);

  return (
    <GlassPanel
      as="article"
      variant="subtle"
      borderRadius="22px"
      p={{ base: 5, md: 6 }}
      borderColor={isOffered ? 'border.default' : undefined}
      boxShadow={isOffered ? '0 18px 48px rgba(6, 182, 212, 0.12)' : undefined}
    >
      <VStack align="stretch" gap={5}>
        <HStack justify="space-between" align="start" gap={4}>
          <Box minW="0">
            <Heading as="h2" size="md" color="fg.default" letterSpacing="0" lineHeight="1.35">
              {bid.job.title}
            </Heading>
            <Text color="fg.muted" fontSize="sm" mt={1}>
              Job budget: {formatJobBudget(bid.job)}
            </Text>
            {isOffered ? (
              <Text color="fg.muted" fontSize="sm" fontWeight="medium" mt={1}>
                The client sent you an offer. Accept to start the contract, or decline to stay in the pool.
              </Text>
            ) : null}
            {isAccepted && contractCopy ? (
              <Text color="fg.muted" fontSize="sm" fontWeight="medium" mt={1}>
                {contractCopy}
              </Text>
            ) : null}
            {changesRequested && bid.payment?.changesRequestedMessage ? (
              <Text color="fg.muted" fontSize="sm" mt={2} whiteSpace="pre-line">
                {bid.payment.changesRequestedMessage}
              </Text>
            ) : null}
            {awaitingReview && bid.payment?.workSubmissionMessage ? (
              <Text color="fg.muted" fontSize="sm" mt={2} whiteSpace="pre-line">
                You submitted: {bid.payment.workSubmissionMessage}
              </Text>
            ) : null}
          </Box>
          <Badge
            variant="outline"
            color="fg.default"
            borderColor="border.default"
            bg="transparent"
            borderRadius="8px"
            px={3}
            py={1}
            flex="0 0 auto"
          >
            {getStatusLabel(bid.status)}
          </Badge>
        </HStack>

        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
          <HStack gap={3} align="start">
            <Box color="fg.muted" mt={0.5}>
              <BriefcaseBusiness size={18} />
            </Box>
            <Box>
              <Text color="fg.subtle" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                Your bid
              </Text>
              <Text color="fg.default" fontWeight="semibold">
                {formatCurrency(bid.amount, bid.job.currencyCode || 'USD') || bid.amount}
              </Text>
            </Box>
          </HStack>
          <HStack gap={3} align="start">
            <Box color="fg.muted" mt={0.5}>
              <Clock3 size={18} />
            </Box>
            <Box>
              <Text color="fg.subtle" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                Delivery
              </Text>
              <Text color="fg.default" fontWeight="semibold">
                {bid.deliveryTime} {bid.deliveryTime === 1 ? 'day' : 'days'}
              </Text>
            </Box>
          </HStack>
        </SimpleGrid>

        <Box>
          <Text color="fg.subtle" fontSize="xs" fontWeight="bold" textTransform="uppercase" mb={2}>
            Proposal
          </Text>
          <Text color="fg.muted" lineHeight="1.75" whiteSpace="pre-line">
            {bid.proposal}
          </Text>
        </Box>

        {bid.relevantExperience ? (
          <Box>
            <Text color="fg.subtle" fontSize="xs" fontWeight="bold" textTransform="uppercase" mb={2}>
              Recent experience
            </Text>
            <Text color="fg.muted" lineHeight="1.75" whiteSpace="pre-line">
              {bid.relevantExperience}
            </Text>
          </Box>
        ) : null}

        <AttachmentDownloadList attachments={bid.attachments ?? []} label="Attachments" />

        <HStack gap={3} flexWrap="wrap">
          {isOffered ? (
            <>
              <Button type="button" onClick={() => onAccept?.(bid)} px={5} {...greenSolidButtonStyles}>
                Accept offer
              </Button>
              <Button type="button" onClick={() => onDecline?.(bid)} px={5} {...subtlePillButtonStyles}>
                Decline
              </Button>
            </>
          ) : null}
          {canSubmitWork ? (
            <Button type="button" onClick={() => onSubmitWork?.(bid)} px={5} {...greenSolidButtonStyles}>
              Submit work
            </Button>
          ) : null}
          <Button as={Link} to={`/jobs/${bid.job.id}`} alignSelf="start" px={5} {...subtlePillButtonStyles}>
            View job
          </Button>
        </HStack>
      </VStack>
    </GlassPanel>
  );
};

const MyBids = () => {
  const { data, loading, error } = useQuery(GET_MY_BIDS, {
    fetchPolicy: 'cache-and-network',
  });
  const [pendingAction, setPendingAction] = React.useState(null);
  const [actionError, setActionError] = React.useState(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState('');

  const refetchQueries = [
    { query: GET_MY_BIDS },
    { query: GET_MY_NOTIFICATIONS, variables: { limit: 12 } },
    { query: UNREAD_NOTIFICATION_COUNT },
  ];

  const [acceptOffer] = useMutation(ACCEPT_OFFER, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  const [declineOffer] = useMutation(DECLINE_OFFER, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  const [submitWork] = useMutation(SUBMIT_WORK, {
    refetchQueries,
    awaitRefetchQueries: true,
  });

  const bids = React.useMemo(() => {
    const list = data?.myBids ?? [];
    return [...list].sort((a, b) => {
      const rankA = BID_SORT_RANK[a.status] ?? 9;
      const rankB = BID_SORT_RANK[b.status] ?? 9;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return 0;
    });
  }, [data?.myBids]);

  const offeredCount = bids.filter((bid) => bid.status === 'OFFERED').length;

  const openAccept = (bid) => {
    setActionError(null);
    setPendingAction({ type: 'accept', bid });
  };

  const openDecline = (bid) => {
    setActionError(null);
    setPendingAction({ type: 'decline', bid });
  };

  const openSubmitWork = (bid) => {
    setActionError(null);
    setActionMessage('');
    setPendingAction({ type: 'submit', bid });
  };

  const closeConfirm = () => {
    if (!actionLoading) {
      setPendingAction(null);
      setActionError(null);
      setActionMessage('');
    }
  };

  const handleConfirm = async () => {
    if (!pendingAction) {
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      if (pendingAction.type === 'accept') {
        await acceptOffer({ variables: { bidId: pendingAction.bid.id } });
      } else if (pendingAction.type === 'decline') {
        await declineOffer({ variables: { bidId: pendingAction.bid.id } });
      } else if (pendingAction.type === 'submit') {
        await submitWork({
          variables: {
            jobId: pendingAction.bid.job.id,
            message: actionMessage.trim() || null,
          },
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

  const dialogTitle =
    pendingAction?.type === 'accept'
      ? 'Accept this offer?'
      : pendingAction?.type === 'decline'
        ? 'Decline this offer?'
        : pendingAction?.type === 'submit'
          ? 'Submit work?'
          : '';
  const dialogDescription =
    pendingAction?.type === 'accept'
      ? `Accepting starts the contract for "${pendingAction.bid.job.title}". Competing proposals will be closed.`
      : pendingAction?.type === 'decline'
        ? `Your proposal for "${pendingAction.bid.job.title}" returns to pending so the client can offer someone else.`
        : pendingAction?.type === 'submit'
          ? `This tells the client the work for "${pendingAction.bid.job.title}" is ready to review. They can approve & release or request changes. Optional note below.`
          : '';
  const confirmLabel =
    pendingAction?.type === 'decline'
      ? 'Decline offer'
      : pendingAction?.type === 'submit'
        ? 'Submit work'
        : 'Accept offer';

  return (
    <PageShell accents={pageAccents} maxW="1120px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }}>
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4} flexWrap="wrap">
          <Button as={Link} to="/dashboard" alignSelf="start" px={3} {...quietPillButtonStyles}>
            <ArrowLeft size={18} />
            Dashboard
          </Button>
          <HStack gap={2}>
            <NotificationBell />
            <Button as={Link} to="/jobs" px={6} {...subtlePillButtonStyles}>
              <SendHorizontal size={17} />
              Find jobs
            </Button>
          </HStack>
        </HStack>

        <GlassPanel variant="solid" borderRadius="28px" p={{ base: 5, md: 8 }}>
          <VStack align="stretch" gap={2}>
            <Heading as="h1" size={{ base: 'xl', md: '2xl' }} color="fg.default" letterSpacing="0">
              My proposals
            </Heading>
            <Text color="fg.muted">
              Track proposals, respond to offers, submit finished work, and open active contracts here. Marketplace
              search only lists open jobs — use this page after you are offered or hired.
            </Text>
            {offeredCount > 0 ? (
              <Text color="rgba(125, 211, 252, 0.95)" fontWeight="semibold" mt={1}>
                {offeredCount} {offeredCount === 1 ? 'offer needs' : 'offers need'} your response
              </Text>
            ) : null}
          </VStack>
        </GlassPanel>

        {loading && !data ? (
          <GlassPanel variant="subtle" borderRadius="22px" p={6}>
            <Text color="fg.muted">Loading your proposals...</Text>
          </GlassPanel>
        ) : null}

        {error ? (
          <GlassPanel variant="subtle" borderRadius="22px" p={6} borderColor="rgba(248, 113, 113, 0.34)">
            <Text color="red.700">Error: {error.message}</Text>
          </GlassPanel>
        ) : null}

        {!loading && !error && bids.length === 0 ? (
          <GlassPanel variant="subtle" borderRadius="22px" p={{ base: 6, md: 8 }}>
            <VStack align="center" gap={4} textAlign="center">
              <Heading as="h2" size="md" color="fg.default" letterSpacing="0">
                No proposals yet
              </Heading>
              <Text color="fg.muted" maxW="520px">
                Browse open jobs and submit your first proposal when the scope is a good fit.
              </Text>
              <Button as={Link} to="/jobs" px={6} {...subtlePillButtonStyles}>
                <SendHorizontal size={17} />
                Browse jobs
              </Button>
            </VStack>
          </GlassPanel>
        ) : null}

        {bids.length ? (
          <VStack align="stretch" gap={4}>
            {bids.map((bid) => (
              <MyBidCard
                key={bid.id}
                bid={bid}
                onAccept={openAccept}
                onDecline={openDecline}
                onSubmitWork={openSubmitWork}
              />
            ))}
          </VStack>
        ) : null}
      </VStack>

      <ConfirmDialog
        open={!!pendingAction}
        title={dialogTitle}
        description={dialogDescription}
        confirmLabel={confirmLabel}
        colorPalette={pendingAction?.type === 'decline' ? 'red' : 'green'}
        loading={actionLoading}
        error={actionError}
        onConfirm={handleConfirm}
        onClose={closeConfirm}
      >
        {pendingAction?.type === 'submit' ? (
          <Field.Root>
            <Field.Label color="fg.muted" fontSize="sm">
              Note to the client (optional)
            </Field.Label>
            <Textarea
              value={actionMessage}
              onChange={(event) => setActionMessage(event.target.value)}
              placeholder="What did you deliver, and where can they find it?"
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

export default MyBids;
