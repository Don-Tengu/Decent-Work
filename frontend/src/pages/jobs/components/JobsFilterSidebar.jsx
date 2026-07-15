import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';
import { BUDGET_TYPE_FILTERS, EXPERIENCE_FILTERS } from '../constants.js';
import CategorySpecialtyFilter from './CategorySpecialtyFilter.jsx';

const FilterSection = ({ title, open, onToggle, children }) => (
  <Box borderBottom="1px solid" borderColor="rgba(148, 163, 184, 0.16)" pb={6}>
    <HStack
      as="button"
      type="button"
      w="full"
      justify="space-between"
      mb={open ? 4 : 0}
      p={0}
      border="0"
      bg="transparent"
      appearance="none"
      cursor="pointer"
      textAlign="left"
      onClick={onToggle}
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'rgba(125, 211, 252, 0.5)',
        outlineOffset: '3px',
      }}
    >
      <Text color="white" fontWeight="bold">
        {title}
      </Text>
      <ChevronDown
        size={17}
        color="rgba(226, 232, 240, 0.62)"
        style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 140ms ease',
        }}
      />
    </HStack>
    {open ? children : null}
  </Box>
);

const FilterCheckbox = ({ checked, label, value, onToggle }) => (
  <Checkbox.Root
    checked={checked}
    onCheckedChange={(details) => onToggle(value, Boolean(details.checked))}
    colorPalette="cyan"
  >
    <Checkbox.HiddenInput />
    <Checkbox.Control
      borderColor="rgba(148, 163, 184, 0.42)"
      bg="rgba(15, 23, 42, 0.58)"
    >
      <Checkbox.Indicator />
    </Checkbox.Control>
    <Checkbox.Label color="rgba(248, 250, 252, 0.88)" fontSize="sm">
      {label}
    </Checkbox.Label>
  </Checkbox.Root>
);

const JobsFilterSidebar = ({
  taxonomyNodes,
  selectedCategoryIds,
  selectedSpecialtyIds,
  selectedExperiences,
  selectedBudgetTypes,
  onTaxonomyChange,
  onExperienceToggle,
  onBudgetTypeToggle,
  onReset,
}) => {
  const [openSections, setOpenSections] = React.useState({
    category: true,
    experience: true,
    budget: true,
  });

  const toggleSection = (section) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  return (
    <VStack as="aside" align="stretch" gap={6}>
      <HStack justify="space-between">
        <Text color="rgba(226, 232, 240, 0.7)" fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="0.08em">
          Filters
        </Text>
        <Button
          type="button"
          size="xs"
          variant="plain"
          px={3}
          bg="transparent"
          color="rgba(125, 211, 252, 0.82)"
          fontWeight="semibold"
          textUnderlineOffset="3px"
          onClick={onReset}
          _hover={{
            bg: 'transparent',
            color: 'cyan.100',
            textDecoration: 'underline',
          }}
          _active={{
            bg: 'transparent',
            color: 'cyan.200',
          }}
          _focusVisible={{
            outline: '2px solid',
            outlineColor: 'rgba(125, 211, 252, 0.5)',
            outlineOffset: '2px',
          }}
        >
          Clear
        </Button>
      </HStack>

      <FilterSection
        title="Category"
        open={openSections.category}
        onToggle={() => toggleSection('category')}
      >
        <CategorySpecialtyFilter
          taxonomyNodes={taxonomyNodes}
          selectedCategoryIds={selectedCategoryIds}
          selectedSpecialtyIds={selectedSpecialtyIds}
          onChange={onTaxonomyChange}
        />
      </FilterSection>

      <FilterSection
        title="Experience level"
        open={openSections.experience}
        onToggle={() => toggleSection('experience')}
      >
        <VStack align="stretch" gap={3}>
          {EXPERIENCE_FILTERS.map((filter) => (
            <FilterCheckbox
              key={filter.value}
              checked={selectedExperiences.includes(filter.value)}
              label={filter.label}
              value={filter.value}
              onToggle={onExperienceToggle}
            />
          ))}
        </VStack>
      </FilterSection>

      <FilterSection
        title="Job type"
        open={openSections.budget}
        onToggle={() => toggleSection('budget')}
      >
        <VStack align="stretch" gap={3}>
          {BUDGET_TYPE_FILTERS.map((filter) => (
            <FilterCheckbox
              key={filter.value}
              checked={selectedBudgetTypes.includes(filter.value)}
              label={filter.label}
              value={filter.value}
              onToggle={onBudgetTypeToggle}
            />
          ))}
        </VStack>
      </FilterSection>
    </VStack>
  );
};

export default JobsFilterSidebar;
