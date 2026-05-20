import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Button, Input, Heading, Text, Alert, VStack, Field, HStack,
} from '@chakra-ui/react';
import GlassPanel from '../components/ui/GlassPanel';
import PageShell from '../components/ui/PageShell';
import SectionEyebrow from '../components/ui/SectionEyebrow';

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
  bg: 'rgba(15, 23, 42, 0.5)',
  border: '1px solid',
  borderColor: 'rgba(148, 163, 184, 0.2)',
  color: 'white',
  borderRadius: '18px',
  h: '56px',
  _placeholder: { color: 'rgba(226, 232, 240, 0.38)' },
  _hover: { borderColor: 'rgba(34, 211, 238, 0.42)' },
  _focus: { borderColor: 'cyan.300', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.3)' },
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
            <SectionEyebrow label="DecentWork Marketplace" dotColor="cyan.300" />

            <VStack align="start" gap={4} maxW="560px">
              <Heading
                size={{ base: '2xl', md: '3xl' }}
                color="white"
                lineHeight="1.02"
                letterSpacing="-0.03em"
              >
                Hire fast.
                <br />
                Pay through escrow.
                <br />
                Build with confidence.
              </Heading>
              <Text color="rgba(226, 232, 240, 0.76)" fontSize={{ base: 'md', md: 'lg' }}>
                A Web3-native freelance workflow for clients and builders who want transparent
                milestones, wallet-based identity, and cleaner payouts.
              </Text>
            </VStack>

            <Box
              w="full"
              borderRadius="28px"
              bg="linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(15, 118, 110, 0.2))"
              border="1px solid"
              borderColor="rgba(148, 163, 184, 0.14)"
              p={{ base: 5, md: 6 }}
            >
              <HStack
                justify="space-between"
                align="start"
                gap={4}
                flexDirection={{ base: 'column', md: 'row' }}
              >
                <VStack align="start" gap={1}>
                  <Text color="whiteAlpha.700" fontSize="sm">Escrow protected</Text>
                  <Text color="white" fontSize="2xl" fontWeight="bold">1 transaction flow</Text>
                </VStack>
                <Text color="cyan.200" fontSize="sm" maxW="250px">
                  Sign in to manage jobs, review bids, and move accepted work into payment flow.
                </Text>
              </HStack>
            </Box>
          </VStack>
        </GlassPanel>

        <GlassPanel variant="soft" w="full" maxW={{ base: 'full', lg: '460px' }} justifySelf="end">
          <VStack gap={6} align="stretch">
            <Box>
              <Text color="cyan.200" fontSize="sm" fontWeight="semibold" mb={2}>
                Welcome back
              </Text>
              <Heading
                as="h1"
                size="2xl"
                color="white"
                letterSpacing="-0.03em"
                mb={2}
              >
                Login to your workspace
              </Heading>
              <Text color="rgba(226, 232, 240, 0.72)" fontSize="md">
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
                  <Field.Label color="white" fontWeight="semibold">
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
                  <Field.Label color="white" fontWeight="semibold">
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
                  borderRadius="18px"
                  bgGradient="to-r"
                  gradientFrom="cyan.400"
                  gradientTo="blue.500"
                  color="gray.950"
                  fontWeight="bold"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 18px 34px rgba(14, 165, 233, 0.3)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  loading={loading}
                  transition="all 0.2s"
                >
                  {loading ? 'Logging in...' : 'Enter Dashboard'}
                </Button>
              </VStack>
            </form>

            <Box textAlign="center" pt={2}>
              <Text color="rgba(226, 232, 240, 0.72)">
                New to DecentWork?{' '}
                <Text
                  as={Link}
                  to="/register"
                  color="cyan.200"
                  fontWeight="semibold"
                  _hover={{ color: 'cyan.100', textDecoration: 'underline' }}
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
