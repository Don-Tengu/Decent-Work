import React from 'react';
import { Button, HStack, Text } from '@chakra-ui/react';

const JobsPagination = ({ page, totalPages, hasNext, hasPrevious, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <HStack justify="space-between" pt={5} flexWrap="wrap" gap={3}>
      <Button
        type="button"
        variant="outline"
        colorPalette="cyan"
        borderRadius="full"
        disabled={!hasPrevious}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <Text color="rgba(226, 232, 240, 0.64)" fontSize="sm" fontWeight="semibold">
        Page {page + 1} of {totalPages}
      </Text>
      <Button
        type="button"
        variant="outline"
        colorPalette="cyan"
        borderRadius="full"
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </HStack>
  );
};

export default JobsPagination;
