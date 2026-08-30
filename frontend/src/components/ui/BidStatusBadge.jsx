import React from 'react';
import { Badge } from '@chakra-ui/react';

// Client-facing decision label for a proposal. PENDING shows nothing (the Offer
// action already implies it); OFFERED/ACCEPTED/REJECTED surface the outcome.
const STATUS_CONFIG = {
  OFFERED: { label: 'Offer sent', colorPalette: 'cyan' },
  ACCEPTED: { label: 'Hired', colorPalette: 'green' },
  REJECTED: { label: 'Not selected', colorPalette: 'gray' },
};

const BidStatusBadge = ({ status, ...props }) => {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return null;
  }

  return (
    <Badge
      colorPalette={config.colorPalette}
      variant="subtle"
      borderRadius="full"
      px={3}
      py={1}
      fontWeight="semibold"
      {...props}
    >
      {config.label}
    </Badge>
  );
};

export default BidStatusBadge;
