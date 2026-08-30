import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CANCEL_JOB,
  CONNECT_WALLET,
  GET_MY_BIDS,
  GET_MY_JOBS,
  GET_MY_NOTIFICATIONS,
  GET_MY_SAVED_JOBS,
  UNREAD_NOTIFICATION_COUNT,
} from '@/graphql/queries.js';
import Dashboard from '@/pages/Dashboard.jsx';

vi.mock('@/utils/web3', () => ({
  connectWallet: (...args) => connectWalletMock(...args),
  subscribeToWalletAccounts: () => () => {},
  addressesEqual: (a, b) =>
    Boolean(a) &&
    Boolean(b) &&
    String(a).trim().toLowerCase() === String(b).trim().toLowerCase(),
}));

const navigateMock = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: {
    id: 'client-1',
    email: 'jean@example.com',
    username: 'Jean',
    role: 'CLIENT',
    walletAddress: null,
  },
  logout: vi.fn(),
  updateUser: vi.fn((partial) => {
    authState.user = { ...authState.user, ...partial };
  }),
}));

const connectWalletMock = vi.hoisted(() =>
  vi.fn(async () => ({
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  }))
);

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/context/AuthContext', () => ({
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

const MY_JOBS_STATUSES = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED'];

const myJobsMock = (jobs) => ({
  request: {
    query: GET_MY_JOBS,
    variables: { statuses: MY_JOBS_STATUSES },
  },
  result: {
    data: {
      myJobs: jobs,
    },
  },
});

const inProgressJob = {
  ...postedJob,
  id: 'job-progress',
  title: 'Wallet Integration Sprint',
  status: 'IN_PROGRESS',
  bids: [
    {
      __typename: 'Bid',
      id: 'bid-accepted',
      status: 'ACCEPTED',
    },
  ],
};

const completedJob = {
  ...postedJob,
  id: 'job-completed',
  title: 'Tokenomics Review',
  status: 'COMPLETED',
  description: 'Delivered the tokenomics memo and closed payment.',
  bids: [
    {
      __typename: 'Bid',
      id: 'bid-done',
      status: 'ACCEPTED',
    },
  ],
};

const myBidsMock = (bids = []) => ({
  request: {
    query: GET_MY_BIDS,
  },
  result: {
    data: {
      myBids: bids,
    },
  },
});

const mySavedJobsMock = (jobs = []) => ({
  request: {
    query: GET_MY_SAVED_JOBS,
  },
  result: {
    data: {
      mySavedJobs: jobs,
    },
  },
});

const notificationMocks = [
  {
    request: { query: UNREAD_NOTIFICATION_COUNT },
    result: { data: { unreadNotificationCount: 0 } },
  },
  {
    request: { query: GET_MY_NOTIFICATIONS, variables: { limit: 12 } },
    result: { data: { myNotifications: [] } },
  },
];

const renderDashboard = (mocks) =>
  render(
    <ChakraProvider value={defaultSystem}>
      <MockedProvider mocks={[...notificationMocks, ...mocks]}>
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
  authState.updateUser.mockClear();
  connectWalletMock.mockClear();
  authState.user = {
    id: 'client-1',
    email: 'jean@example.com',
    username: 'Jean',
    role: 'CLIENT',
    walletAddress: null,
  };
  vi.restoreAllMocks();
});

describe('Client Dashboard', () => {
  it('shows wallet connect CTA when the client has no wallet', async () => {
    renderDashboard([myJobsMock([postedJob])]);

    expect(await screen.findByText(/wallet needed for escrow/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /connect wallet/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/fund and release on-chain escrow/i)).toBeInTheDocument();
  });

  it('connects a client wallet via MetaMask and persists the address', async () => {
    const user = userEvent.setup();
    const connectMock = {
      request: {
        query: CONNECT_WALLET,
        variables: {
          walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        },
      },
      result: {
        data: {
          connectWallet: {
            __typename: 'User',
            id: 'client-1',
            walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          },
        },
      },
    };

    renderDashboard([myJobsMock([postedJob]), connectMock]);

    const connectButtons = await screen.findAllByRole('button', { name: /connect wallet/i });
    await user.click(connectButtons[0]);

    await waitFor(() => {
      expect(connectWalletMock).toHaveBeenCalledWith({ forcePermissionPrompt: false });
      expect(authState.updateUser).toHaveBeenCalledWith({
        walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      });
    });

    expect(await screen.findByText(/wallet connected/i)).toBeInTheDocument();
  });

  it('forces a MetaMask permission prompt when switching an already linked wallet', async () => {
    const user = userEvent.setup();
    authState.user = {
      ...authState.user,
      walletAddress: '0x7E66aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaD672',
    };
    connectWalletMock.mockResolvedValueOnce({
      address: '0xbd2a9bbbbbbbbbbbbbbbbbbbbbbbbbbbbb70901',
    });

    const connectMock = {
      request: {
        query: CONNECT_WALLET,
        variables: {
          walletAddress: '0xbd2a9bbbbbbbbbbbbbbbbbbbbbbbbbbbbb70901',
        },
      },
      result: {
        data: {
          connectWallet: {
            __typename: 'User',
            id: 'client-1',
            walletAddress: '0xbd2a9bbbbbbbbbbbbbbbbbbbbbbbbbbbbb70901',
          },
        },
      },
    };

    renderDashboard([myJobsMock([postedJob]), connectMock]);

    await user.click(await screen.findByRole('button', { name: /switch wallet/i }));

    await waitFor(() => {
      expect(connectWalletMock).toHaveBeenCalledWith({ forcePermissionPrompt: true });
      expect(authState.updateUser).toHaveBeenCalledWith({
        walletAddress: '0xbd2a9bbbbbbbbbbbbbbbbbbbbbbbbbbbbb70901',
      });
    });

    expect(await screen.findByText(/wallet switched/i)).toBeInTheDocument();
  });

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

  it('navigates to the proposals page for a posted job', async () => {
    const user = userEvent.setup();

    renderDashboard([myJobsMock([postedJob])]);

    await user.click(await screen.findByRole('button', { name: /actions for smart contract audit/i }));
    await user.click(await screen.findByRole('menuitem', { name: /view proposals/i }));

    expect(navigateMock).toHaveBeenCalledWith('/jobs/job-open/proposals', {
      state: { from: '/dashboard' },
    });
  });

  it('navigates to the proposals page from the card CTA', async () => {
    const user = userEvent.setup();

    renderDashboard([myJobsMock([postedJob])]);

    await user.click(await screen.findByRole('button', { name: /view proposals/i }));

    expect(navigateMock).toHaveBeenCalledWith('/jobs/job-open/proposals', {
      state: { from: '/dashboard' },
    });
  });

  it('keeps in-progress jobs on the dashboard with a manage-contract CTA', async () => {
    const user = userEvent.setup();

    renderDashboard([myJobsMock([inProgressJob, postedJob])]);

    expect(await screen.findByText('Wallet Integration Sprint')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^in progress$/i })).toBeInTheDocument();
    expect(
      screen.getByText(/open the contract to review submitted work, request changes, or release payment/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manage contract/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /manage contract/i }));

    expect(navigateMock).toHaveBeenCalledWith('/jobs/job-progress/proposals', {
      state: { from: '/dashboard' },
    });

    await user.click(screen.getByRole('button', { name: /actions for wallet integration sprint/i }));
    expect(await screen.findByRole('menuitem', { name: /manage contract/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /remove posting/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /edit posting/i })).not.toBeInTheDocument();
  });

  it('keeps completed jobs on the dashboard under a completed section', async () => {
    const user = userEvent.setup();

    renderDashboard([myJobsMock([completedJob])]);

    expect(await screen.findByText('Tokenomics Review')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^completed$/i })).toBeInTheDocument();
    expect(screen.getByText(/completed\. delivered the tokenomics memo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /view details/i }));

    expect(navigateMock).toHaveBeenCalledWith('/jobs/job-completed/proposals', {
      state: { from: '/dashboard' },
    });
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
              status: 'DRAFT',
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
    expect(within(dialog).getByText(/deleted and cannot be continued later/i)).toBeInTheDocument();
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

describe('Freelancer Dashboard', () => {
  it('renders saved jobs returned by the backend', async () => {
    authState.user = {
      id: 'freelancer-1',
      email: 'ada@example.com',
      username: 'Ada',
      role: 'FREELANCER',
    };

    renderDashboard([
      myBidsMock([]),
      mySavedJobsMock([postedJob]),
    ]);

    expect(await screen.findByText('Smart Contract Audit')).toBeInTheDocument();
    expect(screen.queryByText(/No saved jobs yet/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unsave smart contract audit/i })).toBeInTheDocument();
  });
});
