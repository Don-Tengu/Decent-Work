import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const paper = '{colors.paper.50}';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        paper: {
          50: { value: '#EDE9E0' },
          100: { value: '#EDE9E0' },
          200: { value: '#E3DDD2' },
          300: { value: '#D0C8B8' },
        },
        ink: {
          400: { value: '#8A857C' },
          600: { value: '#5C5852' },
          900: { value: '#141413' },
        },
      },
      fonts: {
        heading: { value: '"Newsreader", "Times New Roman", serif' },
        body: { value: 'Inter, "Segoe UI", system-ui, sans-serif' },
        mono: { value: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: paper },
          canvas: { value: paper },
          muted: { value: paper },
          subtle: { value: paper },
          panel: { value: paper },
          emphasized: { value: '{colors.paper.200}' },
        },
        fg: {
          DEFAULT: { value: '{colors.ink.900}' },
          muted: { value: '{colors.ink.600}' },
          subtle: { value: '{colors.ink.400}' },
        },
        border: {
          DEFAULT: { value: '{colors.paper.300}' },
          muted: { value: '{colors.paper.300}' },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
