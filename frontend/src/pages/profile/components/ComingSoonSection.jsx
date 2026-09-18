import React from 'react';
import { Badge, Box, HStack, Text, VStack } from '@chakra-ui/react';
import GlassPanel from '../../../components/ui/GlassPanel.jsx';
import SectionEyebrow from '../../../components/ui/SectionEyebrow.jsx';

// Placeholder for profile sections that have no backing data yet (portfolio,
// work/employment history, education, reviews). Kept as a styled scaffold so
// the layout is final and each section only needs its data source wired later.
const ComingSoonSection = ({ label, icon: Icon, description }) => (
  <GlassPanel variant="subtle" borderRadius="24px" p={{ base: 6, md: 8 }}>
    <VStack align="stretch" gap={4}>
      <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
        <SectionEyebrow label={label} dotColor="rgba(148, 163, 184, 0.6)" />
        <Badge
          borderRadius="full"
          px={3}
          py={1}
          bg="rgba(148, 163, 184, 0.12)"
          color="fg.muted"
          border="1px solid"
          borderColor="rgba(148, 163, 184, 0.2)"
          fontWeight="medium"
          textTransform="none"
        >
          Coming soon
        </Badge>
      </HStack>

      <HStack
        gap={4}
        align="center"
        border="1px dashed"
        borderColor="rgba(148, 163, 184, 0.22)"
        borderRadius="18px"
        p={{ base: 4, md: 5 }}
        bg="bg.muted"
      >
        {Icon ? (
          <Box
            boxSize="44px"
            borderRadius="14px"
            display="grid"
            placeItems="center"
            bg="rgba(148, 163, 184, 0.12)"
            color="fg.subtle"
            flex="0 0 auto"
          >
            <Icon size={22} />
          </Box>
        ) : null}
        <Text color="fg.muted" fontSize="sm" lineHeight="1.6">
          {description}
        </Text>
      </HStack>
    </VStack>
  </GlassPanel>
);

export default ComingSoonSection;
