import React from 'react';
import { Box, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { JOB_POST_STEPS } from '../constants.js';

const StepInfoColumn = ({ activeStep, stepIndex }) => (
  <VStack align="start" gap={4}>
    <HStack gap={3} flexWrap="wrap">
      <span>
        Step {stepIndex + 1} of {JOB_POST_STEPS.length} &nbsp;&nbsp; Job Post
      </span>
    </HStack>
    <VStack align="start" gap={2}>
      <Heading as="h1" size="4xl" color="white" letterSpacing="-0.03em">
        {activeStep.title}
      </Heading>
      <Text color="rgba(226, 232, 240, 0.74)" fontSize="sm" maxW="48rem">
        {activeStep.description}
      </Text>
      {activeStep.guidanceItems?.length ? (
        <Box
          as="ul"
          pl={5}
          pt={2}
          color="rgba(226, 232, 240, 0.82)"
          listStyleType="disc"
          listStylePosition="outside"
          css={{
            '& li::marker': {
              color: 'rgba(226, 232, 240, 0.82)',
            },
          }}
        >
          {activeStep.guidanceItems.map((item) => (
            <Text as="li" key={item} fontSize="sm" lineHeight="1.6" mb={2} _last={{ mb: 0 }}>
              {item}
            </Text>
          ))}
        </Box>
      ) : null}
    </VStack>
  </VStack>
);

export default StepInfoColumn;
