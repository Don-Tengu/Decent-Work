import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Field,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AlertCircle, Clock3, Tag, X } from 'lucide-react';
import { inputStyles } from '../styles.js';

const budgetOptions = [
  {
    value: 'HOURLY',
    label: 'Hourly rate',
    icon: 'clock',
  },
  {
    value: 'FIXED',
    label: 'Fixed price',
    icon: 'tag',
  },
];

const popoverWidth = 320;
const popoverViewportMargin = 16;

const getPromptCopy = (budgetType) => {
  const isHourly = budgetType === 'HOURLY';

  return {
    addLabel: isHourly ? 'Add an Hourly Rate' : 'Add a Fixed Budget',
    continueLabel: isHourly
      ? 'Continue without an hourly rate'
      : 'Continue without a budget',
  };
};

const BudgetTypeCard = ({ option, selected, onSelect }) => {
  const Icon = option.icon === 'clock' ? Clock3 : Tag;

  return (
    <Box
      as="button"
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(option.value)}
      minH="112px"
      textAlign="left"
      border="1px solid"
      borderColor={selected ? 'rgba(134, 239, 172, 0.72)' : 'rgba(148, 163, 184, 0.22)'}
      bg={selected ? 'rgba(20, 83, 45, 0.28)' : 'rgba(15, 23, 42, 0.42)'}
      borderRadius="18px"
      px={5}
      py={4}
      cursor="pointer"
      transition="all 0.2s ease"
      _hover={{
        borderColor: selected ? 'rgba(134, 239, 172, 0.86)' : 'rgba(226, 232, 240, 0.36)',
        bg: selected ? 'rgba(20, 83, 45, 0.38)' : 'rgba(15, 23, 42, 0.58)',
        transform: 'translateY(-1px)',
      }}
      _focusVisible={{
        outline: '2px solid rgba(255, 255, 255, 0.68)',
        outlineOffset: '3px',
      }}
    >
      <HStack justify="space-between" align="start" gap={4}>
        <Box color={selected ? 'green.200' : 'rgba(226, 232, 240, 0.82)'}>
          <Icon size={24} />
        </Box>
        <Box
          aria-hidden="true"
          boxSize="24px"
          border="2px solid"
          borderColor={selected ? 'green.200' : 'rgba(226, 232, 240, 0.3)'}
          borderRadius="full"
          display="grid"
          placeItems="center"
          flex="0 0 auto"
        >
          {selected ? <Box boxSize="10px" borderRadius="full" bg="green.200" /> : null}
        </Box>
      </HStack>
      <Text color="white" fontWeight="semibold" mt={5}>
        {option.label}
      </Text>
    </Box>
  );
};

const MoneyInput = ({ label, name, value, suffix, invalid, placeholder, onChange, onBlur }) => (
  <Field.Root invalid={invalid} w="full">
    <Field.Label color="white" fontWeight="semibold">
      {label}
    </Field.Label>
    <HStack gap={3} align="center" w="full">
      <Box position="relative" w="full" maxW="180px">
        <Text
          position="absolute"
          left="16px"
          top="50%"
          transform="translateY(-50%)"
          color="rgba(226, 232, 240, 0.72)"
          fontWeight="semibold"
          pointerEvents="none"
        >
          $
        </Text>
        <Input
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={() => onBlur(name)}
          h="52px"
          pl="34px"
          pr={4}
          textAlign="right"
          inputMode="decimal"
          autoComplete="off"
          {...inputStyles}
          borderColor={invalid ? 'red.400' : inputStyles.borderColor}
          _hover={{
            borderColor: invalid ? 'red.400' : inputStyles._hover.borderColor,
          }}
          _focus={{
            borderColor: invalid ? 'red.400' : inputStyles._focus.borderColor,
            boxShadow: invalid
              ? '0 0 0 1px rgba(248, 113, 113, 0.5)'
              : inputStyles._focus.boxShadow,
          }}
        />
      </Box>
      {suffix ? (
        <Text color="rgba(226, 232, 240, 0.74)" fontWeight="semibold" whiteSpace="nowrap">
          {suffix}
        </Text>
      ) : null}
    </HStack>
  </Field.Root>
);

const BudgetErrorMessage = ({ message }) => (
  <HStack align="start" gap={2} color="red.300" maxW="680px">
    <Box flex="0 0 auto" mt="2px">
      <AlertCircle size={16} />
    </Box>
    <Text fontSize="sm" fontWeight="medium" lineHeight="1.5">
      {message}
    </Text>
  </HStack>
);

const NotReadyPrompt = ({
  budgetType,
  position,
  onClose,
  onAddBudget,
  onContinueWithoutBudget,
}) => {
  const promptCopy = getPromptCopy(budgetType);

  return (
    <Box
      role="dialog"
      aria-label="Continue without a budget"
      position="fixed"
      left={`${position.left}px`}
      top={`${position.top}px`}
      zIndex={40}
      w={`${popoverWidth}px`}
      maxW={`calc(100vw - ${popoverViewportMargin * 2}px)`}
      border="1px solid"
      borderColor="rgba(134, 239, 172, 0.26)"
      bg="linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(6, 78, 59, 0.56))"
      borderRadius="16px"
      boxShadow="0 16px 34px rgba(0, 0, 0, 0.32)"
      p={4}
      _after={{
        content: '""',
        position: 'absolute',
        left: `${position.arrowLeft}px`,
        top: '-7px',
        transform: 'translateX(-50%) rotate(45deg)',
        w: '14px',
        h: '14px',
        bg: 'rgba(6, 78, 59, 0.92)',
        borderLeft: '1px solid rgba(134, 239, 172, 0.26)',
        borderTop: '1px solid rgba(134, 239, 172, 0.26)',
      }}
    >
      <VStack align="stretch" gap={3}>
        <HStack align="start" justify="space-between" gap={4}>
          <Text color="white" fontSize="sm" lineHeight="1.55" fontWeight="medium">
            Don't worry. You're not committing to anything final. This helps us find you more
            relevant candidates.
          </Text>
          <IconButton
            aria-label="Close"
            type="button"
            variant="ghost"
            color="rgba(226, 232, 240, 0.76)"
            borderRadius="full"
            minW="30px"
            w="30px"
            h="30px"
            mt="-4px"
            mr="-4px"
            onClick={onClose}
            _hover={{ bg: 'rgba(255, 255, 255, 0.08)', color: 'white' }}
          >
            <X size={18} />
          </IconButton>
        </HStack>

        <Button
          type="button"
          h="38px"
          bg="green.700"
          color="white"
          borderRadius="full"
          fontWeight="bold"
          fontSize="sm"
          onClick={onAddBudget}
          _hover={{ bg: 'green.600', transform: 'translateY(-1px)' }}
          _active={{ transform: 'translateY(0)' }}
        >
          {promptCopy.addLabel}
        </Button>

        <Button
          type="button"
          variant="ghost"
          h="34px"
          color="green.200"
          fontWeight="bold"
          fontSize="sm"
          onClick={() => onContinueWithoutBudget(budgetType)}
          _hover={{
            bg: 'transparent',
            color: 'green.100',
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
          }}
        >
          {promptCopy.continueLabel}
        </Button>
      </VStack>
    </Box>
  );
};

const StepFour = ({
  draft,
  error,
  onBudgetTypeChange,
  onBudgetAmountChange,
  onBudgetAmountBlur,
  onContinueWithoutBudget,
}) => {
  const [pendingNotReadyType, setPendingNotReadyType] = useState('');
  const [popoverPosition, setPopoverPosition] = useState(null);
  const notReadyButtonRef = useRef(null);
  const displayedBudgetType =
    draft.budgetType === 'NOT_READY' ? draft.budgetNotReadyType || 'HOURLY' : draft.budgetType;
  const isHourly = displayedBudgetType === 'HOURLY';
  const isFixed = displayedBudgetType === 'FIXED';
  const notReadyLabel = isHourly
    ? 'Not ready to set an hourly rate?'
    : 'Not ready to set a budget?';
  const hasAmountError = !!error;

  const handlePromptAddBudget = () => {
    onBudgetTypeChange(pendingNotReadyType);
    setPendingNotReadyType('');
    setPopoverPosition(null);
  };

  const handleNotReadyClick = () => {
    const triggerRect = notReadyButtonRef.current?.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const triggerCenter = triggerRect
      ? triggerRect.left + triggerRect.width / 2
      : popoverViewportMargin + popoverWidth / 2;
    const popoverLeft = Math.min(
      Math.max(triggerCenter - popoverWidth / 2, popoverViewportMargin),
      viewportWidth - popoverWidth - popoverViewportMargin
    );

    setPopoverPosition({
      left: popoverLeft,
      top: (triggerRect?.bottom ?? 0) + 12,
      arrowLeft: Math.min(Math.max(triggerCenter - popoverLeft, 18), popoverWidth - 18),
    });
    setPendingNotReadyType(isFixed ? 'FIXED' : 'HOURLY');
  };

  const handlePromptClose = () => {
    setPendingNotReadyType('');
    setPopoverPosition(null);
  };

  const handleBudgetTypeSelect = (value) => {
    handlePromptClose();
    onBudgetTypeChange(value);
  };

  return (
    <VStack align="stretch" gap={7}>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} role="radiogroup" aria-label="Budget type">
        {budgetOptions.map((option) => (
          <BudgetTypeCard
            key={option.value}
            option={option}
            selected={draft.budgetType !== 'NOT_READY' && draft.budgetType === option.value}
            onSelect={handleBudgetTypeSelect}
          />
        ))}
      </SimpleGrid>

      {isFixed ? (
        <VStack align="stretch" gap={6}>
          <Box>
            <Text color="rgba(226, 232, 240, 0.78)" lineHeight="1.7">
              Set a price for the project and pay at the end, or you can divide the project into
              milestones and pay as each milestone is completed.
            </Text>
          </Box>

          <Box>
            <Text color="white" fontWeight="semibold" mb={1}>
              What is the best cost estimate for your project?
            </Text>
            <Text color="rgba(226, 232, 240, 0.66)" mb={4}>
              You can negotiate this cost and create milestones when you chat with your freelancer.
            </Text>
            <MoneyInput
              label="Project budget"
              name="fixedBudget"
              value={draft.fixedBudget}
              invalid={hasAmountError}
              onChange={onBudgetAmountChange}
              onBlur={onBudgetAmountBlur}
              placeholder="0"
            />
          </Box>
        </VStack>
      ) : (
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <MoneyInput
              label="From"
              name="hourlyRateMin"
              value={draft.hourlyRateMin}
              suffix="/hr"
              invalid={hasAmountError}
              onChange={onBudgetAmountChange}
              onBlur={onBudgetAmountBlur}
            />
            <MoneyInput
              label="To"
              name="hourlyRateMax"
              value={draft.hourlyRateMax}
              suffix="/hr"
              invalid={hasAmountError}
              onChange={onBudgetAmountChange}
              onBlur={onBudgetAmountBlur}
            />
          </SimpleGrid>
        </VStack>
      )}

      {error ? <BudgetErrorMessage message={error} /> : null}

      <Box alignSelf="start" position="relative" display="inline-flex" pt={2}>
        {pendingNotReadyType && popoverPosition ? (
          <NotReadyPrompt
            budgetType={pendingNotReadyType}
            position={popoverPosition}
            onClose={handlePromptClose}
            onAddBudget={handlePromptAddBudget}
            onContinueWithoutBudget={onContinueWithoutBudget}
          />
        ) : null}

        <Button
          type="button"
          variant="ghost"
          ref={notReadyButtonRef}
          px={0}
          color="green.300"
          fontWeight="bold"
          onClick={handleNotReadyClick}
          _hover={{ bg: 'transparent', color: 'green.200' }}
        >
          {notReadyLabel}
        </Button>
      </Box>
    </VStack>
  );
};

export default StepFour;
