import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Grid,
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
  BadgeCheck,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  Coins,
  Ellipsis,
  FilePenLine,
  Heart,
  Megaphone,
  Pencil,
  Plus,
  Search,
  SendHorizontal,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';
import GlassPanel from '../components/ui/GlassPanel';
import PageShell from '../components/ui/PageShell';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { pageAccents } from '@/common.js';
import { greenPillButtonStyles, subtlePillButtonStyles, yellowPillButtonStyles } from '../components/ui/buttonStyles.js';
import {
  CANCEL_JOB,
  CONNECT_WALLET,
  GET_MY_BIDS,
  GET_MY_JOBS,
  GET_MY_SAVED_JOBS,
  GET_SAVED_JOB_IDS,
  UNSAVE_JOB,
} from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { connectWallet } from '../utils/web3';
import JobResultCard from './jobs/components/JobResultCard.jsx';


const MY_JOBS_VARIABLES = { statuses: ['DRAFT', 'OPEN'] };

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

const freelancerTabs = [
  { label: 'Best Matches', to: '/jobs' },
  { label: 'Most Recent', to: '/jobs' },
  { label: 'Saved Jobs', active: true },
];

const SidebarCard = ({ children, icon, title, action }) => (
  <GlassPanel variant="subtle" borderRadius="24px" p={{ base: 5, md: 6 }} boxShadow="0 18px 42px rgba(2, 6, 23, 0.2)">
    <VStack align="stretch" gap={5}>
      <HStack justify="space-between" align="center" gap={4}>
        <HStack gap={3} minW="0">
          {icon ? (
            <Box
              boxSize="36px"
              borderRadius="14px"
              display="grid"
              placeItems="center"
              bg="rgba(34, 211, 238, 0.12)"
              color="cyan.200"
              flex="0 0 auto"
            >
              {icon}
            </Box>
          ) : null}
          <Heading as="h3" size="sm" color="white" lineHeight="1.25">
            {title}
          </Heading>
        </HStack>
        {action}
      </HStack>
      {children}
    </VStack>
  </GlassPanel>
);

const SidebarRow = ({ icon, title, detail, to, muted = false }) => {
  const content = (
    <HStack
      justify="space-between"
      align="center"
      gap={4}
      py={3}
      color={muted ? 'rgba(226, 232, 240, 0.42)' : 'rgba(248, 250, 252, 0.9)'}
      transition="color 0.2s ease"
      _hover={to ? { color: 'white' } : undefined}
    >
      <HStack gap={3} minW="0">
        <Box color={muted ? 'rgba(148, 163, 184, 0.46)' : 'cyan.200'} flex="0 0 auto">
          {icon}
        </Box>
        <Box minW="0">
          <Text fontWeight="semibold" lineHeight="1.2">
            {title}
          </Text>
          {detail ? (
            <Text color="rgba(226, 232, 240, 0.52)" fontSize="sm" mt={1}>
              {detail}
            </Text>
          ) : null}
        </Box>
      </HStack>
      {to ? <ChevronDown size={18} style={{ transform: 'rotate(-90deg)' }} /> : <ChevronDown size={18} />}
    </HStack>
  );

  if (!to) {
    return content;
  }

  return (
    <Box as={Link} to={to} textDecoration="none">
      {content}
    </Box>
  );
};

const FreelancerSearchBar = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanValue = searchValue.trim();
    navigate(cleanValue ? `/jobs?q=${encodeURIComponent(cleanValue)}` : '/jobs');
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <HStack
        h="48px"
        px={4}
        gap={3}
        border="1px solid"
        borderColor="rgba(148, 163, 184, 0.22)"
        borderRadius="16px"
        bg="rgba(8, 15, 29, 0.64)"
        color="rgba(226, 232, 240, 0.72)"
        transition="all 0.2s ease"
        _focusWithin={{
          borderColor: 'rgba(34, 211, 238, 0.42)',
          bg: 'rgba(15, 23, 42, 0.78)',
          color: 'white',
        }}
      >
        <Search size={20} />
        <Box
          as="input"
          aria-label="Search jobs"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search for jobs"
          flex="1"
          minW="0"
          h="full"
          border="0"
          outline="0"
          bg="transparent"
          color="white"
          fontWeight="medium"
          fontSize="sm"
          _placeholder={{ color: 'rgba(226, 232, 240, 0.54)' }}
          _focus={{ outline: 'none' }}
        />
      </HStack>
    </Box>
  );
};

const JobTabs = () => (
  <HStack
    as="nav"
    aria-label="Job feed filters"
    gap={{ base: 4, md: 7 }}
    borderBottom="1px solid"
    borderColor="rgba(148, 163, 184, 0.18)"
    overflowX="auto"
    css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
  >
    {freelancerTabs.map((tab) => {
      const tabStyles = {
        position: 'relative',
        pb: 3,
        color: tab.active ? 'white' : 'rgba(226, 232, 240, 0.58)',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        _after: tab.active
          ? {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: '-1px',
              h: '2px',
              borderRadius: 'full',
              bg: 'cyan.300',
            }
          : undefined,
        _hover: { color: 'white' },
      };

      return tab.to ? (
        <Box key={tab.label} as={Link} to={tab.to} {...tabStyles}>
          {tab.label}
        </Box>
      ) : (
        <Box key={tab.label} as="span" {...tabStyles}>
          {tab.label}
        </Box>
      );
    })}
  </HStack>
);

const SavedJobsEmptyState = () => (
  <VStack align="center" justify="center" gap={6} minH={{ base: '330px', md: '470px' }} textAlign="center" px={4}>
    <Box position="relative" w="150px" h="118px">
      <Box
        position="absolute"
        left="12px"
        top="18px"
        boxSize="76px"
        borderRadius="22px"
        display="grid"
        placeItems="center"
        bg="rgba(34, 211, 238, 0.16)"
        border="1px solid"
        borderColor="rgba(103, 232, 249, 0.22)"
        color="cyan.200"
      >
        <BriefcaseBusiness size={34} />
      </Box>
      <Box
        position="absolute"
        right="8px"
        top="2px"
        boxSize="92px"
        borderRadius="full"
        display="grid"
        placeItems="center"
        bgGradient="to-br"
        gradientFrom="green.300"
        gradientTo="cyan.400"
        color="gray.950"
        boxShadow="0 18px 44px rgba(34, 211, 238, 0.22)"
      >
        <Heart size={40} fill="currentColor" />
      </Box>
      <Box
        position="absolute"
        left="54px"
        bottom="0"
        boxSize="42px"
        borderRadius="full"
        display="grid"
        placeItems="center"
        bg="rgba(216, 180, 254, 0.18)"
        color="purple.200"
        border="1px solid"
        borderColor="rgba(216, 180, 254, 0.24)"
      >
        <SendHorizontal size={20} />
      </Box>
    </Box>

    <VStack gap={2} maxW="660px">
      <Heading as="h2" size={{ base: 'md', md: 'lg' }} color="white" letterSpacing="0">
        Keep track of jobs you are interested in.
      </Heading>
      <Text color="rgba(226, 232, 240, 0.64)" fontSize={{ base: 'sm', md: 'md' }} lineHeight="1.7">
        No saved jobs yet. Browse open work now, then keep active conversations organized from your bid pipeline.
      </Text>
    </VStack>

    <HStack gap={3} flexWrap="wrap" justify="center">
      <Button
        as={Link}
        to="/jobs"
        borderRadius="full"
        bgGradient="to-r"
        gradientFrom="cyan.400"
        gradientTo="blue.500"
        color="gray.950"
        fontWeight="bold"
      >
        Browse open jobs
      </Button>
      <Button as={Link} to="/my-bids" {...subtlePillButtonStyles}>
        View my bids
      </Button>
    </HStack>
  </VStack>
);

const SavedJobsList = ({ jobs, saving, onToggleSaved }) => (
  <Box>
    {jobs.map((job) => (
      <JobResultCard
        key={job.id}
        job={job}
        query=""
        saved
        saving={saving}
        onToggleSaved={onToggleSaved}
      />
    ))}
  </Box>
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
        variant="plain"
        bg="transparent"
        color="rgba(226, 232, 240, 0.78)"
        borderRadius="full"
        size="sm"
        _hover={{ bg: 'rgba(14, 116, 144, 0.14)', color: 'cyan.100' }}
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
              fontWeight="600"
              h="42px"
              {...yellowPillButtonStyles}
            >
              <HStack gap={2}>
                <span>{getJobCardActionLabel(job)}</span>
              </HStack>
            </Button>
          ) : (
            <Button
              type="button"
              w="full"
              fontWeight="600"
              h="42px"
              onClick={() => onViewProposals(job)}
              {...greenPillButtonStyles}
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

const RemoveJobDialog = ({ job, loading, error, onClose, onConfirm }) => {
  const isDraft = job?.status === 'DRAFT';
  const jobTitle = job ? getJobTitle(job) : 'this job';
  const actionLabel = isDraft ? 'Remove draft' : 'Remove posting';
  const statusLabel = isDraft ? 'Draft job post' : 'Open job post';
  const description = isDraft
    ? `Remove "${jobTitle}" from your dashboard? This draft will no longer be available to continue posting.`
    : `Remove "${jobTitle}" from your open postings? Freelancers will no longer see it as an active job.`;

  return (
    <ConfirmDialog
      open={!!job}
      headerBadge={{ label: statusLabel, colorPalette: isDraft ? 'yellow' : 'green' }}
      title={`${actionLabel}?`}
      description={description}
      confirmLabel={actionLabel}
      cancelLabel="Keep job"
      colorPalette="red"
      loading={loading}
      error={error}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
};

const ClientDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [jobPendingRemoval, setJobPendingRemoval] = React.useState(null);
  const { data, loading, error } = useQuery(GET_MY_JOBS, {
    variables: MY_JOBS_VARIABLES,
    fetchPolicy: 'cache-and-network',
  });
  const [cancelJob, { loading: deletingJob, error: deleteError, reset: resetDeleteJob }] = useMutation(CANCEL_JOB, {
    refetchQueries: [{ query: GET_MY_JOBS, variables: MY_JOBS_VARIABLES }],
    awaitRefetchQueries: true,
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
    navigate(`/jobs/${job.id}/proposals`, { state: { from: '/dashboard' } });
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
}) => {
  const { data, loading } = useQuery(GET_MY_BIDS, {
    fetchPolicy: 'cache-and-network',
  });
  const {
    data: savedJobsData,
    loading: loadingSavedJobs,
    error: savedJobsError,
  } = useQuery(GET_MY_SAVED_JOBS, {
    fetchPolicy: 'cache-and-network',
  });
  const [unsaveJob, { loading: unsavingSavedJob }] = useMutation(UNSAVE_JOB, {
    refetchQueries: [{ query: GET_MY_SAVED_JOBS }, { query: GET_SAVED_JOB_IDS }],
    awaitRefetchQueries: true,
  });
  const bids = data?.myBids ?? [];
  const savedJobs = savedJobsData?.mySavedJobs ?? [];
  const pendingBidCount = bids.filter((bid) => bid.status === 'PENDING').length;
  const acceptedBidCount = bids.filter((bid) => bid.status === 'ACCEPTED').length;
  const totalBidCountLabel = loading && !data ? '...' : String(bids.length);

  const handleToggleSavedJob = (job) => {
    unsaveJob({ variables: { id: job.id } });
  };

  return (
    <PageShell accents={pageAccents} maxW="1280px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }}>
      <Grid
        templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 320px' }}
        gap={{ base: 6, xl: 8 }}
        alignItems="start"
      >
        <VStack align="stretch" gap={6} minW="0">
          <Stack
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'center' }}
            justify="space-between"
            gap={4}
          >
            <Box>
              <Text color="rgba(125, 211, 252, 0.88)" fontSize="sm" fontWeight="bold" mb={2}>
                Freelancer Workspace
              </Text>
              <Heading as="h1" size={{ base: 'xl', md: '2xl' }} color="white" letterSpacing="0" lineHeight="1.08">
                Good day, {user?.username}
              </Heading>
            </Box>
            <HStack gap={3} justify={{ base: 'stretch', md: 'flex-end' }}>
              <Button
                as={Link}
                to="/jobs"
                {...subtlePillButtonStyles}
                flex={{ base: 1, sm: '0 0 auto' }}
              >
                Browse jobs
              </Button>
              <Button
                type="button"
                onClick={onLogout}
                colorPalette="red"
                borderRadius="full"
                flex={{ base: 1, sm: '0 0 auto' }}
              >
                Logout
              </Button>
            </HStack>
          </Stack>

          <GlassPanel
            as="main"
            variant="solid"
            borderRadius="30px"
            p={{ base: 5, md: 7 }}
            minH={{ base: '560px', xl: '760px' }}
            boxShadow="0 28px 80px rgba(2, 6, 23, 0.34)"
          >
            <VStack align="stretch" gap={7}>
              <FreelancerSearchBar />

              <VStack align="stretch" gap={5}>
                <Heading as="h2" size="lg" color="white" letterSpacing="0">
                  Jobs you might like
                </Heading>
                <JobTabs />
              </VStack>

              {loadingSavedJobs && !savedJobsData ? (
                <PageState
                  title="Loading saved jobs"
                  description="We are pulling your saved opportunities into this workspace."
                />
              ) : null}

              {savedJobsError ? (
                <PageState
                  title="Unable to load saved jobs"
                  description={savedJobsError.message}
                  tone="error"
                />
              ) : null}

              {!loadingSavedJobs && !savedJobsError && savedJobs.length === 0 ? (
                <SavedJobsEmptyState />
              ) : null}

              {!savedJobsError && savedJobs.length > 0 ? (
                <SavedJobsList
                  jobs={savedJobs}
                  saving={unsavingSavedJob}
                  onToggleSaved={handleToggleSavedJob}
                />
              ) : null}
            </VStack>
          </GlassPanel>
        </VStack>

        <VStack as="aside" align="stretch" gap={5}>
          <SidebarCard
            title="Profile"
            icon={<ShieldCheck size={19} />}
            action={
              <Badge colorPalette="cyan" variant="subtle" borderRadius="full" px={3}>
                Freelancer
              </Badge>
            }
          >
            <HStack align="center" gap={4}>
              <Avatar.Root size="lg" bg="cyan.500" color="gray.950">
                <Avatar.Fallback name={user?.username} />
              </Avatar.Root>
              <Box minW="0">
                <Text color="white" fontWeight="bold" lineHeight="1.2">
                  {user?.username}
                </Text>
                <Text
                  color="rgba(226, 232, 240, 0.58)"
                  fontSize="sm"
                  mt={1}
                  css={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.email}
                </Text>
              </Box>
            </HStack>

            <Box borderTop="1px solid" borderColor="rgba(148, 163, 184, 0.14)" pt={4}>
              <HStack justify="space-between" align="center" mb={3}>
                <HStack gap={2} color="rgba(226, 232, 240, 0.68)">
                  <Wallet size={17} />
                  <Text fontSize="sm" fontWeight="semibold">
                    Wallet
                  </Text>
                </HStack>
                {user?.walletAddress ? (
                  <Badge colorPalette="green" borderRadius="full">
                    Connected
                  </Badge>
                ) : (
                  <Badge colorPalette="yellow" borderRadius="full">
                    Needed
                  </Badge>
                )}
              </HStack>
              {user?.walletAddress ? (
                <Text color="white" fontSize="sm" fontWeight="semibold">
                  {shortAddress}
                </Text>
              ) : (
                <Button
                  type="button"
                  onClick={onConnectWallet}
                  size="sm"
                  borderRadius="full"
                  bgGradient="to-r"
                  gradientFrom="cyan.400"
                  gradientTo="blue.500"
                  color="gray.950"
                  fontWeight="bold"
                  w="full"
                >
                  Connect Wallet
                </Button>
              )}
              {walletError ? <Text color="red.300" fontSize="sm" mt={3}>{walletError}</Text> : null}
              {walletSuccess ? <Text color="green.300" fontSize="sm" mt={3}>{walletSuccess}</Text> : null}
            </Box>
          </SidebarCard>

          <SidebarCard
            title="Profile visibility"
            icon={<BadgeCheck size={19} />}
            action={<Pencil size={17} color="rgba(226, 232, 240, 0.58)" />}
          >
            <Text color="rgba(226, 232, 240, 0.66)" fontSize="sm" lineHeight="1.65">
              Wallet verification and stronger proposals will help this profile stand out as the marketplace grows.
            </Text>
            {user?.walletAddress ? (
              <Badge alignSelf="start" colorPalette="green" variant="subtle" borderRadius="full" px={3} py={1}>
                Verification ready
              </Badge>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={onConnectWallet}
                {...subtlePillButtonStyles}
              >
                Connect wallet
              </Button>
            )}
          </SidebarCard>

          <SidebarCard
            title={`Proposals: ${totalBidCountLabel}`}
            icon={<Coins size={19} />}
            action={<ChevronDown size={18} color="rgba(226, 232, 240, 0.58)" />}
          >
            <SimpleGrid columns={2} gap={3}>
              <Box>
                <Text color="cyan.200" fontSize="2xl" fontWeight="bold">
                  {pendingBidCount}
                </Text>
                <Text color="rgba(226, 232, 240, 0.54)" fontSize="sm">
                  Pending
                </Text>
              </Box>
              <Box>
                <Text color="green.200" fontSize="2xl" fontWeight="bold">
                  {acceptedBidCount}
                </Text>
                <Text color="rgba(226, 232, 240, 0.54)" fontSize="sm">
                  Accepted
                </Text>
              </Box>
            </SimpleGrid>
            <Button as={Link} to="/my-bids" size="sm" {...greenPillButtonStyles}>
              View bid pipeline
            </Button>
          </SidebarCard>

          <SidebarCard
            title="Work center"
            icon={<SlidersHorizontal size={19} />}
            action={<ChevronDown size={18} color="rgba(226, 232, 240, 0.58)" />}
          >
            <VStack align="stretch" gap={0}>
              <Box borderBottom="1px solid" borderColor="rgba(148, 163, 184, 0.14)">
                <SidebarRow icon={<Search size={17} />} title="Job feed" detail="Open roles" to="/jobs" />
              </Box>
              <Box borderBottom="1px solid" borderColor="rgba(148, 163, 184, 0.14)">
                <SidebarRow icon={<SendHorizontal size={17} />} title="Proposals" detail={`${pendingBidCount} pending`} to="/my-bids" />
              </Box>
              <SidebarRow icon={<Megaphone size={17} />} title="Project catalog" detail="Soon" muted />
            </VStack>
          </SidebarCard>

          <GlassPanel variant="subtle" borderRadius="24px" p={{ base: 5, md: 6 }}>
            <VStack align="stretch" gap={4}>
              {['Direct contracts', 'Withdrawals', 'Escrow payments'].map((item) => (
                <HStack key={item} justify="space-between" color="rgba(248, 250, 252, 0.86)">
                  <Text fontWeight="semibold">{item}</Text>
                  <Badge colorPalette="purple" variant="subtle" borderRadius="full">
                    Soon
                  </Badge>
                </HStack>
              ))}
            </VStack>
          </GlassPanel>
        </VStack>
      </Grid>
    </PageShell>
  );
};

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
