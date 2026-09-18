import React from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { Download, FileText } from 'lucide-react';
import { toApiUrl } from '@/config/api.js';
import { formatFileSize } from '@/pages/jobs/utils.jsx';

const saveBlob = (blob, fileName) => {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName || 'attachment';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
};

const AttachmentDownloadList = ({ attachments = [], label }) => {
  const [downloadingId, setDownloadingId] = React.useState(null);
  const [downloadError, setDownloadError] = React.useState('');

  if (!attachments.length) {
    return null;
  }

  const handleDownload = async (attachment) => {
    const url = toApiUrl(attachment.publicUrl);
    if (!url) {
      setDownloadError('This attachment is unavailable.');
      return;
    }

    const token = localStorage.getItem('token');
    setDownloadingId(attachment.id);
    setDownloadError('');

    try {
      const response = await fetch(url, {
        headers: {
          authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Attachment download failed.');
      }

      saveBlob(await response.blob(), attachment.fileName);
    } catch (error) {
      setDownloadError(error.message || 'Attachment download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <VStack align="stretch" gap={2}>
      {label ? (
        <Text color="fg.subtle" fontSize="xs" fontWeight="bold" textTransform="uppercase">
          {label}
        </Text>
      ) : null}

      {attachments.map((attachment) => (
        <Box
          as="button"
          key={attachment.id}
          type="button"
          disabled={downloadingId === attachment.id}
          textAlign="left"
          w="full"
          p={3}
          border="1px solid"
          borderColor="border.default"
          borderRadius="12px"
          bg="bg.muted"
          cursor="pointer"
          onClick={() => handleDownload(attachment)}
          _hover={{
            borderColor: 'ink.900',
            bg: 'paper.200',
          }}
          _focusVisible={{
            outline: '2px solid',
            outlineColor: 'ink.900',
            outlineOffset: '3px',
          }}
          _disabled={{
            cursor: 'wait',
            opacity: 0.76,
          }}
        >
          <HStack justify="space-between" gap={3}>
            <HStack gap={3} minW="0">
              <FileText size={16} color="#141413" />
              <Box minW="0">
                <Text color="fg.default" fontWeight="semibold" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {attachment.fileName}
                </Text>
                <Text color="fg.subtle" fontSize="xs">
                  {attachment.contentType || 'Attachment'} - {formatFileSize(attachment.fileSizeBytes)}
                </Text>
              </Box>
            </HStack>
            <HStack gap={2} flex="0 0 auto" color="fg.default" fontSize="sm" fontWeight="bold">
              <Download size={15} />
              <Text display={{ base: 'none', sm: 'block' }}>
                {downloadingId === attachment.id ? 'Downloading' : 'Download'}
              </Text>
            </HStack>
          </HStack>
        </Box>
      ))}

      {downloadError ? (
        <Text color="red.700" fontSize="sm">
          {downloadError}
        </Text>
      ) : null}
    </VStack>
  );
};

export default AttachmentDownloadList;
