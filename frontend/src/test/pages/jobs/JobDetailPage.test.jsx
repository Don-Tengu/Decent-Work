import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GET_JOB,
  GET_MY_BID_FOR_JOB,
  GET_SAVED_JOB_IDS,
} from '@/graphql/queries.js';
import JobDetailPage from '@/pages/jobs/JobDetailPage.jsx';

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
  category: {
    __typename: 'SkillTaxonomyNode',
    id: 'cat-1',
    name: 'Web, Mobile & Software Dev',
  },
  specialty: {
    __typename: 'SkillTaxonomyNode',
    id: 'spec-1',
    name: 'Blockchain',
  },
  jobSkillTags: [],
  attachments: [],
  bids: [],
  client: {
    __typename: 'User',
    id: 'client-1',
    username: 'Client',
  },
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
  request: {
    query: GET_JOB,
    variables: { id: job.id },
  },
  result: {
    data: {
      job,
    },
  },
});

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

const myBidForJobMock = (bid = null, jobId = 'job-1') => ({
  request: {
    query: GET_MY_BID_FOR_JOB,
    variables: { jobId },
  },
  result: {
    data: {
      myBidForJob: bid,
    },
  },
});

const renderJobDetail = (mocks, initialEntry = '/jobs/job-1') =>
  render(
    <ChakraProvider value={defaultSystem}>
      <MockedProvider mocks={mocks}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
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

describe('JobDetailPage proposal flow', () => {
  it('links freelancers to the proposal page for open jobs', async () => {
    renderJobDetail([jobMock(), savedJobIdsMock, myBidForJobMock()]);

    const submitLink = await screen.findByRole('link', { name: /submit proposal/i });
    expect(submitLink).toHaveAttribute('href', '/jobs/job-1/proposal');
    expect(screen.getByText(/0 connects charged during mvp/i)).toBeInTheDocument();
  });

  it('shows the submitted state when the freelancer already proposed', async () => {
    renderJobDetail([jobMock(), savedJobIdsMock, myBidForJobMock(submittedBid)]);

    expect(await screen.findByRole('link', { name: /proposal submitted/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /submit proposal/i })).not.toBeInTheDocument();
  });

  it('does not show an active submit action for clients', async () => {
    authState.user = {
      id: 'client-1',
      email: 'client@example.com',
      username: 'Client',
      role: 'CLIENT',
    };

    renderJobDetail([jobMock(), savedJobIdsMock]);

    expect(await screen.findByRole('button', { name: /freelancers only/i })).toBeDisabled();
    expect(screen.queryByRole('link', { name: /submit proposal/i })).not.toBeInTheDocument();
  });

  it('shows submit work when the hired freelancer has funds in escrow', async () => {
    const hiredJob = {
      ...baseJob,
      status: 'IN_PROGRESS',
    };
    const hiredBid = {
      ...submittedBid,
      status: 'ACCEPTED',
      payment: {
        __typename: 'Payment',
        id: 'payment-1',
        status: 'ESCROWED',
        amount: 1200,
        fundingMode: 'SIMULATED',
        workSubmittedAt: null,
        workSubmissionMessage: null,
        changesRequestedAt: null,
        changesRequestedMessage: null,
      },
    };

    renderJobDetail([jobMock(hiredJob), savedJobIdsMock, myBidForJobMock(hiredBid)]);

    expect(await screen.findByRole('button', { name: /submit work/i })).toBeInTheDocument();
    expect(screen.getByText(/ready to review/i)).toBeInTheDocument();
    expect(screen.queryByText(/proposal actions should stay disabled/i)).not.toBeInTheDocument();
  });

  it('does not show an active submit action for non-open jobs', async () => {
    const closedJob = {
      ...baseJob,
      status: 'IN_PROGRESS',
    };

    renderJobDetail([jobMock(closedJob), savedJobIdsMock, myBidForJobMock(null, 'job-1')]);

    expect(await screen.findByRole('button', { name: /job not open/i })).toBeDisabled();
    expect(screen.queryByRole('link', { name: /submit proposal/i })).not.toBeInTheDocument();
  });
});
