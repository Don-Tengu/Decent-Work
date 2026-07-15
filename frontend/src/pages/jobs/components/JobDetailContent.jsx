import React from 'react';
import { Badge, Box, HStack, Heading, Text, VStack } from '@chakra-ui/react';
import { Download, FileText } from 'lucide-react';
import { toApiUrl } from '@/config/api.js';
import GlassPanel from '../../../components/ui/GlassPanel.jsx';
import JobDetailFacts from './JobDetailFacts.jsx';
import JobDetailHeader from './JobDetailHeader.jsx';
import { formatFileSize, getJobTags } from '../utils.jsx';

const Section = ({ title, children }) => (
  <VStack align="stretch" gap={4} py={7} borderBottom="1px solid" borderColor="rgba(148, 163, 184, 0.18)">
    <Heading as="h2" size="md" color="white" letterSpacing="0">
      {title}
    </Heading>
    {children}
  </VStack>
);

const getAttachmentDownloadUrl = (jobId, attachment) =>
  toApiUrl(attachment.publicUrl || `/api/jobs/${jobId}/attachments/${attachment.id}/download`);

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

const AttachmentsList = ({ jobId, attachments }) => {
  const [downloadingId, setDownloadingId] = React.useState(null);
  const [downloadError, setDownloadError] = React.useState('');

  if (!attachments.length) {
    return (
      <Text color="rgba(226, 232, 240, 0.62)" fontSize="sm">
        The client has not attached files to this listing yet.
      </Text>
    );
  }

  const handleDownload = async (attachment) => {
    const token = localStorage.getItem('token');
    setDownloadingId(attachment.id);
    setDownloadError('');

    try {
      const response = await fetch(getAttachmentDownloadUrl(jobId, attachment), {
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
    <VStack align="stretch" gap={3}>
      {attachments.map((attachment) => (
        <Box
          as="button"
          key={attachment.id}
          type="button"
          disabled={downloadingId === attachment.id}
          textAlign="left"
          w="full"
          p={4}
          border="1px solid"
          borderColor="rgba(148, 163, 184, 0.16)"
          borderRadius="14px"
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
          <HStack justify="space-between" gap={4}>
            <HStack gap={3} minW="0">
              <FileText size={18} color="#a5f3fc" />
              <Box minW="0">
                <Text color="white" fontWeight="bold" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {attachment.fileName}
                </Text>
                <Text color="rgba(226, 232, 240, 0.52)" fontSize="sm">
                  {attachment.contentType || 'Attachment'} - {formatFileSize(attachment.fileSizeBytes)}
                </Text>
              </Box>
            </HStack>
            <HStack gap={2} flex="0 0 auto" color="cyan.100" fontSize="sm" fontWeight="bold">
              <Download size={16} />
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

const JobDetailContent = ({ job }) => {
  const tags = getJobTags(job);
  const attachments = job.attachments ?? [];
  const proposalCount = job.bids?.length ?? 0;

  return (
    <GlassPanel variant="solid" borderRadius="28px" p={{ base: 5, md: 8 }}>
      <JobDetailHeader job={job} />

      <Section title="Summary">
        <Text color="rgba(226, 232, 240, 0.78)" lineHeight="1.85" whiteSpace="pre-line">
          {job.description}
        </Text>
      </Section>

      <Section title="Project details">
        <JobDetailFacts job={job} />
      </Section>

      <Section title="Skills and expertise">
        {tags.length ? (
          <HStack gap={2} flexWrap="wrap">
            {tags.map((tag) => (
              <Badge
                key={tag}
                colorPalette="gray"
                borderRadius="full"
                px={3}
                py={1.5}
                bg="rgba(148, 163, 184, 0.16)"
                color="rgba(248, 250, 252, 0.92)"
              >
                {tag}
              </Badge>
            ))}
          </HStack>
        ) : (
          <Text color="rgba(226, 232, 240, 0.62)" fontSize="sm">
            The client has not added skills to this listing yet.
          </Text>
        )}
      </Section>

      <Section title="Attachments">
        <AttachmentsList jobId={job.id} attachments={attachments} />
      </Section>

      <VStack align="stretch" gap={3} pt={7}>
        <Heading as="h2" size="md" color="white" letterSpacing="0">
          Activity on this job
        </Heading>
        <Text color="rgba(226, 232, 240, 0.66)">
          {proposalCount
            ? `${proposalCount} proposal${proposalCount === 1 ? '' : 's'} submitted so far.`
            : 'No proposals have been submitted yet.'}
        </Text>
      </VStack>
    </GlassPanel>
  );
};

export default JobDetailContent;
