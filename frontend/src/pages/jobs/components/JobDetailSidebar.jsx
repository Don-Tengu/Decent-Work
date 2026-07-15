import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Box, Button, HStack, Heading, Text, VStack } from '@chakra-ui/react';
import { CheckCircle2, Copy, Heart, LockKeyhole, SendHorizontal, ShieldCheck } from 'lucide-react';
import GlassPanel from '../../../components/ui/GlassPanel.jsx';
import { formatBudgetLabel, formatPostedTime } from '../utils.jsx';

const SidebarStat = ({ label, value }) => (
  <Box>
    <Text color="rgba(226, 232, 240, 0.5)" fontSize="xs" fontWeight="bold" textTransform="uppercase">
      {label}
    </Text>
    <Text color="white" fontWeight="semibold" mt={1}>
      {value}
    </Text>
  </Box>
);

const getProposalAction = ({ job, userRole, myBid, loadingMyBid }) => {
  if (job.status !== 'OPEN') {
    return {
      disabled: true,
      icon: <LockKeyhole size={17} />,
      label: 'Job not open',
      copy: 'This job is not accepting new proposals.',
    };
  }

  if (userRole !== 'FREELANCER') {
    return {
      disabled: true,
      icon: <LockKeyhole size={17} />,
      label: 'Freelancers only',
      copy: 'Freelancer accounts can submit proposals from this job page.',
    };
  }

  if (loadingMyBid) {
    return {
      disabled: true,
      icon: <SendHorizontal size={17} />,
      label: 'Checking proposal',
      copy: 'Checking whether you already submitted a proposal.',
    };
  }

  if (myBid) {
    return {
      as: Link,
      to: '/my-bids',
      icon: <CheckCircle2 size={17} />,
      label: 'Proposal submitted',
      copy: 'Your proposal is in review with the client.',
    };
  }

  return {
    as: Link,
    to: `/jobs/${job.id}/proposal`,
    icon: <SendHorizontal size={17} />,
    label: 'Submit proposal',
    copy: 'Send your rate, timeline, and cover letter. 0 connects charged during MVP.',
  };
};

const JobDetailSidebar = ({
  job,
  saved = false,
  saving = false,
  userRole,
  myBid = null,
  loadingMyBid = false,
  onToggleSaved,
}) => {
  const [copied, setCopied] = React.useState(false);
  const proposalCount = job.bids?.length ?? 0;
  const proposalAction = getProposalAction({ job, userRole, myBid, loadingMyBid });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <VStack align="stretch" gap={5} position={{ xl: 'sticky' }} top={{ xl: 6 }}>
      <GlassPanel variant="subtle" borderRadius="24px" p={{ base: 5, md: 6 }}>
        <VStack align="stretch" gap={4}>
          <Heading as="h2" size="md" color="white" letterSpacing="0">
            Ready to bid?
          </Heading>
          <Text color="rgba(226, 232, 240, 0.66)" fontSize="sm" lineHeight="1.65">
            {proposalAction.copy}
          </Text>
          <Button
            as={proposalAction.as}
            to={proposalAction.to}
            type="button"
            disabled={proposalAction.disabled}
            borderRadius="full"
            bgGradient="to-r"
            gradientFrom="cyan.400"
            gradientTo="blue.500"
            color="gray.950"
            fontWeight="bold"
            _disabled={{ opacity: 0.58, cursor: 'not-allowed' }}
          >
            {proposalAction.icon}
            {proposalAction.label}
          </Button>
          <Button
            type="button"
            bg={saved ? 'rgba(34, 197, 94, 0.2)' : 'rgba(15, 35, 54, 0.82)'}
            border="1px solid"
            borderColor={saved ? 'rgba(134, 239, 172, 0.88)' : 'rgba(125, 211, 252, 0.62)'}
            borderRadius="full"
            color={saved ? 'green.100' : 'rgba(226, 232, 240, 0.9)'}
            disabled={saving}
            fontWeight="bold"
            onClick={onToggleSaved}
            transition="all 0.18s ease"
            _hover={{
              bg: saved ? 'rgba(34, 197, 94, 0.28)' : 'rgba(20, 47, 74, 0.94)',
              borderColor: saved ? 'rgba(187, 247, 208, 0.96)' : 'rgba(165, 243, 252, 0.95)',
              color: saved ? 'green.50' : 'cyan.50',
              transform: 'translateY(-1px)',
            }}
            _active={{
              bg: 'rgba(14, 116, 144, 0.28)',
              transform: 'translateY(0)',
            }}
            _disabled={{
              opacity: 0.58,
              cursor: 'not-allowed',
            }}
          >
            <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved' : 'Save job'}
          </Button>
        </VStack>
      </GlassPanel>

      <GlassPanel variant="subtle" borderRadius="24px" p={{ base: 5, md: 6 }}>
        <VStack align="stretch" gap={5}>
          <Heading as="h2" size="md" color="white" letterSpacing="0">
            Job snapshot
          </Heading>
          <SidebarStat label="Budget" value={formatBudgetLabel(job)} />
          <SidebarStat label="Posted" value={formatPostedTime(job.publishedAt || job.createdAt).replace('Posted ', '')} />
          <SidebarStat
            label="Proposals"
            value={proposalCount ? `${proposalCount} submitted` : 'No proposals yet'}
          />
        </VStack>
      </GlassPanel>

      <GlassPanel variant="subtle" borderRadius="24px" p={{ base: 5, md: 6 }}>
        <VStack align="stretch" gap={5}>
          <Heading as="h2" size="md" color="white" letterSpacing="0">
            About the client
          </Heading>
          <HStack gap={3} color="green.200">
            <ShieldCheck size={18} />
            <Text fontWeight="bold">Client verified</Text>
          </HStack>
          <SidebarStat label="Client" value={job.client?.username || 'Marketplace client'} />
          <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm" lineHeight="1.6">
            Client history and escrow activity will become richer as bids, acceptance, and payment funding move into the product flow.
          </Text>
          <Button
            type="button"
            variant="plain"
            justifyContent="start"
            alignSelf="start"
            px={0}
            bg="transparent"
            color="cyan.200"
            fontWeight="semibold"
            textUnderlineOffset="3px"
            onClick={handleCopyLink}
            _hover={{
              bg: 'transparent',
              color: 'cyan.100',
              textDecoration: 'underline',
            }}
            _active={{
              bg: 'transparent',
              color: 'cyan.200',
            }}
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'rgba(125, 211, 252, 0.5)',
              outlineOffset: '3px',
            }}
          >
            <Copy size={16} />
            {copied ? 'Copied job link' : 'Copy job link'}
          </Button>
        </VStack>
      </GlassPanel>
    </VStack>
  );
};

export default JobDetailSidebar;
