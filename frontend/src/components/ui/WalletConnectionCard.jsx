import React from 'react';
import { Badge, Box, Button, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { CheckCircle2, Copy, ExternalLink, Wallet } from 'lucide-react';
import GlassPanel from './GlassPanel.jsx';
import { greenPillButtonStyles, subtlePillButtonStyles } from './buttonStyles.js';

const shortenAddress = (address) => {
  if (!address || address.length < 12) {
    return address || '';
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

/**
 * Shared wallet connection surface for client + freelancer dashboards.
 *
 * @param {'card' | 'compact'} variant
 *   card    — full GlassPanel with copy (client/freelancer sidebars)
 *   compact — header chip + button for tight toolbars
 */
const WalletConnectionCard = ({
  walletAddress,
  connecting = false,
  error = '',
  success = '',
  onConnect,
  variant = 'card',
  roleHint = 'client',
  chainHint = 'Anvil / local chain for MVP escrow',
}) => {
  const connected = Boolean(walletAddress);
  const short = shortenAddress(walletAddress);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!walletAddress) {
      return;
    }
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard may be unavailable in some test/browser contexts.
    }
  };

  const connectLabel = connecting ? 'Connecting…' : connected ? 'Switch wallet' : 'Connect wallet';

  const roleCopy =
    roleHint === 'freelancer'
      ? 'Needed to receive on-chain escrow payouts when a client funds a job.'
      : 'Needed to fund and release on-chain escrow after you hire.';

  if (variant === 'compact') {
    return (
      <HStack
        gap={2}
        flexWrap="wrap"
        align="center"
        justify={{ base: 'stretch', md: 'flex-end' }}
        data-testid="wallet-connection-compact"
      >
        {connected ? (
          <HStack
            gap={2}
            px={3}
            py={1.5}
            borderRadius="full"
            border="1px solid"
            borderColor="rgba(74, 222, 128, 0.35)"
            bg="rgba(20, 83, 45, 0.28)"
            maxW="100%"
          >
            <CheckCircle2 size={15} color="var(--chakra-colors-green-200)" />
            <Text
              color="green.100"
              fontSize="sm"
              fontWeight="semibold"
              fontFamily="mono"
              title={walletAddress}
            >
              {short}
            </Text>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              minW="auto"
              h="auto"
              p={1}
              color="rgba(226, 232, 240, 0.72)"
              aria-label="Copy wallet address"
              onClick={handleCopy}
              _hover={{ bg: 'rgba(255,255,255,0.08)', color: 'white' }}
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            </Button>
          </HStack>
        ) : (
          <Badge
            colorPalette="yellow"
            variant="subtle"
            borderRadius="full"
            px={3}
            py={1}
            fontWeight="semibold"
          >
            Wallet needed for escrow
          </Badge>
        )}
        <Button
          type="button"
          onClick={onConnect}
          disabled={connecting}
          borderRadius="full"
          size="sm"
          {...(connected ? subtlePillButtonStyles : greenPillButtonStyles)}
          flex={{ base: '1 1 auto', sm: '0 0 auto' }}
        >
          <HStack gap={2}>
            {connecting ? <Spinner size="xs" /> : <Wallet size={16} />}
            <span>{connectLabel}</span>
          </HStack>
        </Button>
        {error ? (
          <Text color="red.300" fontSize="sm" w="full" textAlign={{ base: 'left', md: 'right' }}>
            {error}
          </Text>
        ) : null}
        {success && !error ? (
          <Text color="green.300" fontSize="sm" w="full" textAlign={{ base: 'left', md: 'right' }}>
            {success}
          </Text>
        ) : null}
      </HStack>
    );
  }

  return (
    <GlassPanel
      variant="subtle"
      borderRadius="24px"
      p={{ base: 5, md: 6 }}
      data-testid="wallet-connection-card"
    >
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between" align="start" gap={3}>
          <HStack gap={3} align="center" minW="0">
            <Box
              boxSize="42px"
              borderRadius="14px"
              display="grid"
              placeItems="center"
              bg={connected ? 'rgba(34, 197, 94, 0.16)' : 'rgba(34, 211, 238, 0.12)'}
              color={connected ? 'green.200' : 'cyan.200'}
              flexShrink={0}
            >
              <Wallet size={20} />
            </Box>
            <Box minW="0">
              <Text color="white" fontWeight="bold" fontSize="md">
                Wallet
              </Text>
              <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm" mt={0.5}>
                {chainHint}
              </Text>
            </Box>
          </HStack>
          <Badge
            colorPalette={connected ? 'green' : 'yellow'}
            variant="subtle"
            borderRadius="full"
            px={2.5}
            py={0.5}
            flexShrink={0}
          >
            {connected ? 'Connected' : 'Needed'}
          </Badge>
        </HStack>

        <Text color="rgba(226, 232, 240, 0.72)" fontSize="sm" lineHeight="1.6">
          {roleCopy} Use MetaMask on the same network as the escrow contract.
        </Text>

        {connected ? (
          <Box
            border="1px solid"
            borderColor="rgba(74, 222, 128, 0.28)"
            bg="rgba(20, 83, 45, 0.22)"
            borderRadius="16px"
            px={4}
            py={3}
          >
            <HStack justify="space-between" align="center" gap={3}>
              <VStack align="start" gap={0.5} minW="0">
                <Text color="rgba(226, 232, 240, 0.55)" fontSize="xs" fontWeight="semibold">
                  Active address
                </Text>
                <Text
                  color="white"
                  fontFamily="mono"
                  fontSize="sm"
                  fontWeight="semibold"
                  title={walletAddress}
                  css={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  {short}
                </Text>
              </VStack>
              <HStack gap={1}>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  borderRadius="full"
                  color="rgba(226, 232, 240, 0.78)"
                  aria-label="Copy wallet address"
                  onClick={handleCopy}
                  _hover={{ bg: 'rgba(255,255,255,0.08)', color: 'white' }}
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </Button>
              </HStack>
            </HStack>
            {copied ? (
              <Text color="green.200" fontSize="xs" mt={2}>
                Address copied
              </Text>
            ) : null}
          </Box>
        ) : null}

        <Button
          type="button"
          onClick={onConnect}
          disabled={connecting}
          borderRadius="full"
          w="full"
          {...(connected ? subtlePillButtonStyles : greenPillButtonStyles)}
        >
          <HStack gap={2} justify="center">
            {connecting ? <Spinner size="sm" /> : <Wallet size={17} />}
            <span>{connectLabel}</span>
            {!connecting && !connected ? <ExternalLink size={14} opacity={0.75} /> : null}
          </HStack>
        </Button>

        {error ? (
          <Text color="red.300" fontSize="sm" lineHeight="1.5">
            {error}
          </Text>
        ) : null}
        {success && !error ? (
          <Text color="green.300" fontSize="sm" lineHeight="1.5">
            {success}
          </Text>
        ) : null}
      </VStack>
    </GlassPanel>
  );
};

export default WalletConnectionCard;
export { shortenAddress };
