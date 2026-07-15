import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge, Box, HStack, Heading, IconButton, Text, VStack } from '@chakra-ui/react';
import { BadgeCheck, Heart, MapPin } from 'lucide-react';
import {
  formatPostedTime,
  formatWorkSummary,
  getJobTags,
  HighlightedText,
} from '../utils.jsx';

const proposalLabel = (count = 0) => {
  if (count < 5) {
    return 'Fewer than 5';
  }

  if (count < 10) {
    return '5 to 10';
  }

  if (count < 20) {
    return '10 to 20';
  }

  return '20 to 50';
};

const JobResultCard = ({ job, query, saved = false, saving = false, onToggleSaved }) => {
  const location = useLocation();
  const tags = getJobTags(job);
  const proposalCount = job.bids?.length ?? 0;
  const backTarget = `${location.pathname}${location.search}`;

  return (
    <Box
      as="article"
      py={{ base: 6, md: 7 }}
      borderBottom="1px solid"
      borderColor="rgba(148, 163, 184, 0.18)"
    >
      <HStack align="start" justify="space-between" gap={5}>
        <VStack align="stretch" gap={4} flex="1" minW="0">
          <Text color="rgba(226, 232, 240, 0.54)" fontSize="sm">
            {formatPostedTime(job.publishedAt || job.createdAt)}
          </Text>

          <Heading as="h3" size={{ base: 'md', md: 'lg' }} lineHeight="1.28" letterSpacing="0">
            <Box
              as={Link}
              to={`/jobs/${job.id}`}
              state={{ from: backTarget }}
              color="white"
              display="inline"
              _hover={{ color: 'cyan.200' }}
              _focusVisible={{ outline: '2px solid', outlineColor: 'cyan.300', outlineOffset: '3px' }}
            >
              <HighlightedText query={query}>{job.title}</HighlightedText>
            </Box>
          </Heading>

          <HStack gap={3} flexWrap="wrap" color="rgba(226, 232, 240, 0.7)" fontSize="sm">
            <HStack gap={1.5}>
              <BadgeCheck size={17} color="#60a5fa" />
              <Text>Client verified</Text>
            </HStack>
            <Text color="orange.300">*****</Text>
            <Text>{proposalCount ? 'Active proposals' : 'New listing'}</Text>
            <HStack gap={1.5}>
              <MapPin size={16} />
              <Text>Remote</Text>
            </HStack>
          </HStack>

          <Text color="rgba(226, 232, 240, 0.74)" fontSize="sm" fontWeight="semibold">
            {formatWorkSummary(job)}
          </Text>

          <HighlightedText
            query={query}
            as="p"
            color="rgba(226, 232, 240, 0.78)"
            lineHeight="1.75"
            fontSize="sm"
            css={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
            }}
          >
            {job.description}
          </HighlightedText>

          {tags.length ? (
            <HStack gap={2} flexWrap="wrap">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  colorPalette="gray"
                  variant="subtle"
                  borderRadius="8px"
                  px={3}
                  py={1}
                  bg="rgba(148, 163, 184, 0.16)"
                  color="rgba(248, 250, 252, 0.9)"
                >
                  <HighlightedText query={query}>{tag}</HighlightedText>
                </Badge>
              ))}
            </HStack>
          ) : null}

          <Text color="rgba(226, 232, 240, 0.52)" fontSize="sm">
            Proposals: <Box as="span" color="rgba(226, 232, 240, 0.82)" fontWeight="semibold">{proposalLabel(proposalCount)}</Box>
          </Text>
        </VStack>

        <VStack gap={3} flex="0 0 auto">
          <IconButton
            aria-label={`${saved ? 'Unsave' : 'Save'} ${job.title}`}
            type="button"
            borderRadius="full"
            bg={saved ? 'rgba(34, 197, 94, 0.2)' : 'rgba(15, 35, 54, 0.82)'}
            border="1px solid"
            borderColor={saved ? 'rgba(134, 239, 172, 0.88)' : 'rgba(125, 211, 252, 0.62)'}
            color={saved ? 'green.100' : 'rgba(226, 232, 240, 0.9)'}
            disabled={saving}
            onClick={() => onToggleSaved?.(job)}
            transition="all 0.18s ease"
            _hover={{
              bg: saved ? 'rgba(34, 197, 94, 0.28)' : 'rgba(20, 47, 74, 0.94)',
              borderColor: saved ? 'rgba(187, 247, 208, 0.96)' : 'rgba(165, 243, 252, 0.95)',
              color: saved ? 'green.50' : 'cyan.50',
              transform: 'translateY(-1px)',
            }}
            _active={{
              bg: 'rgba(14, 116, 144, 0.28)',
              transform: 'translateY(0)',
            }}
            _disabled={{
              opacity: 0.58,
              cursor: 'not-allowed',
            }}
          >
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
          </IconButton>
        </VStack>
      </HStack>
    </Box>
  );
};

export default JobResultCard;
