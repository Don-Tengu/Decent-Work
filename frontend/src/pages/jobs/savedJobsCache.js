import { GET_SAVED_JOB_IDS } from '@/graphql/queries.js';

const readSavedJobIds = (cache) => {
  try {
    return cache.readQuery({ query: GET_SAVED_JOB_IDS })?.savedJobIds ?? [];
  } catch {
    return [];
  }
};

export const addSavedJobIdToCache = (cache, jobId) => {
  const jobIdString = String(jobId);
  const savedJobIds = readSavedJobIds(cache).map(String);

  cache.writeQuery({
    query: GET_SAVED_JOB_IDS,
    data: {
      savedJobIds: savedJobIds.includes(jobIdString)
        ? savedJobIds
        : [...savedJobIds, jobIdString],
    },
  });
};

export const removeSavedJobIdFromCache = (cache, jobId) => {
  const jobIdString = String(jobId);

  cache.writeQuery({
    query: GET_SAVED_JOB_IDS,
    data: {
      savedJobIds: readSavedJobIds(cache)
        .map(String)
        .filter((savedJobId) => savedJobId !== jobIdString),
    },
  });
};
