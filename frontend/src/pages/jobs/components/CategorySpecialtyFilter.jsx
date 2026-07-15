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
  borderColor: 'rgba(148, 163, 184, 0.42)',
  bg: 'rgba(15, 23, 42, 0.58)',
};

const optionLabelStyles = {
  color: 'rgba(248, 250, 252, 0.9)',
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
    borderColor="rgba(148, 163, 184, 0.28)"
    borderRadius="14px"
    bg="rgba(8, 15, 29, 0.76)"
    color="rgba(226, 232, 240, 0.72)"
    _focusWithin={{
      borderColor: 'rgba(125, 211, 252, 0.54)',
      boxShadow: '0 0 0 1px rgba(125, 211, 252, 0.16)',
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
      bg="transparent"
      color="white"
      fontSize="sm"
      _placeholder={{ color: 'rgba(226, 232, 240, 0.42)' }}
      _focus={{ outline: 'none' }}
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
        color="rgba(226, 232, 240, 0.68)"
        onClick={onClear}
        _hover={{ bg: 'transparent', color: 'cyan.100' }}
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
        borderColor={open ? 'rgba(125, 211, 252, 0.52)' : 'rgba(148, 163, 184, 0.24)'}
        borderRadius="14px"
        bg="rgba(8, 15, 29, 0.72)"
        color="white"
        px={3}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        _hover={{
          bg: 'rgba(8, 15, 29, 0.82)',
          borderColor: 'rgba(125, 211, 252, 0.4)',
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
          borderColor="rgba(148, 163, 184, 0.22)"
          borderRadius="18px"
          bg="rgba(10, 18, 32, 0.98)"
          boxShadow="0 22px 60px rgba(2, 6, 23, 0.48)"
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
                  <Text color="rgba(226, 232, 240, 0.62)" fontSize="sm">
                    {group.name}
                  </Text>
                  {group.showAllOption ? (
                    <Checkbox.Root
                      checked={selectedCategorySet.has(group.id)}
                      colorPalette="cyan"
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
                      checked={selectedSpecialtySet.has(specialty.id)}
                      colorPalette="cyan"
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
                <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm" py={3}>
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
