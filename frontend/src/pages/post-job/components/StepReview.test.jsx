import React from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StepReview from './StepReview.jsx';

const taxonomyNodes = [
  {
    id: 'cat-1',
    name: 'Web, Mobile & Software Dev',
    slug: 'web-mobile-software-dev',
    level: 'CATEGORY',
    displayOrder: 1,
    parent: null,
  },
  {
    id: 'sub-1',
    name: 'Blockchain',
    slug: 'blockchain',
    level: 'SUBCATEGORY',
    displayOrder: 1,
    parent: {
      id: 'cat-1',
      name: 'Web, Mobile & Software Dev',
      displayOrder: 1,
    },
  },
  {
    id: 'spec-1',
    name: 'Emerging Tech',
    slug: 'emerging-tech',
    level: 'SPECIALTY',
    displayOrder: 1,
    parent: {
      id: 'sub-1',
      name: 'Blockchain',
      displayOrder: 1,
      parent: {
        id: 'cat-1',
      },
    },
  },
  {
    id: 'spec-2',
    name: 'NFT & Gaming',
    slug: 'nft-gaming',
    level: 'SPECIALTY',
    displayOrder: 2,
    parent: {
      id: 'sub-1',
      name: 'Blockchain',
      displayOrder: 1,
      parent: {
        id: 'cat-1',
      },
    },
  },
  {
    id: '19',
    name: 'Other - Accounting & Consulting',
    slug: 'other-accounting-consulting',
    level: 'CATEGORY',
    displayOrder: 2,
    parent: null,
  },
];

const baseDraft = {
  title: 'Smart Contract Audit',
  categoryId: 'cat-1',
  categoryName: 'Web, Mobile & Software Dev',
  specialtyId: 'spec-1',
  specialtyName: 'Emerging Tech',
  skillIds: [],
  skillNamesById: {},
  customSkillNames: ['Solidity', 'Smart Contract'],
  scopeSize: 'SMALL',
  scopeDurationAmount: '1',
  scopeDurationUnit: 'MONTH',
  scopeDurationDays: 30,
  experienceLevel: 'ENTRY',
  contractToHire: false,
  budgetType: 'HOURLY',
  budgetNotReadyConfirmed: false,
  budgetNotReadyType: '',
  hourlyRateMin: '17.00',
  hourlyRateMax: '49.00',
  fixedBudget: '',
  currencyCode: 'USD',
  paymentModel: 'OFF_CHAIN_NEGOTIATED',
  description:
    'We need a smart contract auditor to review Solidity contracts and produce a clear security report.',
  attachments: [],
};

const renderReview = (props = {}) => {
  const onDraftPatch = props.onDraftPatch ?? vi.fn();

  render(
    <ChakraProvider value={defaultSystem}>
      <StepReview
        draft={props.draft ?? baseDraft}
        submitError={props.submitError ?? ''}
        onDraftPatch={onDraftPatch}
        taxonomyNodes={taxonomyNodes}
        taxonomyLoading={false}
        taxonomyError={null}
      />
    </ChakraProvider>
  );

  return { onDraftPatch };
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('StepReview', () => {
  it('renders the draft summary sections', () => {
    renderReview();

    expect(screen.getByText('Smart Contract Audit')).toBeInTheDocument();
    expect(screen.getByText(/smart contract auditor/i)).toBeInTheDocument();
    expect(screen.getByText('Emerging Tech')).toBeInTheDocument();
    expect(screen.getByText('Solidity')).toBeInTheDocument();
    expect(screen.getByText('Small, 1 month, Entry level, Not planning to hire full time')).toBeInTheDocument();
    expect(screen.getByText('$17.00 - $49.00 /hr')).toBeInTheDocument();
  });

  it('renders persisted skill names instead of taxonomy labels with matching ids', () => {
    renderReview({
      draft: {
        ...baseDraft,
        skillIds: ['19'],
        skillNamesById: {
          19: 'React',
        },
        customSkillNames: ['ZK Proof'],
      },
    });

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('ZK Proof')).toBeInTheDocument();
    expect(screen.queryByText('Other - Accounting & Consulting')).not.toBeInTheDocument();
  });

  it('falls back to persisted category names while taxonomy is unavailable', () => {
    renderReview({
      draft: {
        ...baseDraft,
        categoryId: 'cat-missing',
        categoryName: 'Development',
        specialtyId: 'spec-missing',
        specialtyName: 'Smart Contracts',
      },
    });

    expect(screen.getByText('Smart Contracts')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  it('commits title edits only when saved', async () => {
    const user = userEvent.setup();
    const { onDraftPatch } = renderReview();

    await user.click(screen.getByRole('button', { name: /edit job name/i }));
    await user.clear(screen.getByDisplayValue('Smart Contract Audit'));
    await user.type(screen.getByRole('textbox', { name: /write a title/i }), 'Protocol Audit');
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onDraftPatch).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /edit job name/i }));
    await user.clear(screen.getByDisplayValue('Smart Contract Audit'));
    await user.type(screen.getByRole('textbox', { name: /write a title/i }), 'Protocol Audit');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onDraftPatch).toHaveBeenCalledWith({ title: 'Protocol Audit' });
  });

  it('validates skills before saving the skills dialog', async () => {
    const user = userEvent.setup();

    renderReview({
      draft: {
        ...baseDraft,
        skillIds: [],
        customSkillNames: [],
      },
    });

    await user.click(screen.getByRole('button', { name: /edit skills/i }));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Add at least one skill before saving.')).toBeInTheDocument();
  });

  it('commits category edits after selecting a specialty', async () => {
    const user = userEvent.setup();
    const { onDraftPatch } = renderReview();

    await user.click(screen.getByRole('button', { name: /edit category/i }));
    await user.selectOptions(screen.getByRole('combobox', { name: /specialty/i }), 'spec-2');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(onDraftPatch).toHaveBeenCalledWith({
      categoryId: 'cat-1',
      specialtyId: 'spec-2',
    });
  });
});
