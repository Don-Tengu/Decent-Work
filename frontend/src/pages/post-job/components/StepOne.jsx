import React from 'react';
import { Field, Input, VStack } from '@chakra-ui/react';
import { inputStyles } from '../styles.js';

const StepOne = ({ draft, error, onChange }) => (
  <VStack align="stretch" gap={6}>
    <Field.Root required invalid={!!error}>
      <Field.Label color="white" fontWeight="semibold">
        Write a title for your job post
      </Field.Label>
      <Input name="title" value={draft.title} onChange={onChange} h="58px" {...inputStyles} />
      {error && <Field.ErrorText color="red.300">{error}</Field.ErrorText>}
    </Field.Root>
  </VStack>
);

export default StepOne;
