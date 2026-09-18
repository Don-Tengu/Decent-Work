import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Button, Input, Heading, Text, Alert, VStack, Field, RadioGroup, Stack, HStack,
} from '@chakra-ui/react';
import GlassPanel from '../components/ui/GlassPanel';
import PageShell from '../components/ui/PageShell';
import SectionEyebrow from '../components/ui/SectionEyebrow';
import { greenSolidButtonStyles } from '../components/ui/buttonStyles.js';

const pageAccents = [
  {
    top: '-100px',
    right: '-40px',
    w: '320px',
    h: '320px',
    bg: 'rgba(34, 197, 94, 0.14)',
    filter: 'blur(28px)',
  },
  {
    bottom: '-140px',
    left: '-60px',
    w: '360px',
    h: '360px',
    bg: 'rgba(14, 165, 233, 0.12)',
    filter: 'blur(30px)',
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

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'FREELANCER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <PageShell accents={pageAccents}>
      <Box
        display="grid"
        gridTemplateColumns={{ base: '1fr', lg: '0.94fr 1.06fr' }}
        gap={{ base: 8, lg: 10 }}
        alignItems="stretch"
      >
        <GlassPanel
          variant="soft"
          order={{ base: 2, lg: 1 }}
          w="full"
          maxW={{ base: 'full', lg: '500px' }}
        >
          <VStack gap={6} align="stretch">
            <Box>
              <Text color="fg.muted" fontSize="sm" fontWeight="semibold" mb={2}>
                Create account
              </Text>
              <Heading
                as="h1"
                size="2xl"
                color="fg.default"
                letterSpacing="-0.03em"
                mb={2}
              >
                Join the hiring network
              </Heading>
              <Text color="fg.muted" fontSize="md">
                Start as a freelancer or client and keep payments transparent from day one.
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
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    {...inputStyles}
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label color="fg.default" fontWeight="semibold">
                    Username
                  </Field.Label>
                  <Input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    {...inputStyles}
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label color="fg.default" fontWeight="semibold">
                    Password
                  </Field.Label>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    {...inputStyles}
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label color="fg.default" fontWeight="semibold" mb={3}>
                    Choose your side
                  </Field.Label>
                  <RadioGroup.Root
                    name="role"
                    value={formData.role}
                    onValueChange={(details) => setFormData({ ...formData, role: details.value })}
                  >
                    <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
                      <RadioGroup.Item
                        value="FREELANCER"
                        flex={1}
                        p={4}
                        borderRadius="20px"
                        border="1px solid"
                        borderColor={formData.role === 'FREELANCER' ? 'rgba(56, 189, 248, 0.55)' : 'rgba(148, 163, 184, 0.18)'}
                        bg={formData.role === 'FREELANCER' ? 'rgba(8, 47, 73, 0.7)' : 'rgba(255, 255, 255, 0.04)'}
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{
                          borderColor: 'rgba(226, 232, 240, 0.34)',
                          bg: formData.role === 'FREELANCER' ? 'rgba(8, 47, 73, 0.78)' : 'rgba(255, 255, 255, 0.07)',
                          transform: 'translateY(-1px)',
                        }}
                        _focusVisible={{
                          outline: '2px solid rgba(255, 255, 255, 0.7)',
                          outlineOffset: '3px',
                        }}
                      >
                        <RadioGroup.ItemHiddenInput />
                        <VStack align="start" gap={2}>
                          <RadioGroup.ItemControl
                            borderColor="rgba(226, 232, 240, 0.45)"
                            transition="all 0.2s"
                            _hover={{
                              borderColor: 'rgba(255, 255, 255, 0.9)',
                            }}
                            _focusVisible={{
                              boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.18)',
                            }}
                            _checked={{
                              bg: 'white',
                              borderColor: 'white',
                              color: 'gray.900',
                            }}
                          />
                          <RadioGroup.ItemText color="fg.default" fontWeight="semibold">
                            Freelancer
                          </RadioGroup.ItemText>
                          <Text color="fg.subtle" fontSize="sm">
                            Find projects, submit bids, and receive escrow-backed payouts.
                          </Text>
                        </VStack>
                      </RadioGroup.Item>
                      <RadioGroup.Item
                        value="CLIENT"
                        flex={1}
                        p={4}
                        borderRadius="20px"
                        border="1px solid"
                        borderColor={formData.role === 'CLIENT' ? 'rgba(74, 222, 128, 0.55)' : 'rgba(148, 163, 184, 0.18)'}
                        bg={formData.role === 'CLIENT' ? 'rgba(20, 83, 45, 0.55)' : 'rgba(255, 255, 255, 0.04)'}
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{
                          borderColor: 'rgba(226, 232, 240, 0.34)',
                          bg: formData.role === 'CLIENT' ? 'rgba(20, 83, 45, 0.64)' : 'rgba(255, 255, 255, 0.07)',
                          transform: 'translateY(-1px)',
                        }}
                        _focusVisible={{
                          outline: '2px solid rgba(255, 255, 255, 0.7)',
                          outlineOffset: '3px',
                        }}
                      >
                        <RadioGroup.ItemHiddenInput />
                        <VStack align="start" gap={2}>
                          <RadioGroup.ItemControl
                            borderColor="rgba(226, 232, 240, 0.45)"
                            transition="all 0.2s"
                            _hover={{
                              borderColor: 'rgba(255, 255, 255, 0.9)',
                            }}
                            _focusVisible={{
                              boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.18)',
                            }}
                            _checked={{
                              bg: 'white',
                              borderColor: 'white',
                              color: 'gray.900',
                            }}
                          />
                          <RadioGroup.ItemText color="fg.default" fontWeight="semibold">
                            Client
                          </RadioGroup.ItemText>
                          <Text color="fg.subtle" fontSize="sm">
                            Post jobs, compare talent, and release payment when work is approved.
                          </Text>
                        </VStack>
                      </RadioGroup.Item>
                    </Stack>
                  </RadioGroup.Root>
                </Field.Root>

                <Button
                  type="submit"
                  w="full"
                  h="58px"
                  loading={loading}
                  {...greenSolidButtonStyles}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </VStack>
            </form>

            <Box textAlign="center" pt={2}>
              <Text color="fg.muted">
                Already have an account?{' '}
                <Text
                  as={Link}
                  to="/login"
                  color="fg.muted"
                  fontWeight="semibold"
                  _hover={{ color: 'fg.default', textDecoration: 'underline' }}
                >
                  Login here
                </Text>
              </Text>
            </Box>
          </VStack>
        </GlassPanel>

        <GlassPanel
          variant="solid"
          order={{ base: 1, lg: 2 }}
          p={{ base: 8, md: 10, lg: 12 }}
        >
          <VStack align="start" gap={6}>
            <SectionEyebrow label="Decent Work" dotColor="green.300" />

            <VStack align="start" gap={4} maxW="580px">
              <Heading
                size={{ base: '2xl', md: '3xl' }}
                color="fg.default"
                lineHeight="1.02"
                letterSpacing="-0.03em"
              >
                One product.
                <br />
                Two roles.
                <br />
                One shared trust layer.
              </Heading>
              <Text color="fg.muted" fontSize={{ base: 'md', md: 'lg' }}>
                Build an Upwork-style flow where identity, payment custody, and project delivery
                feel simpler and more transparent.
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
              <VStack align="start" gap={4}>
                <Text color="fg.default" fontSize="lg" fontWeight="semibold">
                  What this account unlocks
                </Text>
                <Stack direction={{ base: 'column', md: 'row' }} gap={4} w="full">
                  <Box flex={1} p={4} borderRadius="20px" bg="rgba(255, 255, 255, 0.04)">
                    <Text color="fg.muted" fontWeight="semibold" mb={1}>For clients</Text>
                    <Text color="fg.muted" fontSize="sm">
                      Publish jobs, accept the right bid, and move funds into escrow.
                    </Text>
                  </Box>
                  <Box flex={1} p={4} borderRadius="20px" bg="rgba(255, 255, 255, 0.04)">
                    <Text color="fg.muted" fontWeight="semibold" mb={1}>For freelancers</Text>
                    <Text color="fg.muted" fontSize="sm">
                      Submit proposals, connect a wallet, and get paid with clearer guarantees.
                    </Text>
                  </Box>
                </Stack>
              </VStack>
            </Box>
          </VStack>
        </GlassPanel>
      </Box>
    </PageShell>
  );
};

export default Register;
