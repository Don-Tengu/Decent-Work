import React from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';

const SectionEyebrow = ({ label, dotColor = 'ink.900' }) => (
  <HStack
    px={3}
    py={1.5}
    borderRadius="8px"
    bg="transparent"
    border="1px solid"
    borderColor="border.default"
    width="fit-content"
  >
    <Box w="6px" h="6px" borderRadius="full" bg={dotColor} />
    <Text color="fg.muted" fontSize="sm" fontWeight="medium">
      {label}
    </Text>
  </HStack>
);

export default SectionEyebrow;
