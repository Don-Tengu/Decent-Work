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
        <Text color="rgba(226, 232, 240, 0.5)" fontSize="xs" fontWeight="bold" textTransform="uppercase">
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
          borderColor="rgba(148, 163, 184, 0.16)"
          borderRadius="12px"
          bg="rgba(15, 23, 42, 0.42)"
          cursor="pointer"
          onClick={() => handleDownload(attachment)}
          _hover={{
            borderColor: 'rgba(125, 211, 252, 0.46)',
            bg: 'rgba(14, 116, 144, 0.14)',
          }}
          _focusVisible={{
            outline: '2px solid',
            outlineColor: 'cyan.300',
            outlineOffset: '3px',
          }}
          _disabled={{
            cursor: 'wait',
            opacity: 0.76,
          }}
        >
          <HStack justify="space-between" gap={3}>
            <HStack gap={3} minW="0">
              <FileText size={16} color="#a5f3fc" />
              <Box minW="0">
                <Text color="white" fontWeight="semibold" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {attachment.fileName}
                </Text>
                <Text color="rgba(226, 232, 240, 0.52)" fontSize="xs">
                  {attachment.contentType || 'Attachment'} - {formatFileSize(attachment.fileSizeBytes)}
                </Text>
              </Box>
            </HStack>
            <HStack gap={2} flex="0 0 auto" color="cyan.100" fontSize="sm" fontWeight="bold">
              <Download size={15} />
              <Text display={{ base: 'none', sm: 'block' }}>
                {downloadingId === attachment.id ? 'Downloading' : 'Download'}
              </Text>
            </HStack>
          </HStack>
        </Box>
      ))}

      {downloadError ? (
        <Text color="red.200" fontSize="sm">
          {downloadError}
        </Text>
      ) : null}
    </VStack>
  );
};

export default AttachmentDownloadList;
