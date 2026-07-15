import React from 'react';
import { Box, Button, HStack } from '@chakra-ui/react';
import { Search, X } from 'lucide-react';

const JobsSearchBar = ({ value, onChange, onSubmit, onClear }) => (
  <Box as="form" onSubmit={onSubmit} w="full">
    <HStack gap={3} align="center">
      <HStack
        flex="1"
        h="48px"
        px={4}
        gap={3}
        border="1px solid"
        borderColor="rgba(148, 163, 184, 0.26)"
        borderRadius="full"
        bg="rgba(8, 15, 29, 0.72)"
        color="rgba(226, 232, 240, 0.72)"
        _focusWithin={{
          borderColor: 'rgba(34, 211, 238, 0.52)',
          boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.28)',
        }}
      >
        <Search size={20} />
        <Box
          as="input"
          aria-label="Search jobs"
          value={value}
          onChange={onChange}
          placeholder="Search for jobs"
          flex="1"
          minW="0"
          h="full"
          border="0"
          outline="0"
          bg="transparent"
          color="white"
          fontWeight="medium"
          fontSize="sm"
          _placeholder={{ color: 'rgba(226, 232, 240, 0.48)' }}
          _focus={{ outline: 'none' }}
        />
        {value ? (
          <Button
            aria-label="Clear job search"
            type="button"
            size="xs"
            minW="0"
            boxSize="28px"
            p={0}
            borderRadius="full"
            variant="ghost"
            color="rgba(226, 232, 240, 0.72)"
            onClick={onClear}
          >
            <X size={16} />
          </Button>
        ) : null}
      </HStack>

    </HStack>
  </Box>
);

export default JobsSearchBar;
