import React from 'react';
import { Badge, Box, Button, HStack, NativeSelect, Text } from '@chakra-ui/react';
import { Bookmark, Heart } from 'lucide-react';
import { JOB_SORT_OPTIONS } from '../constants.js';

const JobsResultsToolbar = ({
  totalElements,
  loading,
  sort,
  savedSearch,
  onSortChange,
  onSaveSearch,
}) => (
  <HStack
    justify="space-between"
    align={{ base: 'stretch', md: 'center' }}
    flexWrap="wrap"
    gap={4}
    borderBottom="1px solid"
    borderColor="rgba(148, 163, 184, 0.18)"
    pb={4}
  >

    <HStack gap={3}>
      <Box minW="210px">
        <NativeSelect.Root>
          <NativeSelect.Field
            aria-label="Sort jobs"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            bg="rgba(8, 15, 29, 0.72)"
            borderColor="rgba(148, 163, 184, 0.24)"
            color="white"
            borderRadius="14px"
          >
            {JOB_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                Sort by: {option.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator color="rgba(226, 232, 240, 0.64)" />
        </NativeSelect.Root>
      </Box>
    </HStack>
  </HStack>
);

export default JobsResultsToolbar;
