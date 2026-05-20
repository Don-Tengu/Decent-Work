import React from 'react';
import { Box } from '@chakra-ui/react';

const panelVariants = {
  solid: {
    bg: 'rgba(9, 16, 30, 0.78)',
    backdropFilter: 'blur(18px)',
    borderColor: 'rgba(148, 163, 184, 0.18)',
    boxShadow: '0 30px 80px rgba(2, 6, 23, 0.45)',
  },
  soft: {
    bg: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(24px)',
    borderColor: 'rgba(148, 163, 184, 0.16)',
    boxShadow: '0 30px 80px rgba(2, 6, 23, 0.45)',
  },
  subtle: {
    bg: 'rgba(10, 18, 32, 0.72)',
    borderColor: 'rgba(148, 163, 184, 0.16)',
    boxShadow: '0 20px 40px rgba(2, 6, 23, 0.22)',
  },
};

const GlassPanel = ({
  children,
  variant = 'soft',
  borderRadius = '32px',
  border = '1px solid',
  p = { base: 8, md: 10 },
  ...props
}) => (
  <Box
    border={border}
    borderRadius={borderRadius}
    p={p}
    {...panelVariants[variant]}
    {...props}
  >
    {children}
  </Box>
);

export default GlassPanel;
