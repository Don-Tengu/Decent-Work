import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Field,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AlertCircle, X } from 'lucide-react';
import { greenSolidButtonStyles } from '../../../components/ui/buttonStyles.js';
import { inputStyles } from '../styles.js';

const popoverWidth = 320;
const popoverViewportMargin = 16;

const getPromptCopy = () => ({
  addLabel: 'Add a Fixed Budget',
  continueLabel: 'Continue without a budget',
});

const MoneyInput = ({
  label,
  name,
  value,
  suffix,
  currencyPrefix = '$',
  invalid,
  placeholder,
  onChange,
  onBlur,
}) => (
  <Field.Root invalid={invalid} w="full">
    <Field.Label color="fg.default" fontWeight="semibold">
      {label}
    </Field.Label>
    <HStack gap={3} align="center" w="full">
      <Box position="relative" w="full" maxW="180px">
        <Input
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={() => onBlur(name)}
          h="52px"
          pl="36px"
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
        <Text
          position="absolute"
          left="14px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
          color="ink.900"
          fontWeight="semibold"
          pointerEvents="none"
        >
          {currencyPrefix}
        </Text>
      </Box>
      {suffix ? (
        <Text color="fg.muted" fontWeight="semibold" whiteSpace="nowrap">
          {suffix}
        </Text>
      ) : null}
    </HStack>
  </Field.Root>
);

const BudgetErrorMessage = ({ message }) => (
  <HStack align="start" gap={2} color="red.700" maxW="680px">
    <Box flex="0 0 auto" mt="2px">
      <AlertCircle size={16} />
    </Box>
    <Text fontSize="sm" fontWeight="medium" lineHeight="1.5">
      {message}
    </Text>
  </HStack>
);

const NotReadyPrompt = ({
  position,
  onClose,
  onAddBudget,
  onContinueWithoutBudget,
}) => {
  const promptCopy = getPromptCopy();

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
      borderColor="border.default"
      bg="bg.canvas"
      borderRadius="12px"
      boxShadow="0 12px 32px rgba(20, 20, 19, 0.1)"
      p={4}
      _after={{
        content: '""',
        position: 'absolute',
        left: `${position.arrowLeft}px`,
        top: '-7px',
        transform: 'translateX(-50%) rotate(45deg)',
        w: '14px',
        h: '14px',
        bg: 'bg.canvas',
        borderLeft: '1px solid',
        borderTop: '1px solid',
        borderColor: 'border.default',
      }}
    >
      <VStack align="stretch" gap={3}>
        <HStack align="start" justify="space-between" gap={4}>
          <Text color="fg.default" fontSize="sm" lineHeight="1.55" fontWeight="medium">
            Don't worry. You're not committing to anything final. This helps us find you more
            relevant candidates.
          </Text>
          <IconButton
            aria-label="Close"
            type="button"
            variant="ghost"
            color="fg.muted"
            borderRadius="full"
            minW="30px"
            w="30px"
            h="30px"
            mt="-4px"
            mr="-4px"
            onClick={onClose}
            _hover={{ bg: 'paper.200', color: 'ink.900' }}
          >
            <X size={18} />
          </IconButton>
        </HStack>

        <Button
          type="button"
          h="38px"
          fontSize="sm"
          onClick={onAddBudget}
          {...greenSolidButtonStyles}
        >
          {promptCopy.addLabel}
        </Button>

        <Button
          type="button"
          variant="ghost"
          h="34px"
          color="fg.muted"
          fontWeight="bold"
          fontSize="sm"
          onClick={() => onContinueWithoutBudget('FIXED')}
          _hover={{
            bg: 'transparent',
            color: 'fg.default',
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
  const [showNotReadyPrompt, setShowNotReadyPrompt] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const notReadyButtonRef = useRef(null);
  const hasAmountError = !!error;

  // MVP: coerce legacy hourly drafts to fixed price so the form stays consistent.
  useEffect(() => {
    if (draft.budgetType === 'HOURLY') {
      onBudgetTypeChange('FIXED');
    }
    // Intentionally only when budgetType changes — avoid re-firing on parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onBudgetTypeChange is not memoized
  }, [draft.budgetType]);

  const handlePromptAddBudget = () => {
    onBudgetTypeChange('FIXED');
    setShowNotReadyPrompt(false);
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
    setShowNotReadyPrompt(true);
  };

  const handlePromptClose = () => {
    setShowNotReadyPrompt(false);
    setPopoverPosition(null);
  };

  return (
    <VStack align="stretch" gap={6} pb={4}>
      <VStack align="stretch" gap={5}>
        <Box>
          <Text color="fg.muted" lineHeight="1.7">
            Set a price for the project in USDC. After you hire, you fund on-chain escrow from MetaMask
            and release when the work is approved.
          </Text>
        </Box>

        <Box>
          <Text color="fg.default" fontWeight="semibold" mb={1}>
            What is the best cost estimate for your project?
          </Text>
          <Text color="fg.muted" mb={4}>
            You can negotiate this cost with your freelancer before hiring.
          </Text>
          <MoneyInput
            label="Project budget"
            name="fixedBudget"
            value={draft.fixedBudget}
            currencyPrefix="$"
            invalid={hasAmountError}
            onChange={onBudgetAmountChange}
            onBlur={onBudgetAmountBlur}
            placeholder="0"
          />
        </Box>
      </VStack>

      {error ? <BudgetErrorMessage message={error} /> : null}

      <Box
        border="1px solid"
        borderColor="border.default"
        bg="paper.200"
        borderRadius="12px"
        px={5}
        py={4}
      >
        <Text color="fg.default" fontWeight="semibold" mb={1}>
          On-chain USDC escrow
        </Text>
        <Text color="fg.muted" fontSize="sm" lineHeight="1.55">
          After you hire, approve and deposit USDC into FreelanceEscrow (Anvil, Base Sepolia, or
          Base). The freelancer can submit work, then you approve &amp; release (5% platform fee)
          or request changes. You still need a little ETH in the wallet for gas.
        </Text>
      </Box>

      <Box alignSelf="start" position="relative" display="inline-flex" pt={1} flexShrink={0}>
        {showNotReadyPrompt && popoverPosition ? (
          <NotReadyPrompt
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
          color="fg.muted"
          fontWeight="bold"
          onClick={handleNotReadyClick}
          _hover={{ bg: 'transparent', color: 'fg.default' }}
        >
          Not ready to set a budget?
        </Button>
      </Box>
    </VStack>
  );
};

export default StepFour;
