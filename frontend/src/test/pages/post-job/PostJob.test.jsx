import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET_JOB, GET_SKILL_TAXONOMY, PUBLISH_JOB, SAVE_JOB_DRAFT, UPDATE_JOB } from '@/graphql/queries.js';
import PostJob from '@/pages/post-job/PostJob.jsx';

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
  budgetType: 'FIXED',
  hourlyRateMin: null,
  hourlyRateMax: null,
  fixedBudget: 500,
  currencyCode: 'USDC',
  paymentModel: 'ON_CHAIN_ESCROW',
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
          budgetType: 'FIXED',
          hourlyRateMin: null,
          hourlyRateMax: null,
          fixedBudget: 500,
          currencyCode: 'USDC',
          paymentModel: 'ON_CHAIN_ESCROW',
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
          scopeSize: null,
          scopeDurationAmount: null,
          scopeDurationUnit: null,
          experienceLevel: null,
          contractToHire: false,
          budgetType: 'FIXED',
          hourlyRateMin: null,
          hourlyRateMax: null,
          fixedBudget: null,
          currencyCode: 'USDC',
          paymentModel: 'ON_CHAIN_ESCROW',
        },
      },
    },
    result: {
      data: {
        saveJobDraft: {
          ...jobResponse,
          status: 'DRAFT',
          draftStep: 'SKILLS',
          scopeSize: null,
          scopeDurationAmount: null,
          scopeDurationUnit: null,
          scopeDurationDays: null,
          experienceLevel: null,
          description: '',
          category: null,
          specialty: null,
          jobSkillTags: [],
          publishedAt: null,
        },
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
          description,
          categoryId: 'cat-1',
          specialtyId: 'spec-1',
          skillIds: [],
          customSkillNames: ['Solidity'],
          draftStep: 'REVIEW',
          scopeSize: 'MEDIUM',
          scopeDurationAmount: 1,
          scopeDurationUnit: 'MONTH',
          experienceLevel: 'INTERMEDIATE',
          contractToHire: false,
          budgetType: 'FIXED',
          hourlyRateMin: null,
          hourlyRateMax: null,
          fixedBudget: 500,
          currencyCode: 'USDC',
          paymentModel: 'ON_CHAIN_ESCROW',
        },
      },
    },
    result: {
      data: {
        saveJobDraft: {
          ...jobResponse,
          status: 'DRAFT',
          draftStep: 'REVIEW',
          publishedAt: null,
        },
      },
    },
  },
  {
    request: {
      query: SAVE_JOB_DRAFT,
      variables: {
        id: 'job-1',
        input: {
          title: 'Smart Contract Audit',
          description,
          categoryId: 'cat-1',
          specialtyId: 'spec-1',
          skillIds: [],
          customSkillNames: ['Solidity'],
          draftStep: 'REVIEW',
          scopeSize: 'MEDIUM',
          scopeDurationAmount: 1,
          scopeDurationUnit: 'MONTH',
          experienceLevel: 'INTERMEDIATE',
          contractToHire: false,
          budgetType: 'FIXED',
          hourlyRateMin: null,
          hourlyRateMax: null,
          fixedBudget: 500,
          currencyCode: 'USDC',
          paymentModel: 'ON_CHAIN_ESCROW',
        },
      },
    },
    result: {
      data: {
        saveJobDraft: {
          ...jobResponse,
          status: 'DRAFT',
          draftStep: 'REVIEW',
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
    expect(screen.getByText('2/5 complete')).toBeInTheDocument();
    expect(screen.getByText('Choose project size')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /medium/i }));
    await user.click(screen.getByRole('button', { name: /edit duration/i }));
    await user.type(screen.getByPlaceholderText(/time/i), '1');
    await user.selectOptions(screen.getByRole('combobox'), 'MONTH');
    await user.click(screen.getByRole('button', { name: /edit experience level/i }));
    await user.click(screen.getByRole('radio', { name: /intermediate/i }));
    await user.click(screen.getByRole('button', { name: /next step: budget/i }));

    await screen.findByRole('heading', { name: 'Tell us about your budget.' });
    expect(screen.queryByRole('radio', { name: /hourly rate/i })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /fixed price/i })).toBeInTheDocument();
    expect(screen.getByText(/on-chain usdc escrow/i)).toBeInTheDocument();
    expect(screen.queryByText(/off-chain/i)).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: /project budget/i }), '500');
    await user.click(screen.getByRole('button', { name: /next step: details/i }));

    await screen.findByRole('heading', { name: 'Start the conversation.' });
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review job post/i })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: /describe what you need/i }), description);
    await user.click(screen.getByRole('button', { name: /review job post/i }));

    await screen.findByRole('heading', { name: 'Review your job post' });
    expect(screen.getByText(/\$500\.00 fixed price/i)).toBeInTheDocument();
    expect(screen.queryByText('Step 5 of 5')).not.toBeInTheDocument();
    expect(screen.queryByText('5/5 complete')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 6 of 6')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exit/i })).toBeInTheDocument();

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
              budgetType: 'FIXED',
              hourlyRateMin: null,
              hourlyRateMax: null,
              fixedBudget: 500,
              currencyCode: 'USDC',
              paymentModel: 'ON_CHAIN_ESCROW',
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

  it('clears previously saved skill tags when a draft is saved with none selected', async () => {
    const user = userEvent.setup();
    const draftWithSkills = {
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
    };

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
            job: draftWithSkills,
          },
        },
      },
      {
        request: {
          query: SAVE_JOB_DRAFT,
          variables: {
            id: 'job-1',
            input: {
              title: 'Saved Draft',
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
              budgetType: 'FIXED',
              hourlyRateMin: null,
              hourlyRateMax: null,
              fixedBudget: 500,
              currencyCode: 'USDC',
              paymentModel: 'ON_CHAIN_ESCROW',
            },
          },
        },
        result: {
          data: {
            saveJobDraft: {
              ...draftWithSkills,
              jobSkillTags: [],
            },
          },
        },
      },
    ]);

    expect(await screen.findByText('React')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /remove react/i }));
    expect(screen.queryByText('React')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText(/draft saved/i)).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  it('keeps draftStep at SCOPE until scope fields are chosen and saved', async () => {
    const user = userEvent.setup();
    const draftAtScope = {
      ...jobResponse,
      status: 'DRAFT',
      draftStep: 'SCOPE',
      title: 'Saved Draft',
      description: '',
      scopeSize: null,
      scopeDurationAmount: null,
      scopeDurationUnit: null,
      scopeDurationDays: null,
      experienceLevel: null,
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
      publishedAt: null,
    };

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
            job: draftAtScope,
          },
        },
      },
      {
        request: {
          query: SAVE_JOB_DRAFT,
          variables: {
            id: 'job-1',
            input: {
              title: 'Saved Draft',
              description: '',
              categoryId: 'cat-1',
              specialtyId: 'spec-1',
              skillIds: [],
              customSkillNames: ['Solidity'],
              draftStep: 'SCOPE',
              scopeSize: null,
              scopeDurationAmount: null,
              scopeDurationUnit: null,
              experienceLevel: null,
              contractToHire: false,
              budgetType: 'FIXED',
              hourlyRateMin: null,
              hourlyRateMax: null,
              fixedBudget: 500,
              currencyCode: 'USDC',
              paymentModel: 'ON_CHAIN_ESCROW',
            },
          },
        },
        result: {
          data: {
            saveJobDraft: draftAtScope,
          },
        },
      },
    ]);

    expect(await screen.findByRole('heading', { name: 'Estimate the scope of work' })).toBeInTheDocument();
    expect(screen.getByText('Choose project size')).toBeInTheDocument();
    expect(screen.getByText('2/5 complete')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText(/draft saved/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Estimate the scope of work' })).toBeInTheDocument();
    expect(screen.getByText('Choose project size')).toBeInTheDocument();
  });

  it('allows saving a budget-step draft without an amount and only validates on next', async () => {
    const user = userEvent.setup();
    const draftAtBudget = {
      ...jobResponse,
      status: 'DRAFT',
      draftStep: 'BUDGET',
      title: 'Saved Draft',
      description: '',
      fixedBudget: null,
      hourlyRateMin: null,
      hourlyRateMax: null,
      publishedAt: null,
    };

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
            job: draftAtBudget,
          },
        },
      },
      {
        request: {
          query: SAVE_JOB_DRAFT,
          variables: {
            id: 'job-1',
            input: {
              title: 'Saved Draft',
              description: '',
              categoryId: 'cat-1',
              specialtyId: 'spec-1',
              skillIds: [],
              customSkillNames: ['Solidity'],
              draftStep: 'BUDGET',
              scopeSize: 'MEDIUM',
              scopeDurationAmount: 1,
              scopeDurationUnit: 'MONTH',
              experienceLevel: 'INTERMEDIATE',
              contractToHire: false,
              budgetType: 'FIXED',
              hourlyRateMin: null,
              hourlyRateMax: null,
              fixedBudget: null,
              currencyCode: 'USDC',
              paymentModel: 'ON_CHAIN_ESCROW',
            },
          },
        },
        result: {
          data: {
            saveJobDraft: draftAtBudget,
          },
        },
      },
    ]);

    expect(await screen.findByRole('heading', { name: /tell us about your budget/i })).toBeInTheDocument();

    const budgetInput = screen.getByRole('textbox', { name: /project budget/i });
    await user.click(budgetInput);
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText(/draft saved/i)).toBeInTheDocument();
    expect(screen.queryByText(/enter a fixed project budget/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next step: details/i }));

    expect(await screen.findByText(/enter a fixed project budget before moving to the next step/i)).toBeInTheDocument();
  });

  it('does not validate description when attaching a file, only on save draft or review', async () => {
    const user = userEvent.setup();
    const draftAtDetails = {
      ...jobResponse,
      status: 'DRAFT',
      draftStep: 'DETAILS',
      title: 'Saved Draft',
      description: '',
      publishedAt: null,
    };

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
            job: draftAtDetails,
          },
        },
      },
    ]);

    expect(await screen.findByRole('heading', { name: /start the conversation/i })).toBeInTheDocument();

    await user.click(screen.getByRole('textbox', { name: /describe what you need/i }));
    await user.click(screen.getByRole('button', { name: /attach file/i }));

    expect(screen.queryByText(/must be more than 50 characters/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText(/must be more than 50 characters/i)).toBeInTheDocument();
    expect(screen.queryByText(/draft saved/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /review job post/i }));

    expect(screen.getByText(/must be more than 50 characters/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Review your job post' })).not.toBeInTheDocument();
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

    await userEvent.click(screen.getByRole('button', { name: /exit/i }));

    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });
});
