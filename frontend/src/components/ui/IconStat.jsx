import React from 'react';
import { HStack, Text } from '@chakra-ui/react';

// A small "icon + value" identity stat row (member since, hourly rate, wallet)
// shared by the freelancer drawer and the full profile page.
const IconStat = ({ icon: Icon, size = 16, children, ...props }) => (
  <HStack gap={2.5} color="fg.muted" fontSize="sm" {...props}>
    <Icon size={size} color="#5C5852" />
    <Text>{children}</Text>
  </HStack>
);

export default IconStat;
