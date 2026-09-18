import React from 'react';
import { Badge, Box, HStack, Heading, Text, VStack } from '@chakra-ui/react';
import { BadgeCheck, Clock3, MapPin } from 'lucide-react';
import { formatPostedTime } from '../utils.jsx';

const MetaItem = ({ icon: Icon, children }) => (
  <HStack gap={2} color="fg.muted" fontSize="sm">
    <Icon size={17} />
    <Text>{children}</Text>
  </HStack>
);

const JobDetailHeader = ({ job }) => (
  <VStack align="stretch" gap={5} pb={7} borderBottom="1px solid" borderColor="rgba(148, 163, 184, 0.18)">
    <HStack justify="space-between" align="start" gap={5} flexWrap="wrap">
      <Box flex="1" minW="0">
        <Text color="fg.muted" fontSize="sm" fontWeight="medium" mb={3}>
          {job.category?.name || 'Open opportunity'}
        </Text>
        <Heading as="h1" size={{ base: '2xl', md: '3xl' }} color="fg.default" letterSpacing="0" lineHeight="1.08">
          {job.title}
        </Heading>
      </Box>
    </HStack>

    <HStack gap={4} flexWrap="wrap">
      <MetaItem icon={Clock3}>{formatPostedTime(job.publishedAt || job.createdAt)}</MetaItem>
      <MetaItem icon={MapPin}>Remote</MetaItem>
      <MetaItem icon={BadgeCheck}>Client verified</MetaItem>
    </HStack>
  </VStack>
);

export default JobDetailHeader;
