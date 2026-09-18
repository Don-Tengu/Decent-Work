import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme.js';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET_JOB, GET_MY_BIDS, GET_MY_BID_FOR_JOB, PLACE_BID } from '@/graphql/queries.js';
import SubmitProposalPage from '@/pages/jobs/SubmitProposalPage.jsx';

const authState = vi.hoisted(() => ({
  user: {
    id: 'freelancer-1',
    email: 'freelancer@example.com',
    username: 'Freelancer',
    role: 'FREELANCER',
  },
}));

vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}));

const baseJob = {
  __typename: 'Job',
  id: 'job-1',
  title: 'Smart Contract Audit',
  description: 'Review Solidity contracts and prepare a concise security report with remediation guidance.',
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
  category: { __typename: 'SkillTaxonomyNode', id: 'cat-1', name: 'Web, Mobile & Software Dev' },
  specialty: { __typename: 'SkillTaxonomyNode', id: 'spec-1', name: 'Blockchain' },
  jobSkillTags: [],
  attachments: [],
  bids: [],
  client: { __typename: 'User', id: 'client-1', username: 'Client' },
  createdAt: '2026-05-09T00:00:00',
  updatedAt: '2026-05-09T00:00:00',
  publishedAt: '2026-05-09T00:00:00',
};

const submittedBid = {
  __typename: 'Bid',
  id: 'bid-1',
  amount: 1200,
  proposal: 'I can complete this smart contract audit with a clear findings report and remediation notes.',
  relevantExperience: null,
  deliveryTime: 14,
  status: 'PENDING',
  createdAt: '2026-05-10T00:00:00',
  attachments: [],
  payment: null,
};

const jobMock = (job = baseJob) => ({
  request: { query: GET_JOB, variables: { id: job.id } },
  result: { data: { job } },
});

const myBidForJobMock = (bid = null, jobId = 'job-1') => ({
  request: { query: GET_MY_BID_FOR_JOB, variables: { jobId } },
  result: { data: { myBidForJob: bid } },
});

const myBidsMock = {
  request: { query: GET_MY_BIDS },
  result: { data: { myBids: [] } },
};

const renderPage = (mocks) =>
  render(
    <ChakraProvider value={system}>
      <MockedProvider mocks={mocks}>
        <MemoryRouter initialEntries={['/jobs/job-1/proposal']}>
          <Routes>
            <Route path="/jobs/:jobId/proposal" element={<SubmitProposalPage />} />
            <Route path="/jobs/:jobId" element={<div>Job detail route</div>} />
            <Route path="/my-bids" element={<div>My proposals route</div>} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    </ChakraProvider>
  );

afterEach(() => {
  cleanup();
  authState.user = {
    id: 'freelancer-1',
    email: 'freelancer@example.com',
    username: 'Freelancer',
    role: 'FREELANCER',
  };
});

describe('SubmitProposalPage', () => {
  it('renders the proposal form for an open job', async () => {
    renderPage([jobMock(), myBidForJobMock()]);

    expect(await screen.findByRole('heading', { name: /submit a proposal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit proposal/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/your fixed-price bid/i)).toBeInTheDocument();
  });

  it('blocks submission when required fields are empty', async () => {
    const user = userEvent.setup();
    renderPage([jobMock(), myBidForJobMock()]);

    await user.clear(await screen.findByLabelText(/your fixed-price bid/i));
    await user.click(screen.getByRole('button', { name: /submit proposal/i }));

    expect(await screen.findByText(/proposal amount is required/i)).toBeInTheDocument();
    expect(screen.getByText(/delivery time is required/i)).toBeInTheDocument();
    expect(screen.getByText(/proposal is required/i)).toBeInTheDocument();
  });

  it('submits a valid proposal and redirects to the job page', async () => {
    const user = userEvent.setup();
    const proposal = 'I can complete this smart contract audit with a clear findings report and remediation notes.';

    renderPage([
      jobMock(),
      myBidForJobMock(),
      {
        request: {
          query: PLACE_BID,
          variables: {
            input: { jobId: 'job-1', amount: 1200, deliveryTime: 14, proposal, relevantExperience: null },
          },
        },
        result: { data: { placeBid: submittedBid } },
      },
      myBidForJobMock(submittedBid),
      jobMock(),
      myBidsMock,
    ]);

    const amountField = await screen.findByLabelText(/your fixed-price bid/i);
    await user.clear(amountField);
    await user.type(amountField, '1200');
    await user.type(screen.getByLabelText(/delivery time in days/i), '14');
    await user.type(screen.getByLabelText(/cover letter/i), proposal);
    await user.click(screen.getByRole('button', { name: /submit proposal/i }));

    expect(await screen.findByText(/job detail route/i)).toBeInTheDocument();
  });

  it('sends the recent experience text when the freelancer fills it in', async () => {
    const user = userEvent.setup();
    const proposal = 'I can complete this smart contract audit with a clear findings report and remediation notes.';
    const experience = 'Audited 12 Solidity protocols over the past two years with zero post-launch incidents.';
    const bidWithExperience = { ...submittedBid, relevantExperience: experience };

    renderPage([
      jobMock(),
      myBidForJobMock(),
      {
        request: {
          query: PLACE_BID,
          variables: {
            input: { jobId: 'job-1', amount: 1200, deliveryTime: 14, proposal, relevantExperience: experience },
          },
        },
        result: { data: { placeBid: bidWithExperience } },
      },
      myBidForJobMock(bidWithExperience),
      jobMock(),
      myBidsMock,
    ]);

    const amountField = await screen.findByLabelText(/your fixed-price bid/i);
    await user.clear(amountField);
    await user.type(amountField, '1200');
    await user.type(screen.getByLabelText(/delivery time in days/i), '14');
    await user.type(screen.getByLabelText(/cover letter/i), proposal);
    await user.type(screen.getByLabelText(/recent experience with similar projects/i), experience);
    await user.click(screen.getByRole('button', { name: /submit proposal/i }));

    expect(await screen.findByText(/job detail route/i)).toBeInTheDocument();
  });

  it('redirects to the job page when a proposal already exists', async () => {
    renderPage([jobMock(), myBidForJobMock(submittedBid)]);

    expect(await screen.findByText(/job detail route/i)).toBeInTheDocument();
  });
});
