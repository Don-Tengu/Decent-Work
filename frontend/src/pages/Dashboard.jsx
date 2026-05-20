import React from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Dialog,
  Heading,
  HStack,
  IconButton,
  Menu,
  Portal,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ClipboardList,
  Ellipsis,
  FilePenLine,
  Plus,
} from 'lucide-react';
import GlassPanel from '../components/ui/GlassPanel';
import PageShell from '../components/ui/PageShell';
import SectionEyebrow from '../components/ui/SectionEyebrow';
import { pageAccents } from '@/common.js';
import { CANCEL_JOB, CONNECT_WALLET, GET_JOB_BIDS, GET_MY_JOBS } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { connectWallet } from '../utils/web3';


const MY_JOBS_VARIABLES = { statuses: ['DRAFT', 'OPEN'] };

const formatBudget = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) {
    return 'Not saved yet';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const getJobTitle = (job) => job.title?.trim() || 'Untitled draft';

const DRAFT_CARD_COPY = {
  SKILLS: {
    message: 'Add the skills you need to continue',
    actionLabel: 'Add skills',
  },
  SCOPE: {
    message: "Add your project's scope to continue",
    actionLabel: 'Add scope',
  },
  BUDGET: {
    message: 'Add your budget to continue',
    actionLabel: 'Add budget',
  },
  DETAILS: {
    message: 'Add details to your draft',
    actionLabel: 'Fill in draft',
  },
  REVIEW: {
    message: 'Finalize your job post',
    actionLabel: 'Finalize job post',
  },
};

const getFallbackDraftStep = (job) => {
  const hasTaxonomy = Boolean(job.category?.id && job.specialty?.id);
  const hasSkills = (job.jobSkillTags?.length ?? 0) > 0;

  if (!hasTaxonomy || !hasSkills) {
    return 'SKILLS';
  }

  return job.description?.trim() ? 'REVIEW' : 'DETAILS';
};

const getDraftCardCopy = (job) => {
  const draftStep = DRAFT_CARD_COPY[job.draftStep] ? job.draftStep : getFallbackDraftStep(job);

  return DRAFT_CARD_COPY[draftStep] ?? DRAFT_CARD_COPY.SKILLS;
};

const getJobCardMessage = (job) => {
  const description = job.description?.trim();

  if (job.status === 'DRAFT') {
    return getDraftCardCopy(job).message;
  }

  return description || 'Review incoming offers from freelancers for this posted job.';
};

const getJobCardActionLabel = (job) =>
  job.status === 'DRAFT' ? getDraftCardCopy(job).actionLabel : 'View proposals';

const clientJobCardFlex = {
  base: '0 0 100%',
  md: '0 0 calc((100% - 18px) / 2)',
  xl: '0 0 calc((100% - 36px) / 3)',
};

const StatCard = ({ label, value, color }) => (
  <GlassPanel variant="subtle" borderRadius="24px" p={6}>
    <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm" textTransform="uppercase" letterSpacing="0.08em" mb={3}>
      {label}
    </Text>
    <Text color={color || 'white'} fontSize="3xl" fontWeight="bold" letterSpacing="-0.03em">
      {value}
    </Text>
  </GlassPanel>
);

const NavCard = ({ to, fromColor, toColor, icon, title, description }) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <Box
      bg="rgba(10, 18, 32, 0.78)"
      border="1px solid"
      borderColor="rgba(148, 163, 184, 0.16)"
      borderRadius="28px"
      p={6}
      cursor="pointer"
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-6px)',
        boxShadow: '0 26px 48px rgba(2, 6, 23, 0.35)',
        borderColor: 'rgba(125, 211, 252, 0.28)',
      }}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset="auto -10px -30px auto"
        w="160px"
        h="160px"
        borderRadius="full"
        bgGradient="to-br"
        gradientFrom={fromColor}
        gradientTo={toColor}
        opacity={0.3}
        filter="blur(8px)"
      />
      <Box
        w="56px"
        h="56px"
        borderRadius="18px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgGradient="to-br"
        gradientFrom={fromColor}
        gradientTo={toColor}
        mb={5}
        position="relative"
      >
        <Text fontSize="2xl">{icon}</Text>
      </Box>
      <Heading size="md" color="white" mb={2}>{title}</Heading>
      <Text color="rgba(226, 232, 240, 0.72)" fontSize="sm" lineHeight="1.7">
        {description}
      </Text>
    </Box>
  </Link>
);

const PageState = ({ title, description, tone = 'default' }) => (
  <GlassPanel
    variant="soft"
    borderRadius="28px"
    p={{ base: 6, md: 8 }}
    borderColor={tone === 'error' ? 'rgba(248, 113, 113, 0.32)' : undefined}
  >
    <VStack align="center" gap={3} textAlign="center">
      <Heading size="md" color="white">
        {title}
      </Heading>
      <Text color={tone === 'error' ? 'red.200' : 'rgba(226, 232, 240, 0.68)'} maxW="560px">
        {description}
      </Text>
    </VStack>
  </GlassPanel>
);

const JobStatusLabel = ({ status }) => (
  <Badge
    alignSelf="start"
    colorPalette={status === 'OPEN' ? 'green' : 'yellow'}
    variant="subtle"
    px={3}
    py={1}
    borderRadius="full"
    fontWeight="semibold"
  >
    {status === 'OPEN' ? 'Open job post' : 'Draft job post'}
  </Badge>
);

const menuItemStyles = {
  borderRadius: '10px',
  color: 'rgba(248, 250, 252, 0.9)',
  cursor: 'pointer',
  fontWeight: 'semibold',
  px: 3,
  py: 2.5,
  _highlighted: {
    bg: 'rgba(148, 163, 184, 0.14)',
    color: 'white',
  },
  _hover: {
    bg: 'rgba(148, 163, 184, 0.14)',
    color: 'white',
  },
};

const destructiveMenuItemStyles = {
  ...menuItemStyles,
  color: 'red.200',
  _highlighted: {
    bg: 'rgba(248, 113, 113, 0.12)',
    color: 'red.100',
  },
  _hover: {
    bg: 'rgba(248, 113, 113, 0.12)',
    color: 'red.100',
  },
};

const JobActionsMenu = ({ job, isDraft, onEditDraft, onEditPosting, onRemove, onViewProposals }) => (
  <Menu.Root positioning={{ placement: 'bottom-end', gutter: 10 }}>
    <Menu.Trigger asChild>
      <IconButton
        aria-label={`Actions for ${getJobTitle(job)}`}
        type="button"
        variant="ghost"
        bg="transparent"
        color="rgba(226, 232, 240, 0.78)"
        borderRadius="full"
        size="sm"
        _hover={{ bg: 'rgba(148, 163, 184, 0.12)', color: 'white' }}
        _active={{ bg: 'transparent', color: 'rgba(226, 232, 240, 0.78)' }}
        _open={{ bg: 'transparent', color: 'rgba(226, 232, 240, 0.78)' }}
        _expanded={{ bg: 'transparent', color: 'rgba(226, 232, 240, 0.78)' }}
        css={{
          '&[data-state=open], &[aria-expanded=true]': {
            background: 'transparent',
            color: 'rgba(226, 232, 240, 0.78)',
          },
        }}
      >
        <Ellipsis size={20} />
      </IconButton>
    </Menu.Trigger>
    <Portal>
      <Menu.Positioner>
        <Menu.Content
          bg="rgba(9, 16, 30, 0.98)"
          border="1px solid"
          borderColor="rgba(148, 163, 184, 0.18)"
          borderRadius="16px"
          boxShadow="0 24px 60px rgba(2, 6, 23, 0.46)"
          minW="210px"
          p={2}
          zIndex="popover"
        >
          <Menu.Arrow>
            <Menu.ArrowTip bg="rgba(9, 16, 30, 0.98)" borderColor="rgba(148, 163, 184, 0.18)" />
          </Menu.Arrow>
          {isDraft ? (
            <>
              <Menu.Item value={`edit-draft-${job.id}`} onClick={() => onEditDraft(job)} {...menuItemStyles}>
                Edit draft
              </Menu.Item>
              <Menu.Item value={`remove-draft-${job.id}`} onClick={() => onRemove(job)} {...destructiveMenuItemStyles}>
                Remove draft
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Item value={`view-proposals-${job.id}`} onClick={() => onViewProposals(job)} {...menuItemStyles}>
                View Proposals
              </Menu.Item>
              <Menu.Item value={`edit-posting-${job.id}`} onClick={() => onEditPosting(job)} {...menuItemStyles}>
                Edit Posting
              </Menu.Item>
              <Menu.Item value={`remove-posting-${job.id}`} onClick={() => onRemove(job)} {...destructiveMenuItemStyles}>
                Remove Posting
              </Menu.Item>
            </>
          )}
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu.Root>
);

const ClientJobCard = ({ job, onEditDraft, onEditPosting, onRemove, onViewProposals }) => {
  const isDraft = job.status === 'DRAFT';

  return (
    <GlassPanel
      data-client-job-card
      variant="subtle"
      borderRadius="24px"
      p={{ base: 5, md: 6 }}
      minH={{ base: '300px', md: '320px' }}
      h="full"
      flex={clientJobCardFlex}
      minW="0"
      scrollSnapAlign="start"
      transition="all 0.25s ease"
      _hover={{
        transform: 'translateY(-4px)',
        borderColor: isDraft ? 'rgba(250, 204, 21, 0.28)' : 'rgba(74, 222, 128, 0.28)',
      }}
    >
      <VStack align="stretch" gap={5} h="full">
        <HStack justify="space-between" align="start" gap={4}>
          <HStack gap={4} align="center" minW="0">
            <Box
              boxSize="48px"
              borderRadius="full"
              display="grid"
              placeItems="center"
              bg={isDraft ? 'rgba(250, 204, 21, 0.14)' : 'rgba(34, 197, 94, 0.14)'}
              color={isDraft ? 'yellow.200' : 'green.200'}
              flex="0 0 auto"
            >
              {isDraft ? <FilePenLine size={22} /> : <BriefcaseBusiness size={22} />}
            </Box>
            <Heading
              as="h3"
              size="sm"
              color="white"
              lineHeight="1.35"
              fontWeight="semibold"
              css={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getJobTitle(job)}
            </Heading>
          </HStack>
          <JobActionsMenu
            job={job}
            isDraft={isDraft}
            onEditDraft={onEditDraft}
            onEditPosting={onEditPosting}
            onRemove={onRemove}
            onViewProposals={onViewProposals}
          />
        </HStack>

        <JobStatusLabel status={job.status} />

        <Text
          color="rgba(248, 250, 252, 0.9)"
          fontSize={{ base: 'md', md: 'lg' }}
          fontWeight={isDraft ? 'bold' : 'medium'}
          lineHeight="1.45"
          minH="76px"
          css={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 3,
            overflow: 'hidden',
          }}
        >
          {getJobCardMessage(job)}
        </Text>

        <Text color="rgba(226, 232, 240, 0.52)" fontSize="sm" mt="-2">
          Updated {formatDate(job.updatedAt || job.createdAt)}
        </Text>

        <Box mt="auto">
          {isDraft ? (
            <Button
              as={Link}
              to={`/post-job/${job.id}`}
              w="full"
              borderRadius="full"
              colorPalette="yellow"
              color="yellow.500"
              variant="outline"
              fontWeight="600"
              h="42px"
            >
              <HStack gap={2}>
                <span>{getJobCardActionLabel(job)}</span>
              </HStack>
            </Button>
          ) : (
            <Button
              type="button"
              w="full"
              borderRadius="full"
              colorPalette="green"
              color="green.500"
              variant="outline"
              fontWeight="600"
              h="42px"
              onClick={() => onViewProposals(job)}
            >
              <HStack gap={2}>
                <span>View proposals</span>
              </HStack>
            </Button>
          )}
        </Box>
      </VStack>
    </GlassPanel>
  );
};

const PostJobCarouselCard = () => (
  <Box
    as={Link}
    to="/post-job"
    aria-label="Create a new job post"
    data-client-job-card
    flex={clientJobCardFlex}
    minW="0"
    minH={{ base: '300px', md: '320px' }}
    scrollSnapAlign="start"
    border="1px solid"
    borderColor="rgba(148, 163, 184, 0.22)"
    borderRadius="24px"
    bg="rgba(10, 18, 32, 0.44)"
    color="white"
    display="grid"
    placeItems="center"
    textDecoration="none"
    transition="all 0.25s ease"
    _hover={{
      borderColor: 'rgba(74, 222, 128, 0.34)',
      bg: 'rgba(15, 23, 42, 0.7)',
      transform: 'translateY(-4px)',
    }}
  >
    <HStack gap={3} color="rgba(248, 250, 252, 0.9)">
      <Plus size={22} />
      <Text fontWeight="semibold">Post a job</Text>
    </HStack>
  </Box>
);

const JobCarouselArrow = ({ direction, disabled, onClick, ...props }) => {
  const isPrevious = direction === 'previous';

  return (
    <IconButton
      aria-label={isPrevious ? 'Show previous job' : 'Show next job'}
      type="button"
      borderRadius="full"
      variant="solid"
      bg="rgba(226, 232, 240, 0.14)"
      color="white"
      disabled={disabled}
      onClick={onClick}
      flex="0 0 auto"
      {...props}
      _hover={{
        bg: disabled ? 'rgba(226, 232, 240, 0.14)' : 'rgba(226, 232, 240, 0.22)',
      }}
      _disabled={{
        opacity: 0.45,
        cursor: 'not-allowed',
      }}
    >
      {isPrevious ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
    </IconButton>
  );
};

const ClientJobCarousel = ({ jobs, onEditDraft, onEditPosting, onRemove, onViewProposals }) => {
  const railRef = React.useRef(null);
  const [canScrollPrevious, setCanScrollPrevious] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
    const hasOverflow = maxScrollLeft > 4;

    setCanScrollPrevious(hasOverflow && rail.scrollLeft > 4);
    setCanScrollNext(hasOverflow && rail.scrollLeft < maxScrollLeft - 4);
  }, []);

  React.useEffect(() => {
    const rail = railRef.current;

    if (!rail) {
      return undefined;
    }

    rail.scrollLeft = 0;
    updateScrollState();

    const handleScroll = () => updateScrollState();
    const resizeObserver =
      typeof window !== 'undefined' && 'ResizeObserver' in window
        ? new window.ResizeObserver(updateScrollState)
        : null;

    rail.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver?.observe(rail);
    window.addEventListener('resize', handleScroll);

    return () => {
      rail.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleScroll);
    };
  }, [jobs.length, updateScrollState]);

  const scrollJobs = (direction) => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    const firstCard = rail.querySelector('[data-client-job-card]');
    const track = rail.firstElementChild;
    const styles = track ? window.getComputedStyle(track) : null;
    const gap = Number.parseFloat(styles?.columnGap || styles?.gap || '18') || 18;
    const cardWidth = firstCard?.getBoundingClientRect().width || rail.clientWidth;
    const distance = direction * (cardWidth + gap);

    if (typeof rail.scrollBy === 'function') {
      rail.scrollBy({ left: distance, behavior: 'smooth' });
    } else {
      rail.scrollLeft += distance;
    }

    window.setTimeout(updateScrollState, 350);
  };

  return (
    <Box as="section" aria-label="Client jobs" position="relative" w="full">
      <HStack display={{ base: 'flex', md: 'none' }} justify="space-between" mb={3}>
        <JobCarouselArrow
          direction="previous"
          disabled={!canScrollPrevious}
          onClick={() => scrollJobs(-1)}
        />
        <JobCarouselArrow
          direction="next"
          disabled={!canScrollNext}
          onClick={() => scrollJobs(1)}
        />
      </HStack>
      <JobCarouselArrow
        direction="previous"
        disabled={!canScrollPrevious}
        onClick={() => scrollJobs(-1)}
        display={{ base: 'none', md: 'inline-flex' }}
        position="absolute"
        left="-54px"
        top="50%"
        transform="translateY(-50%)"
      />
      <Box
        ref={railRef}
        w="full"
        overflowX="auto"
        pt={2}
        pb={3}
        mt={-2}
        mb={-3}
        scrollBehavior="smooth"
        scrollSnapType="x mandatory"
        css={{
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        <HStack align="stretch" gap={{ base: 4, md: '18px' }} w="full">
          {jobs.map((job) => (
            <ClientJobCard
              key={job.id}
              job={job}
              onEditDraft={onEditDraft}
              onEditPosting={onEditPosting}
              onRemove={onRemove}
              onViewProposals={onViewProposals}
            />
          ))}
          <PostJobCarouselCard />
        </HStack>
      </Box>
      <JobCarouselArrow
        direction="next"
        disabled={!canScrollNext}
        onClick={() => scrollJobs(1)}
        display={{ base: 'none', md: 'inline-flex' }}
        position="absolute"
        right="-54px"
        top="50%"
        transform="translateY(-50%)"
      />
    </Box>
  );
};

const ProposalDialog = ({ job, bids, loading, error, onClose }) => (
  <Dialog.Root open={!!job} onOpenChange={(details) => !details.open && onClose()}>
    <Portal>
      <Dialog.Backdrop bg="rgba(2, 6, 23, 0.78)" backdropFilter="blur(8px)" />
      <Dialog.Positioner px={{ base: 4, md: 6 }}>
        <Dialog.Content
          bg="rgba(9, 16, 30, 0.96)"
          border="1px solid"
          borderColor="rgba(148, 163, 184, 0.18)"
          borderRadius="28px"
          color="white"
          maxW="720px"
        >
          <Dialog.Header px={6} pt={6} pb={2}>
            <VStack align="start" gap={2}>
              <Dialog.Title fontSize="xl" fontWeight="bold">
                Proposals for {job ? getJobTitle(job) : 'job'}
              </Dialog.Title>
              <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm">
                Review incoming offers from freelancers for this posted job.
              </Text>
            </VStack>
          </Dialog.Header>
          <Dialog.Body px={6} py={5}>
            {loading ? (
              <Text color="rgba(226, 232, 240, 0.7)">Loading proposals...</Text>
            ) : null}
            {error ? (
              <Text color="red.200">{error.message}</Text>
            ) : null}
            {!loading && !error && bids.length === 0 ? (
              <Text color="rgba(226, 232, 240, 0.68)">No proposals have arrived yet.</Text>
            ) : null}
            {!loading && !error && bids.length > 0 ? (
              <VStack align="stretch" gap={4}>
                {bids.map((bid) => (
                  <Box
                    key={bid.id}
                    border="1px solid"
                    borderColor="rgba(148, 163, 184, 0.16)"
                    borderRadius="18px"
                    bg="rgba(15, 23, 42, 0.58)"
                    p={4}
                  >
                    <HStack justify="space-between" align="start" gap={4} mb={3}>
                      <Box>
                        <Text color="white" fontWeight="semibold">
                          {bid.freelancer?.username || 'Freelancer'}
                        </Text>
                        <Text color="rgba(226, 232, 240, 0.56)" fontSize="sm">
                          {bid.deliveryTime} day delivery
                        </Text>
                      </Box>
                      <Badge colorPalette="green" borderRadius="full" px={3} py={1}>
                        {formatBudget(bid.amount)}
                      </Badge>
                    </HStack>
                    <Text color="rgba(226, 232, 240, 0.72)" lineHeight="1.7">
                      {bid.proposal}
                    </Text>
                  </Box>
                ))}
              </VStack>
            ) : null}
          </Dialog.Body>
          <Dialog.Footer px={6} pb={6}>
            <Dialog.CloseTrigger asChild>
              <Button type="button" borderRadius="full" colorPalette="gray" variant="outline">
                Close
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
);

const RemoveJobDialog = ({ job, loading, error, onClose, onConfirm }) => {
  const isDraft = job?.status === 'DRAFT';
  const jobTitle = job ? getJobTitle(job) : 'this job';
  const actionLabel = isDraft ? 'Remove draft' : 'Remove posting';
  const statusLabel = isDraft ? 'Draft job post' : 'Open job post';

  return (
    <Dialog.Root
      lazyMount
      open={!!job}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
      placement="center"
      size={{ base: 'sm', md: 'md' }}
    >
      <Portal>
        <Dialog.Backdrop bg="rgba(2, 6, 23, 0.78)" backdropFilter="blur(8px)" />
        <Dialog.Positioner px={{ base: 4, md: 6 }}>
          <Dialog.Content
            bg="rgba(8, 13, 25, 0.98)"
            border="1px solid"
            borderColor="rgba(148, 163, 184, 0.22)"
            borderRadius="26px"
            boxShadow="0 28px 80px rgba(0, 0, 0, 0.48)"
            color="white"
            maxW="460px"
          >
            <Dialog.Header px={{ base: 5, md: 6 }} pt={{ base: 5, md: 6 }} pb={2}>
              <VStack align="start" gap={3}>
                <Badge
                  colorPalette={isDraft ? 'yellow' : 'green'}
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontWeight="semibold"
                >
                  {statusLabel}
                </Badge>
                <Dialog.Title fontSize={{ base: 'xl', md: '2xl' }} lineHeight="1.1" letterSpacing="0">
                  {actionLabel}?
                </Dialog.Title>
              </VStack>
            </Dialog.Header>

            <Dialog.Body px={{ base: 5, md: 6 }} py={3}>
              <Text color="rgba(226, 232, 240, 0.72)" lineHeight="1.7">
                {isDraft
                  ? `Remove "${jobTitle}" from your dashboard? This draft will no longer be available to continue posting.`
                  : `Remove "${jobTitle}" from your open postings? Freelancers will no longer see it as an active job.`}
              </Text>
              {error ? (
                <Text color="red.200" fontSize="sm" mt={4}>
                  {error.message}
                </Text>
              ) : null}
            </Dialog.Body>

            <Dialog.Footer px={{ base: 5, md: 6 }} pb={{ base: 5, md: 6 }} pt={3} gap={3}>
              <Button
                type="button"
                variant="ghost"
                borderRadius="full"
                color="rgba(226, 232, 240, 0.78)"
                disabled={loading}
                onClick={onClose}
                _hover={{ bg: 'rgba(148, 163, 184, 0.12)', color: 'white' }}
              >
                Keep job
              </Button>
              <Button
                type="button"
                borderRadius="full"
                colorPalette="red"
                fontWeight="bold"
                loading={loading}
                onClick={onConfirm}
              >
                {actionLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

const ClientDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = React.useState(null);
  const [jobPendingRemoval, setJobPendingRemoval] = React.useState(null);
  const { data, loading, error } = useQuery(GET_MY_JOBS, {
    variables: MY_JOBS_VARIABLES,
    fetchPolicy: 'cache-and-network',
  });
  const [cancelJob, { loading: deletingJob, error: deleteError, reset: resetDeleteJob }] = useMutation(CANCEL_JOB, {
    refetchQueries: [{ query: GET_MY_JOBS, variables: MY_JOBS_VARIABLES }],
    awaitRefetchQueries: true,
  });
  const [
    loadJobBids,
    { data: bidsData, loading: loadingBids, error: bidsError },
  ] = useLazyQuery(GET_JOB_BIDS, {
    fetchPolicy: 'network-only',
  });

  const jobs = data?.myJobs ?? [];

  const handleEditDraft = (job) => {
    navigate(`/post-job/${job.id}`);
  };

  const handleEditPosting = (job) => {
    navigate(`/post-job/${job.id}?mode=edit-posting`);
  };

  const handleRemove = (job) => {
    resetDeleteJob?.();
    setJobPendingRemoval(job);
  };

  const handleCloseRemoveDialog = () => {
    if (deletingJob) {
      return;
    }

    resetDeleteJob?.();
    setJobPendingRemoval(null);
  };

  const handleConfirmRemove = async () => {
    if (!jobPendingRemoval) {
      return;
    }

    try {
      await cancelJob({ variables: { id: jobPendingRemoval.id } });
      resetDeleteJob?.();
      setJobPendingRemoval(null);
    } catch {
      // Apollo exposes the mutation error through deleteError for the dialog.
    }
  };

  const handleViewProposals = (job) => {
    setSelectedJob(job);
    loadJobBids({ variables: { jobId: job.id } });
  };

  return (
    <PageShell accents={pageAccents} maxW="1274px" py={{ base: 8, md: 10 }}>
      <VStack align="stretch" gap={8}>

          <Stack
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
            gap={6}
          >
            <VStack align="start" gap={3}>
              <Heading color="white" size={{ base: 'xl', md: '3xl' }} letterSpacing="-0.03em">
                Good day, {user?.username}
              </Heading>
            </VStack>

            <HStack gap={3} justify={{ base: 'stretch', md: 'flex-end' }} flexWrap="wrap">
              <Button
                as={Link}
                to="/post-job"
                borderRadius="full"
                colorPalette="green"
                bg="green.700"
                color="white"
                fontWeight="700"
                px={6}
                flex={{ base: '1 1 180px', sm: '0 0 auto' }}
                _hover={{ bg: 'green.800' }}
                _active={{ bg: 'green.900' }}
              >
                <HStack gap={2}>
                  <Plus size={18} />
                  <span>Post a job</span>
                </HStack>
              </Button>
              <Button
                type="button"
                onClick={onLogout}
                fontWeight="700"
                colorPalette="red"
                borderRadius="full"
                flex={{ base: '1 1 140px', sm: '0 0 auto' }}
              >
                Logout
              </Button>
            </HStack>
          </Stack>


        <HStack justify="space-between" align={{ base: 'start', md: 'center' }} flexWrap="wrap" gap={4}>
          <Box>

            <Heading color="white" size="2xl">
              Overview
            </Heading>
          </Box>
        </HStack>

        {loading && !data ? (
          <PageState title="Loading jobs" description="We are pulling your posted jobs and saved drafts." />
        ) : null}

        {error ? (
          <PageState title="Unable to load dashboard jobs" description={error.message} tone="error" />
        ) : null}

        {!loading && !error && jobs.length === 0 ? (
          <GlassPanel variant="soft" borderRadius="30px" p={{ base: 6, md: 10 }}>
            <VStack gap={5} textAlign="center">
              <Box
                boxSize="60px"
                borderRadius="20px"
                display="grid"
                placeItems="center"
                bg="rgba(34, 197, 94, 0.12)"
                color="green.200"
              >
                <ClipboardList size={28} />
              </Box>
              <VStack gap={2}>
                <Heading color="white" size="md">
                  No jobs yet
                </Heading>
                <Text color="rgba(226, 232, 240, 0.68)" maxW="560px">
                  Start a job post or save a draft. It will appear here when you are ready to continue.
                </Text>
              </VStack>
              <Button as={Link} to="/post-job" borderRadius="full" colorPalette="green">
                Post a job
              </Button>
            </VStack>
          </GlassPanel>
        ) : null}

        {!error && jobs.length > 0 ? (
          <ClientJobCarousel
            jobs={jobs}
            onEditDraft={handleEditDraft}
            onEditPosting={handleEditPosting}
            onRemove={handleRemove}
            onViewProposals={handleViewProposals}
          />
        ) : null}

        {deletingJob ? (
          <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm">
            Updating dashboard...
          </Text>
        ) : null}
      </VStack>

      <ProposalDialog
        job={selectedJob}
        bids={bidsData?.jobBids ?? []}
        loading={loadingBids}
        error={bidsError}
        onClose={() => setSelectedJob(null)}
      />
      <RemoveJobDialog
        job={jobPendingRemoval}
        loading={deletingJob}
        error={deleteError}
        onClose={handleCloseRemoveDialog}
        onConfirm={handleConfirmRemove}
      />
    </PageShell>
  );
};

const FreelancerDashboard = ({
  user,
  shortAddress,
  walletError,
  walletSuccess,
  onConnectWallet,
  onLogout,
}) => (
  <PageShell accents={pageAccents} maxW="1100px" py={8}>
    <VStack align="stretch" gap={8} position="relative">
      <GlassPanel variant="solid" borderRadius="36px" p={{ base: 6, md: 8 }} boxShadow="0 30px 80px rgba(2, 6, 23, 0.36)">
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          justify="space-between"
          align={{ base: 'start', lg: 'center' }}
          gap={6}
        >
          <VStack align="start" gap={4} maxW="620px">
            <SectionEyebrow label="Product Console" dotColor="cyan.300" />
            <Heading
              size={{ base: 'xl', md: '2xl' }}
              color="white"
              lineHeight="1.03"
              letterSpacing="-0.03em"
            >
              Welcome back, {user?.username}.
              <br />
              Let&apos;s keep work moving.
            </Heading>
            <Text color="rgba(226, 232, 240, 0.74)" fontSize={{ base: 'md', md: 'lg' }}>
              Track jobs, move accepted work into escrow, and keep both sides aligned on one
              clean workflow.
            </Text>
          </VStack>

          <Button
            onClick={onLogout}
            colorPalette="red"
            variant="solid"
            size="md"
            borderRadius="full"
          >
            Logout
          </Button>
        </Stack>
      </GlassPanel>

      <GlassPanel
        variant="soft"
        borderRadius="32px"
        p={{ base: 6, md: 8 }}
        boxShadow="0 24px 60px rgba(2, 6, 23, 0.28)"
      >
        <Stack direction={{ base: 'column', lg: 'row' }} gap={8} align="start">
          <HStack gap={5} align="start" flex={1}>
            <Avatar.Root size="2xl" bg="cyan.500" color="gray.950">
              <Avatar.Fallback name={user?.username} />
            </Avatar.Root>
            <VStack align="start" flex={1} gap={3}>
              <HStack flexWrap="wrap" gap={3}>
                <Heading size="lg" color="white">
                  {user?.username}
                </Heading>
                <Badge
                  colorPalette={user?.role === 'FREELANCER' ? 'cyan' : 'green'}
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {user?.role === 'FREELANCER' ? 'Freelancer' : 'Client'}
                </Badge>
              </HStack>
              <Text color="rgba(226, 232, 240, 0.68)" fontSize="md">
                {user?.email}
              </Text>
              <Text color="rgba(226, 232, 240, 0.56)" fontSize="sm" maxW="560px">
                Review open opportunities, submit sharper proposals, and stay ready for escrow-backed work.
              </Text>
            </VStack>
          </HStack>

          <GlassPanel
            variant="solid"
            minW={{ base: 'full', lg: '320px' }}
            w={{ base: 'full', lg: '320px' }}
            borderRadius="28px"
            p={5}
            bg="rgba(8, 15, 29, 0.74)"
            borderColor="rgba(148, 163, 184, 0.14)"
            boxShadow="none"
          >
            <Text color="whiteAlpha.700" fontSize="sm" mb={3}>
              Wallet Status
            </Text>
            {user?.walletAddress ? (
              <VStack align="start" gap={3}>
                <Badge colorPalette="green" fontSize="sm" px={3} py={1} borderRadius="full">
                  Connected
                </Badge>
                <Text color="white" fontWeight="semibold" fontSize="md">
                  {shortAddress}
                </Text>
                <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm">
                  Your wallet is ready for marketplace payments and escrow actions.
                </Text>
              </VStack>
            ) : (
              <VStack align="start" gap={3}>
                <Text color="rgba(226, 232, 240, 0.68)" fontSize="sm">
                  Connect your wallet to prepare for escrow payments and on-chain actions.
                </Text>
                <Button
                  onClick={onConnectWallet}
                  size="sm"
                  borderRadius="full"
                  bgGradient="to-r"
                  gradientFrom="cyan.400"
                  gradientTo="blue.500"
                  color="gray.950"
                  fontWeight="bold"
                >
                  Connect Wallet
                </Button>
                {walletError && <Text color="red.300" fontSize="sm">{walletError}</Text>}
                {walletSuccess && <Text color="green.300" fontSize="sm">{walletSuccess}</Text>}
              </VStack>
            )}
          </GlassPanel>
        </Stack>
      </GlassPanel>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
        <StatCard label="Active Jobs" value="0" color="blue.300" />
        <StatCard label="Total Earnings" value="$0" color="green.300" />
        <StatCard label="Completed" value="0" color="purple.300" />
      </SimpleGrid>

      <Box>
        <HStack justify="space-between" mb={5} flexWrap="wrap" gap={3}>
          <Stack direction="column" gap={1}>
            <Heading size="md" color="white">
              Quick Actions
            </Heading>
            <Text color="rgba(226, 232, 240, 0.62)" fontSize="sm">
              Jump into the next high-value step for your workflow.
            </Text>
          </Stack>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          <NavCard
            to="/jobs"
            fromColor="cyan.400"
            toColor="blue.500"
            icon="💼"
            title="Browse Jobs"
            description="Discover open opportunities, review budgets, and find the next best match."
          />

          <NavCard
            to="/my-bids"
            fromColor="green.300"
            toColor="teal.400"
            icon="📝"
            title="My Bids"
            description="Track proposals, compare opportunities, and follow accepted work."
          />

          <NavCard
            to="/jobs"
            fromColor="orange.300"
            toColor="pink.500"
            icon="💰"
            title="Payments"
            description="Review the payment flow and prepare accepted jobs for escrow-backed release."
          />
        </SimpleGrid>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <GlassPanel variant="subtle" borderRadius="28px" p={6}>
          <Text color="white" fontSize="lg" fontWeight="semibold" mb={2}>
            Your current stage
          </Text>
          <Text color="rgba(226, 232, 240, 0.66)" fontSize="sm" lineHeight="1.7">
            You are set up to discover jobs, connect a wallet, and start building a bid history that can evolve into an escrow-backed work profile.
          </Text>
        </GlassPanel>

        <NavCard
          to="/my-bids"
          fromColor="blue.400"
          toColor="cyan.500"
          icon="⚡"
          title="Review Bid Pipeline"
          description="Stay close to replies, accepted offers, and the next steps toward payout."
        />
      </SimpleGrid>
    </VStack>
  </PageShell>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [connectWalletMutation] = useMutation(CONNECT_WALLET);
  const [walletError, setWalletError] = React.useState('');
  const [walletSuccess, setWalletSuccess] = React.useState('');

  const handleConnectWallet = async () => {
    setWalletError('');
    setWalletSuccess('');
    try {
      const { address } = await connectWallet();
      await connectWalletMutation({ variables: { walletAddress: address } });
      setWalletSuccess(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (error) {
      setWalletError('Failed to connect wallet: ' + error.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const shortAddress = user?.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : null;

  if (user?.role === 'CLIENT') {
    return <ClientDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <FreelancerDashboard
      user={user}
      shortAddress={shortAddress}
      walletError={walletError}
      walletSuccess={walletSuccess}
      onConnectWallet={handleConnectWallet}
      onLogout={handleLogout}
    />
  );
};

export default Dashboard;
