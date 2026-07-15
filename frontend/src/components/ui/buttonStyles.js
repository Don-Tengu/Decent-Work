export const subtlePillButtonStyles = {
  variant: 'plain',
  border: '1px solid',
  borderColor: 'rgba(125, 211, 252, 0.48)',
  borderRadius: 'full',
  bg: 'rgba(8, 15, 29, 0.36)',
  color: 'rgba(226, 232, 240, 0.9)',
  fontWeight: 'medium',
  transition: 'all 0.18s ease',
  _hover: {
    bg: 'rgba(14, 116, 144, 0.18)',
    borderColor: 'rgba(125, 211, 252, 0.68)',
    color: 'cyan.100',
    boxShadow: '0 0 0 1px rgba(125, 211, 252, 0.08)',
  },
  _active: {
    bg: 'rgba(14, 116, 144, 0.26)',
    color: 'cyan.100',
  },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'rgba(125, 211, 252, 0.5)',
    outlineOffset: '3px',
  },
};

export const quietPillButtonStyles = {
  ...subtlePillButtonStyles,
  borderColor: 'transparent',
  bg: 'transparent',
  color: 'rgba(226, 232, 240, 0.82)',
  _hover: {
    bg: 'rgba(14, 116, 144, 0.14)',
    borderColor: 'rgba(125, 211, 252, 0.24)',
    color: 'cyan.100',
    boxShadow: 'none',
  },
  _active: {
    bg: 'rgba(14, 116, 144, 0.22)',
    color: 'cyan.100',
  },
};

export const greenPillButtonStyles = {
  ...subtlePillButtonStyles,
  borderColor: 'rgba(134, 239, 172, 0.52)',
  color: 'green.100',
  _hover: {
    bg: 'rgba(34, 197, 94, 0.16)',
    borderColor: 'rgba(134, 239, 172, 0.74)',
    color: 'green.50',
    boxShadow: '0 0 0 1px rgba(134, 239, 172, 0.08)',
  },
  _active: {
    bg: 'rgba(34, 197, 94, 0.24)',
    color: 'green.50',
  },
};

// Filled primary CTA (e.g. Hire, Release payment) — distinct from the
// outlined pill variants above.
export const greenSolidButtonStyles = {
  borderRadius: 'full',
  bg: 'green.500',
  color: 'gray.950',
  fontWeight: 'bold',
  transition: 'all 0.18s ease',
  _hover: { bg: 'green.400', transform: 'translateY(-1px)' },
  _active: { bg: 'green.600', transform: 'translateY(0)' },
  _disabled: { opacity: 0.6, cursor: 'not-allowed', transform: 'none' },
};

export const yellowPillButtonStyles = {
  ...subtlePillButtonStyles,
  borderColor: 'rgba(253, 224, 71, 0.46)',
  color: 'yellow.100',
  _hover: {
    bg: 'rgba(234, 179, 8, 0.14)',
    borderColor: 'rgba(253, 224, 71, 0.68)',
    color: 'yellow.50',
    boxShadow: '0 0 0 1px rgba(253, 224, 71, 0.08)',
  },
  _active: {
    bg: 'rgba(234, 179, 8, 0.22)',
    color: 'yellow.50',
  },
};
