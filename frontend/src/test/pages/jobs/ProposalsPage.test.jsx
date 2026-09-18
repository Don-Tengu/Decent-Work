import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme.js';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GET_JOB,
  GET_JOB_BIDS,
  GET_PAYMENT_FOR_JOB,
  OFFER_BID,
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
  fundingMode: 'SIMULATED',
  onChainEscrowId: null,
  fundTransactionHash: null,
  releaseTransactionHash: null,
  clientWallet: null,
  freelancerWallet: null,
  platformFeePercent: 5,
  chainId: null,
  escrowAddress: '0x0',
  workSubmittedAt: null,
  workSubmissionMessage: null,
  changesRequestedAt: null,
  changesRequestedMessage: null,
};

const inReviewPayment = {
  ...escrowedPayment,
  status: 'IN_REVIEW',
  workSubmittedAt: '2026-08-30T12:00:00',
  workSubmissionMessage: 'Audit report is in the shared folder.',
};

const offerBidMock = () => ({
  request: { query: OFFER_BID, variables: { bidId: 'bid-1' } },
  result: {
    data: {
      offerBid: {
        __typename: 'Bid',
        id: 'bid-1',
        status: 'OFFERED',
        amount: 1200,
        job: {
          __typename: 'Job',
          id: 'job-1',
          status: 'OPEN',
        },
      },
    },
  },
});

const renderProposals = (mocks) =>
  render(
    <ChakraProvider value={system}>
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

  it('shows an Offer action and confirms before sending', async () => {
    const user = userEvent.setup();

    renderProposals([jobMock(), jobBidsMock([makeBid()]), paymentMock(null)]);

    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'Offer' }));

    const dialog = await screen.findByRole('dialog', { name: /send offer to ada lovelace/i });
    expect(within(dialog).getByText(/other proposals stay open until they accept/i)).toBeInTheDocument();
  });

  it('sends an offer and shows waiting state without rejecting others', async () => {
    const user = userEvent.setup();

    renderProposals([
      jobMock(),
      jobBidsMock([makeBid()]),
      paymentMock(null),
      offerBidMock(),
      jobMock(),
      jobBidsMock([makeBid({ status: 'OFFERED' })]),
      paymentMock(null),
    ]);

    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'Offer' }));

    const dialog = await screen.findByRole('dialog', { name: /send offer to ada lovelace/i });
    await user.click(within(dialog).getByRole('button', { name: 'Send offer' }));

    expect(await screen.findByText(/offer sent — waiting for freelancer/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /withdraw offer/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Offer' })).not.toBeInTheDocument();
  });

  it('confirms before releasing payment on a hired job', async () => {
    const user = userEvent.setup();

    renderProposals([
      jobMock(makeJob({ status: 'IN_PROGRESS' })),
      jobBidsMock([makeBid({ status: 'ACCEPTED' })]),
      paymentMock(escrowedPayment),
    ]);

    expect(await screen.findByText(/manage contract/i)).toBeInTheDocument();
    expect(screen.getByText(/hired freelancer/i)).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: /release payment/i }));

    const dialog = await screen.findByRole('dialog', { name: /release payment/i });
    expect(within(dialog).getByText(/marks the job complete/i)).toBeInTheDocument();
  });

  it('groups non-hired proposals under Other proposals on an in-progress job', async () => {
    renderProposals([
      jobMock(makeJob({ status: 'IN_PROGRESS' })),
      jobBidsMock([
        makeBid({ status: 'ACCEPTED' }),
        makeBid({
          id: 'bid-2',
          status: 'PENDING',
          freelancer: makeFreelancer({
            id: 'freelancer-2',
            username: 'bob',
            profile: {
              fullName: 'Bob',
              bio: null,
              skills: [],
              hourlyRate: null,
              profileImage: null,
            },
          }),
        }),
      ]),
      paymentMock(escrowedPayment),
    ]);

    expect(await screen.findByRole('button', { name: /release payment/i })).toBeInTheDocument();
    expect(screen.getByText(/other proposals/i)).toBeInTheDocument();
    expect(screen.getByText('Not selected')).toBeInTheDocument();
  });

  it('shows approve and request-changes actions when work is in review', async () => {
    renderProposals([
      jobMock(makeJob({ status: 'IN_PROGRESS' })),
      jobBidsMock([makeBid({ status: 'ACCEPTED' })]),
      paymentMock(inReviewPayment),
    ]);

    expect(await screen.findByRole('button', { name: /approve & release/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request changes/i })).toBeInTheDocument();
    expect(screen.getByText(/work submitted for review/i)).toBeInTheDocument();
    expect(screen.getByText(/audit report is in the shared folder/i)).toBeInTheDocument();
  });

  it('shows withdraw offer when a proposal is already offered', async () => {
    renderProposals([
      jobMock(),
      jobBidsMock([makeBid({ status: 'OFFERED' })]),
      paymentMock(null),
    ]);

    expect(await screen.findByRole('button', { name: /withdraw offer/i })).toBeInTheDocument();
    expect(screen.getByText(/offer sent — waiting for freelancer/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Offer' })).not.toBeInTheDocument();
  });
});
