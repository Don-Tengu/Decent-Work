import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme.js';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { GET_USER } from '@/graphql/queries.js';
import FreelancerProfilePage from '@/pages/profile/FreelancerProfilePage.jsx';

const profileUser = {
  __typename: 'User',
  id: 'user-1',
  username: 'ada',
  role: 'FREELANCER',
  walletAddress: '0x1234567890abcdef1234',
  createdAt: '2025-01-04T00:00:00',
  profile: {
    __typename: 'UserProfile',
    fullName: 'Ada Lovelace',
    bio: 'Security researcher focused on EVM contracts.',
    skills: ['Solidity', 'Foundry'],
    hourlyRate: 85,
    profileImage: null,
  },
};

const userMock = (user = profileUser) => ({
  request: { query: GET_USER, variables: { id: 'user-1' } },
  result: { data: { user } },
});

const renderProfile = (mocks) =>
  render(
    <ChakraProvider value={system}>
      <MockedProvider mocks={mocks}>
        <MemoryRouter initialEntries={['/freelancers/user-1']}>
          <Routes>
            <Route path="/freelancers/:userId" element={<FreelancerProfilePage />} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    </ChakraProvider>
  );

afterEach(cleanup);

describe('FreelancerProfilePage', () => {
  it('renders the real profile data we have', async () => {
    renderProfile([userMock()]);

    expect(await screen.findByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByText(/security researcher/i)).toBeInTheDocument();
    expect(screen.getByText('Solidity')).toBeInTheDocument();
    expect(screen.getByText('$85/hr')).toBeInTheDocument();
    expect(screen.getByText(/member since/i)).toBeInTheDocument();
  });

  it('renders coming-soon scaffolds for sections without data', async () => {
    renderProfile([userMock()]);

    await screen.findByRole('heading', { name: 'Ada Lovelace' });

    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Employment history')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Reviews & ratings')).toBeInTheDocument();
    expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThanOrEqual(4);
  });
});
