import React from 'react';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { Badge, Box, Button, HStack, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { ArrowLeft, BriefcaseBusiness, Clock3, SendHorizontal } from 'lucide-react';
import { GET_MY_BIDS } from '../graphql/queries';
import GlassPanel from '../components/ui/GlassPanel.jsx';
import PageShell from '../components/ui/PageShell.jsx';
import AttachmentDownloadList from '../components/ui/AttachmentDownloadList.jsx';
import { quietPillButtonStyles, subtlePillButtonStyles } from '../components/ui/buttonStyles.js';

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

const formatMoney = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
  }).format(Number(amount));

const formatJobBudget = (job) => {
  const currency = job.currencyCode || 'USD';

  if (job.budgetType === 'HOURLY') {
    const min = Number(job.hourlyRateMin);
    const max = Number(job.hourlyRateMax);
    return job.hourlyRateMin != null && job.hourlyRateMax != null && Number.isFinite(min) && Number.isFinite(max)
      ? `${formatMoney(min, currency)} - ${formatMoney(max, currency)}/hr`
      : 'Hourly budget not set';
  }

  if (job.budgetType === 'FIXED') {
    const fixedBudget = Number(job.fixedBudget);
    return job.fixedBudget != null && Number.isFinite(fixedBudget) ? formatMoney(fixedBudget, currency) : 'Fixed budget not set';
  }

  return 'Budget not set';
};

const getStatusPalette = (status) => {
  if (status === 'ACCEPTED') {
    return 'green';
  }

  if (status === 'REJECTED') {
    return 'red';
  }

  return 'yellow';
};

const MyBidCard = ({ bid }) => (
  <GlassPanel as="article" variant="subtle" borderRadius="22px" p={{ base: 5, md: 6 }}>
    <VStack align="stretch" gap={5}>
      <HStack justify="space-between" align="start" gap={4}>
        <Box minW="0">
          <Heading as="h2" size="md" color="white" letterSpacing="0" lineHeight="1.35">
            {bid.job.title}
          </Heading>
          <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm" mt={1}>
            Job budget: {formatJobBudget(bid.job)}
          </Text>
          {bid.status === 'ACCEPTED' && bid.job.status ? (
            <Text color="rgba(134, 239, 172, 0.9)" fontSize="sm" fontWeight="medium" mt={1}>
              {bid.job.status === 'COMPLETED' ? 'Completed · paid' : 'Hired · in progress'}
            </Text>
          ) : null}
        </Box>
        <Badge colorPalette={getStatusPalette(bid.status)} borderRadius="full" px={3} py={1} flex="0 0 auto">
          {bid.status}
        </Badge>
      </HStack>

      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
        <HStack gap={3} align="start">
          <Box color="cyan.200" mt={0.5}>
            <BriefcaseBusiness size={18} />
          </Box>
          <Box>
            <Text color="rgba(226, 232, 240, 0.5)" fontSize="xs" fontWeight="bold" textTransform="uppercase">
              Your bid
            </Text>
            <Text color="white" fontWeight="semibold">
              {formatMoney(bid.amount, bid.job.currencyCode || 'USD')}
            </Text>
          </Box>
        </HStack>
        <HStack gap={3} align="start">
          <Box color="cyan.200" mt={0.5}>
            <Clock3 size={18} />
          </Box>
          <Box>
            <Text color="rgba(226, 232, 240, 0.5)" fontSize="xs" fontWeight="bold" textTransform="uppercase">
              Delivery
            </Text>
            <Text color="white" fontWeight="semibold">
              {bid.deliveryTime} {bid.deliveryTime === 1 ? 'day' : 'days'}
            </Text>
          </Box>
        </HStack>
      </SimpleGrid>

      <Box>
        <Text color="rgba(226, 232, 240, 0.5)" fontSize="xs" fontWeight="bold" textTransform="uppercase" mb={2}>
          Proposal
        </Text>
        <Text color="rgba(226, 232, 240, 0.76)" lineHeight="1.75" whiteSpace="pre-line">
          {bid.proposal}
        </Text>
      </Box>

      {bid.relevantExperience ? (
        <Box>
          <Text color="rgba(226, 232, 240, 0.5)" fontSize="xs" fontWeight="bold" textTransform="uppercase" mb={2}>
            Recent experience
          </Text>
          <Text color="rgba(226, 232, 240, 0.76)" lineHeight="1.75" whiteSpace="pre-line">
            {bid.relevantExperience}
          </Text>
        </Box>
      ) : null}

      <AttachmentDownloadList attachments={bid.attachments ?? []} label="Attachments" />

      <Button as={Link} to={`/jobs/${bid.job.id}`} alignSelf="start" px={5} {...subtlePillButtonStyles}>
        View job
      </Button>
    </VStack>
  </GlassPanel>
);

const MyBids = () => {
  const { data, loading, error } = useQuery(GET_MY_BIDS, {
    fetchPolicy: 'cache-and-network',
  });
  const bids = data?.myBids ?? [];

  return (
    <PageShell accents={pageAccents} maxW="1120px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }}>
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4} flexWrap="wrap">
          <Button as={Link} to="/dashboard" alignSelf="start" px={3} {...quietPillButtonStyles}>
            <ArrowLeft size={18} />
            Dashboard
          </Button>
          <Button as={Link} to="/jobs" px={6} {...subtlePillButtonStyles}>
            <SendHorizontal size={17} />
            Find jobs
          </Button>
        </HStack>

        <GlassPanel variant="solid" borderRadius="28px" p={{ base: 5, md: 8 }}>
          <VStack align="stretch" gap={2}>
            <Heading as="h1" size={{ base: 'xl', md: '2xl' }} color="white" letterSpacing="0">
              My proposals
            </Heading>
            <Text color="rgba(226, 232, 240, 0.64)">
              Track proposals you have sent. 0 connects are charged during the MVP.
            </Text>
          </VStack>
        </GlassPanel>

        {loading && !data ? (
          <GlassPanel variant="subtle" borderRadius="22px" p={6}>
            <Text color="rgba(226, 232, 240, 0.72)">Loading your proposals...</Text>
          </GlassPanel>
        ) : null}

        {error ? (
          <GlassPanel variant="subtle" borderRadius="22px" p={6} borderColor="rgba(248, 113, 113, 0.34)">
            <Text color="red.200">Error: {error.message}</Text>
          </GlassPanel>
        ) : null}

        {!loading && !error && bids.length === 0 ? (
          <GlassPanel variant="subtle" borderRadius="22px" p={{ base: 6, md: 8 }}>
            <VStack align="center" gap={4} textAlign="center">
              <Heading as="h2" size="md" color="white" letterSpacing="0">
                No proposals yet
              </Heading>
              <Text color="rgba(226, 232, 240, 0.62)" maxW="520px">
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
              <MyBidCard key={bid.id} bid={bid} />
            ))}
          </VStack>
        ) : null}
      </VStack>
    </PageShell>
  );
};

export default MyBids;
