import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme.js';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JobsFilterSidebar from '@/pages/jobs/components/JobsFilterSidebar.jsx';

const taxonomyNodes = [
  {
    id: 'cat-dev',
    name: 'Web, Mobile & Software Dev',
    level: 'CATEGORY',
    displayOrder: 1,
    parent: null,
  },
];

const renderSidebar = () => {
  const props = {
    taxonomyNodes,
    selectedCategoryIds: [],
    selectedSpecialtyIds: [],
    selectedExperiences: [],
    selectedBudgetTypes: [],
    onTaxonomyChange: vi.fn(),
    onExperienceToggle: vi.fn(),
    onBudgetTypeToggle: vi.fn(),
    onReset: vi.fn(),
  };

  render(
    <ChakraProvider value={system}>
      <JobsFilterSidebar {...props} />
    </ChakraProvider>
  );

  return props;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('JobsFilterSidebar', () => {
  it('collapses and expands active filter sections', async () => {
    const user = userEvent.setup();

    renderSidebar();

    expect(screen.getByRole('button', { name: /all categories/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/entry level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fixed price/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/hourly/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^category$/i }));
    expect(screen.queryByRole('button', { name: /all categories/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^experience level$/i }));
    expect(screen.queryByLabelText(/entry level/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^job type$/i }));
    expect(screen.queryByLabelText(/fixed price/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^category$/i }));
    expect(screen.getByRole('button', { name: /all categories/i })).toBeInTheDocument();
  });

  it('keeps clear as the global reset action', async () => {
    const user = userEvent.setup();
    const props = renderSidebar();

    await user.click(screen.getByRole('button', { name: /^clear$/i }));

    expect(props.onReset).toHaveBeenCalledTimes(1);
  });
});
