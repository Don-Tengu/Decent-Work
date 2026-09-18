import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme.js';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CategorySpecialtyFilter from '@/pages/jobs/components/CategorySpecialtyFilter.jsx';

const taxonomyNodes = [
  {
    id: 'cat-design',
    name: 'Design & Creative',
    level: 'CATEGORY',
    displayOrder: 1,
    parent: null,
  },
  {
    id: 'sub-design',
    name: 'Game Art',
    level: 'SUBCATEGORY',
    displayOrder: 1,
    parent: { id: 'cat-design' },
  },
  {
    id: 'spec-nft-art',
    name: 'NFT, AR/VR & Game Art',
    level: 'SPECIALTY',
    displayOrder: 1,
    parent: { id: 'sub-design' },
  },
  {
    id: 'cat-dev',
    name: 'Web, Mobile & Software Dev',
    level: 'CATEGORY',
    displayOrder: 2,
    parent: null,
  },
  {
    id: 'sub-blockchain',
    name: 'Blockchain',
    level: 'SUBCATEGORY',
    displayOrder: 1,
    parent: { id: 'cat-dev' },
  },
  {
    id: 'spec-blockchain',
    name: 'Blockchain, NFT & Cryptocurrency',
    level: 'SPECIALTY',
    displayOrder: 1,
    parent: { id: 'sub-blockchain' },
  },
  {
    id: 'spec-ai',
    name: 'AI Apps & Integration',
    level: 'SPECIALTY',
    displayOrder: 2,
    parent: { id: 'sub-blockchain' },
  },
];

const StatefulFilter = ({ onChange = vi.fn() }) => {
  const [selection, setSelection] = React.useState({
    categoryIds: [],
    specialtyIds: [],
  });

  const handleChange = (nextSelection) => {
    setSelection(nextSelection);
    onChange(nextSelection);
  };

  return (
    <ChakraProvider value={system}>
      <CategorySpecialtyFilter
        taxonomyNodes={taxonomyNodes}
        selectedCategoryIds={selection.categoryIds}
        selectedSpecialtyIds={selection.specialtyIds}
        onChange={handleChange}
      />
    </ChakraProvider>
  );
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CategorySpecialtyFilter', () => {
  it('clears category-wide selection when a specialty in that category is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<StatefulFilter onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /all categories/i }));
    await user.click(screen.getByLabelText(/all - web, mobile & software dev/i));

    expect(screen.getByLabelText(/all - web, mobile & software dev/i)).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith({
      categoryIds: ['cat-dev'],
      specialtyIds: [],
    });

    await user.click(screen.getByLabelText(/blockchain, nft & cryptocurrency/i));

    expect(screen.getByLabelText(/all - web, mobile & software dev/i)).not.toBeChecked();
    expect(screen.getByLabelText(/blockchain, nft & cryptocurrency/i)).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith({
      categoryIds: [],
      specialtyIds: ['spec-blockchain'],
    });
  });

  it('clears selected specialties in a category when all category is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<StatefulFilter onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /all categories/i }));
    await user.click(screen.getByLabelText(/ai apps & integration/i));
    await user.click(screen.getByLabelText(/all - web, mobile & software dev/i));

    expect(screen.getByLabelText(/ai apps & integration/i)).not.toBeChecked();
    expect(screen.getByLabelText(/all - web, mobile & software dev/i)).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith({
      categoryIds: ['cat-dev'],
      specialtyIds: [],
    });
  });

  it('summarizes multiple selections with comma-separated labels', async () => {
    const user = userEvent.setup();

    render(<StatefulFilter />);

    await user.click(screen.getByRole('button', { name: /all categories/i }));
    await user.click(screen.getByLabelText(/blockchain, nft & cryptocurrency/i));
    await user.click(screen.getByLabelText(/ai apps & integration/i));

    expect(screen.getByRole('button', {
      name: /blockchain, nft & cryptocurrency, ai apps & integration/i,
    })).toBeInTheDocument();
  });

  it('filters specialties and keeps their category headings visible', async () => {
    const user = userEvent.setup();

    render(<StatefulFilter />);

    await user.click(screen.getByRole('button', { name: /all categories/i }));
    await user.type(screen.getByLabelText(/search categories and specialties/i), 'NFT');

    expect(screen.getByText('Design & Creative')).toBeInTheDocument();
    expect(screen.getByLabelText(/nft, ar\/vr & game art/i)).toBeInTheDocument();
    expect(screen.getByText('Web, Mobile & Software Dev')).toBeInTheDocument();
    expect(screen.getByLabelText(/blockchain, nft & cryptocurrency/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/ai apps & integration/i)).not.toBeInTheDocument();
  });
});
