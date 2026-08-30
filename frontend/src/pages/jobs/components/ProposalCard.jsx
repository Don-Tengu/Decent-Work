import React from 'react';
import { Badge, Box, Button, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { Clock, Paperclip } from 'lucide-react';
import UserAvatar from '../../../components/ui/UserAvatar.jsx';
import SkillTags from '../../../components/ui/SkillTags.jsx';
import FieldLabel from '../../../components/ui/FieldLabel.jsx';
import GlassPanel from '../../../components/ui/GlassPanel.jsx';
import BidStatusBadge from '../../../components/ui/BidStatusBadge.jsx';
import { greenSolidButtonStyles, subtlePillButtonStyles } from '../../../components/ui/buttonStyles.js';
import { formatCurrency, formatDeliveryTime } from '../utils.jsx';
import { formatHourlyRate, formatMemberSince, formatRole, getDisplayName } from '@/utils/user.js';
import { getPaymentActionFlags } from '../paymentActions.js';

// One proposal row in the client-facing proposals list. The freelancer
// identity (avatar + name) and the "View proposal details" button both open
// the slide-out drawer; Offer / Withdraw / Fund / Release depend on state.
const ProposalCard = ({
  bid,
  currencyCode = 'USD',
  jobStatus,
  payment,
  hasOutstandingOffer = false,
  emphasis = false,
  subdued = false,
  onOpenFreelancer,
  onOffer,
  onWithdrawOffer,
  onFund,
  onRelease,
  onRequestChanges,
}) => {
  const freelancer = bid.freelancer;
  const name = getDisplayName(freelancer);
  const memberSince = formatMemberSince(freelancer?.createdAt);
  const hourlyRate = formatHourlyRate(freelancer?.profile?.hourlyRate, currencyCode);
  const attachmentCount = bid.attachments?.length ?? 0;
  const meta = [formatRole(freelancer?.role), memberSince].filter(Boolean).join(' · ');

  const isAccepted = bid.status === 'ACCEPTED';
  const { canOffer, canWithdrawOffer, canFund, canRelease, canRequestChanges, releaseLabel, paymentNote } =
    getPaymentActionFlags({
      bid,
      jobStatus,
      payment,
      hasOutstandingOffer,
    });

  // After hire, non-winners should read as not selected even if the row was
  // never flipped to REJECTED (older hires before competing-bid reject).
  const displayStatus =
    bid.status === 'PENDING' && (jobStatus === 'IN_PROGRESS' || jobStatus === 'COMPLETED')
      ? 'REJECTED'
      : bid.status;

  const openFreelancer = () => onOpenFreelancer?.(bid);

  return (
    <GlassPanel
      variant="subtle"
      borderRadius="22px"
      p={{ base: 5, md: 6 }}
      opacity={subdued ? 0.78 : 1}
      borderColor={
        emphasis
          ? 'rgba(34, 211, 238, 0.35)'
          : subdued
            ? 'rgba(148, 163, 184, 0.12)'
            : undefined
      }
      boxShadow={emphasis ? '0 18px 48px rgba(6, 182, 212, 0.12)' : undefined}
    >
      <Grid
        templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 200px' }}
        gap={{ base: 5, lg: 8 }}
        alignItems="start"
      >
        <VStack align="stretch" gap={4} minW="0">
          <HStack
            as="button"
            type="button"
            onClick={openFreelancer}
            gap={4}
            align="center"
            textAlign="left"
            w="fit-content"
            maxW="full"
            mx={-2}
            px={2}
            py={2}
            borderRadius="16px"
            cursor="pointer"
            transition="background 0.18s ease"
            _hover={{ bg: 'rgba(125, 211, 252, 0.08)' }}
            _focusVisible={{ outline: '2px solid', outlineColor: 'cyan.300', outlineOffset: '2px' }}
          >
            <UserAvatar user={freelancer} size="lg" flex="0 0 auto" />
            <Box minW="0">
              <Text color="white" fontWeight="bold" fontSize="lg" lineHeight="1.25">
                {name}
              </Text>
              {meta ? (
                <Text color="rgba(226, 232, 240, 0.56)" fontSize="sm">
                  {meta}
                </Text>
              ) : null}
            </Box>
          </HStack>

          <Box>
            <FieldLabel mb={1.5}>Proposal</FieldLabel>
            <Text
              color="rgba(226, 232, 240, 0.78)"
              lineHeight="1.7"
              overflowWrap="anywhere"
              css={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: subdued ? 2 : 3,
                overflow: 'hidden',
              }}
            >
              {bid.proposal}
            </Text>
          </Box>

          {!subdued ? <SkillTags skills={freelancer?.profile?.skills} max={6} /> : null}

          <HStack gap={3} flexWrap="wrap" pt={1} align="center">
            {canOffer ? (
              <Button type="button" onClick={() => onOffer?.(bid)} px={5} {...greenSolidButtonStyles}>
                Offer
              </Button>
            ) : null}
            {canWithdrawOffer ? (
              <Button type="button" onClick={() => onWithdrawOffer?.(bid)} px={5} {...subtlePillButtonStyles}>
                Withdraw offer
              </Button>
            ) : null}
            {canFund ? (
              <Button type="button" onClick={() => onFund?.(bid)} px={5} {...greenSolidButtonStyles}>
                Fund escrow
              </Button>
            ) : null}
            {canRelease ? (
              <Button type="button" onClick={() => onRelease?.(bid)} px={5} {...greenSolidButtonStyles}>
                {releaseLabel}
              </Button>
            ) : null}
            {canRequestChanges ? (
              <Button type="button" onClick={() => onRequestChanges?.(bid)} px={5} {...subtlePillButtonStyles}>
                Request changes
              </Button>
            ) : null}
            <Button type="button" onClick={openFreelancer} size="sm" px={4} {...subtlePillButtonStyles}>
              {isAccepted ? 'View contract details' : 'View proposal details'}
            </Button>
            {attachmentCount > 0 ? (
              <HStack gap={1.5} color="rgba(226, 232, 240, 0.56)" fontSize="sm">
                <Paperclip size={14} />
                <Text>
                  {attachmentCount} {attachmentCount === 1 ? 'attachment' : 'attachments'}
                </Text>
              </HStack>
            ) : null}
          </HStack>
        </VStack>

        <VStack align={{ base: 'start', lg: 'end' }} gap={3} minW="0">
          <Badge colorPalette="green" borderRadius="full" px={3} py={1} fontSize="md">
            {formatCurrency(bid.amount, currencyCode) || `${bid.amount}`}
          </Badge>
          <HStack gap={1.5} color="rgba(226, 232, 240, 0.6)" fontSize="sm">
            <Clock size={14} />
            <Text>{formatDeliveryTime(bid.deliveryTime)}</Text>
          </HStack>
          {hourlyRate ? (
            <Text color="rgba(226, 232, 240, 0.6)" fontSize="sm">
              {hourlyRate}
            </Text>
          ) : null}
          <BidStatusBadge status={displayStatus} />
          {paymentNote ? (
            <Text color="rgba(134, 239, 172, 0.9)" fontSize="sm" fontWeight="medium">
              {paymentNote}
            </Text>
          ) : null}
        </VStack>
      </Grid>
    </GlassPanel>
  );
};

export default ProposalCard;
