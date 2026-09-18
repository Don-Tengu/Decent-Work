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
        borderColor="border.default"
        borderRadius="12px"
        bg="bg.muted"
        color="fg.muted"
        _focusWithin={{
          borderColor: 'ink.900',
          boxShadow: '0 0 0 1px #141413',
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
          bg="bg.muted"
          color="fg.default"
          fontWeight="medium"
          fontSize="sm"
          _placeholder={{ color: 'fg.subtle' }}
          _focus={{ outline: 'none', bg: 'bg.muted' }}
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
            color="fg.muted"
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
