import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Button, Input, Heading, Text, Alert, VStack, Field, HStack,
} from '@chakra-ui/react';
import GlassPanel from '../components/ui/GlassPanel';
import PageShell from '../components/ui/PageShell';
import SectionEyebrow from '../components/ui/SectionEyebrow';
import { greenSolidButtonStyles } from '../components/ui/buttonStyles.js';

const pageAccents = [
  {
    top: '-120px',
    left: '-90px',
    w: '260px',
    h: '260px',
    bg: 'rgba(34, 211, 238, 0.16)',
    filter: 'blur(24px)',
  },
  {
    bottom: '-100px',
    right: '-60px',
    w: '320px',
    h: '320px',
    bg: 'rgba(79, 70, 229, 0.18)',
    filter: 'blur(28px)',
  },
];

const inputStyles = {
  bg: 'bg.muted',
  border: '1px solid',
  borderColor: 'border.default',
  color: 'fg.default',
  borderRadius: '12px',
  h: '56px',
  _placeholder: { color: 'fg.subtle' },
  _hover: { borderColor: 'ink.600' },
  _focus: { borderColor: 'ink.900', boxShadow: '0 0 0 1px #141413' },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell accents={pageAccents}>
      <Box
        display="grid"
        gridTemplateColumns={{ base: '1fr', lg: '1.08fr 0.92fr' }}
        gap={{ base: 8, lg: 10 }}
        alignItems="stretch"
      >
        <GlassPanel variant="solid" p={{ base: 8, md: 10, lg: 12 }}>
          <VStack align="start" gap={6}>
            <SectionEyebrow label="DecentWork Marketplace" dotColor="ink.900" />

            <VStack align="start" gap={4} maxW="560px">
              <Heading
                size={{ base: '2xl', md: '3xl' }}
                color="fg.default"
                lineHeight="1.02"
                letterSpacing="-0.03em"
              >
                Hire fast.
                <br />
                Pay through escrow.
                <br />
                Build with confidence.
              </Heading>
              <Text color="fg.muted" fontSize={{ base: 'md', md: 'lg' }}>
                A Web3-native freelance workflow for clients and builders who want transparent
                milestones, wallet-based identity, and cleaner payouts.
              </Text>
            </VStack>

            <Box
              w="full"
              borderRadius="28px"
              bg="bg.canvas"
              border="1px solid"
              borderColor="border.default"
              p={{ base: 5, md: 6 }}
            >
              <HStack
                justify="space-between"
                align="start"
                gap={4}
                flexDirection={{ base: 'column', md: 'row' }}
              >
                <VStack align="start" gap={1}>
                  <Text color="fg.muted" fontSize="sm">Escrow protected</Text>
                  <Text color="fg.default" fontSize="2xl" fontWeight="bold">1 transaction flow</Text>
                </VStack>
                <Text color="fg.muted" fontSize="sm" maxW="250px">
                  Sign in to manage jobs, review bids, and move accepted work into payment flow.
                </Text>
              </HStack>
            </Box>
          </VStack>
        </GlassPanel>

        <GlassPanel variant="soft" w="full" maxW={{ base: 'full', lg: '460px' }} justifySelf="end">
          <VStack gap={6} align="stretch">
            <Box>
              <Text color="fg.muted" fontSize="sm" fontWeight="semibold" mb={2}>
                Welcome back
              </Text>
              <Heading
                as="h1"
                size="2xl"
                color="fg.default"
                letterSpacing="-0.03em"
                mb={2}
              >
                Login to your workspace
              </Heading>
              <Text color="fg.muted" fontSize="md">
                Access jobs, bids, and wallet-connected payment activity.
              </Text>
            </Box>

            {error && (
              <Alert.Root status="error" borderRadius="xl" bg="rgba(127, 29, 29, 0.45)" border="1px solid rgba(252, 165, 165, 0.32)">
                <Alert.Indicator />
                <Alert.Title>{error}</Alert.Title>
              </Alert.Root>
            )}

            <form onSubmit={handleSubmit}>
              <VStack gap={5}>
                <Field.Root required>
                  <Field.Label color="fg.default" fontWeight="semibold">
                    Email Address
                  </Field.Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    {...inputStyles}
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label color="fg.default" fontWeight="semibold">
                    Password
                  </Field.Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    {...inputStyles}
                  />
                </Field.Root>

                <Button
                  type="submit"
                  w="full"
                  h="58px"
                  loading={loading}
                  {...greenSolidButtonStyles}
                >
                  {loading ? 'Logging in...' : 'Enter Dashboard'}
                </Button>
              </VStack>
            </form>

            <Box textAlign="center" pt={2}>
              <Text color="fg.muted">
                New to DecentWork?{' '}
                <Text
                  as={Link}
                  to="/register"
                  color="fg.muted"
                  fontWeight="semibold"
                  _hover={{ color: 'fg.default', textDecoration: 'underline' }}
                >
                  Create an account
                </Text>
              </Text>
            </Box>
          </VStack>
        </GlassPanel>
      </Box>
    </PageShell>
  );
};

export default Login;
