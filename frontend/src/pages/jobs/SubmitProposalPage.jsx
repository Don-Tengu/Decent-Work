import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Box, Button, Field, Grid, HStack, Heading, Input, Text, Textarea, VStack } from '@chakra-ui/react';
import { ArrowLeft, CheckCircle2, ExternalLink, Info, SendHorizontal } from 'lucide-react';
import { GET_JOB, GET_MY_BID_FOR_JOB, GET_MY_BIDS, PLACE_BID } from '@/graphql/queries.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { quietPillButtonStyles, subtlePillButtonStyles } from '../../components/ui/buttonStyles.js';
import { inputStyles } from '../post-job/styles.js';
import PageShell from '../../components/ui/PageShell.jsx';
import GlassPanel from '../../components/ui/GlassPanel.jsx';
import JobDetailHeader from './components/JobDetailHeader.jsx';
import JobsPageState from './components/JobsPageState.jsx';
import ProposalAttachments from './components/ProposalAttachments.jsx';
import { EXPERIENCE_LABELS, SCOPE_SIZE_LABELS } from './constants.js';
import { formatBudgetLabel, formatDuration, getJobTags } from './utils.jsx';
import { uploadBidAttachments } from './bidAttachments.js';
import {
  MAX_PROPOSAL_ATTACHMENTS,
  MAX_PROPOSAL_ATTACHMENT_BYTES,
  MAX_PROPOSAL_LENGTH,
  MAX_RELEVANT_EXPERIENCE_LENGTH,
  getAmountLabel,
  getAttachmentDraftId,
  getInitialAmount,
  validateProposalForm,
} from './proposalForm.js';

const DESCRIPTION_CLAMP_THRESHOLD = 280;

const pageAccents = [
  {
    top: '-140px',
    left: '-120px',
    w: '360px',
    h: '360px',
    bg: 'rgba(6, 182, 212, 0.12)',
    filter: 'blur(34px)',
  },
  {
    top: '220px',
    right: '-120px',
    w: '340px',
    h: '340px',
    bg: 'rgba(16, 185, 129, 0.12)',
    filter: 'blur(32px)',
  },
];

const fieldInputStyles = (hasError) => ({
  ...inputStyles,
  borderColor: hasError ? 'red.400' : inputStyles.borderColor,
  _hover: { borderColor: hasError ? 'red.400' : inputStyles._hover.borderColor },
  _focus: {
    borderColor: hasError ? 'red.400' : inputStyles._focus.borderColor,
    boxShadow: hasError ? '0 0 0 1px rgba(248, 113, 113, 0.5)' : inputStyles._focus.boxShadow,
  },
});

const JobMetaRow = ({ label, value }) => (
  <HStack
    justify="space-between"
    align="start"
    gap={4}
    py={3}
    borderBottom="1px solid"
    borderColor="rgba(148, 163, 184, 0.12)"
    _last={{ borderBottom: 'none' }}
  >
    <Text color="rgba(226, 232, 240, 0.5)" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.04em">
      {label}
    </Text>
    <Text color="white" fontWeight="semibold" fontSize="sm" textAlign="right">
      {value}
    </Text>
  </HStack>
);

const SubmitProposalPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFreelancer = user?.role === 'FREELANCER';
  const jobHref = `/jobs/${jobId}`;

  const { data, loading, error } = useQuery(GET_JOB, {
    variables: { id: jobId },
    skip: !jobId,
    fetchPolicy: 'cache-and-network',
  });
  const { data: myBidData, loading: loadingMyBid } = useQuery(GET_MY_BID_FOR_JOB, {
    variables: { jobId },
    skip: !jobId || !isFreelancer,
    fetchPolicy: 'cache-and-network',
  });
  const [placeBid] = useMutation(PLACE_BID);

  const job = data?.job ?? null;
  const myBid = myBidData?.myBidForJob ?? null;

  const initialAmount = React.useMemo(() => getInitialAmount(job), [job]);
  const [form, setForm] = React.useState({ amount: '', deliveryTime: '', proposal: '', relevantExperience: '' });
  const [errors, setErrors] = React.useState({});
  const [descExpanded, setDescExpanded] = React.useState(false);
  const [attachments, setAttachments] = React.useState([]);
  const [attachmentError, setAttachmentError] = React.useState('');
  const [serverError, setServerError] = React.useState('');
  const [uploadWarning, setUploadWarning] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitStarted, setSubmitStarted] = React.useState(false);

  React.useEffect(() => {
    setForm((current) => (current.amount ? current : { ...current, amount: initialAmount }));
  }, [initialAmount]);

  const guardFailed =
    !isFreelancer || (job && job.status !== 'OPEN') || Boolean(myBid);
  const willRedirect = !loading && !loadingMyBid && !submitStarted && guardFailed;

  React.useEffect(() => {
    if (loading || loadingMyBid || submitStarted) {
      return;
    }
    if (guardFailed) {
      navigate(jobHref, { replace: true });
    }
  }, [loading, loadingMyBid, submitStarted, guardFailed, jobHref, navigate]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setServerError('');
  };

  const handleAttachmentsAdd = (files) => {
    if (!files.length) {
      return;
    }

    const accepted = [];
    let nextError = '';

    for (const file of files) {
      if (attachments.length + accepted.length >= MAX_PROPOSAL_ATTACHMENTS) {
        nextError = `You can attach up to ${MAX_PROPOSAL_ATTACHMENTS} files.`;
        break;
      }
      if (file.size > MAX_PROPOSAL_ATTACHMENT_BYTES) {
        nextError = 'Each file must be 100MB or smaller.';
        continue;
      }
      accepted.push({ id: getAttachmentDraftId(file), file });
    }

    if (accepted.length) {
      setAttachments((current) => [...current, ...accepted]);
    }
    setAttachmentError(nextError);
  };

  const handleAttachmentRemove = (id) => {
    setAttachments((current) => current.filter((item) => item.id !== id));
    setAttachmentError('');
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (!job || submitting) {
      return;
    }

    const nextErrors = validateProposalForm(form);
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    setServerError('');
    setSubmitStarted(true);
    setSubmitting(true);

    let bidId = null;
    try {
      const { data: result } = await placeBid({
        variables: {
          input: {
            jobId: job.id,
            amount: Number(form.amount.trim()),
            deliveryTime: Number.parseInt(form.deliveryTime.trim(), 10),
            proposal: form.proposal.trim(),
            relevantExperience: form.relevantExperience.trim() || null,
          },
        },
        refetchQueries: [
          { query: GET_MY_BID_FOR_JOB, variables: { jobId: job.id } },
          { query: GET_JOB, variables: { id: job.id } },
          { query: GET_MY_BIDS },
        ],
        awaitRefetchQueries: true,
      });
      bidId = result?.placeBid?.id ?? null;
    } catch (submitError) {
      setServerError(submitError.message || 'Unable to submit proposal.');
      setSubmitting(false);
      setSubmitStarted(false);
      return;
    }

    if (bidId && attachments.length) {
      try {
        await uploadBidAttachments(bidId, attachments);
      } catch (uploadError) {
        setSubmitting(false);
        setUploadWarning(
          uploadError.message
            ? `Proposal submitted, but some attachments failed to upload: ${uploadError.message}`
            : 'Proposal submitted, but some attachments failed to upload.'
        );
        return;
      }
    }

    navigate(jobHref, { replace: true });
  };

  const proposalLength = form.proposal.trim().length;
  const relevantExperienceLength = form.relevantExperience.trim().length;
  const tags = job ? getJobTags(job) : [];
  const showDescriptionToggle = (job?.description?.length ?? 0) > DESCRIPTION_CLAMP_THRESHOLD;

  if (loading || loadingMyBid) {
    return (
      <PageShell accents={pageAccents} maxW="1280px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }}>
        <JobsPageState
          title="Loading proposal form"
          description="We are pulling together the job scope and your proposal readiness."
        />
      </PageShell>
    );
  }

  if (willRedirect) {
    return (
      <PageShell accents={pageAccents} maxW="1280px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }}>
        <JobsPageState
          title="Returning to the job"
          description="This proposal form is not available right now. Taking you back to the job page."
        />
      </PageShell>
    );
  }

  if (error || !job) {
    return (
      <PageShell accents={pageAccents} maxW="1280px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }}>
        <VStack align="stretch" gap={5}>
          <Button as={Link} to={jobHref} alignSelf="start" px={3} {...quietPillButtonStyles}>
            <ArrowLeft size={18} />
            Back to job
          </Button>
          <JobsPageState
            title="Unable to load job"
            description={error?.message || 'This opportunity may have been removed or is no longer available.'}
            tone="error"
          />
        </VStack>
      </PageShell>
    );
  }

  if (uploadWarning) {
    return (
      <PageShell accents={pageAccents} maxW="1280px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }}>
        <GlassPanel variant="solid" borderRadius="24px" p={{ base: 6, md: 8 }}>
          <VStack align="stretch" gap={5}>
            <HStack gap={3} color="green.200">
              <CheckCircle2 size={22} />
              <Heading as="h1" size="lg" color="white" letterSpacing="0">
                Proposal submitted
              </Heading>
            </HStack>
            <Text color="orange.200" fontSize="sm" lineHeight="1.7" role="alert">
              {uploadWarning}
            </Text>
            <Text color="rgba(226, 232, 240, 0.7)" fontSize="sm" lineHeight="1.7">
              Your proposal is in review with the client. You can reach out to them to re-share any files
              that did not upload.
            </Text>
            <HStack gap={3} flexWrap="wrap">
              <Button as={Link} to={jobHref} {...subtlePillButtonStyles} px={6}>
                Back to job
              </Button>
              <Button as={Link} to="/my-bids" {...quietPillButtonStyles} px={6}>
                View my proposals
              </Button>
            </HStack>
          </VStack>
        </GlassPanel>
      </PageShell>
    );
  }

  return (
    <PageShell accents={pageAccents} maxW="1280px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }} pb={{ base: '150px', md: '132px' }}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Button as={Link} to={jobHref} alignSelf="start" px={3} mb={4} {...quietPillButtonStyles}>
            <ArrowLeft size={18} />
            Back to job
          </Button>
          <Heading as="h1" size={{ base: '2xl', md: '3xl' }} color="white" letterSpacing="0">
            Submit a proposal
          </Heading>
        </Box>

        <GlassPanel variant="solid" borderRadius="24px" p={{ base: 5, md: 7 }}>
          <JobDetailHeader job={job} />
          <Grid
            templateColumns={{ base: '1fr', lg: 'minmax(0, 1.7fr) minmax(0, 1fr)' }}
            gap={{ base: 6, lg: 8 }}
            pt={6}
          >
            <VStack align="stretch" gap={3}>
              <Text
                color="rgba(226, 232, 240, 0.78)"
                lineHeight="1.85"
                whiteSpace="pre-line"
                lineClamp={descExpanded ? undefined : 4}
              >
                {job.description}
              </Text>
              <HStack gap={5} flexWrap="wrap">
                {showDescriptionToggle ? (
                  <Box
                    as="button"
                    type="button"
                    onClick={() => setDescExpanded((current) => !current)}
                    color="rgba(125, 211, 252, 0.95)"
                    fontSize="sm"
                    fontWeight="semibold"
                    _hover={{ color: 'white' }}
                  >
                    {descExpanded ? 'Show less' : 'Show more'}
                  </Box>
                ) : null}
                <HStack
                  as={Link}
                  to={jobHref}
                  gap={1.5}
                  color="rgba(125, 211, 252, 0.95)"
                  fontSize="sm"
                  fontWeight="semibold"
                  _hover={{ color: 'white' }}
                >
                  <ExternalLink size={15} />
                  <Text>View job posting</Text>
                </HStack>
              </HStack>
            </VStack>

            <Box
              bg="rgba(15, 23, 42, 0.42)"
              border="1px solid"
              borderColor="rgba(148, 163, 184, 0.14)"
              borderRadius="16px"
              px={4}
              py={1}
              h="fit-content"
            >
              <JobMetaRow label="Experience level" value={EXPERIENCE_LABELS[job.experienceLevel] ?? 'Flexible'} />
              <JobMetaRow label="Budget" value={formatBudgetLabel(job)} />
              <JobMetaRow label="Engagement" value={formatDuration(job.scopeDurationAmount, job.scopeDurationUnit)} />
              <JobMetaRow label="Project scope" value={SCOPE_SIZE_LABELS[job.scopeSize] ?? 'Flexible'} />
            </Box>
          </Grid>

          {tags.length ? (
            <Box pt={6}>
              <Text color="white" fontWeight="semibold" mb={3}>
                Skills and expertise
              </Text>
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
            </Box>
          ) : null}
        </GlassPanel>

        <GlassPanel variant="solid" borderRadius="24px" p={{ base: 5, md: 7 }}>
          <VStack align="stretch" gap={5}>
            <Box>
              <Heading as="h2" size="md" color="white" letterSpacing="0">
                Terms
              </Heading>
              <Text color="rgba(226, 232, 240, 0.62)" fontSize="sm" mt={1}>
                What is the rate you{'’'}d like to bid for this job?
              </Text>
            </Box>

            <HStack
              justify="space-between"
              align="center"
              gap={4}
              flexWrap="wrap"
              px={4}
              py={3}
              bg="rgba(15, 23, 42, 0.42)"
              border="1px solid"
              borderColor="rgba(148, 163, 184, 0.14)"
              borderRadius="14px"
            >
              <Text color="rgba(226, 232, 240, 0.6)" fontSize="sm">
                Client{'’'}s budget
              </Text>
              <Text color="white" fontWeight="bold">
                {formatBudgetLabel(job)}
              </Text>
            </HStack>

            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5}>
              <Field.Root invalid={Boolean(errors.amount)} required>
                <Field.Label color="white" fontWeight="semibold">
                  {getAmountLabel(job)}
                </Field.Label>
                <Input
                  value={form.amount}
                  onChange={handleChange('amount')}
                  inputMode="decimal"
                  placeholder="1200"
                  disabled={submitting}
                  {...fieldInputStyles(Boolean(errors.amount))}
                />
                {errors.amount ? (
                  <Field.ErrorText color="red.300">{errors.amount}</Field.ErrorText>
                ) : (
                  <Field.HelperText color="rgba(226, 232, 240, 0.5)">
                    Total amount the client will see on your proposal
                  </Field.HelperText>
                )}
              </Field.Root>

              <Field.Root invalid={Boolean(errors.deliveryTime)} required>
                <Field.Label color="white" fontWeight="semibold">
                  Delivery time in days
                </Field.Label>
                <Input
                  value={form.deliveryTime}
                  onChange={handleChange('deliveryTime')}
                  inputMode="numeric"
                  placeholder="14"
                  disabled={submitting}
                  {...fieldInputStyles(Boolean(errors.deliveryTime))}
                />
                {errors.deliveryTime ? (
                  <Field.ErrorText color="red.300">{errors.deliveryTime}</Field.ErrorText>
                ) : null}
              </Field.Root>
            </Grid>

            <HStack gap={2} align="center" color="rgba(134, 239, 172, 0.92)" fontSize="sm">
              <CheckCircle2 size={16} />
              <Text>0% platform fee during the MVP — you keep 100%.</Text>
            </HStack>
          </VStack>
        </GlassPanel>

        <GlassPanel variant="solid" borderRadius="24px" p={{ base: 5, md: 7 }}>
          <VStack align="stretch" gap={5}>
            <HStack justify="space-between" align="start" gap={4} flexWrap="wrap">
              <Box>
                <Heading as="h2" size="md" color="white" letterSpacing="0">
                  Cover Letter
                </Heading>
                <Text color="rgba(226, 232, 240, 0.62)" fontSize="sm" mt={1}>
                  Tell the client why you are the right fit.
                </Text>
              </Box>
            </HStack>

            <Field.Root invalid={Boolean(errors.proposal)} required>
              <Field.Label color="white" fontWeight="semibold">
                Cover letter
              </Field.Label>
              <Textarea
                value={form.proposal}
                onChange={handleChange('proposal')}
                placeholder="Share your approach, relevant experience, and what the client can expect."
                minH="200px"
                resize="vertical"
                maxLength={MAX_PROPOSAL_LENGTH + 1}
                disabled={submitting}
                {...fieldInputStyles(Boolean(errors.proposal))}
              />
              <HStack justify="space-between" gap={3} align="start">
                {errors.proposal ? (
                  <Field.ErrorText color="red.300">{errors.proposal}</Field.ErrorText>
                ) : (
                  <Box />
                )}
                <Text
                  color={proposalLength > MAX_PROPOSAL_LENGTH ? 'red.300' : 'rgba(226, 232, 240, 0.52)'}
                  fontSize="xs"
                  flex="0 0 auto"
                >
                  {proposalLength}/{MAX_PROPOSAL_LENGTH}
                </Text>
              </HStack>
            </Field.Root>

            <Field.Root invalid={Boolean(errors.relevantExperience)}>
              <Field.Label color="white" fontWeight="semibold">
                Describe your recent experience with similar projects
              </Field.Label>
              <Textarea
                value={form.relevantExperience}
                onChange={handleChange('relevantExperience')}
                placeholder="Share recent, similar projects you have delivered. (optional)"
                minH="140px"
                resize="vertical"
                maxLength={MAX_RELEVANT_EXPERIENCE_LENGTH + 1}
                disabled={submitting}
                {...fieldInputStyles(Boolean(errors.relevantExperience))}
              />
              <HStack justify="space-between" gap={3} align="start">
                {errors.relevantExperience ? (
                  <Field.ErrorText color="red.300">{errors.relevantExperience}</Field.ErrorText>
                ) : (
                  <Field.HelperText color="rgba(226, 232, 240, 0.5)">Optional</Field.HelperText>
                )}
                <Text
                  color={
                    relevantExperienceLength > MAX_RELEVANT_EXPERIENCE_LENGTH
                      ? 'red.300'
                      : 'rgba(226, 232, 240, 0.52)'
                  }
                  fontSize="xs"
                  flex="0 0 auto"
                >
                  {relevantExperienceLength}/{MAX_RELEVANT_EXPERIENCE_LENGTH}
                </Text>
              </HStack>
            </Field.Root>

            <Box>
              <Text color="white" fontWeight="semibold" mb={1}>
                Attachments
              </Text>
              <Text color="rgba(226, 232, 240, 0.55)" fontSize="sm" mb={3}>
                Drag or upload project files
              </Text>
              <ProposalAttachments
                attachments={attachments}
                error={attachmentError}
                disabled={submitting}
                onAttachmentsAdd={handleAttachmentsAdd}
                onAttachmentRemove={handleAttachmentRemove}
              />
            </Box>
            
          </VStack>
        </GlassPanel>
      </VStack>

      <Box
        position="fixed"
        left="0"
        right="0"
        bottom="0"
        zIndex="10"
        bg="rgba(2, 6, 23, 0.94)"
        backdropFilter="blur(18px)"
        borderTop="1px solid rgba(148, 163, 184, 0.14)"
        px={{ base: 4, md: 8 }}
        py={{ base: 4, md: 5 }}
      >
        <Box maxW="1280px" mx="auto">
          <HStack justify="space-between" align="center" gap={4} flexWrap="wrap">
            <Box minW="0">
              {serverError ? (
                <Text color="red.300" fontSize="sm" fontWeight="semibold" role="alert">
                  {serverError}
                </Text>
              ) : (
                <Text color="rgba(226, 232, 240, 0.6)" fontSize="sm">
                  Review your terms, then send your proposal to the client.
                </Text>
              )}
            </Box>
            <HStack gap={3} flexWrap="wrap" justify="flex-end">
              <Button
                as={Link}
                to={jobHref}
                variant="ghost"
                color="rgba(226, 232, 240, 0.78)"
                _hover={{ bg: 'rgba(148, 163, 184, 0.1)', color: 'white' }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                loading={submitting}
                loadingText="Submitting"
                borderRadius="full"
                bgGradient="to-r"
                gradientFrom="cyan.400"
                gradientTo="blue.500"
                color="gray.950"
                fontWeight="bold"
                px={6}
                _hover={{ transform: 'translateY(-1px)', boxShadow: '0 16px 34px rgba(14, 165, 233, 0.24)' }}
                _active={{ transform: 'translateY(0)' }}
              >
                <SendHorizontal size={17} />
                Submit proposal
              </Button>
            </HStack>
          </HStack>
        </Box>
      </Box>
    </PageShell>
  );
};

export default SubmitProposalPage;
