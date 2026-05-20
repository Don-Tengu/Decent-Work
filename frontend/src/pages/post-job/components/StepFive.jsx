import React, { useRef } from 'react';
import {
  Box,
  Button,
  Field,
  HStack,
  IconButton,
  Input,
  Link,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { AlertCircle, FileText, Paperclip, Trash2 } from 'lucide-react';
import {
  formatAttachmentSize,
  getAttachmentDisplayName,
  getAttachmentSizeBytes,
  MAX_JOB_ATTACHMENTS,
  MAX_JOB_ATTACHMENT_BYTES,
  MAX_JOB_DESCRIPTION_LENGTH,
} from '../constants.js';
import { inputStyles } from '../styles.js';

const StepFive = ({
  draft,
  descriptionError,
  attachmentError,
  submitError,
  onDescriptionChange,
  onDescriptionBlur,
  onAttachmentsAdd,
  onAttachmentRemove,
}) => {
  const fileInputRef = useRef(null);
  const remainingCharacters = MAX_JOB_DESCRIPTION_LENGTH - draft.description.length;
  const hasFileSlots = (draft.attachments?.length ?? 0) < MAX_JOB_ATTACHMENTS;

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    onAttachmentsAdd(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  return (
    <VStack align="stretch" gap={7}>
      <Field.Root required invalid={!!descriptionError}>
        <Field.Label color="white" fontWeight="semibold">
          Describe what you need
        </Field.Label>
        <Textarea
          name="description"
          value={draft.description}
          onChange={onDescriptionChange}
          onBlur={onDescriptionBlur}
          placeholder="Already have a description? Paste it here."
          minH={{ base: '230px', md: '220px' }}
          resize="vertical"
          maxLength={MAX_JOB_DESCRIPTION_LENGTH}
          {...inputStyles}
          borderColor={descriptionError ? 'red.400' : inputStyles.borderColor}
          _hover={{
            borderColor: descriptionError ? 'red.400' : inputStyles._hover.borderColor,
          }}
          _focus={{
            borderColor: descriptionError ? 'red.400' : inputStyles._focus.borderColor,
            boxShadow: descriptionError
              ? '0 0 0 1px rgba(248, 113, 113, 0.5)'
              : inputStyles._focus.boxShadow,
          }}
        />
        <HStack justify="space-between" gap={3} align="start" flexWrap="wrap">
          {descriptionError ? (
            <Field.ErrorText color="red.300" fontWeight="semibold">
              <HStack gap={2} align="center">
                <AlertCircle size={18} />
                <span>{descriptionError}</span>
              </HStack>
            </Field.ErrorText>
          ) : (
            <Box />
          )}
          <Text
            color={remainingCharacters < 0 ? 'red.300' : 'rgba(226, 232, 240, 0.6)'}
            fontSize="sm"
            fontWeight="medium"
          >
            {remainingCharacters.toLocaleString()} characters left
          </Text>
        </HStack>
      </Field.Root>

      <VStack align="stretch" gap={4}>
        <Input
          ref={fileInputRef}
          type="file"
          display="none"
          multiple
          onChange={handleFileChange}
        />

        <HStack align="center" gap={4} flexWrap="wrap">
          <Button
            type="button"
            variant="outline"
            borderRadius="full"
            borderColor="rgba(226, 232, 240, 0.34)"
            color="white"
            px={5}
            disabled={!hasFileSlots}
            onClick={handleAttachClick}
            _hover={{ borderColor: 'green.300', bg: 'rgba(34, 197, 94, 0.1)' }}
          >
            <HStack gap={2}>
              <Paperclip size={19} />
              <span>Attach file</span>
            </HStack>
          </Button>
          <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm">
            Max file size: 100MB
          </Text>
        </HStack>

        {attachmentError ? (
          <Text color="red.300" fontSize="sm" fontWeight="semibold" role="alert">
            <HStack gap={2} align="center">
              <AlertCircle size={18} />
              <span>{attachmentError}</span>
            </HStack>
          </Text>
        ) : null}

        {draft.attachments?.length ? (
          <VStack
            align="stretch"
            gap={3}
            maxH={{ base: '260px', lg: 'clamp(160px, 25vh, 260px)' }}
            overflowY="auto"
            pr={1}
            css={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(148, 163, 184, 0.36) transparent',
              '&::-webkit-scrollbar': { width: '8px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(148, 163, 184, 0.34)',
                borderRadius: '999px',
              },
            }}
          >
            {draft.attachments.map((attachment) => {
              const attachmentName = getAttachmentDisplayName(attachment);
              const attachmentSize = getAttachmentSizeBytes(attachment);
              const isOversized = attachmentSize > MAX_JOB_ATTACHMENT_BYTES;

              return (
                <HStack
                  key={attachment.id}
                  justify="space-between"
                  align="center"
                  gap={4}
                  border="1px solid"
                  borderColor={isOversized ? 'rgba(248, 113, 113, 0.62)' : 'rgba(148, 163, 184, 0.2)'}
                  bg="rgba(15, 23, 42, 0.46)"
                  borderRadius="16px"
                  px={4}
                  py={3}
                >
                  <HStack minW="0" gap={3}>
                    <Box
                      boxSize="36px"
                      borderRadius="full"
                      display="grid"
                      placeItems="center"
                      bg="rgba(34, 211, 238, 0.12)"
                      color="cyan.200"
                      flex="0 0 auto"
                    >
                      <FileText size={18} />
                    </Box>
                    <Box minW="0">
                      <Text
                        color="white"
                        fontWeight="semibold"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {attachmentName}
                      </Text>
                      <Text color={isOversized ? 'red.300' : 'rgba(226, 232, 240, 0.58)'} fontSize="sm">
                        {formatAttachmentSize(attachmentSize)}
                      </Text>
                    </Box>
                  </HStack>

                  <IconButton
                    aria-label={`Remove ${attachmentName}`}
                    type="button"
                    variant="ghost"
                    color="rgba(226, 232, 240, 0.72)"
                    borderRadius="full"
                    minW="36px"
                    w="36px"
                    h="36px"
                    onClick={() => onAttachmentRemove(attachment.id)}
                    _hover={{ bg: 'rgba(248, 113, 113, 0.12)', color: 'red.200' }}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </HStack>
              );
            })}
          </VStack>
        ) : null}

        {submitError ? (
          <Text color="red.300" fontSize="sm" fontWeight="medium">
            {submitError}
          </Text>
        ) : null}
      </VStack>
    </VStack>
  );
};

export default StepFive;
