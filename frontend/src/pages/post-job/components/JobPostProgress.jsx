import React from 'react';
import { Box, HStack, Progress, Text, VStack } from '@chakra-ui/react';

const JobPostProgress = ({ steps, activeStepIndex, completedStepCount, progressValue }) => (
  <VStack align="stretch" gap={3}>
    <HStack justify="space-between" align="center" gap={4} flexWrap="wrap">
      <Text color="fg.default" fontWeight="semibold">
        Step {activeStepIndex + 1} of {steps.length}
      </Text>
      <Text color="fg.muted" fontSize="sm">
        {steps[activeStepIndex].title}
      </Text>
      <Text color="fg.muted" fontSize="sm" fontWeight="medium">
        {completedStepCount}/{steps.length} complete
      </Text>
    </HStack>

    <Progress.Root value={progressValue}  variant="subtle" size="sm">
      <Progress.Track
        borderRadius="full"
        bg="paper.200"
        h="10px"
        overflow="hidden"
      >
        <Progress.Range borderRadius="full" />
      </Progress.Track>
    </Progress.Root>

    <HStack justify="space-between" gap={3} display={{ base: 'none', md: 'flex' }}>
      {steps.map((step, index) => {
        const isActive = index === activeStepIndex;
        const isCompleted = index < completedStepCount;

        return (
          <Box key={step.id} flex="1" minW="0">
            <Text
              color={isActive ? 'fg.default' : isCompleted ? 'fg.muted' : 'fg.subtle'}
              fontSize="xs"
              fontWeight={isActive ? 'semibold' : 'medium'}
              textAlign="center"
              textTransform="uppercase"
              letterSpacing="0.08em"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {step.shortLabel}
            </Text>
          </Box>
        );
      })}
    </HStack>
  </VStack>
);

export default JobPostProgress;
