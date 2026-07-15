import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Box, Button, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import {
  GET_JOB,
  GET_MY_BID_FOR_JOB,
  GET_MY_SAVED_JOBS,
  GET_SAVED_JOB_IDS,
  SAVE_JOB,
  UNSAVE_JOB,
} from '@/graphql/queries.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { quietPillButtonStyles, subtlePillButtonStyles } from '../../components/ui/buttonStyles.js';
import PageShell from '../../components/ui/PageShell.jsx';
import JobDetailContent from './components/JobDetailContent.jsx';
import JobDetailSidebar from './components/JobDetailSidebar.jsx';
import JobsPageState from './components/JobsPageState.jsx';
import { addSavedJobIdToCache, removeSavedJobIdFromCache } from './savedJobsCache.js';

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

const getBackTarget = (state) => (typeof state?.from === 'string' ? state.from : '/jobs');

const JobDetailPage = () => {
  const { jobId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const backTarget = getBackTarget(location.state);
  const isFreelancer = user?.role === 'FREELANCER';
  const { data, loading, error } = useQuery(GET_JOB, {
    variables: { id: jobId },
    skip: !jobId,
    fetchPolicy: 'cache-and-network',
  });
  const { data: myBidData, loading: loadingMyBid } = useQuery(GET_MY_BID_FOR_JOB, {
    variables: { jobId },
    skip: !jobId || !isFreelancer,
    fetchPolicy: 'cache-and-network',
  });
  const { data: savedJobsData } = useQuery(GET_SAVED_JOB_IDS, {
    fetchPolicy: 'cache-and-network',
  });
  const [saveJob, { loading: savingJob }] = useMutation(SAVE_JOB, {
    optimisticResponse: ({ id }) => ({
      saveJob: {
        __typename: 'Job',
        id,
        status: 'OPEN',
      },
    }),
    update: (cache, _result, { variables }) => addSavedJobIdToCache(cache, variables.id),
    refetchQueries: [{ query: GET_SAVED_JOB_IDS }, { query: GET_MY_SAVED_JOBS }],
    awaitRefetchQueries: true,
  });
  const [unsaveJob, { loading: unsavingJob }] = useMutation(UNSAVE_JOB, {
    optimisticResponse: ({ id }) => ({
      unsaveJob: {
        __typename: 'Job',
        id,
        status: 'OPEN',
      },
    }),
    update: (cache, _result, { variables }) => removeSavedJobIdFromCache(cache, variables.id),
    refetchQueries: [{ query: GET_SAVED_JOB_IDS }, { query: GET_MY_SAVED_JOBS }],
    awaitRefetchQueries: true,
  });
  const job = data?.job;
  const myBid = myBidData?.myBidForJob ?? null;
  const savedJobIdSet = React.useMemo(
    () => new Set((savedJobsData?.savedJobIds ?? []).map(String)),
    [savedJobsData]
  );
  const isSaved = job ? savedJobIdSet.has(String(job.id)) : false;

  const handleToggleSaved = () => {
    if (!job) {
      return;
    }

    const variables = { id: job.id };
    if (isSaved) {
      unsaveJob({ variables });
      return;
    }
    saveJob({ variables });
  };

  return (
    <PageShell accents={pageAccents} maxW="1280px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }}>
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4} flexWrap="wrap">
          <Button as={Link} to={backTarget} alignSelf="start" px={3} {...quietPillButtonStyles}>
            <ArrowLeft size={18} />
            Back to search
          </Button>
          <Button as={Link} to="/dashboard" px={6} {...subtlePillButtonStyles}>
            <LayoutDashboard size={17} />
            Dashboard
          </Button>
        </HStack>

        {loading && !job ? (
          <JobsPageState
            title="Loading job details"
            description="We are pulling together the scope, budget, client context, and proposal readiness."
          />
        ) : null}

        {error ? (
          <JobsPageState
            title="Unable to load job"
            description={error.message}
            tone="error"
          />
        ) : null}

        {!loading && !error && !job ? (
          <JobsPageState
            title="Job not found"
            description="This opportunity may have been removed or is no longer available."
          />
        ) : null}

        {job ? (
          <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 320px' }} gap={{ base: 6, xl: 8 }} alignItems="start">
            <Box minW="0">
              <JobDetailContent job={job} />
            </Box>
            <JobDetailSidebar
              job={job}
              saved={isSaved}
              saving={savingJob || unsavingJob}
              userRole={user?.role}
              myBid={myBid}
              loadingMyBid={loadingMyBid}
              onToggleSaved={handleToggleSaved}
            />
          </Grid>
        ) : null}

        {job?.status && job.status !== 'OPEN' ? (
          <Text color="orange.200" fontSize="sm" textAlign="center">
            This job is currently {job.status.toLowerCase().replace('_', ' ')}. Proposal actions should stay disabled.
          </Text>
        ) : null}
      </VStack>
    </PageShell>
  );
};

export default JobDetailPage;
