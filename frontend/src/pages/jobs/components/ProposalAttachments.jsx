import React, { useRef } from 'react';
import { Box, Button, HStack, IconButton, Input, Text, VStack } from '@chakra-ui/react';
import { AlertCircle, FileText, Paperclip, Trash2 } from 'lucide-react';
import { MAX_PROPOSAL_ATTACHMENTS, MAX_PROPOSAL_ATTACHMENT_BYTES } from '../proposalForm.js';
import { formatFileSize } from '../utils.jsx';

const ProposalAttachments = ({
  attachments = [],
  error = '',
  disabled = false,
  onAttachmentsAdd,
  onAttachmentRemove,
}) => {
  const fileInputRef = useRef(null);
  const hasFileSlots = attachments.length < MAX_PROPOSAL_ATTACHMENTS;

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    onAttachmentsAdd(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  return (
    <VStack align="stretch" gap={4}>
      <Input ref={fileInputRef} type="file" display="none" multiple onChange={handleFileChange} />

      <HStack align="center" gap={4} flexWrap="wrap">
        <Button
          type="button"
          variant="outline"
          borderRadius="full"
          borderColor="rgba(226, 232, 240, 0.34)"
          color="white"
          px={5}
          disabled={disabled || !hasFileSlots}
          onClick={handleAttachClick}
          _hover={{ borderColor: 'cyan.300', bg: 'rgba(34, 211, 238, 0.1)' }}
        >
          <HStack gap={2}>
            <Paperclip size={19} />
            <span>Attach file</span>
          </HStack>
        </Button>
        <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm">
          Up to {MAX_PROPOSAL_ATTACHMENTS} files, max 100MB each
        </Text>
      </HStack>

      {error ? (
        <Text color="red.300" fontSize="sm" fontWeight="semibold" role="alert">
          <HStack gap={2} align="center">
            <AlertCircle size={18} />
            <span>{error}</span>
          </HStack>
        </Text>
      ) : null}

      {attachments.length ? (
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
          {attachments.map((attachment) => {
            const { id, file } = attachment;
            const isOversized = file.size > MAX_PROPOSAL_ATTACHMENT_BYTES;

            return (
              <HStack
                key={id}
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
                      {file.name}
                    </Text>
                    <Text color={isOversized ? 'red.300' : 'rgba(226, 232, 240, 0.58)'} fontSize="sm">
                      {formatFileSize(file.size)}
                    </Text>
                  </Box>
                </HStack>

                <IconButton
                  aria-label={`Remove ${file.name}`}
                  type="button"
                  variant="ghost"
                  color="rgba(226, 232, 240, 0.72)"
                  borderRadius="full"
                  minW="36px"
                  w="36px"
                  h="36px"
                  disabled={disabled}
                  onClick={() => onAttachmentRemove(id)}
                  _hover={{ bg: 'rgba(248, 113, 113, 0.12)', color: 'red.200' }}
                >
                  <Trash2 size={18} />
                </IconButton>
              </HStack>
            );
          })}
        </VStack>
      ) : null}
    </VStack>
  );
};

export default ProposalAttachments;
