import React from 'react';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { GET_JOBS } from '../graphql/queries';
import GlassPanel from '../components/ui/GlassPanel';
import PageShell from '../components/ui/PageShell';
import SectionEyebrow from '../components/ui/SectionEyebrow';

const pageAccents = [
  {
    top: '-160px',
    left: '-120px',
    w: '380px',
    h: '380px',
    bg: 'rgba(6, 182, 212, 0.14)',
    filter: 'blur(32px)',
  },
  {
    top: '140px',
    right: '-110px',
    w: '340px',
    h: '340px',
    bg: 'rgba(16, 185, 129, 0.14)',
    filter: 'blur(30px)',
  },
];

const formatBudget = (budget) => {
  const value = Number(budget);

  if (Number.isNaN(value)) {
    return '$0';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
};

const formatBudgetLabel = (job) => {
  if (job.budgetType === 'HOURLY') {
    return `${formatBudget(job.hourlyRateMin)}-${formatBudget(job.hourlyRateMax)}/hr`;
  }

  if (job.budgetType === 'FIXED') {
    return formatBudget(job.fixedBudget);
  }

  return 'Budget TBD';
};

const PageState = ({ title, description, tone = 'default' }) => (
  <GlassPanel
    variant="soft"
    borderRadius="28px"
    p={{ base: 6, md: 8 }}
    textAlign="center"
    borderColor={tone === 'error' ? 'rgba(248, 113, 113, 0.3)' : undefined}
  >
    <VStack gap={3}>
      <Heading size="md" color="white">
        {title}
      </Heading>
      <Text color={tone === 'error' ? 'red.200' : 'rgba(226, 232, 240, 0.7)'} maxW="520px">
        {description}
      </Text>
    </VStack>
  </GlassPanel>
);

const JobCard = ({ job }) => (
  <GlassPanel
    variant="subtle"
    borderRadius="28px"
    p={6}
    h="full"
    transition="all 0.28s ease"
    _hover={{
      transform: 'translateY(-6px)',
      borderColor: 'rgba(103, 232, 249, 0.28)',
      boxShadow: '0 24px 50px rgba(2, 6, 23, 0.28)',
    }}
  >
    <VStack align="stretch" gap={5} h="full">
      <HStack justify="space-between" align="start" gap={4}>
        <VStack align="start" gap={2}>
          <Badge colorPalette="cyan" variant="subtle" px={3} py={1} borderRadius="full">
            Open Opportunity
          </Badge>
          <Heading size="md" color="white" lineHeight="1.2">
            {job.title}
          </Heading>
        </VStack>
        <Text
          color="green.300"
          fontSize={{ base: 'xl', md: '2xl' }}
          fontWeight="bold"
          letterSpacing="-0.03em"
          textAlign="right"
        >
          {formatBudgetLabel(job)}
        </Text>
      </HStack>

      <HStack gap={3} flexWrap="wrap">
        <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm" textTransform="uppercase" letterSpacing="0.08em">
          Client
        </Text>
        <Text color="rgba(226, 232, 240, 0.82)" fontSize="sm" fontWeight="semibold">
          {job.client.username}
        </Text>
      </HStack>

      <Text color="rgba(226, 232, 240, 0.72)" lineHeight="1.8" flex={1}>
        {job.description}
      </Text>

      <HStack justify="space-between" align="center" pt={2} flexWrap="wrap" gap={3}>
        <Text color="rgba(226, 232, 240, 0.54)" fontSize="sm">
          Escrow-ready freelance listing
        </Text>
        <Button
          type="button"
          borderRadius="full"
          bgGradient="to-r"
          gradientFrom="cyan.400"
          gradientTo="blue.500"
          color="gray.950"
          fontWeight="bold"
          px={6}
          _hover={{
            bgGradient: 'to-r',
            gradientFrom: 'cyan.300',
            gradientTo: 'blue.400',
          }}
        >
          Place Bid
        </Button>
      </HStack>
    </VStack>
  </GlassPanel>
);

const Jobs = () => {
  const { data, loading, error } = useQuery(GET_JOBS, {
    variables: { status: 'OPEN', limit: 20, offset: 0 },
  });

  const jobs = data?.jobs ?? [];

  return (
    <PageShell accents={pageAccents} maxW="1120px" py={{ base: 8, md: 10 }}>
      <VStack align="stretch" gap={8}>
        <GlassPanel variant="solid" borderRadius="36px" p={{ base: 6, md: 8 }}>
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            justify="space-between"
            align={{ base: 'start', lg: 'center' }}
            gap={6}
          >
            <VStack align="start" gap={4} maxW="680px">
              <SectionEyebrow label="Marketplace Feed" dotColor="cyan.300" />
              <Heading
                size={{ base: 'xl', md: '2xl' }}
                color="white"
                lineHeight="1.05"
                letterSpacing="-0.03em"
              >
                Discover open jobs that fit your next sprint.
              </Heading>
              <Text color="rgba(226, 232, 240, 0.72)" fontSize={{ base: 'md', md: 'lg' }}>
                Browse active listings, review budgets quickly, and keep the next bidding step
                clear and focused.
              </Text>
            </VStack>

            <Button
              as={Link}
              to="/dashboard"
              variant="outline"
              colorPalette="gray"
              borderRadius="full"
              px={6}
            >
              Back to Dashboard
            </Button>
          </Stack>
        </GlassPanel>

        <HStack
          justify="space-between"
          align={{ base: 'start', md: 'center' }}
          flexWrap="wrap"
          gap={4}
        >
          <Box>
            <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm" textTransform="uppercase" letterSpacing="0.08em" mb={2}>
              Open Listings
            </Text>
            <Heading size="lg" color="white">
              {loading ? 'Loading jobs...' : `${jobs.length} opportunities available`}
            </Heading>
          </Box>

          {!loading && jobs.length > 0 && (
            <Badge colorPalette="green" px={4} py={2} borderRadius="full" fontSize="sm">
              Status: OPEN
            </Badge>
          )}
        </HStack>

        {loading ? (
          <PageState
            title="Loading jobs"
            description="We are pulling the latest open opportunities for you now."
          />
        ) : null}

        {error ? (
          <PageState
            title="Unable to load jobs"
            description={error.message}
            tone="error"
          />
        ) : null}

        {!loading && !error && jobs.length > 0 ? (
          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </SimpleGrid>
        ) : null}

        {!loading && !error && jobs.length === 0 ? (
          <PageState
            title="No jobs available right now"
            description="New listings will show up here once clients publish open work to the marketplace."
          />
        ) : null}
      </VStack>
    </PageShell>
  );
};

export default Jobs;
