import React from 'react';
import { Text } from '@chakra-ui/react';

// The small uppercase "eyebrow" label used above content blocks (Proposal,
// Cover letter, Skills, …). Centralizes the shared label tokens.
const FieldLabel = ({ children, ...props }) => (
  <Text
    color="fg.subtle"
    fontSize="xs"
    fontWeight="bold"
    textTransform="uppercase"
    letterSpacing="0.04em"
    {...props}
  >
    {children}
  </Text>
);

export default FieldLabel;
