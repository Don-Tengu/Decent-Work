import React from 'react';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { JOB_POST_STEPS } from '../constants.js';
import JobPostProgress from './JobPostProgress.jsx';
import { greenSolidButtonStyles, textUnderlineButtonStyles } from '../../../components/ui/buttonStyles.js';

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
      bg="bg.canvas"
      borderTop="1px solid"
      borderColor="border.default"
      px={{ base: 4, md: 8 }}
      py={{ base: 4, md: 5 }}
    >
      <Box maxW="1380px" mx="auto">
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
            <HStack align="center" gap={3} flexWrap="wrap">
              <Button type="button" onClick={onExit} {...textUnderlineButtonStyles}>
                Exit
              </Button>
              {draftSaveError ? (
                <Text color="red.700" fontSize="sm" fontWeight="semibold" role="alert">
                  {draftSaveError}
                </Text>
              ) : null}
              {draftSaveSuccess ? (
                <Text color="fg.muted" fontSize="sm" fontWeight="semibold">
                  {draftSaveSuccess}
                </Text>
              ) : null}
            </HStack>
            <HStack gap={3} flexWrap="wrap" justify="flex-end">
              <Button
                type="button"
                onClick={onSaveDraft}
                disabled={saveDraftDisabled || isSavingDraft || isSubmitting}
                {...textUnderlineButtonStyles}
              >
                {isSavingDraft ? 'Saving...' : 'Save'}
              </Button>
              <Button
                type="button"
                onClick={onBack}
                disabled={activeStepIndex === 0}
                {...textUnderlineButtonStyles}
              >
                Back
              </Button>
              <Button
                px={6}
                onClick={onContinue}
                disabled={(activeStep.id === 'skills' && taxonomyLoading) || isSubmitting || isSavingDraft}
                {...greenSolidButtonStyles}
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
