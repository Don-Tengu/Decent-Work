import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme.js';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { GET_JOBS_PAGE, GET_SAVED_JOB_IDS, GET_SKILL_TAXONOMY } from '@/graphql/queries.js';
import JobsPage from '@/pages/jobs/JobsPage.jsx';

const taxonomyNodes = [
  {
    __typename: 'SkillTaxonomyNode',
    id: 'cat-dev',
    name: 'Web, Mobile & Software Dev',
    slug: 'web-mobile-software-dev',
    level: 'CATEGORY',
    displayOrder: 1,
    parent: null,
  },
  {
    __typename: 'SkillTaxonomyNode',
    id: 'sub-blockchain',
    name: 'Blockchain',
    slug: 'blockchain',
    level: 'SUBCATEGORY',
    displayOrder: 1,
    parent: {
      __typename: 'SkillTaxonomyNode',
      id: 'cat-dev',
      name: 'Web, Mobile & Software Dev',
      displayOrder: 1,
      parent: null,
    },
  },
  {
    __typename: 'SkillTaxonomyNode',
    id: 'spec-blockchain',
    name: 'Blockchain, NFT & Cryptocurrency',
    slug: 'blockchain-nft-cryptocurrency',
    level: 'SPECIALTY',
    displayOrder: 1,
    parent: {
      __typename: 'SkillTaxonomyNode',
      id: 'sub-blockchain',
      name: 'Blockchain',
      displayOrder: 1,
      parent: {
        __typename: 'SkillTaxonomyNode',
        id: 'cat-dev',
      },
    },
  },
];

const emptyJobsPage = (page = 0) => ({
  __typename: 'JobPage',
  content: [],
  totalElements: 0,
  totalPages: 0,
  page,
  size: 8,
  hasNext: false,
  hasPrevious: false,
});

const jobsPageMock = (variables) => ({
  request: {
    query: GET_JOBS_PAGE,
    variables,
  },
  result: {
    data: {
      jobsPage: emptyJobsPage(variables.page ?? 0),
    },
  },
});

const taxonomyMock = {
  request: {
    query: GET_SKILL_TAXONOMY,
  },
  result: {
    data: {
      skillTaxonomy: taxonomyNodes,
    },
  },
};

const savedJobIdsMock = {
  request: {
    query: GET_SAVED_JOB_IDS,
  },
  result: {
    data: {
      savedJobIds: [],
    },
  },
};

const LocationProbe = () => {
  const location = useLocation();
  return <output aria-label="location">{location.search}</output>;
};

const renderJobsPage = (mocks, initialEntry = '/jobs') =>
  render(
    <ChakraProvider value={system}>
      <MockedProvider mocks={mocks}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <JobsPage />
          <LocationProbe />
        </MemoryRouter>
      </MockedProvider>
    </ChakraProvider>
  );

afterEach(() => {
  cleanup();
});

describe('JobsPage filters', () => {
  it('writes category selections to URL params and resets pagination', async () => {
    const user = userEvent.setup();
    const initialVariables = {
      status: 'OPEN',
      query: null,
      categoryIds: [],
      specialtyIds: [],
      experienceLevels: [],
      budgetTypes: [],
      page: 2,
      size: 8,
      sort: 'BEST_MATCH',
    };
    const filteredVariables = {
      ...initialVariables,
      categoryIds: ['cat-dev'],
      page: 0,
    };

    renderJobsPage([
      taxonomyMock,
      savedJobIdsMock,
      jobsPageMock(initialVariables),
      jobsPageMock(filteredVariables),
    ], '/jobs?page=3');

    await user.click(await screen.findByRole('button', { name: /all categories/i }));
    await user.click(await screen.findByLabelText(/all - web, mobile & software dev/i));

    await waitFor(() => {
      expect(screen.getByLabelText('location')).toHaveTextContent('categories=cat-dev');
      expect(screen.getByLabelText('location')).not.toHaveTextContent('page=');
    });
  });
});
