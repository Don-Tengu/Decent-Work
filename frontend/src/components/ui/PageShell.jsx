import React from 'react';
import { Box } from '@chakra-ui/react';

const defaultAccents = [
  {
    top: '-120px',
    left: '-90px',
    w: '260px',
    h: '260px',
    bg: 'rgba(34, 211, 238, 0.16)',
    filter: 'blur(24px)',
  },
  {
    bottom: '-100px',
    right: '-60px',
    w: '320px',
    h: '320px',
    bg: 'rgba(79, 70, 229, 0.18)',
    filter: 'blur(28px)',
  },
];

const PageShell = ({
  children,
  maxW = '1180px',
  px = { base: 4, md: 8 },
  py = { base: 8, md: 12 },
  accents = defaultAccents,
  ...props
}) => (
  <Box minH="100vh" position="relative" overflow="hidden" px={px} py={py} {...props}>
    {accents.map((accent, index) => (
      <Box
        key={`${accent.bg}-${index}`}
        position="absolute"
        borderRadius="full"
        pointerEvents="none"
        {...accent}
      />
    ))}
    <Box maxW={maxW} mx="auto" position="relative">
      {children}
    </Box>
  </Box>
);

export default PageShell;
