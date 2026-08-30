import React from 'react';
import { Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { Banknote, BriefcaseBusiness, Clock3, Gauge, ShieldCheck } from 'lucide-react';
import { EXPERIENCE_LABELS, SCOPE_SIZE_LABELS } from '../constants.js';
import { formatBudgetLabel, formatDuration } from '../utils.jsx';

const paymentModelLabels = {
  OFF_CHAIN_NEGOTIATED: 'Off-chain negotiated',
  ON_CHAIN_ESCROW: 'On-chain escrow',
  ON_CHAIN_MILESTONE_ESCROW: 'Milestone escrow',
};

const budgetTypeLabels = {
  HOURLY: 'Hourly contract',
  FIXED: 'Fixed price',
  NOT_READY: 'Budget TBD',
};

const FactItem = ({ icon: Icon, label, value, detail }) => (
  <HStack align="start" gap={3}>
    <HStack
      align="center"
      justify="center"
      boxSize="38px"
      flex="0 0 auto"
      borderRadius="12px"
      bg="rgba(34, 211, 238, 0.1)"
      color="cyan.200"
    >
      <Icon size={19} />
    </HStack>
    <VStack align="start" gap={1} minW="0">
      <Text color="rgba(226, 232, 240, 0.52)" fontSize="xs" fontWeight="bold" textTransform="uppercase">
        {label}
      </Text>
      <Text color="white" fontWeight="bold" lineHeight="1.3">
        {value}
      </Text>
      {detail ? (
        <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm" lineHeight="1.45">
          {detail}
        </Text>
      ) : null}
    </VStack>
  </HStack>
);

const JobDetailFacts = ({ job }) => {
  const facts = [
    {
      icon: Banknote,
      label: 'Budget',
      value: formatBudgetLabel(job),
      detail: budgetTypeLabels[job.budgetType] || 'Budget preference',
    },
    {
      icon: Gauge,
      label: 'Experience',
      value: EXPERIENCE_LABELS[job.experienceLevel] || 'Flexible',
      detail: 'Client preference',
    },
    {
      icon: Clock3,
      label: 'Timeline',
      value: formatDuration(job.scopeDurationAmount, job.scopeDurationUnit),
      detail: 'Estimated duration',
    },
    {
      icon: BriefcaseBusiness,
      label: 'Scope',
      value: SCOPE_SIZE_LABELS[job.scopeSize] || 'Flexible',
      detail: job.contractToHire ? 'Contract-to-hire option' : 'Freelance project',
    },
    {
      icon: ShieldCheck,
      label: 'Payment',
      value: paymentModelLabels[job.paymentModel] || 'On-chain escrow',
      detail:
        job.paymentModel === 'OFF_CHAIN_NEGOTIATED'
          ? 'Legacy simulated escrow — funds are not locked on-chain'
          : 'Client funds USDC escrow after hire, then releases when work is approved',
    },
  ];

  return (
    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }} gap={{ base: 5, md: 7 }}>
      {facts.map((fact) => (
        <FactItem key={fact.label} {...fact} />
      ))}
    </Grid>
  );
};

export default JobDetailFacts;
