import React from 'react';
import { Box } from '@chakra-ui/react';

const panelVariants = {
  solid: {
    bg: 'bg.canvas',
    borderColor: 'border.default',
  },
  soft: {
    bg: 'bg.canvas',
    borderColor: 'border.default',
  },
  subtle: {
    bg: 'transparent',
    borderColor: 'border.default',
  },
};

const GlassPanel = ({
  children,
  variant = 'soft',
  borderRadius = '16px',
  border = '1px solid',
  p = { base: 8, md: 10 },
  ...props
}) => (
  <Box
    border={border}
    borderRadius={borderRadius}
    p={p}
    boxShadow="none"
    {...panelVariants[variant]}
    {...props}
  >
    {children}
  </Box>
);

export default GlassPanel;
