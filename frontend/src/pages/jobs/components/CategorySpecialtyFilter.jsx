import React from 'react';
import { Box, Button, Checkbox, HStack, Text, VStack } from '@chakra-ui/react';
import { ChevronDown, Search, X } from 'lucide-react';
import {
  buildCategoryFilterGroups,
  filterCategoryGroups,
  getCategoryFilterLabel,
  toggleCategorySelection,
  toggleSpecialtySelection,
} from '../taxonomyFilters.js';

const checkboxStyles = {
  borderColor: 'border.default',
  bg: 'bg.panel',
  color: 'fg.default',
};

const optionLabelStyles = {
  color: 'fg.default',
  fontSize: 'sm',
  fontWeight: 'semibold',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const dropdownScrollbarStyles = {
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(125, 211, 252, 0.38) rgba(15, 23, 42, 0.28)',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(15, 23, 42, 0.28)',
    borderRadius: '999px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(125, 211, 252, 0.34)',
    border: '2px solid rgba(10, 18, 32, 0.98)',
    borderRadius: '999px',
    backgroundClip: 'padding-box',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(125, 211, 252, 0.48)',
  },
};

const SearchInput = ({ value, onChange, onClear }) => (
  <HStack
    h="40px"
    px={3}
    gap={2}
    border="1px solid"
    borderColor="border.default"
    borderRadius="12px"
    bg="bg.muted"
    color="fg.muted"
    _focusWithin={{
      borderColor: 'ink.900',
      boxShadow: '0 0 0 1px #141413',
    }}
  >
    <Search size={16} />
    <Box
      as="input"
      aria-label="Search categories and specialties"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      flex="1"
      minW="0"
      h="full"
      border="0"
      outline="0"
      bg="bg.muted"
      color="fg.default"
      fontSize="sm"
      _placeholder={{ color: 'fg.subtle' }}
      _focus={{ outline: 'none', bg: 'bg.muted' }}
    />
    {value ? (
      <Button
        type="button"
        aria-label="Clear category search"
        size="xs"
        variant="plain"
        minW="0"
        boxSize="24px"
        p={0}
        borderRadius="full"
        color="fg.muted"
        onClick={onClear}
        _hover={{ bg: 'transparent', color: 'fg.default' }}
      >
        <X size={14} />
      </Button>
    ) : null}
  </HStack>
);

const CategorySpecialtyFilter = ({
  taxonomyNodes,
  selectedCategoryIds,
  selectedSpecialtyIds,
  onChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const rootRef = React.useRef(null);
  const groups = React.useMemo(() => buildCategoryFilterGroups(taxonomyNodes), [taxonomyNodes]);
  const visibleGroups = React.useMemo(() => filterCategoryGroups(groups, search), [groups, search]);
  const selectedCategorySet = React.useMemo(
    () => new Set(selectedCategoryIds.map(String)),
    [selectedCategoryIds]
  );
  const selectedSpecialtySet = React.useMemo(
    () => new Set(selectedSpecialtyIds.map(String)),
    [selectedSpecialtyIds]
  );
  const triggerLabel = getCategoryFilterLabel(groups, selectedCategoryIds, selectedSpecialtyIds);

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const handleCategoryToggle = (group, checked) => {
    onChange(toggleCategorySelection({
      selectedCategoryIds,
      selectedSpecialtyIds,
      categoryId: group.id,
      specialtyIds: group.specialties.map((specialty) => specialty.id),
      checked,
    }));
  };

  const handleSpecialtyToggle = (group, specialty, checked) => {
    onChange(toggleSpecialtySelection({
      selectedCategoryIds,
      selectedSpecialtyIds,
      categoryId: group.id,
      specialtyId: specialty.id,
      checked,
    }));
  };

  return (
    <Box ref={rootRef} position="relative">
      <Button
        type="button"
        w="full"
        h="42px"
        justifyContent="space-between"
        variant="plain"
        border="1px solid"
        borderColor="border.default"
        borderRadius="12px"
        bg="bg.canvas"
        color="fg.default"
        px={3}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        _hover={{
          bg: 'bg.canvas',
          borderColor: 'ink.900',
        }}
        _focusVisible={{
          outline: '2px solid',
          outlineColor: 'rgba(125, 211, 252, 0.5)',
          outlineOffset: '2px',
        }}
      >
        <Text overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" fontWeight="medium">
          {triggerLabel}
        </Text>
        <ChevronDown
          size={17}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 140ms ease',
          }}
        />
      </Button>

      {open ? (
        <Box
          position="absolute"
          zIndex={20}
          top="calc(100% + 8px)"
          left={0}
          w={{ base: 'full', lg: '380px' }}
          maxW={{ base: 'full', lg: 'calc(100vw - 48px)' }}
          maxH="380px"
          p={3}
          border="1px solid"
          borderColor="border.default"
          borderRadius="12px"
          bg="bg.panel"
          boxShadow="0 12px 32px rgba(20, 20, 19, 0.08)"
          overflow="hidden"
        >
          <VStack align="stretch" gap={3}>
            <SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} />
            <VStack
              align="stretch"
              gap={4}
              maxH="300px"
              overflowY="auto"
              overflowX="hidden"
              pr={2}
              css={dropdownScrollbarStyles}
            >
              {visibleGroups.length ? visibleGroups.map((group) => (
                <VStack key={group.id} align="stretch" gap={2}>
                  <Text color="fg.muted" fontSize="sm">
                    {group.name}
                  </Text>
                  {group.showAllOption ? (
                    <Checkbox.Root
                      variant="outline"
                      checked={selectedCategorySet.has(group.id)}
                      onCheckedChange={(details) => handleCategoryToggle(group, Boolean(details.checked))}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control {...checkboxStyles}>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label {...optionLabelStyles}>
                        All - {group.name}
                      </Checkbox.Label>
                    </Checkbox.Root>
                  ) : null}
                  {group.specialties.map((specialty) => (
                    <Checkbox.Root
                      key={specialty.id}
                      variant="outline"
                      checked={selectedSpecialtySet.has(specialty.id)}
                      onCheckedChange={(details) => handleSpecialtyToggle(group, specialty, Boolean(details.checked))}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control {...checkboxStyles}>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label {...optionLabelStyles}>
                        {specialty.name}
                      </Checkbox.Label>
                    </Checkbox.Root>
                  ))}
                </VStack>
              )) : (
                <Text color="fg.muted" fontSize="sm" py={3}>
                  No matching categories or specialties.
                </Text>
              )}
            </VStack>
          </VStack>
        </Box>
      ) : null}
    </Box>
  );
};

export default CategorySpecialtyFilter;
