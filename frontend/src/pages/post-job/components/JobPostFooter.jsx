import React from 'react';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { JOB_POST_STEPS } from '../constants.js';
import JobPostProgress from './JobPostProgress.jsx';

const JobPostFooter = ({
  activeStep,
  activeStepIndex,
  completedStepCount,
  progressValue,
  onBack,
  onContinue,
  onExit,
  onSaveDraft,
  taxonomyLoading,
  isSubmitting,
  isSavingDraft,
  saveDraftDisabled = false,
  draftSaveError,
  draftSaveSuccess,
}) => {
  const isLastStep = activeStepIndex === JOB_POST_STEPS.length - 1;
  const continueLabel = isLastStep
    ? 'Review job post'
    : `Next step: ${JOB_POST_STEPS[activeStepIndex + 1].shortLabel}`;

  return (
    <Box
      position="fixed"
      left="0"
      right="0"
      bottom="0"
      zIndex="10"
      bg="rgba(2, 6, 23, 0.94)"
      backdropFilter="blur(18px)"
      borderTop="1px solid rgba(148, 163, 184, 0.14)"
      px={{ base: 4, md: 8 }}
      py={{ base: 4, md: 5 }}
    >
      <Box maxW="1380px" mx="auto">
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
            <HStack align="center" gap={3} flexWrap="wrap">
              <Button
                variant="ghost"
                color="rgba(226, 232, 240, 0.78)"
                _hover={{ bg: 'rgba(148, 163, 184, 0.1)', color: 'white' }}
                onClick={onExit}
              >
                Exit
              </Button>
              {draftSaveError ? (
                <Text color="red.300" fontSize="sm" fontWeight="semibold" role="alert">
                  {draftSaveError}
                </Text>
              ) : null}
              {draftSaveSuccess ? (
                <Text color="green.300" fontSize="sm" fontWeight="semibold">
                  {draftSaveSuccess}
                </Text>
              ) : null}
            </HStack>
            <HStack gap={3} flexWrap="wrap" justify="flex-end">
              <Button
                variant="outline"
                borderColor="rgba(74, 222, 128, 0.34)"
                color="green.100"
                onClick={onSaveDraft}
                disabled={saveDraftDisabled || isSavingDraft || isSubmitting}
                _hover={{ bg: 'rgba(34, 197, 94, 0.1)', borderColor: 'green.300' }}
              >
                {isSavingDraft ? 'Saving...' : 'Save draft'}
              </Button>
              <Button
                variant="outline"
                borderColor="rgba(148, 163, 184, 0.24)"
                color="white"
                onClick={onBack}
                disabled={activeStepIndex === 0}
              >
                Back
              </Button>
              <Button
                bgGradient="to-r"
                gradientFrom="green.300"
                gradientTo="cyan.400"
                color="gray.950"
                fontWeight="bold"
                borderRadius="full"
                px={6}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 18px 34px rgba(74, 222, 128, 0.24)',
                }}
                _active={{ transform: 'translateY(0)' }}
                onClick={onContinue}
                disabled={(activeStep.id === 'skills' && taxonomyLoading) || isSubmitting}
              >
                {continueLabel}
              </Button>
            </HStack>
          </HStack>

          <JobPostProgress
            steps={JOB_POST_STEPS}
            activeStepIndex={activeStepIndex}
            completedStepCount={completedStepCount}
            progressValue={progressValue}
          />
        </VStack>
      </Box>
    </Box>
  );
};

export default JobPostFooter;
