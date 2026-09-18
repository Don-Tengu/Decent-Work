import React from 'react';
import { Badge } from '@chakra-ui/react';

const STATUS_CONFIG = {
  OFFERED: { label: 'Offer sent' },
  ACCEPTED: { label: 'Hired' },
  REJECTED: { label: 'Not selected' },
};

const BidStatusBadge = ({ status, ...props }) => {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      color="fg.default"
      borderColor="border.default"
      bg="transparent"
      borderRadius="8px"
      px={2.5}
      py={0.5}
      fontWeight="medium"
      fontSize="xs"
      {...props}
    >
      {config.label}
    </Badge>
  );
};

export default BidStatusBadge;
