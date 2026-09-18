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
      <Heading as="h1" size="4xl" color="fg.default" letterSpacing="-0.03em">
        {activeStep.title}
      </Heading>
      <Text color="fg.muted" fontSize="sm" maxW="48rem">
        {activeStep.description}
      </Text>
      {activeStep.guidanceItems?.length ? (
        <Box
          as="ul"
          pl={5}
          pt={2}
          color="fg.muted"
          listStyleType="disc"
          listStylePosition="outside"
          css={{
            '& li::marker': {
              color: 'fg.muted',
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
