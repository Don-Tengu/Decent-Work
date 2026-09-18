import React, { useState } from 'react';
import {
  Box,
  Field,
  HStack,
  IconButton,
  NativeSelect,
  NumberInput,
  RadioGroup,
  SimpleGrid,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react';
import { getScopeDurationDays } from '../constants.js';
import { editIconButtonStyles, inputStyles } from '../styles.js';

const optionTextColor = '#141413';

const scopeOptions = [
  {
    value: 'LARGE',
    label: 'Large',
    description: 'Longer term or complex initiatives, such as building a full product.',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    description: 'Well-defined projects with clear requirements and milestones.',
  },
  {
    value: 'SMALL',
    label: 'Small',
    description: 'Quick and straightforward tasks with a focused outcome.',
  },
];

const experienceOptions = [
  {
    value: 'ENTRY',
    label: 'Entry',
    description: 'Looking for someone relatively new to this field.',
  },
  {
    value: 'INTERMEDIATE',
    label: 'Intermediate',
    description: 'Looking for substantial experience in this field.',
  },
  {
    value: 'EXPERT',
    label: 'Expert',
    description: 'Looking for comprehensive and deep expertise in this field.',
  },
];

const durationUnitOptions = [
  { value: 'DAY', label: 'day' },
  { value: 'WEEK', label: 'week' },
  { value: 'MONTH', label: 'month' },
  { value: 'YEAR', label: 'year' },
];

const durationUnitLabels = {
  DAY: { singular: 'day', plural: 'days' },
  WEEK: { singular: 'week', plural: 'weeks' },
  MONTH: { singular: 'month', plural: 'months' },
  YEAR: { singular: 'year', plural: 'years' },
};

const optionCardStyles = (isSelected) => ({
  p: 3,
  borderRadius: '12px',
  border: '1px solid',
  borderColor: isSelected ? 'ink.900' : 'border.default',
  bg: 'paper.200',
  cursor: 'pointer',
  transition: 'border-color 0.15s ease, background 0.15s ease',
  _hover: {
    borderColor: 'ink.900',
    bg: 'paper.200',
  },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'ink.900',
    outlineOffset: '2px',
  },
});

const PencilIcon = (props) => (
  <Box
    as="svg"
    viewBox="0 0 24 24"
    boxSize="18px"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </Box>
);

const getOption = (options, value) => options.find((option) => option.value === value);

const getInitialExpandedSection = (draft) => {
  if (!draft.scopeSize) {
    return 'scope';
  }

  if (getScopeDurationDays(draft.scopeDurationAmount, draft.scopeDurationUnit) < 1) {
    return 'duration';
  }

  if (!draft.experienceLevel) {
    return 'experience';
  }

  return null;
};

const formatDurationSummary = (amount, unit) => {
  const numericAmount = Number.parseInt(String(amount ?? ''), 10);
  const unitLabel = durationUnitLabels[unit] ?? durationUnitLabels.DAY;

  if (!Number.isInteger(numericAmount) || numericAmount < 1) {
    return 'Choose duration';
  }

  return `${numericAmount} ${numericAmount === 1 ? unitLabel.singular : unitLabel.plural}`;
};

const SectionShell = ({ id, title, summary, description, open, onToggle, children }) => (
  <Box
    borderBottom="1px solid"
    borderColor="border.default"
    py={{ base: 4, md: 5 }}
  >
    <HStack align="start" justify="space-between" gap={4}>
      <Box minW="0" flex="1">
        <Text color="fg.default" fontWeight="semibold" fontSize={{ base: 'lg', md: 'xl' }}>
          {summary}
        </Text>
        {description ? (
          <Text color="fg.muted" fontSize={{ base: 'sm', md: 'md' }} mt={1}>
            {description}
          </Text>
        ) : null}
      </Box>
      <IconButton
        aria-label={`${open ? 'Collapse' : 'Edit'} ${title}`}
        aria-controls={`${id}-panel`}
        aria-expanded={open}
        type="button"
        onClick={() => onToggle(id)}
        {...editIconButtonStyles}
      >
        <PencilIcon />
      </IconButton>
    </HStack>

    {open ? (
      <Box id={`${id}-panel`} pt={4}>
        {children}
      </Box>
    ) : null}
  </Box>
);

const RadioOption = ({ option, selectedValue }) => {
  const isSelected = selectedValue === option.value;

  return (
    <RadioGroup.Item value={option.value} {...optionCardStyles(isSelected)}>
      <RadioGroup.ItemHiddenInput />
      <HStack align="start" gap={3}>
        <RadioGroup.ItemControl
          mt={1}
          borderColor="ink.600"
          bg="paper.50"
          transition="all 0.2s"
          _checked={{
            bg: 'ink.900',
            borderColor: 'ink.900',
            color: 'paper.50',
          }}
        />
        <VStack align="start" gap={1}>
          <RadioGroup.ItemText color="fg.default" fontWeight="semibold">
            {option.label}
          </RadioGroup.ItemText>
          <Text color="fg.muted" fontSize="sm" lineHeight="1.6">
            {option.description}
          </Text>
        </VStack>
      </HStack>
    </RadioGroup.Item>
  );
};

const StepThree = ({
  draft,
  error,
  onScopeSizeChange,
  onDurationAmountChange,
  onDurationUnitChange,
  onExperienceLevelChange,
  onContractToHireChange,
}) => {
  const [expandedSection, setExpandedSection] = useState(() => getInitialExpandedSection(draft));
  const durationDays = getScopeDurationDays(draft.scopeDurationAmount, draft.scopeDurationUnit);
  const scopeOption = getOption(scopeOptions, draft.scopeSize);
  const experienceOption = getOption(experienceOptions, draft.experienceLevel);
  const contractSummary = draft.contractToHire
    ? 'Planning to hire full time'
    : 'Not planning to hire full time';

  const handleSectionToggle = (sectionId) => {
    setExpandedSection((currentSection) => (currentSection === sectionId ? null : sectionId));
  };

  return (
    <VStack align="stretch" gap={0}>
      <SectionShell
        id="scope"
        title="scope of work"
        summary={scopeOption?.label ?? 'Choose project size'}
        description={scopeOption?.description}
        open={expandedSection === 'scope'}
        onToggle={handleSectionToggle}
      >
        <Field.Root required invalid={!!error && error.toLowerCase().includes('scope')}>
          <RadioGroup.Root
            name="scopeSize"
            value={draft.scopeSize || null}
            onValueChange={({ value }) => onScopeSizeChange(value)}
          >
            <VStack align="stretch" gap={3}>
              {scopeOptions.map((option) => (
                <RadioOption key={option.value} option={option} selectedValue={draft.scopeSize} />
              ))}
            </VStack>
          </RadioGroup.Root>
        </Field.Root>
      </SectionShell>

      <SectionShell
        id="duration"
        title="duration"
        summary={formatDurationSummary(draft.scopeDurationAmount, draft.scopeDurationUnit)}
        open={expandedSection === 'duration'}
        onToggle={handleSectionToggle}
      >
        <Field.Root required invalid={!!error && error.toLowerCase().includes('duration')}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <NumberInput.Root
              name="scopeDurationAmount"
              value={draft.scopeDurationAmount}
              min={1}
              step={1}
              size="lg"
              clampValueOnBlur
              inputMode="numeric"
              pattern="[0-9]*"
              onValueChange={({ value }) => onDurationAmountChange(value)}
            >
              <NumberInput.Input placeholder="Time" h="58px" {...inputStyles} />
              <NumberInput.Control color="fg.muted">
                <NumberInput.IncrementTrigger borderColor="rgba(148, 163, 184, 0.18)" />
                <NumberInput.DecrementTrigger borderColor="rgba(148, 163, 184, 0.18)" />
              </NumberInput.Control>
            </NumberInput.Root>

            <NativeSelect.Root size="lg">
              <NativeSelect.Field
                name="scopeDurationUnit"
                value={draft.scopeDurationUnit || ''}
                onChange={(event) => onDurationUnitChange(event.currentTarget.value)}
                h="58px"
                {...inputStyles}
              >
                <option value="" disabled style={{ color: optionTextColor }}>
                  Select unit
                </option>
                {durationUnitOptions.map((option) => (
                  <option key={option.value} value={option.value} style={{ color: optionTextColor }}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator color="fg.muted" />
            </NativeSelect.Root>
          </SimpleGrid>
        </Field.Root>
      </SectionShell>

      <SectionShell
        id="experience"
        title="experience level"
        summary={
          experienceOption
            ? (experienceOption.label === 'Entry' ? 'Entry level' : experienceOption.label)
            : 'Choose experience level'
        }
        description={experienceOption?.description}
        open={expandedSection === 'experience'}
        onToggle={handleSectionToggle}
      >
        <Field.Root required invalid={!!error && error.toLowerCase().includes('experience')}>
          <RadioGroup.Root
            name="experienceLevel"
            value={draft.experienceLevel || null}
            onValueChange={({ value }) => onExperienceLevelChange(value)}
          >
            <VStack align="stretch" gap={3}>
              {experienceOptions.map((option) => (
                <RadioOption
                  key={option.value}
                  option={option}
                  selectedValue={draft.experienceLevel}
                />
              ))}
            </VStack>
          </RadioGroup.Root>
        </Field.Root>
      </SectionShell>

      <SectionShell
        id="contract"
        title="contract-to-hire opportunity"
        summary={contractSummary}
        description={draft.contractToHire ? 'This job could become a longer term role.' : ''}
        open={expandedSection === 'contract'}
        onToggle={handleSectionToggle}
      >
        <HStack
          justify="space-between"
          align={{ base: 'start', md: 'center' }}
          gap={4}
          flexWrap="wrap"
        >
          <Box>
            <Text color="fg.default" fontWeight="semibold" mb={1}>
              Contract-to-hire opportunity
            </Text>
            <Text color="fg.muted" fontSize="sm">
              Mark this when the job could become a longer term role.
            </Text>
          </Box>
          <Switch.Root
            checked={draft.contractToHire}
            onCheckedChange={({ checked }) => onContractToHireChange(checked)}
            
            size="lg"
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label color="fg.muted" fontWeight="semibold">
              {draft.contractToHire ? 'Yes' : 'No'}
            </Switch.Label>
          </Switch.Root>
        </HStack>
      </SectionShell>

      {error ? (
        <Text color="red.700" fontSize="sm">
          {error}
        </Text>
      ) : null}
    </VStack>
  );
};

export default StepThree;
