import React from 'react';
import { Link } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Drawer,
  HStack,
  IconButton,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ArrowUpRight, CalendarDays, Clock, Coins, Wallet, X } from 'lucide-react';
import UserAvatar from '../../../components/ui/UserAvatar.jsx';
import SkillTags from '../../../components/ui/SkillTags.jsx';
import AttachmentDownloadList from '../../../components/ui/AttachmentDownloadList.jsx';
import IconStat from '../../../components/ui/IconStat.jsx';
import FieldLabel from '../../../components/ui/FieldLabel.jsx';
import BidStatusBadge from '../../../components/ui/BidStatusBadge.jsx';
import { greenSolidButtonStyles, subtlePillButtonStyles } from '../../../components/ui/buttonStyles.js';
import { formatCurrency, formatDeliveryTime } from '../utils.jsx';
import {
  formatHourlyRate,
  formatMemberSince,
  formatRole,
  getDisplayName,
  shortenAddress,
} from '@/utils/user.js';

const drawerContentStyles = {
  bg: 'rgba(8, 13, 25, 0.98)',
  color: 'white',
  borderLeft: '1px solid',
  borderColor: 'rgba(148, 163, 184, 0.2)',
  boxShadow: '0 28px 80px rgba(0, 0, 0, 0.48)',
};

const Section = ({ label, children }) => (
  <Box>
    <FieldLabel mb={2}>{label}</FieldLabel>
    {children}
  </Box>
);

// Right-side slide-out summarizing a single proposal's freelancer: identity
// snapshot, the cover letter / experience, skills, and attachments, with a
// link out to the full profile page.
const FreelancerDrawer = ({ bid, currencyCode = 'USD', jobStatus, payment, onClose, onHire, onRelease }) => {
  const freelancer = bid?.freelancer;
  const name = getDisplayName(freelancer);
  const memberSince = formatMemberSince(freelancer?.createdAt);
  const hourlyRate = formatHourlyRate(freelancer?.profile?.hourlyRate, currencyCode);
  const wallet = shortenAddress(freelancer?.walletAddress);
  const bio = freelancer?.profile?.bio?.trim();
  const amount = formatCurrency(bid?.amount, currencyCode);
  const isAccepted = bid?.status === 'ACCEPTED';
  const canHire = jobStatus === 'OPEN' && bid?.status === 'PENDING';
  const isEscrowed = isAccepted && payment?.status === 'ESCROWED';
  const isPaid = isAccepted && (payment?.status === 'RELEASED' || jobStatus === 'COMPLETED');
  const paymentNote = isPaid ? 'Paid · completed' : isEscrowed ? 'Funds in escrow' : null;

  return (
    <Drawer.Root
      open={!!bid}
      onOpenChange={({ open }) => {
        if (!open) {
          onClose();
        }
      }}
      placement="end"
      size={{ base: 'full', md: 'md' }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Drawer.Backdrop bg="rgba(2, 6, 23, 0.78)" backdropFilter="blur(8px)" />
        <Drawer.Positioner>
          <Drawer.Content {...drawerContentStyles}>
            <Drawer.CloseTrigger asChild>
              <IconButton
                aria-label="Close freelancer details"
                type="button"
                variant="ghost"
                position="absolute"
                top={4}
                right={4}
                zIndex={1}
                borderRadius="full"
                minW="40px"
                w="40px"
                h="40px"
                color="rgba(226, 232, 240, 0.76)"
                _hover={{ bg: 'rgba(255, 255, 255, 0.08)', color: 'white' }}
              >
                <X size={22} />
              </IconButton>
            </Drawer.CloseTrigger>

            <Drawer.Header
              borderBottom="1px solid"
              borderColor="rgba(148, 163, 184, 0.12)"
              px={{ base: 5, md: 6 }}
              py={5}
            >
              <HStack gap={4} align="center" pr={10}>
                <UserAvatar user={freelancer} size="xl" flex="0 0 auto" />
                <Box minW="0">
                  <Drawer.Title fontSize="xl" fontWeight="bold" color="white" lineHeight="1.2">
                    {name}
                  </Drawer.Title>
                  <Text color="rgba(226, 232, 240, 0.56)" fontSize="sm">
                    {formatRole(freelancer?.role)}
                  </Text>
                </Box>
              </HStack>
            </Drawer.Header>

            <Drawer.Body px={{ base: 5, md: 6 }} py={5}>
              <VStack align="stretch" gap={6}>
                <VStack align="stretch" gap={2.5}>
                  {memberSince ? <IconStat icon={CalendarDays} size={15}>{memberSince}</IconStat> : null}
                  {hourlyRate ? <IconStat icon={Coins} size={15}>{hourlyRate}</IconStat> : null}
                  {wallet ? <IconStat icon={Wallet} size={15}>{wallet}</IconStat> : null}
                </VStack>

                <HStack gap={3} flexWrap="wrap" align="center">
                  {amount ? (
                    <Badge colorPalette="green" borderRadius="full" px={3} py={1} fontSize="md">
                      {amount}
                    </Badge>
                  ) : null}
                  <HStack gap={1.5} color="rgba(226, 232, 240, 0.6)" fontSize="sm">
                    <Clock size={14} />
                    <Text>{formatDeliveryTime(bid?.deliveryTime)}</Text>
                  </HStack>
                  <BidStatusBadge status={bid?.status} />
                  {paymentNote ? (
                    <Text color="rgba(134, 239, 172, 0.9)" fontSize="sm" fontWeight="medium">
                      {paymentNote}
                    </Text>
                  ) : null}
                </HStack>

                {bio ? (
                  <Section label="Overview">
                    <Text color="rgba(226, 232, 240, 0.78)" lineHeight="1.7" whiteSpace="pre-line" overflowWrap="anywhere">
                      {bio}
                    </Text>
                  </Section>
                ) : null}

                <Section label="Cover letter">
                  <Text color="rgba(226, 232, 240, 0.82)" lineHeight="1.8" whiteSpace="pre-line" overflowWrap="anywhere">
                    {bid?.proposal}
                  </Text>
                </Section>

                {bid?.relevantExperience ? (
                  <Section label="Recent experience">
                    <Text color="rgba(226, 232, 240, 0.78)" lineHeight="1.8" whiteSpace="pre-line" overflowWrap="anywhere">
                      {bid.relevantExperience}
                    </Text>
                  </Section>
                ) : null}

                {freelancer?.profile?.skills?.length ? (
                  <Section label="Skills">
                    <SkillTags skills={freelancer.profile.skills} />
                  </Section>
                ) : null}

                {bid?.attachments?.length ? (
                  <Section label="Attachments">
                    <AttachmentDownloadList attachments={bid.attachments} />
                  </Section>
                ) : null}
              </VStack>
            </Drawer.Body>

            {bid ? (
              <Drawer.Footer
                borderTop="1px solid"
                borderColor="rgba(148, 163, 184, 0.12)"
                px={{ base: 5, md: 6 }}
                py={4}
                flexDirection="column"
                gap={3}
              >
                {canHire ? (
                  <Button type="button" onClick={() => onHire?.(bid)} w="full" {...greenSolidButtonStyles}>
                    Hire {name}
                  </Button>
                ) : null}
                {isEscrowed ? (
                  <Button type="button" onClick={() => onRelease?.(bid)} w="full" {...greenSolidButtonStyles}>
                    Release payment
                  </Button>
                ) : null}
                {freelancer?.id ? (
                  <Button as={Link} to={`/freelancers/${freelancer.id}`} w="full" {...subtlePillButtonStyles}>
                    <ArrowUpRight size={16} />
                    View full profile
                  </Button>
                ) : null}
              </Drawer.Footer>
            ) : null}
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};

export default FreelancerDrawer;
