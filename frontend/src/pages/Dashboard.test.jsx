import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CANCEL_JOB, GET_JOB_BIDS, GET_MY_JOBS } from '@/graphql/queries.js';
import Dashboard from './Dashboard.jsx';

const navigateMock = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: {
    id: 'client-1',
    email: 'jean@example.com',
    username: 'Jean',
    role: 'CLIENT',
  },
  logout: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

const postedJob = {
  __typename: 'Job',
  id: 'job-open',
  title: 'Smart Contract Audit',
  description: 'Review Solidity contracts and prepare a concise security report.',
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
    name: 'Development',
  },
  specialty: {
    __typename: 'SkillTaxonomyNode',
    id: 'spec-1',
    name: 'Smart Contracts',
  },
  jobSkillTags: [],
  attachments: [],
  bids: [
    {
      __typename: 'Bid',
      id: 'bid-1',
      status: 'PENDING',
    },
  ],
  client: {
    __typename: 'User',
    id: 'client-1',
    username: 'Jean',
  },
  createdAt: '2026-05-09T00:00:00',
  updatedAt: '2026-05-09T00:00:00',
  publishedAt: '2026-05-09T00:00:00',
};

const draftJob = {
  ...postedJob,
  id: 'job-draft',
  title: 'Landing Page Build',
  description: '',
  status: 'DRAFT',
  draftStep: 'SKILLS',
  specialty: null,
  bids: [],
  publishedAt: null,
};

const myJobsMock = (jobs) => ({
  request: {
    query: GET_MY_JOBS,
    variables: { statuses: ['DRAFT', 'OPEN'] },
  },
  result: {
    data: {
      myJobs: jobs,
    },
  },
});

const renderDashboard = (mocks) =>
  render(
    <ChakraProvider value={defaultSystem}>
      <MockedProvider mocks={mocks}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </MockedProvider>
    </ChakraProvider>
  );

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
  authState.logout.mockReset();
  vi.restoreAllMocks();
});

describe('Client Dashboard', () => {
  it('renders posted and draft jobs with client actions', async () => {
    const user = userEvent.setup();

    renderDashboard([myJobsMock([postedJob, draftJob])]);

    expect(await screen.findByText('Smart Contract Audit')).toBeInTheDocument();
    expect(screen.getByText('Landing Page Build')).toBeInTheDocument();
    expect(screen.getByText('Open job post')).toBeInTheDocument();
    expect(screen.getByText('Draft job post')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /post a job/i })).toHaveAttribute('href', '/post-job');
    expect(screen.getByRole('link', { name: /add skills/i })).toHaveAttribute(
      'href',
      '/post-job/job-draft'
    );
    expect(screen.getByRole('button', { name: /view proposals/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete landing page build/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actions for smart contract audit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actions for landing page build/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /actions for landing page build/i }));

    expect(await screen.findByRole('menuitem', { name: /edit draft/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /remove draft/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /actions for smart contract audit/i }));

    expect(await screen.findByRole('menuitem', { name: /view proposals/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /edit posting/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /remove posting/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /view job posting/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /invite freelancers/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /reuse posting/i })).not.toBeInTheDocument();
  });

  it('shows the next required draft action on each job card', async () => {
    renderDashboard([
      myJobsMock([
        {
          ...draftJob,
          id: 'draft-skills',
          draftStep: 'SKILLS',
        },
        {
          ...draftJob,
          id: 'draft-scope',
          draftStep: 'SCOPE',
          category: postedJob.category,
          specialty: postedJob.specialty,
          jobSkillTags: [
            {
              __typename: 'JobSkillTag',
              id: 'skill-1',
              skillId: null,
              name: 'Solidity',
              custom: true,
              displayOrder: 1,
              skill: null,
            },
          ],
        },
        {
          ...draftJob,
          id: 'draft-budget',
          draftStep: 'BUDGET',
        },
        {
          ...draftJob,
          id: 'draft-details',
          draftStep: 'DETAILS',
        },
        {
          ...draftJob,
          id: 'draft-review',
          draftStep: 'REVIEW',
          description: 'Review Solidity contracts and prepare a concise security report.',
        },
      ]),
    ]);

    expect(await screen.findByText('Add the skills you need to continue')).toBeInTheDocument();
    expect(screen.getByText("Add your project's scope to continue")).toBeInTheDocument();
    expect(screen.getByText('Add your budget to continue')).toBeInTheDocument();
    expect(screen.getByText('Add details to your draft')).toBeInTheDocument();
    expect(screen.getByText('Finalize your job post')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add skills/i })).toHaveAttribute('href', '/post-job/draft-skills');
    expect(screen.getByRole('link', { name: /add scope/i })).toHaveAttribute('href', '/post-job/draft-scope');
    expect(screen.getByRole('link', { name: /add budget/i })).toHaveAttribute('href', '/post-job/draft-budget');
    expect(screen.getByRole('link', { name: /fill in draft/i })).toHaveAttribute('href', '/post-job/draft-details');
    expect(screen.getByRole('link', { name: /finalize job post/i })).toHaveAttribute('href', '/post-job/draft-review');
  });

  it('navigates to posted edit review from the job menu', async () => {
    const user = userEvent.setup();

    renderDashboard([myJobsMock([postedJob])]);

    await user.click(await screen.findByRole('button', { name: /actions for smart contract audit/i }));
    await user.click(await screen.findByRole('menuitem', { name: /edit posting/i }));

    expect(navigateMock).toHaveBeenCalledWith('/post-job/job-open?mode=edit-posting');
  });

  it('loads proposals for a posted job', async () => {
    const user = userEvent.setup();

    renderDashboard([
      myJobsMock([postedJob]),
      {
        request: {
          query: GET_JOB_BIDS,
          variables: { jobId: 'job-open' },
        },
        result: {
          data: {
            jobBids: [
              {
                __typename: 'Bid',
                id: 'bid-1',
                amount: 1200,
                proposal: 'I can complete this audit with a clear report.',
                deliveryTime: 7,
                status: 'PENDING',
                freelancer: {
                  __typename: 'User',
                  id: 'freelancer-1',
                  username: 'Ada',
                },
                createdAt: '2026-05-09T00:00:00',
              },
            ],
          },
        },
      },
    ]);

    await user.click(await screen.findByRole('button', { name: /actions for smart contract audit/i }));
    await user.click(await screen.findByRole('menuitem', { name: /view proposals/i }));

    expect(await screen.findByText('Ada')).toBeInTheDocument();
    expect(screen.getByText(/complete this audit/i)).toBeInTheDocument();
  });

  it('opens a themed dialog before removing a draft job', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderDashboard([
      myJobsMock([postedJob, draftJob]),
      {
        request: {
          query: CANCEL_JOB,
          variables: { id: 'job-draft' },
        },
        result: {
          data: {
            cancelJob: {
              __typename: 'Job',
              id: 'job-draft',
              status: 'CANCELLED',
            },
          },
        },
      },
      myJobsMock([postedJob]),
    ]);

    await user.click(await screen.findByRole('button', { name: /actions for landing page build/i }));
    await user.click(await screen.findByRole('menuitem', { name: /remove draft/i }));

    const dialog = await screen.findByRole('dialog', { name: /remove draft/i });

    expect(within(dialog).getByText(/draft job post/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/no longer be available to continue posting/i)).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: /remove draft/i }));

    await waitFor(() => {
      expect(screen.queryByText('Landing Page Build')).not.toBeInTheDocument();
    });
  });

  it('opens a themed dialog before removing a posted job', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderDashboard([
      myJobsMock([postedJob]),
      {
        request: {
          query: CANCEL_JOB,
          variables: { id: 'job-open' },
        },
        result: {
          data: {
            cancelJob: {
              __typename: 'Job',
              id: 'job-open',
              status: 'CANCELLED',
            },
          },
        },
      },
      myJobsMock([]),
    ]);

    await user.click(await screen.findByRole('button', { name: /actions for smart contract audit/i }));
    await user.click(await screen.findByRole('menuitem', { name: /remove posting/i }));

    const dialog = await screen.findByRole('dialog', { name: /remove posting/i });

    expect(within(dialog).getByText(/open job post/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/freelancers will no longer see it/i)).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: /remove posting/i }));

    await waitFor(() => {
      expect(screen.queryByText('Smart Contract Audit')).not.toBeInTheDocument();
    });
  });
});
