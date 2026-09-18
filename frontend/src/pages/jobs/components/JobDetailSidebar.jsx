import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Box, Button, HStack, Heading, Text, VStack } from '@chakra-ui/react';
import { CheckCircle2, Copy, Heart, LockKeyhole, SendHorizontal, ShieldCheck } from 'lucide-react';
import GlassPanel from '../../../components/ui/GlassPanel.jsx';
import { formatBudgetLabel, formatPostedTime } from '../utils.jsx';
import { getFreelancerWorkFlags } from '../paymentActions.js';
import { greenSolidButtonStyles, subtlePillButtonStyles } from '../../../components/ui/buttonStyles.js';

const SidebarStat = ({ label, value }) => (
  <Box>
    <Text color="fg.subtle" fontSize="xs" fontWeight="bold" textTransform="uppercase">
      {label}
    </Text>
    <Text color="fg.default" fontWeight="semibold" mt={1}>
      {value}
    </Text>
  </Box>
);

const getProposalAction = ({ job, userRole, myBid, loadingMyBid, onSubmitWork }) => {
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

  if (myBid?.status === 'OFFERED') {
    return {
      as: Link,
      to: '/my-bids',
      icon: <CheckCircle2 size={17} />,
      label: 'Respond to offer',
      copy: 'The client sent you an offer. Accept or decline it from My proposals.',
      highlight: true,
    };
  }

  if (myBid?.status === 'ACCEPTED') {
    const { canSubmitWork, awaitingReview, awaitingFunding, changesRequested, isPaid } =
      getFreelancerWorkFlags({ ...myBid, job });

    if (canSubmitWork) {
      return {
        onClick: onSubmitWork,
        icon: <SendHorizontal size={17} />,
        label: 'Submit work',
        copy: changesRequested
          ? 'The client requested changes. Submit again when the update is ready.'
          : 'Tell the client this work is ready to review. They can approve & release or request changes.',
        highlight: true,
      };
    }

    if (awaitingReview) {
      return {
        as: Link,
        to: '/my-bids',
        icon: <CheckCircle2 size={17} />,
        label: 'Awaiting client review',
        copy: 'You submitted work. The client can approve & release or request changes.',
        highlight: true,
      };
    }

    if (awaitingFunding) {
      return {
        as: Link,
        to: '/my-bids',
        icon: <CheckCircle2 size={17} />,
        label: 'Waiting for escrow funding',
        copy: 'You are hired. The client needs to fund on-chain escrow before you can submit work.',
        highlight: true,
      };
    }

    return {
      as: Link,
      to: '/my-bids',
      icon: <CheckCircle2 size={17} />,
      label: isPaid ? 'View completed contract' : 'View active contract',
      copy: isPaid
        ? 'This contract is completed. Open My proposals for history.'
        : 'You are hired on this job. Track it from My proposals.',
      highlight: true,
    };
  }

  if (myBid) {
    return {
      as: Link,
      to: '/my-bids',
      icon: <CheckCircle2 size={17} />,
      label: myBid.status === 'REJECTED' ? 'Not selected' : 'Proposal submitted',
      copy:
        myBid.status === 'REJECTED'
          ? 'Another freelancer was hired for this job.'
          : 'Your proposal is in review with the client.',
    };
  }

  if (job.status !== 'OPEN') {
    return {
      disabled: true,
      icon: <LockKeyhole size={17} />,
      label: 'Job not open',
      copy: 'This job is not accepting new proposals.',
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
  onSubmitWork,
}) => {
  const [copied, setCopied] = React.useState(false);
  const proposalCount = job.bids?.length ?? 0;
  const proposalAction = getProposalAction({ job, userRole, myBid, loadingMyBid, onSubmitWork });
  const panelTitle =
    myBid?.status === 'ACCEPTED'
      ? job.status === 'COMPLETED'
        ? 'Contract'
        : 'Your contract'
      : myBid
        ? 'Your proposal'
        : 'Ready to bid?';

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
          <Heading as="h2" size="md" color="fg.default" letterSpacing="0">
            {panelTitle}
          </Heading>
          <Text color="fg.muted" fontSize="sm" lineHeight="1.65">
            {proposalAction.copy}
          </Text>
          <Button
            as={proposalAction.as}
            to={proposalAction.to}
            type="button"
            disabled={proposalAction.disabled}
            onClick={proposalAction.onClick}
            {...greenSolidButtonStyles}
            _disabled={{ opacity: 0.58, cursor: 'not-allowed' }}
          >
            {proposalAction.icon}
            {proposalAction.label}
          </Button>
          <Button
            type="button"
            {...subtlePillButtonStyles}
            color={saved ? 'ink.900' : 'fg.default'}
            bg={saved ? 'paper.200' : 'transparent'}
            borderColor={saved ? 'ink.900' : 'border.default'}
            disabled={saving}
            fontWeight="semibold"
            onClick={onToggleSaved}
          >
            <Heart size={17} strokeWidth={1.75} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved' : 'Save job'}
          </Button>
        </VStack>
      </GlassPanel>

      <GlassPanel variant="subtle" borderRadius="24px" p={{ base: 5, md: 6 }}>
        <VStack align="stretch" gap={5}>
          <Heading as="h2" size="md" color="fg.default" letterSpacing="0">
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
          <Heading as="h2" size="md" color="fg.default" letterSpacing="0">
            About the client
          </Heading>
          <HStack gap={3} color="fg.muted">
            <ShieldCheck size={18} />
            <Text fontWeight="bold">Client verified</Text>
          </HStack>
          <SidebarStat label="Client" value={job.client?.username || 'Marketplace client'} />
          <Text color="fg.muted" fontSize="sm" lineHeight="1.6">
            Client history and escrow activity will become richer as bids, acceptance, and payment funding move into the product flow.
          </Text>
          <Button
            type="button"
            variant="plain"
            justifyContent="start"
            alignSelf="start"
            px={0}
            bg="transparent"
            color="fg.muted"
            fontWeight="semibold"
            textUnderlineOffset="3px"
            onClick={handleCopyLink}
            _hover={{
              bg: 'transparent',
              color: 'fg.default',
              textDecoration: 'underline',
            }}
            _active={{
              bg: 'transparent',
              color: 'fg.muted',
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
