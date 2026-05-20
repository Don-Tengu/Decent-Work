import React from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';

const SectionEyebrow = ({ label, dotColor = 'cyan.300' }) => (
  <HStack
    px={4}
    py={2}
    borderRadius="full"
    bg="rgba(148, 163, 184, 0.1)"
    border="1px solid"
    borderColor="rgba(148, 163, 184, 0.16)"
    width="fit-content"
  >
    <Box w="10px" h="10px" borderRadius="full" bg={dotColor} />
    <Text color="whiteAlpha.800" fontSize="sm" fontWeight="semibold">
      {label}
    </Text>
  </HStack>
);

export default SectionEyebrow;
