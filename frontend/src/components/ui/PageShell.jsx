import React from 'react';
import { Box } from '@chakra-ui/react';

const PageShell = ({
  children,
  maxW = '1180px',
  px = { base: 4, md: 8 },
  py = { base: 8, md: 12 },
  accents: _accents,
  ...props
}) => (
  <Box minH="100vh" position="relative" bg="bg.canvas" color="fg.default" px={px} py={py} {...props}>
    <Box maxW={maxW} mx="auto" position="relative">
      {children}
    </Box>
  </Box>
);

export default PageShell;
