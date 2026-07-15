import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ACCEPT_BID,
  GET_JOB,
  GET_JOB_BIDS,
  GET_PAYMENT_FOR_JOB,
} from '@/graphql/queries.js';
import ProposalsPage from '@/pages/jobs/ProposalsPage.jsx';

const authState = vi.hoisted(() => ({
  user: {
    id: 'client-1',
    email: 'jean@example.com',
    username: 'Jean',
    role: 'CLIENT',
  },
}));

vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}));

const makeJob = (overrides = {}) => ({
  __typename: 'Job',
  id: 'job-1',
  title: 'Smart Contract Audit',
  description: 'Review Solidity contracts and prepare a concise security report.',
  status: 'OPEN',
  draftStep: null,
  scopeSize: 'MEDIUM',
  scopeDurationAmount: 1,
  scopeDurationUnit: 'MONTH',
  scopeDurationDays: 30,
  experienceLevel: 'EXPERT',
  contractToHire: false,
  budgetType: 'FIXED',
  hourlyRateMin: null,
  hourlyRateMax: null,
  fixedBudget: 1500,
  currencyCode: 'USD',
  paymentModel: 'OFF_CHAIN_NEGOTIATED',
  category: { __typename: 'SkillTaxonomyNode', id: 'cat-1', name: 'Development' },
  specialty: { __typename: 'SkillTaxonomyNode', id: 'spec-1', name: 'Blockchain' },
  jobSkillTags: [],
  attachments: [],
  bids: [{ __typename: 'Bid', id: 'bid-1', status: 'PENDING' }],
  client: { __typename: 'User', id: 'client-1', username: 'Jean' },
  createdAt: '2026-05-09T00:00:00',
  updatedAt: '2026-05-09T00:00:00',
  publishedAt: '2026-05-09T00:00:00',
  ...overrides,
});

const makeFreelancer = (overrides = {}) => ({
  __typename: 'User',
  id: 'freelancer-1',
  username: 'ada',
  role: 'FREELANCER',
  walletAddress: '0x1234567890abcdef1234',
  createdAt: '2025-01-04T00:00:00',
  profile: {
    __typename: 'UserProfile',
    fullName: 'Ada Lovelace',
    bio: 'Security researcher focused on EVM contracts.',
    skills: ['Solidity', 'Foundry', 'EVM'],
    hourlyRate: 85,
    profileImage: null,
  },
  ...overrides,
});

const makeBid = (overrides = {}) => ({
  __typename: 'Bid',
  id: 'bid-1',
  amount: 1200,
  proposal: 'I can complete this audit with a clear findings report and remediation notes.',
  relevantExperience: 'Audited 20+ Solidity contracts.',
  deliveryTime: 7,
  status: 'PENDING',
  freelancer: makeFreelancer(),
  createdAt: '2026-05-09T00:00:00',
  attachments: [],
  ...overrides,
});

const jobMock = (job = makeJob()) => ({
  request: { query: GET_JOB, variables: { id: job.id } },
  result: { data: { job } },
});

const jobBidsMock = (bids) => ({
  request: { query: GET_JOB_BIDS, variables: { jobId: 'job-1' } },
  result: { data: { jobBids: bids } },
});

const paymentMock = (payment) => ({
  request: { query: GET_PAYMENT_FOR_JOB, variables: { jobId: 'job-1' } },
  result: { data: { paymentForJob: payment } },
});

const escrowedPayment = {
  __typename: 'Payment',
  id: 'payment-1',
  status: 'ESCROWED',
  amount: 1200,
};

const acceptBidMock = () => ({
  request: { query: ACCEPT_BID, variables: { bidId: 'bid-1' } },
  result: {
    data: {
      acceptBid: {
        __typename: 'Payment',
        id: 'payment-1',
        status: 'ESCROWED',
        amount: 1200,
        job: { __typename: 'Job', id: 'job-1', status: 'IN_PROGRESS' },
      },
    },
  },
});

const renderProposals = (mocks) =>
  render(
    <ChakraProvider value={defaultSystem}>
      <MockedProvider mocks={mocks}>
        <MemoryRouter initialEntries={['/jobs/job-1/proposals']}>
          <Routes>
            <Route path="/jobs/:jobId/proposals" element={<ProposalsPage />} />
            <Route path="/freelancers/:userId" element={<div>Full profile route</div>} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    </ChakraProvider>
  );

afterEach(() => {
  cleanup();
  authState.user = {
    id: 'client-1',
    email: 'jean@example.com',
    username: 'Jean',
    role: 'CLIENT',
  };
});

describe('ProposalsPage', () => {
  it('lists proposals with the freelancer name, skills, and amount', async () => {
    renderProposals([jobMock(), jobBidsMock([makeBid()]), paymentMock(null)]);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText(/proposals for smart contract audit/i)).toBeInTheDocument();
    expect(screen.getByText(/clear findings report/i)).toBeInTheDocument();
    expect(screen.getByText('Solidity')).toBeInTheDocument();
    expect(screen.getByText('$1,200')).toBeInTheDocument();
    expect(screen.getByText(/7 days delivery/i)).toBeInTheDocument();
    expect(
      screen.getByText((text) => text.startsWith('Freelancer') && /member since/i.test(text))
    ).toBeInTheDocument();
  });

  it('opens the freelancer drawer and links to the full profile', async () => {
    const user = userEvent.setup();

    renderProposals([jobMock(), jobBidsMock([makeBid()]), paymentMock(null)]);

    await user.click(await screen.findByRole('button', { name: /ada lovelace/i }));

    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText(/cover letter/i)).toBeInTheDocument();
    expect(within(drawer).getByText(/audited 20\+ solidity contracts/i)).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: /view full profile/i })).toHaveAttribute(
      'href',
      '/freelancers/freelancer-1'
    );
  });

  it('shows an empty state when there are no proposals', async () => {
    renderProposals([jobMock(), jobBidsMock([]), paymentMock(null)]);

    expect(await screen.findByText(/no proposals yet/i)).toBeInTheDocument();
  });

  it('keeps proposals private from clients who do not own the job', async () => {
    authState.user = { id: 'other-client', email: 'x@example.com', username: 'X', role: 'CLIENT' };

    renderProposals([jobMock()]);

    expect(await screen.findByText(/proposals are private/i)).toBeInTheDocument();
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
  });

  it('shows a Hire action on open proposals and confirms before hiring', async () => {
    const user = userEvent.setup();

    renderProposals([jobMock(), jobBidsMock([makeBid()]), paymentMock(null)]);

    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'Hire' }));

    const dialog = await screen.findByRole('dialog', { name: /hire ada lovelace/i });
    expect(within(dialog).getByText(/declines every other proposal/i)).toBeInTheDocument();
  });

  it('hires a freelancer end-to-end and surfaces the release action', async () => {
    const user = userEvent.setup();

    renderProposals([
      jobMock(),
      jobBidsMock([makeBid()]),
      paymentMock(null),
      acceptBidMock(),
      jobMock(makeJob({ status: 'IN_PROGRESS' })),
      jobBidsMock([makeBid({ status: 'ACCEPTED' })]),
      paymentMock(escrowedPayment),
    ]);

    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'Hire' }));

    const dialog = await screen.findByRole('dialog', { name: /hire ada lovelace/i });
    await user.click(within(dialog).getByRole('button', { name: 'Hire' }));

    expect(await screen.findByRole('button', { name: /release payment/i })).toBeInTheDocument();
    expect(screen.getByText(/funds in escrow/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hire' })).not.toBeInTheDocument();
  });

  it('confirms before releasing payment on a hired job', async () => {
    const user = userEvent.setup();

    renderProposals([
      jobMock(makeJob({ status: 'IN_PROGRESS' })),
      jobBidsMock([makeBid({ status: 'ACCEPTED' })]),
      paymentMock(escrowedPayment),
    ]);

    await user.click(await screen.findByRole('button', { name: /release payment/i }));

    const dialog = await screen.findByRole('dialog', { name: /release payment/i });
    expect(within(dialog).getByText(/marks the job complete/i)).toBeInTheDocument();
  });
});
