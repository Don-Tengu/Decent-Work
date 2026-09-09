import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import {
  GET_MY_BIDS,
  GET_MY_NOTIFICATIONS,
  UNREAD_NOTIFICATION_COUNT,
} from '@/graphql/queries.js';
import MyBids from '@/pages/MyBids.jsx';

const proposalText = 'I can complete this audit with a clear findings report and remediation notes.';

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

const renderMyBids = (mocks) =>
  render(
    <ChakraProvider value={defaultSystem}>
      <MockedProvider mocks={[...notificationMocks, ...mocks]}>
        <MemoryRouter>
          <MyBids />
        </MemoryRouter>
      </MockedProvider>
    </ChakraProvider>
  );

const myBidsMock = (bids) => ({
  request: {
    query: GET_MY_BIDS,
  },
  result: {
    data: {
      myBids: bids,
    },
  },
});

const makeBid = (overrides = {}) => ({
  __typename: 'Bid',
  id: 'bid-1',
  amount: 1200,
  proposal: proposalText,
  relevantExperience: null,
  deliveryTime: 14,
  status: 'PENDING',
  attachments: [],
  job: {
    __typename: 'Job',
    id: 'job-1',
    title: 'Smart Contract Audit',
    status: 'OPEN',
    budgetType: 'FIXED',
    hourlyRateMin: null,
    hourlyRateMax: null,
    fixedBudget: 1500,
    currencyCode: 'USD',
  },
  payment: null,
  ...overrides,
});

afterEach(() => {
  cleanup();
});

describe('MyBids', () => {
  it('shows submitted proposal details', async () => {
    renderMyBids([myBidsMock([makeBid()])]);

    expect(await screen.findByText('Smart Contract Audit')).toBeInTheDocument();
    expect(screen.getByText('$1,200')).toBeInTheDocument();
    expect(screen.getByText('14 days')).toBeInTheDocument();
    expect(screen.getByText(proposalText)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view job/i })).toHaveAttribute('href', '/jobs/job-1');
  });

  it('formats USDC amounts without crashing NumberFormat', async () => {
    renderMyBids([
      myBidsMock([
        makeBid({
          job: {
            __typename: 'Job',
            id: 'job-1',
            title: 'Smart Contract Audit',
            status: 'OPEN',
            budgetType: 'FIXED',
            hourlyRateMin: null,
            hourlyRateMax: null,
            fixedBudget: 1500,
            currencyCode: 'USDC',
          },
        }),
      ]),
    ]);

    expect(await screen.findByText('Smart Contract Audit')).toBeInTheDocument();
    expect(screen.getByText('$1,200')).toBeInTheDocument();
    expect(screen.getByText(/job budget: \$1,500/i)).toBeInTheDocument();
  });

  it('flags an accepted proposal as an active contract', async () => {
    renderMyBids([
      myBidsMock([
        makeBid({
          id: 'bid-2',
          status: 'ACCEPTED',
          job: {
            __typename: 'Job',
            id: 'job-2',
            title: 'Smart Contract Audit',
            status: 'IN_PROGRESS',
            budgetType: 'FIXED',
            hourlyRateMin: null,
            hourlyRateMax: null,
            fixedBudget: 1500,
            currencyCode: 'USD',
          },
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
        }),
      ]),
    ]);

    expect(await screen.findByText(/submit work when you are done/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit work/i })).toBeInTheDocument();
  });

  it('shows awaiting-review copy after work is submitted', async () => {
    renderMyBids([
      myBidsMock([
        makeBid({
          id: 'bid-2',
          status: 'ACCEPTED',
          job: {
            __typename: 'Job',
            id: 'job-2',
            title: 'Smart Contract Audit',
            status: 'IN_PROGRESS',
            budgetType: 'FIXED',
            hourlyRateMin: null,
            hourlyRateMax: null,
            fixedBudget: 1500,
            currencyCode: 'USD',
          },
          payment: {
            __typename: 'Payment',
            id: 'payment-1',
            status: 'IN_REVIEW',
            amount: 1200,
            fundingMode: 'SIMULATED',
            workSubmittedAt: '2026-08-30T12:00:00',
            workSubmissionMessage: 'PR is ready.',
            changesRequestedAt: null,
            changesRequestedMessage: null,
          },
        }),
      ]),
    ]);

    expect(await screen.findByText(/waiting for the client to review/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit work/i })).not.toBeInTheDocument();
    expect(screen.getByText(/you submitted: pr is ready/i)).toBeInTheDocument();
  });

  it('shows accept and decline actions for an offered proposal', async () => {
    renderMyBids([
      myBidsMock([
        makeBid({
          status: 'OFFERED',
        }),
      ]),
    ]);

    expect(await screen.findByText(/offer received/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept offer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
    expect(screen.getByText(/1 offer needs your response/i)).toBeInTheDocument();
  });

  it('shows an empty state when no proposals exist', async () => {
    renderMyBids([myBidsMock([])]);

    expect(await screen.findByRole('heading', { name: /no proposals yet/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse jobs/i })).toHaveAttribute('href', '/jobs');
  });
});
