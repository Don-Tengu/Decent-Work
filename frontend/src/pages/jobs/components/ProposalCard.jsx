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

// One proposal row in the client-facing proposals list. The freelancer
// identity (avatar + name) and the "View proposal details" button both open
// the slide-out drawer; the contextual Hire / Release action depends on the
// job + payment state.
const ProposalCard = ({ bid, currencyCode = 'USD', jobStatus, payment, onOpenFreelancer, onHire, onRelease }) => {
  const freelancer = bid.freelancer;
  const name = getDisplayName(freelancer);
  const memberSince = formatMemberSince(freelancer?.createdAt);
  const hourlyRate = formatHourlyRate(freelancer?.profile?.hourlyRate, currencyCode);
  const attachmentCount = bid.attachments?.length ?? 0;
  const meta = [formatRole(freelancer?.role), memberSince].filter(Boolean).join(' · ');

  const isAccepted = bid.status === 'ACCEPTED';
  const canHire = jobStatus === 'OPEN' && bid.status === 'PENDING';
  const isEscrowed = isAccepted && payment?.status === 'ESCROWED';
  const isPaid = isAccepted && (payment?.status === 'RELEASED' || jobStatus === 'COMPLETED');
  const paymentNote = isPaid ? 'Paid · completed' : isEscrowed ? 'Funds in escrow' : null;

  const openFreelancer = () => onOpenFreelancer?.(bid);

  return (
    <GlassPanel variant="subtle" borderRadius="22px" p={{ base: 5, md: 6 }}>
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
                WebkitLineClamp: 3,
                overflow: 'hidden',
              }}
            >
              {bid.proposal}
            </Text>
          </Box>

          <SkillTags skills={freelancer?.profile?.skills} max={6} />

          <HStack gap={3} flexWrap="wrap" pt={1} align="center">
            {canHire ? (
              <Button type="button" onClick={() => onHire?.(bid)} px={5} {...greenSolidButtonStyles}>
                Hire
              </Button>
            ) : null}
            {isEscrowed ? (
              <Button type="button" onClick={() => onRelease?.(bid)} px={5} {...greenSolidButtonStyles}>
                Release payment
              </Button>
            ) : null}
            <Button type="button" onClick={openFreelancer} size="sm" px={4} {...subtlePillButtonStyles}>
              View proposal details
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
          <BidStatusBadge status={bid.status} />
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
