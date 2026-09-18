export const inputStyles = {
  bg: 'bg.muted',
  border: '1px solid',
  borderColor: 'border.default',
  color: 'fg.default',
  borderRadius: '12px',
  outline: 'none',
  boxShadow: 'none',
  _placeholder: { color: 'fg.subtle' },
  _hover: { borderColor: 'ink.600' },
  _focus: {
    borderColor: 'ink.900',
    boxShadow: 'none',
    outline: 'none',
    bg: 'bg.muted',
  },
  _focusVisible: {
    borderColor: 'ink.900',
    boxShadow: 'none',
    outline: 'none',
  },
  _invalid: {
    borderColor: 'red.700',
    boxShadow: 'none',
    outline: 'none',
  },
};

export const tagsInputControlStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 2,
};

export const tagsInputFieldStyles = {
  flex: '1 1 72px',
  minW: '72px',
  w: 'auto',
};

export const editIconButtonStyles = {
  variant: 'outline',
  color: 'ink.900',
  borderColor: 'border.default',
  bg: 'paper.200',
  borderRadius: 'full',
  minW: '46px',
  w: '46px',
  h: '46px',
  _hover: {
    borderColor: 'ink.900',
    bg: 'paper.300',
    color: 'ink.900',
  },
};

export const skillTagStyles = {
  bg: 'paper.200',
  color: 'ink.900',
  border: '0',
  borderRadius: '10px',
  fontWeight: 'semibold',
  px: 3,
  py: 1,
};

export const infoCardStyles = {
  borderRadius: '16px',
  bg: 'bg.panel',
  border: '1px solid',
  borderColor: 'border.default',
  p: 5,
};
