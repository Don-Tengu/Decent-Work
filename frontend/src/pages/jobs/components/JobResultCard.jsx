import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge, Box, HStack, Heading, IconButton, Text, VStack } from '@chakra-ui/react';
import { BadgeCheck, Heart, MapPin } from 'lucide-react';
import {
  formatPostedTime,
  getJobTags,
  getWorkSummaryParts,
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
          <Text color="fg.subtle" fontSize="sm">
            {formatPostedTime(job.publishedAt || job.createdAt)}
          </Text>

          <Heading as="h3" size={{ base: 'md', md: 'lg' }} lineHeight="1.28" letterSpacing="0">
            <Box
              as={Link}
              to={`/jobs/${job.id}`}
              state={{ from: backTarget }}
              color="fg.default"
              display="inline"
              _hover={{ color: 'fg.muted' }}
              _focusVisible={{ outline: '2px solid', outlineColor: 'ink.900', outlineOffset: '3px' }}
            >
              <HighlightedText query={query}>{job.title}</HighlightedText>
            </Box>
          </Heading>

          <HStack gap={3} flexWrap="wrap" color="fg.muted" fontSize="sm">
            <HStack gap={1.5}>
              <BadgeCheck size={17} color="#1d4ed8" />
              <Text>Client verified</Text>
            </HStack>
            <Text color="orange.700">*****</Text>
            <Text>{proposalCount ? 'Active proposals' : 'New listing'}</Text>
            <HStack gap={1.5}>
              <MapPin size={16} />
              <Text>Remote</Text>
            </HStack>
          </HStack>

          <HStack gap="0.45em" flexWrap="wrap" color="fg.muted" fontSize="sm" fontWeight="semibold">
            {getWorkSummaryParts(job).map((part, index) => (
              <React.Fragment key={part}>
                {index > 0 ? (
                  <Text as="span" color="fg.subtle" fontWeight="normal" aria-hidden>
                    ·
                  </Text>
                ) : null}
                <Text as="span">{part}</Text>
              </React.Fragment>
            ))}
          </HStack>

          <HighlightedText
            query={query}
            as="p"
            color="fg.muted"
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
                  color="fg.default"
                >
                  <HighlightedText query={query}>{tag}</HighlightedText>
                </Badge>
              ))}
            </HStack>
          ) : null}

          <Text color="fg.subtle" fontSize="sm">
            Proposals: <Box as="span" color="fg.muted" fontWeight="semibold">{proposalLabel(proposalCount)}</Box>
          </Text>
        </VStack>

        <VStack gap={3} flex="0 0 auto">
          <IconButton
            aria-label={`${saved ? 'Unsave' : 'Save'} ${job.title}`}
            type="button"
            variant="plain"
            borderRadius="full"
            bg={saved ? 'paper.200' : 'transparent'}
            border="1px solid"
            borderColor={saved ? 'ink.900' : 'border.default'}
            color={saved ? 'ink.900' : 'fg.muted'}
            disabled={saving}
            onClick={() => onToggleSaved?.(job)}
            transition="background 0.15s ease, border-color 0.15s ease, color 0.15s ease"
            _hover={{
              bg: 'paper.200',
              borderColor: 'ink.900',
              color: 'ink.900',
            }}
            _active={{
              bg: 'paper.300',
            }}
            _disabled={{
              opacity: 0.45,
              cursor: 'not-allowed',
            }}
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'ink.900',
              outlineOffset: '2px',
            }}
          >
            <Heart size={18} strokeWidth={1.75} fill={saved ? 'currentColor' : 'none'} />
          </IconButton>
        </VStack>
      </HStack>
    </Box>
  );
};

export default JobResultCard;
