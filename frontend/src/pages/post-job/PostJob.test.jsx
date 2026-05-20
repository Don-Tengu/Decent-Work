import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET_JOB, GET_SKILL_TAXONOMY, PUBLISH_JOB, SAVE_JOB_DRAFT, UPDATE_JOB } from '@/graphql/queries.js';
import PostJob from './PostJob.jsx';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const taxonomyNodes = [
  {
    __typename: 'SkillTaxonomyNode',
    id: 'cat-1',
    name: 'Web, Mobile & Software Dev',
    slug: 'web-mobile-software-dev',
    level: 'CATEGORY',
    displayOrder: 1,
    parent: null,
  },
  {
    __typename: 'SkillTaxonomyNode',
    id: 'sub-1',
    name: 'Blockchain',
    slug: 'blockchain',
    level: 'SUBCATEGORY',
    displayOrder: 1,
    parent: {
      __typename: 'SkillTaxonomyNode',
      id: 'cat-1',
      name: 'Web, Mobile & Software Dev',
      displayOrder: 1,
      parent: null,
    },
  },
  {
    __typename: 'SkillTaxonomyNode',
    id: 'spec-1',
    name: 'Emerging Tech',
    slug: 'emerging-tech',
    level: 'SPECIALTY',
    displayOrder: 1,
    parent: {
      __typename: 'SkillTaxonomyNode',
      id: 'sub-1',
      name: 'Blockchain',
      displayOrder: 1,
      parent: {
        __typename: 'SkillTaxonomyNode',
        id: 'cat-1',
      },
    },
  },
];

const description =
  'We need a smart contract auditor to review Solidity contracts and prepare a clear security report.';

const jobResponse = {
  __typename: 'Job',
  id: 'job-1',
  title: 'Smart Contract Audit',
  description,
  status: 'OPEN',
  draftStep: null,
  scopeSize: 'MEDIUM',
  scopeDurationAmount: 1,
  scopeDurationUnit: 'MONTH',
  scopeDurationDays: 30,
  experienceLevel: 'INTERMEDIATE',
  contractToHire: false,
  budgetType: 'HOURLY',
  hourlyRateMin: 17,
  hourlyRateMax: 49,
  fixedBudget: null,
  currencyCode: 'USD',
  paymentModel: 'OFF_CHAIN_NEGOTIATED',
  category: {
    __typename: 'SkillTaxonomyNode',
    id: 'cat-1',
    name: 'Web, Mobile & Software Dev',
  },
  specialty: {
    __typename: 'SkillTaxonomyNode',
    id: 'spec-1',
    name: 'Emerging Tech',
  },
  jobSkillTags: [
    {
      __typename: 'JobSkillTag',
      id: 'job-skill-1',
      skillId: null,
      name: 'Solidity',
      custom: true,
      displayOrder: 1,
      skill: null,
    },
  ],
  attachments: [],
  bids: [],
  client: {
    __typename: 'User',
    id: 'client-1',
    username: 'jean',
  },
  createdAt: '2026-05-09T00:00:00',
  updatedAt: '2026-05-09T00:00:00',
  publishedAt: '2026-05-09T00:00:00',
};

const mocks = [
  {
    request: {
      query: GET_SKILL_TAXONOMY,
    },
    result: {
      data: {
        skillTaxonomy: taxonomyNodes,
      },
    },
  },
  {
    request: {
      query: PUBLISH_JOB,
      variables: {
        id: null,
        input: {
          title: 'Smart Contract Audit',
          description,
          categoryId: 'cat-1',
          specialtyId: 'spec-1',
          skillIds: [],
          customSkillNames: ['Solidity'],
          scopeSize: 'MEDIUM',
          scopeDurationAmount: 1,
          scopeDurationUnit: 'MONTH',
          experienceLevel: 'INTERMEDIATE',
          contractToHire: false,
          budgetType: 'HOURLY',
          hourlyRateMin: 17,
          hourlyRateMax: 49,
          fixedBudget: null,
          currencyCode: 'USD',
          paymentModel: 'OFF_CHAIN_NEGOTIATED',
        },
      },
    },
    result: {
      data: {
        publishJob: jobResponse,
      },
    },
  },
  {
    request: {
      query: SAVE_JOB_DRAFT,
      variables: {
        id: null,
        input: {
          title: 'Smart Contract Audit',
          description: '',
          categoryId: null,
          specialtyId: null,
          skillIds: [],
          customSkillNames: [],
          draftStep: 'SKILLS',
          scopeSize: 'MEDIUM',
          scopeDurationAmount: 1,
          scopeDurationUnit: 'MONTH',
          experienceLevel: 'INTERMEDIATE',
          contractToHire: false,
          budgetType: 'HOURLY',
          hourlyRateMin: 17,
          hourlyRateMax: 49,
          fixedBudget: null,
          currencyCode: 'USD',
          paymentModel: 'OFF_CHAIN_NEGOTIATED',
        },
      },
    },
    result: {
      data: {
        saveJobDraft: {
          ...jobResponse,
          status: 'DRAFT',
          draftStep: 'SKILLS',
          description: '',
          category: null,
          specialty: null,
          jobSkillTags: [],
          publishedAt: null,
        },
      },
    },
  },
];

const renderPostJob = () =>
  render(
    <ChakraProvider value={defaultSystem}>
      <MockedProvider mocks={mocks}>
        <MemoryRouter>
          <PostJob />
        </MemoryRouter>
      </MockedProvider>
    </ChakraProvider>
  );

const renderPostJobRoute = (routeMocks, initialEntry = '/post-job/job-1') =>
  render(
    <ChakraProvider value={defaultSystem}>
      <MockedProvider mocks={routeMocks}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/post-job/:jobId" element={<PostJob />} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    </ChakraProvider>
  );

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

describe('PostJob review page', () => {
  it('keeps the wizard at five steps, opens review separately, and publishes from review', async () => {
    const user = userEvent.setup();

    renderPostJob();

    expect(await screen.findByText('Step 1 of 5')).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: /write a title/i }),
      'Smart Contract Audit'
    );
    await user.click(screen.getByRole('button', { name: /next step: skills/i }));

    await screen.findByRole('heading', { name: 'Add related skill tags' });
    let selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'cat-1');

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).not.toBeDisabled();
    });

    selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[1], 'spec-1');
    await user.type(screen.getByPlaceholderText(/search or add a skill/i), 'Solidity{enter}');
    await screen.findByText('Solidity');
    await user.click(screen.getByRole('button', { name: /next step: scope/i }));

    await screen.findByRole('heading', { name: 'Estimate the scope of work' });
    await user.click(screen.getByRole('button', { name: /next step: budget/i }));

    await screen.findByRole('heading', { name: 'Tell us about your budget.' });
    await user.click(screen.getByRole('button', { name: /next step: details/i }));

    await screen.findByRole('heading', { name: 'Start the conversation.' });
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review job post/i })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: /describe what you need/i }), description);
    await user.click(screen.getByRole('button', { name: /review job post/i }));

    await screen.findByRole('heading', { name: 'Review your job post' });
    expect(screen.getByText('$17.00 - $49.00 /hr')).toBeInTheDocument();
    expect(screen.queryByText('Step 5 of 5')).not.toBeInTheDocument();
    expect(screen.queryByText('5/5 complete')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 6 of 6')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /exit/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /back/i }));

    await screen.findByRole('heading', { name: 'Start the conversation.' });
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /review job post/i }));
    await screen.findByRole('heading', { name: 'Review your job post' });

    await user.click(screen.getByRole('button', { name: /post job/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('saves a backend draft from the footer without leaving the wizard', async () => {
    const user = userEvent.setup();

    renderPostJob();

    await user.type(
      await screen.findByRole('textbox', { name: /write a title/i }),
      'Smart Contract Audit'
    );
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText(/draft saved/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('disables saving a draft on the title step until a job name is entered', async () => {
    const user = userEvent.setup();

    renderPostJob();

    const titleInput = await screen.findByRole('textbox', { name: /write a title/i });
    const saveDraftButton = screen.getByRole('button', { name: /save draft/i });

    expect(saveDraftButton).toBeDisabled();

    await user.type(titleInput, 'Smart Contract Audit');

    await waitFor(() => {
      expect(saveDraftButton).toBeEnabled();
    });
  });

  it('opens a posted job directly in edit review mode', async () => {
    renderPostJobRoute([
      {
        request: {
          query: GET_SKILL_TAXONOMY,
        },
        result: {
          data: {
            skillTaxonomy: taxonomyNodes,
          },
        },
      },
      {
        request: {
          query: GET_JOB,
          variables: { id: 'job-1' },
        },
        result: {
          data: {
            job: jobResponse,
          },
        },
      },
    ], '/post-job/job-1?mode=edit-posting');

    expect(await screen.findByRole('heading', { name: 'Edit job posting' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Review your job post' })).not.toBeInTheDocument();
  });

  it('saves posted job edits from review mode', async () => {
    const user = userEvent.setup();

    renderPostJobRoute([
      {
        request: {
          query: GET_SKILL_TAXONOMY,
        },
        result: {
          data: {
            skillTaxonomy: taxonomyNodes,
          },
        },
      },
      {
        request: {
          query: GET_JOB,
          variables: { id: 'job-1' },
        },
        result: {
          data: {
            job: jobResponse,
          },
        },
      },
      {
        request: {
          query: UPDATE_JOB,
          variables: {
            id: 'job-1',
            input: {
              title: 'Smart Contract Audit',
              description,
              categoryId: 'cat-1',
              specialtyId: 'spec-1',
              skillIds: [],
              customSkillNames: ['Solidity'],
              scopeSize: 'MEDIUM',
              scopeDurationAmount: 1,
              scopeDurationUnit: 'MONTH',
              experienceLevel: 'INTERMEDIATE',
              contractToHire: false,
              budgetType: 'HOURLY',
              hourlyRateMin: 17,
              hourlyRateMax: 49,
              fixedBudget: null,
              currencyCode: 'USD',
              paymentModel: 'OFF_CHAIN_NEGOTIATED',
            },
          },
        },
        result: {
          data: {
            updateJob: jobResponse,
          },
        },
      },
    ], '/post-job/job-1?mode=edit-posting');

    await screen.findByRole('heading', { name: 'Edit job posting' });
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('hydrates a saved draft from the route id', async () => {
    const user = userEvent.setup();

    renderPostJobRoute([
      {
        request: {
          query: GET_SKILL_TAXONOMY,
        },
        result: {
          data: {
            skillTaxonomy: taxonomyNodes,
          },
        },
      },
      {
        request: {
          query: GET_JOB,
          variables: { id: 'job-1' },
        },
        result: {
          data: {
            job: {
              ...jobResponse,
              status: 'DRAFT',
              draftStep: 'SKILLS',
              title: 'Saved Draft',
              description: '',
              category: null,
              specialty: null,
              jobSkillTags: [],
              publishedAt: null,
            },
          },
        },
      },
    ]);

    expect(await screen.findByRole('heading', { name: 'Add related skill tags' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(await screen.findByDisplayValue('Saved Draft')).toBeInTheDocument();
  });

  it('shows saved built-in skill tags when reopening the skills step', async () => {
    renderPostJobRoute([
      {
        request: {
          query: GET_SKILL_TAXONOMY,
        },
        result: {
          data: {
            skillTaxonomy: taxonomyNodes,
          },
        },
      },
      {
        request: {
          query: GET_JOB,
          variables: { id: 'job-1' },
        },
        result: {
          data: {
            job: {
              ...jobResponse,
              status: 'DRAFT',
              draftStep: 'SKILLS',
              title: 'Saved Draft',
              description: '',
              category: null,
              specialty: null,
              jobSkillTags: [
                {
                  __typename: 'JobSkillTag',
                  id: 'job-skill-10',
                  skillId: '10',
                  name: 'React',
                  custom: false,
                  displayOrder: 1,
                  skill: {
                    __typename: 'Skill',
                    id: '10',
                    name: 'React',
                  },
                },
              ],
              publishedAt: null,
            },
          },
        },
      },
    ]);

    expect(await screen.findByRole('heading', { name: 'Add related skill tags' })).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('opens a completed draft directly on the review screen', async () => {
    renderPostJobRoute([
      {
        request: {
          query: GET_SKILL_TAXONOMY,
        },
        result: {
          data: {
            skillTaxonomy: taxonomyNodes,
          },
        },
      },
      {
        request: {
          query: GET_JOB,
          variables: { id: 'job-1' },
        },
        result: {
          data: {
            job: {
              ...jobResponse,
              status: 'DRAFT',
              draftStep: 'REVIEW',
              publishedAt: null,
            },
          },
        },
      },
    ]);

    expect(await screen.findByRole('heading', { name: 'Review your job post' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post job/i })).toBeInTheDocument();
  });
});
