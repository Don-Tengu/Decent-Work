import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useSearchParams } from 'react-router-dom';
import { Box, Button, Grid, HStack, Heading, Text, VStack } from '@chakra-ui/react';
import {
  GET_JOBS_PAGE,
  GET_MY_SAVED_JOBS,
  GET_SAVED_JOB_IDS,
  GET_SKILL_TAXONOMY,
  SAVE_JOB,
  UNSAVE_JOB,
} from '@/graphql/queries.js';
import { subtlePillButtonStyles } from '../../components/ui/buttonStyles.js';
import GlassPanel from '../../components/ui/GlassPanel.jsx';
import PageShell from '../../components/ui/PageShell.jsx';
import JobsFilterSidebar from './components/JobsFilterSidebar.jsx';
import JobsPagination from './components/JobsPagination.jsx';
import JobsPageState from './components/JobsPageState.jsx';
import JobResultCard from './components/JobResultCard.jsx';
import JobsResultsToolbar from './components/JobsResultsToolbar.jsx';
import JobsSearchBar from './components/JobsSearchBar.jsx';
import { JOBS_PAGE_SIZE, SEARCH_PARAM_KEYS } from './constants.js';
import { addSavedJobIdToCache, removeSavedJobIdFromCache } from './savedJobsCache.js';
import { getParamList, setParamList } from './utils.jsx';

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

const getPageIndex = (searchParams) => {
  const page = Number.parseInt(searchParams.get(SEARCH_PARAM_KEYS.page) ?? '1', 10);
  return Number.isInteger(page) && page > 0 ? page - 1 : 0;
};

const JobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get(SEARCH_PARAM_KEYS.query)?.trim() ?? '';
  const selectedCategoryIds = getParamList(searchParams, SEARCH_PARAM_KEYS.categories);
  const selectedSpecialtyIds = getParamList(searchParams, SEARCH_PARAM_KEYS.specialties);
  const selectedExperiences = getParamList(searchParams, SEARCH_PARAM_KEYS.experience);
  const selectedBudgetTypes = getParamList(searchParams, SEARCH_PARAM_KEYS.budgetType);
  const sort = searchParams.get(SEARCH_PARAM_KEYS.sort) || 'BEST_MATCH';
  const pageIndex = getPageIndex(searchParams);
  const [searchDraft, setSearchDraft] = React.useState(query);
  const [savedSearch, setSavedSearch] = React.useState(false);

  React.useEffect(() => {
    setSearchDraft(query);
  }, [query]);

  const { data: taxonomyData } = useQuery(GET_SKILL_TAXONOMY);
  const { data: savedJobsData } = useQuery(GET_SAVED_JOB_IDS, {
    fetchPolicy: 'cache-and-network',
  });
  const { data, loading, error } = useQuery(GET_JOBS_PAGE, {
    variables: {
      status: 'OPEN',
      query: query || null,
      categoryIds: selectedCategoryIds,
      specialtyIds: selectedSpecialtyIds,
      experienceLevels: selectedExperiences,
      budgetTypes: selectedBudgetTypes,
      page: pageIndex,
      size: JOBS_PAGE_SIZE,
      sort,
    },
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

  const taxonomyNodes = taxonomyData?.skillTaxonomy ?? [];
  const savedJobIdSet = React.useMemo(
    () => new Set((savedJobsData?.savedJobIds ?? []).map(String)),
    [savedJobsData]
  );
  const jobsPage = data?.jobsPage;
  const jobs = jobsPage?.content ?? [];
  const totalElements = jobsPage?.totalElements ?? 0;
  const totalPages = jobsPage?.totalPages ?? 0;
  const safePageIndex = jobsPage?.page ?? pageIndex;

  const updateSearchParams = React.useCallback((mutator) => {
    const nextParams = new URLSearchParams(searchParams);
    mutator(nextParams);
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  const resetPage = (params) => {
    params.delete(SEARCH_PARAM_KEYS.page);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateSearchParams((params) => {
      const cleanQuery = searchDraft.trim();
      if (cleanQuery) {
        params.set(SEARCH_PARAM_KEYS.query, cleanQuery);
      } else {
        params.delete(SEARCH_PARAM_KEYS.query);
      }
      resetPage(params);
    });
  };

  const handleClearSearch = () => {
    setSearchDraft('');
    updateSearchParams((params) => {
      params.delete(SEARCH_PARAM_KEYS.query);
      resetPage(params);
    });
  };

  const handleTaxonomyChange = ({ categoryIds, specialtyIds }) => {
    updateSearchParams((params) => {
      setParamList(params, SEARCH_PARAM_KEYS.categories, categoryIds);
      setParamList(params, SEARCH_PARAM_KEYS.specialties, specialtyIds);
      params.delete('category');
      resetPage(params);
    });
  };

  const toggleListFilter = (key, value, checked) => {
    updateSearchParams((params) => {
      const nextValues = new Set(getParamList(params, key));
      if (checked) {
        nextValues.add(value);
      } else {
        nextValues.delete(value);
      }
      setParamList(params, key, [...nextValues]);
      resetPage(params);
    });
  };

  const handleSortChange = (nextSort) => {
    updateSearchParams((params) => {
      if (nextSort === 'BEST_MATCH') {
        params.delete(SEARCH_PARAM_KEYS.sort);
      } else {
        params.set(SEARCH_PARAM_KEYS.sort, nextSort);
      }
      resetPage(params);
    });
  };

  const handlePageChange = (nextPageIndex) => {
    updateSearchParams((params) => {
      if (nextPageIndex <= 0) {
        params.delete(SEARCH_PARAM_KEYS.page);
      } else {
        params.set(SEARCH_PARAM_KEYS.page, String(nextPageIndex + 1));
      }
    });
  };

  const handleResetFilters = () => {
    updateSearchParams((params) => {
      params.delete(SEARCH_PARAM_KEYS.categories);
      params.delete(SEARCH_PARAM_KEYS.specialties);
      params.delete(SEARCH_PARAM_KEYS.experience);
      params.delete(SEARCH_PARAM_KEYS.budgetType);
      params.delete('category');
      resetPage(params);
    });
  };

  const handleToggleSaved = (job) => {
    const variables = { id: job.id };
    if (savedJobIdSet.has(String(job.id))) {
      unsaveJob({ variables });
      return;
    }
    saveJob({ variables });
  };

  return (
    <PageShell accents={pageAccents} maxW="1280px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }}>
      <VStack align="stretch" gap={6}>
        <StackHeader />

        <Grid
          templateColumns={{ base: '1fr', lg: '280px minmax(0, 1fr)' }}
          gap={{ base: 6, lg: 8 }}
          alignItems="start"
        >
          <GlassPanel
            variant="subtle"
            borderRadius="24px"
            p={{ base: 5, md: 6 }}
            position={{ lg: 'sticky' }}
            top={{ lg: 6 }}
            zIndex={30}
          >
            <JobsFilterSidebar
              taxonomyNodes={taxonomyNodes}
              selectedCategoryIds={selectedCategoryIds}
              selectedSpecialtyIds={selectedSpecialtyIds}
              selectedExperiences={selectedExperiences}
              selectedBudgetTypes={selectedBudgetTypes}
              onTaxonomyChange={handleTaxonomyChange}
              onExperienceToggle={(value, checked) =>
                toggleListFilter(SEARCH_PARAM_KEYS.experience, value, checked)
              }
              onBudgetTypeToggle={(value, checked) =>
                toggleListFilter(SEARCH_PARAM_KEYS.budgetType, value, checked)
              }
              onReset={handleResetFilters}
            />
          </GlassPanel>

          <GlassPanel variant="solid" borderRadius="28px" p={{ base: 5, md: 7 }} position="relative" zIndex={1}>
            <VStack align="stretch" gap={6}>
              <HStack align={{ base: 'stretch', md: 'center' }} gap={4} flexWrap="wrap">
                <Box flex="1" minW={{ base: '100%', md: '420px' }}>
                  <JobsSearchBar
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    onSubmit={handleSearchSubmit}
                    onClear={handleClearSearch}
                  />
                </Box>
                <Text color="green.200" fontWeight="bold" px={2}>
                  Advanced search
                </Text>
              </HStack>

              <JobsResultsToolbar
                totalElements={totalElements}
                loading={loading}
                sort={sort}
                savedSearch={savedSearch}
                onSortChange={handleSortChange}
                onSaveSearch={() => setSavedSearch(true)}
              />

              {loading && !data ? (
                <JobsPageState
                  title="Loading jobs"
                  description="We are searching open opportunities that match your filters."
                />
              ) : null}

              {error ? (
                <JobsPageState
                  title="Unable to load jobs"
                  description={error.message}
                  tone="error"
                />
              ) : null}

              {!loading && !error && jobs.length === 0 ? (
                <JobsPageState
                  title="No matching jobs yet"
                  description="Try a broader keyword or clear a few filters to see more open opportunities."
                />
              ) : null}

              {!error && jobs.length > 0 ? (
                <Box>
                  {jobs.map((job) => (
                    <JobResultCard
                      key={job.id}
                      job={job}
                      query={query}
                      saved={savedJobIdSet.has(String(job.id))}
                      saving={savingJob || unsavingJob}
                      onToggleSaved={handleToggleSaved}
                    />
                  ))}
                  <JobsPagination
                    page={safePageIndex}
                    totalPages={totalPages}
                    hasNext={jobsPage?.hasNext ?? false}
                    hasPrevious={jobsPage?.hasPrevious ?? false}
                    onPageChange={handlePageChange}
                  />
                </Box>
              ) : null}
            </VStack>
          </GlassPanel>
        </Grid>
      </VStack>
    </PageShell>
  );
};

const StackHeader = () => (
  <HStack justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} flexWrap="wrap">
    <Box>
      <Heading as="h1" size={{ base: 'xl', md: '2xl' }} color="white" letterSpacing="0" lineHeight="1.08">
        Search open jobs
      </Heading>
    </Box>
    <Button
      as={Link}
      to="/dashboard"
      px={6}
      {...subtlePillButtonStyles}
    >
      Back to Dashboard
    </Button>
  </HStack>
);

export default JobsPage;
