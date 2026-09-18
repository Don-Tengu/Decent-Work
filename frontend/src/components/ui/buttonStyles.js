const inkRadius = '12px';

export const subtlePillButtonStyles = {
  variant: 'plain',
  border: '1px solid',
  borderColor: 'border.default',
  borderRadius: inkRadius,
  bg: 'transparent',
  color: 'fg.default',
  fontWeight: 'medium',
  transition: 'background 0.15s ease, border-color 0.15s ease',
  _hover: {
    bg: 'bg.muted',
    borderColor: 'ink.900',
    color: 'fg.default',
  },
  _active: {
    bg: 'paper.200',
  },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'ink.900',
    outlineOffset: '2px',
  },
};

export const textUnderlineButtonStyles = {
  variant: 'plain',
  border: '0',
  borderColor: 'transparent',
  borderRadius: '0',
  bg: 'transparent',
  color: 'fg.default',
  fontWeight: 'medium',
  px: 1,
  textDecoration: 'none',
  textUnderlineOffset: '4px',
  textDecorationThickness: '1px',
  _hover: {
    bg: 'transparent',
    borderColor: 'transparent',
    color: 'fg.default',
    textDecoration: 'underline',
  },
  _active: {
    bg: 'transparent',
  },
  _disabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
    textDecoration: 'none',
  },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'ink.900',
    outlineOffset: '2px',
  },
};

export const quietPillButtonStyles = {
  ...subtlePillButtonStyles,
  borderColor: 'transparent',
  bg: 'transparent',
  color: 'fg.muted',
  _hover: {
    bg: 'bg.muted',
    borderColor: 'transparent',
    color: 'fg.default',
  },
  _active: {
    bg: 'paper.200',
  },
};

export const greenPillButtonStyles = { ...subtlePillButtonStyles };

export const yellowPillButtonStyles = { ...subtlePillButtonStyles };

export const greenSolidButtonStyles = {
  borderRadius: inkRadius,
  bg: 'ink.900',
  color: 'paper.100',
  fontWeight: 'semibold',
  border: '1px solid',
  borderColor: 'ink.900',
  transition: 'opacity 0.15s ease, background 0.15s ease',
  _hover: { bg: 'ink.600', borderColor: 'ink.600', color: 'paper.100' },
  _active: { bg: 'ink.900' },
  _disabled: { opacity: 0.45, cursor: 'not-allowed' },
};
