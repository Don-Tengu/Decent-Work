import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { GET_MY_BIDS } from '@/graphql/queries.js';
import MyBids from '@/pages/MyBids.jsx';

const proposalText = 'I can complete this audit with a clear findings report and remediation notes.';

const renderMyBids = (mocks) =>
  render(
    <ChakraProvider value={defaultSystem}>
      <MockedProvider mocks={mocks}>
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

afterEach(() => {
  cleanup();
});

describe('MyBids', () => {
  it('shows submitted proposal details', async () => {
    renderMyBids([
      myBidsMock([
        {
          __typename: 'Bid',
          id: 'bid-1',
          amount: 1200,
          proposal: proposalText,
          deliveryTime: 14,
          status: 'PENDING',
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
        },
      ]),
    ]);

    expect(await screen.findByText('Smart Contract Audit')).toBeInTheDocument();
    expect(screen.getByText('$1,200')).toBeInTheDocument();
    expect(screen.getByText('14 days')).toBeInTheDocument();
    expect(screen.getByText(proposalText)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view job/i })).toHaveAttribute('href', '/jobs/job-1');
  });

  it('flags an accepted proposal as hired and in progress', async () => {
    renderMyBids([
      myBidsMock([
        {
          __typename: 'Bid',
          id: 'bid-2',
          amount: 1200,
          proposal: proposalText,
          deliveryTime: 14,
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
        },
      ]),
    ]);

    expect(await screen.findByText(/hired · in progress/i)).toBeInTheDocument();
  });

  it('shows an empty state when no proposals exist', async () => {
    renderMyBids([myBidsMock([])]);

    expect(await screen.findByRole('heading', { name: /no proposals yet/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse jobs/i })).toHaveAttribute('href', '/jobs');
  });
});
