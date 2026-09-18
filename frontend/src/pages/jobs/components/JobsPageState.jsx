import React from 'react';
import { Heading, Text, VStack } from '@chakra-ui/react';
import GlassPanel from '../../../components/ui/GlassPanel.jsx';

const JobsPageState = ({ title, description, tone = 'default' }) => (
  <GlassPanel
    variant="soft"
    borderRadius="20px"
    p={{ base: 6, md: 8 }}
    textAlign="center"
    borderColor={tone === 'error' ? 'rgba(248, 113, 113, 0.3)' : undefined}
  >
    <VStack gap={3}>
      <Heading size="md" color="fg.default">
        {title}
      </Heading>
      <Text color={tone === 'error' ? 'red.700' : 'fg.muted'} maxW="560px">
        {description}
      </Text>
    </VStack>
  </GlassPanel>
);

export default JobsPageState;
