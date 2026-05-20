import React from 'react';
import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { STEP_PLACEHOLDER_FIELDS } from '../constants.js';

const PlaceholderField = ({ label }) => (
  <Box
    borderRadius="18px"
    border="1px dashed"
    borderColor="rgba(148, 163, 184, 0.24)"
    bg="rgba(15, 23, 42, 0.46)"
    px={4}
    py={4}
  >
    <Text color="whiteAlpha.900" fontWeight="medium">
      {label}
    </Text>
    <Text color="rgba(226, 232, 240, 0.48)" fontSize="sm" mt={1}>
      Step shell ready for the next implementation pass.
    </Text>
  </Box>
);

const FutureStepPlaceholder = ({ stepId }) => (
  <VStack align="stretch" gap={6}>
    <Box
      borderRadius="24px"
      border="1px solid"
      borderColor="rgba(148, 163, 184, 0.16)"
      bg="rgba(15, 23, 42, 0.4)"
      p={{ base: 5, md: 6 }}
    >
      <Text color="white" fontWeight="semibold" mb={2}>
        Step infrastructure is in place
      </Text>
      <Text color="rgba(226, 232, 240, 0.68)" lineHeight="1.7">
        This panel is intentionally scaffolded now so the next implementation can plug in the real
        controls without changing the page shell, progress logic, or draft shape.
      </Text>
    </Box>

    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
      {(STEP_PLACEHOLDER_FIELDS[stepId] ?? []).map((label) => (
        <PlaceholderField key={label} label={label} />
      ))}
    </SimpleGrid>
  </VStack>
);

export default FutureStepPlaceholder;
