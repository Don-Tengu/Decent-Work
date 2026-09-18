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
  BadgeCheck,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  Coins,
  Ellipsis,
  FilePenLine,
  Heart,
  LoaderCircle,
  Megaphone,
  Pencil,
  Plus,
  Search,
  SendHorizontal,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import GlassPanel from '../components/ui/GlassPanel';
import PageShell from '../components/ui/PageShell';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import NotificationBell from '../components/ui/NotificationBell.jsx';
import { pageAccents } from '@/common.js';
import {
  greenPillButtonStyles,
  greenSolidButtonStyles,
  subtlePillButtonStyles,
  textUnderlineButtonStyles,
  yellowPillButtonStyles,
} from '../components/ui/buttonStyles.js';
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
import { getFreelancerWorkFlags } from './jobs/paymentActions.js';
import {
  addressesEqual,
  connectWallet,
  subscribeToWalletAccounts,
} from '../utils/web3';
import JobResultCard from './jobs/components/JobResultCard.jsx';
import WalletConnectionCard from '../components/ui/WalletConnectionCard.jsx';
import { WEB3_CONFIG } from '../config/web3.js';

// All client-visible lifecycle stages except CANCELLED (soft-deleted / removed).
const MY_JOBS_VARIABLES = {
  statuses: ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED'],
};

const JOB_STATUS_META = {
  DRAFT: {
    label: 'Draft job post',
    shortLabel: 'Draft',
    colorPalette: 'yellow',
    icon: FilePenLine,
    iconBg: 'rgba(250, 204, 21, 0.14)',
    iconColor: 'yellow.200',
    hoverBorder: 'rgba(250, 204, 21, 0.28)',
  },
  OPEN: {
    label: 'Open job post',
    shortLabel: 'Open',
    colorPalette: 'green',
    icon: BriefcaseBusiness,
    iconBg: 'bg.muted',
    iconColor: 'fg.default',
    hoverBorder: 'border.default',
  },
  IN_PROGRESS: {
    label: 'In progress',
    shortLabel: 'In progress',
    colorPalette: 'cyan',
    icon: LoaderCircle,
    iconBg: 'bg.muted',
    iconColor: 'fg.default',
    hoverBorder: 'border.default',
  },
  COMPLETED: {
    label: 'Completed',
    shortLabel: 'Completed',
    colorPalette: 'gray',
    icon: BadgeCheck,
    iconBg: 'bg.muted',
    iconColor: 'fg.muted',
    hoverBorder: 'rgba(148, 163, 184, 0.28)',
  },
};

// Dashboard sections — order is intentional: active contracts first, then hiring, drafts, history.
const CLIENT_JOB_SECTIONS = [
  {
    key: 'IN_PROGRESS',
    statuses: ['IN_PROGRESS'],
    title: 'In progress',
    description: 'Active contracts. Review submitted work or release payment when you are ready.',
    showPostCard: false,
  },
  {
    key: 'OPEN',
    statuses: ['OPEN'],
    title: 'Open for proposals',
    description: 'Jobs still accepting freelancers. Review offers and hire when ready.',
    showPostCard: true,
  },
  {
    key: 'DRAFT',
    statuses: ['DRAFT'],
    title: 'Drafts',
    description: 'Unfinished posts you can continue anytime.',
    showPostCard: false,
  },
  {
    key: 'COMPLETED',
    statuses: ['COMPLETED'],
    title: 'Completed',
    description: 'Finished jobs and released payments stay here for reference.',
    showPostCard: false,
  },
];

const sortJobsByRecent = (jobs) =>
  [...jobs].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

const groupClientJobs = (jobs) =>
  CLIENT_JOB_SECTIONS.map((section) => ({
    ...section,
    jobs: sortJobsByRecent(jobs.filter((job) => section.statuses.includes(job.status))),
  })).filter((section) => section.jobs.length > 0);

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
  const pendingBids = (job.bids ?? []).filter((bid) => bid.status === 'PENDING').length;

  if (job.status === 'DRAFT') {
    return getDraftCardCopy(job).message;
  }

  if (job.status === 'IN_PROGRESS') {
    return 'A freelancer is hired. Open the contract to review submitted work, request changes, or release payment.';
  }

  if (job.status === 'COMPLETED') {
    return description
      ? `Completed. ${description}`
      : 'This job is complete and payment has been released.';
  }

  if (job.status === 'OPEN') {
    if (pendingBids > 0) {
      return pendingBids === 1
        ? '1 proposal waiting for your review.'
        : `${pendingBids} proposals waiting for your review.`;
    }
    return description || 'No proposals yet — freelancers can still find this open posting.';
  }

  return description || 'Review this job on your dashboard.';
};

const getJobCardActionLabel = (job) => {
  if (job.status === 'DRAFT') {
    return getDraftCardCopy(job).actionLabel;
  }
  if (job.status === 'IN_PROGRESS') {
    return 'Manage contract';
  }
  if (job.status === 'COMPLETED') {
    return 'View details';
  }
  return 'View proposals';
};

const getJobCardButtonStyles = (job) => {
  if (job.status === 'DRAFT') {
    return yellowPillButtonStyles;
  }
  if (job.status === 'COMPLETED') {
    return subtlePillButtonStyles;
  }
  return greenPillButtonStyles;
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
              bg="bg.muted"
              color="fg.muted"
              flex="0 0 auto"
            >
              {icon}
            </Box>
          ) : null}
          <Heading as="h3" size="sm" color="fg.default" lineHeight="1.25">
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
      color={muted ? 'fg.subtle' : 'fg.default'}
      transition="color 0.2s ease"
      _hover={to ? { color: 'fg.default' } : undefined}
    >
      <HStack gap={3} minW="0">
        <Box color={muted ? 'rgba(148, 163, 184, 0.46)' : 'fg.muted'} flex="0 0 auto">
          {icon}
        </Box>
        <Box minW="0">
          <Text fontWeight="semibold" lineHeight="1.2">
            {title}
          </Text>
          {detail ? (
            <Text color="fg.subtle" fontSize="sm" mt={1}>
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
        borderColor="border.default"
        borderRadius="12px"
        bg="bg.muted"
        color="fg.muted"
        transition="all 0.2s ease"
        _focusWithin={{
          borderColor: 'ink.900',
          bg: 'bg.muted',
          color: 'fg.default',
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
          bg="bg.muted"
          color="fg.default"
          fontWeight="medium"
          fontSize="sm"
          _placeholder={{ color: 'fg.subtle' }}
          _focus={{ outline: 'none', bg: 'bg.muted' }}
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
        color: tab.active ? 'fg.default' : 'fg.subtle',
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
              bg: 'ink.900',
            }
          : undefined,
        _hover: { color: 'fg.default' },
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
        bg="bg.muted"
        border="1px solid"
        borderColor="border.default"
        color="fg.muted"
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
        bg="ink.900"
        color="paper.100"
        boxShadow="none"
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
        bg="bg.muted"
        color="fg.default"
        border="1px solid"
        borderColor="border.default"
      >
        <SendHorizontal size={20} />
      </Box>
    </Box>

    <VStack gap={2} maxW="660px">
      <Heading as="h2" size={{ base: 'md', md: 'lg' }} color="fg.default" letterSpacing="0">
        Keep track of jobs you are interested in.
      </Heading>
      <Text color="fg.muted" fontSize={{ base: 'sm', md: 'md' }} lineHeight="1.7">
        No saved jobs yet. Browse open work now, then keep active conversations organized from your bid pipeline.
      </Text>
    </VStack>

    <HStack gap={3} flexWrap="wrap" justify="center">
      <Button
        as={Link}
        to="/jobs"
        {...greenSolidButtonStyles}
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
      <Heading size="md" color="fg.default">
        {title}
      </Heading>
      <Text color={tone === 'error' ? 'red.700' : 'fg.muted'} maxW="560px">
        {description}
      </Text>
    </VStack>
  </GlassPanel>
);

const JobStatusLabel = ({ status }) => {
  const meta = JOB_STATUS_META[status] ?? JOB_STATUS_META.OPEN;

  return (
    <Badge
      alignSelf="start"
      variant="outline"
      color="fg.default"
      borderColor="border.default"
      bg="transparent"
      px={3}
      py={1}
      borderRadius="8px"
      fontWeight="medium"
    >
      {meta.label}
    </Badge>
  );
};

const menuItemStyles = {
  borderRadius: '8px',
  color: 'fg.default',
  cursor: 'pointer',
  fontWeight: 'medium',
  px: 3,
  py: 2.5,
  _highlighted: {
    bg: 'paper.200',
    color: 'fg.default',
  },
  _hover: {
    bg: 'paper.200',
    color: 'fg.default',
  },
};

const destructiveMenuItemStyles = {
  ...menuItemStyles,
  color: 'red.700',
  _highlighted: {
    bg: 'paper.200',
    color: 'red.700',
  },
  _hover: {
    bg: 'paper.200',
    color: 'red.700',
  },
};

const JobActionsMenu = ({ job, onEditDraft, onEditPosting, onRemove, onViewProposals }) => {
  const status = job.status;
  const isDraft = status === 'DRAFT';
  const isOpen = status === 'OPEN';
  const isInProgress = status === 'IN_PROGRESS';
  const isCompleted = status === 'COMPLETED';

  return (
    <Menu.Root positioning={{ placement: 'bottom-end', gutter: 10 }}>
      <Menu.Trigger asChild>
        <IconButton
          aria-label={`Actions for ${getJobTitle(job)}`}
          type="button"
          variant="plain"
          bg="paper.200"
          color="ink.900"
          borderRadius="full"
          size="sm"
          _hover={{ bg: 'paper.300', color: 'ink.900' }}
          _active={{ bg: 'paper.200', color: 'ink.900' }}
          _open={{ bg: 'paper.300', color: 'ink.900' }}
          _expanded={{ bg: 'paper.300', color: 'ink.900' }}
        >
          <Ellipsis size={20} />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            bg="bg.canvas"
            border="1px solid"
            borderColor="border.default"
            borderRadius="12px"
            boxShadow="0 12px 32px rgba(20, 20, 19, 0.1)"
            color="fg.default"
            minW="210px"
            p={2}
            zIndex="popover"
          >
            <Menu.Arrow>
              <Menu.ArrowTip bg="bg.canvas" borderColor="border.default" />
            </Menu.Arrow>
            {isDraft ? (
              <>
                <Menu.Item value={`edit-draft-${job.id}`} onClick={() => onEditDraft(job)} {...menuItemStyles}>
                  Edit draft
                </Menu.Item>
                <Menu.Item
                  value={`remove-draft-${job.id}`}
                  onClick={() => onRemove(job)}
                  {...destructiveMenuItemStyles}
                >
                  Remove draft
                </Menu.Item>
              </>
            ) : null}
            {isOpen ? (
              <>
                <Menu.Item
                  value={`view-proposals-${job.id}`}
                  onClick={() => onViewProposals(job)}
                  {...menuItemStyles}
                >
                  View proposals
                </Menu.Item>
                <Menu.Item
                  value={`edit-posting-${job.id}`}
                  onClick={() => onEditPosting(job)}
                  {...menuItemStyles}
                >
                  Edit posting
                </Menu.Item>
                <Menu.Item
                  value={`remove-posting-${job.id}`}
                  onClick={() => onRemove(job)}
                  {...destructiveMenuItemStyles}
                >
                  Remove posting
                </Menu.Item>
              </>
            ) : null}
            {isInProgress ? (
              <Menu.Item
                value={`manage-contract-${job.id}`}
                onClick={() => onViewProposals(job)}
                {...menuItemStyles}
              >
                Manage contract
              </Menu.Item>
            ) : null}
            {isCompleted ? (
              <Menu.Item
                value={`view-details-${job.id}`}
                onClick={() => onViewProposals(job)}
                {...menuItemStyles}
              >
                View details
              </Menu.Item>
            ) : null}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

const ClientJobCard = ({ job, onEditDraft, onEditPosting, onRemove, onViewProposals }) => {
  const isDraft = job.status === 'DRAFT';
  const meta = JOB_STATUS_META[job.status] ?? JOB_STATUS_META.OPEN;
  const StatusIcon = meta.icon;
  const actionLabel = getJobCardActionLabel(job);
  const buttonStyles = getJobCardButtonStyles(job);

  return (
    <GlassPanel
      data-client-job-card
      variant="subtle"
      borderRadius="24px"
      p={{ base: 5, md: 6 }}
      minH={{ base: '280px', md: '300px' }}
      h="full"
      minW="0"
      transition="border-color 0.15s ease"
      _hover={{
        borderColor: 'ink.900',
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
              bg={meta.iconBg}
              color={meta.iconColor}
              flex="0 0 auto"
            >
              <StatusIcon size={22} />
            </Box>
            <Heading
              as="h3"
              size="sm"
              color="fg.default"
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
            onEditDraft={onEditDraft}
            onEditPosting={onEditPosting}
            onRemove={onRemove}
            onViewProposals={onViewProposals}
          />
        </HStack>

        <JobStatusLabel status={job.status} />

        <Text
          color="fg.default"
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

        <Text color="fg.subtle" fontSize="sm" mt="-2">
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
              {...buttonStyles}
            >
              <HStack gap={2}>
                <span>{actionLabel}</span>
              </HStack>
            </Button>
          ) : (
            <Button
              type="button"
              w="full"
              fontWeight="600"
              h="42px"
              onClick={() => onViewProposals(job)}
              {...buttonStyles}
            >
              <HStack gap={2}>
                <span>{actionLabel}</span>
              </HStack>
            </Button>
          )}
        </Box>
      </VStack>
    </GlassPanel>
  );
};

const ClientJobSection = ({
  section,
  onEditDraft,
  onEditPosting,
  onRemove,
  onViewProposals,
}) => {
  const meta = JOB_STATUS_META[section.key] ?? JOB_STATUS_META.OPEN;

  return (
    <VStack as="section" align="stretch" gap={4} aria-labelledby={`client-jobs-${section.key}`}>
      <HStack justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} flexWrap="wrap">
        <Box minW="0">
          <HStack gap={3} align="center" flexWrap="wrap" mb={1.5}>
            <Heading
              as="h2"
              id={`client-jobs-${section.key}`}
              color="fg.default"
              size="lg"
              letterSpacing="-0.02em"
            >
              {section.title}
            </Heading>
            <Badge
              variant="outline"
              color="fg.muted"
              borderColor="border.default"
              bg="transparent"
              borderRadius="8px"
              px={2.5}
              py={0.5}
              fontWeight="medium"
            >
              {section.jobs.length}
            </Badge>
          </HStack>
          <Text color="fg.muted" fontSize="sm" maxW="640px">
            {section.description}
          </Text>
        </Box>
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={5}>
        {section.jobs.map((job) => (
          <ClientJobCard
            key={job.id}
            job={job}
            onEditDraft={onEditDraft}
            onEditPosting={onEditPosting}
            onRemove={onRemove}
            onViewProposals={onViewProposals}
          />
        ))}
      </SimpleGrid>
    </VStack>
  );
};

const RemoveJobDialog = ({ job, loading, error, onClose, onConfirm }) => {
  const isDraft = job?.status === 'DRAFT';
  const jobTitle = job ? getJobTitle(job) : 'this job';
  const meta = JOB_STATUS_META[job?.status] ?? JOB_STATUS_META.OPEN;
  const actionLabel = isDraft ? 'Remove draft' : 'Remove posting';
  const description = isDraft
    ? `Remove "${jobTitle}" from your dashboard? This draft will be deleted and cannot be continued later.`
    : `Remove "${jobTitle}" from your open postings? Freelancers will no longer see it as an active job.`;

  return (
    <ConfirmDialog
      open={!!job}
      headerBadge={{ label: meta.label, colorPalette: meta.colorPalette }}
      title={`${actionLabel}?`}
      description={description}
      confirmLabel={actionLabel}
      cancelLabel="Keep job"
      
      loading={loading}
      error={error}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
};

const ClientDashboard = ({
  user,
  walletConnecting,
  walletError,
  walletSuccess,
  onConnectWallet,
  onLogout,
}) => {
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
  const jobSections = React.useMemo(() => groupClientJobs(jobs), [jobs]);

  const handleEditDraft = (job) => {
    navigate(`/post-job/${job.id}`);
  };

  const handleEditPosting = (job) => {
    navigate(`/post-job/${job.id}?mode=edit-posting`);
  };

  const handleRemove = (job) => {
    // Only drafts and open postings can be removed from the dashboard.
    if (job.status !== 'DRAFT' && job.status !== 'OPEN') {
      return;
    }
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

  const chainHint = WEB3_CONFIG.chainName
    ? `${WEB3_CONFIG.chainName} (chain ${WEB3_CONFIG.chainId})`
    : 'Local Anvil for MVP escrow';

  return (
    <PageShell accents={pageAccents} maxW="1120px" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={10}>
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', lg: 'start' }}
          gap={6}
        >
          <Box flex="1" minW="0">
            <Heading
              as="h1"
              color="fg.default"
              size={{ base: 'xl', md: '2xl' }}
              letterSpacing="-0.02em"
              lineHeight="1.2"
            >
              Good day, {user?.username}
            </Heading>
            <Text color="fg.muted" fontSize="md" mt={3} maxW="34rem">
              Track drafts, open posts, active contracts, and completed work in one place.
            </Text>
          </Box>

          <HStack gap={4} justify={{ base: 'stretch', md: 'flex-end' }} flexWrap="wrap" flexShrink={0}>
            <NotificationBell />
            <Button type="button" onClick={onLogout} {...textUnderlineButtonStyles}>
              Logout
            </Button>
            <Button as={Link} to="/post-job" px={5} {...greenSolidButtonStyles}>
              <HStack gap={2}>
                <Plus size={18} />
                <span>Post a job</span>
              </HStack>
            </Button>
          </HStack>
        </Stack>

        {user?.walletAddress ? (
          <WalletConnectionCard
            variant="compact"
            walletAddress={user?.walletAddress}
            connecting={walletConnecting}
            error={walletError}
            success={walletSuccess}
            onConnect={onConnectWallet}
            roleHint="client"
            chainHint={chainHint}
          />
        ) : null}

        {/* Full guidance card when escrow wallet is still missing */}
        {!user?.walletAddress ? (
          <WalletConnectionCard
            variant="card"
            walletAddress={user?.walletAddress}
            connecting={walletConnecting}
            error={walletError}
            success={walletSuccess}
            onConnect={onConnectWallet}
            roleHint="client"
            chainHint={chainHint}
          />
        ) : null}

        {loading && !data ? (
          <PageState
            title="Loading jobs"
            description="We are pulling your drafts, open posts, and contracts."
          />
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
                color="fg.muted"
              >
                <ClipboardList size={28} />
              </Box>
              <VStack gap={2}>
                <Heading color="fg.default" size="md">
                  No jobs yet
                </Heading>
                <Text color="fg.muted" maxW="560px">
                  Start a job post or save a draft. Open posts, active contracts, and completed work
                  will all appear here.
                </Text>
              </VStack>
              <Button as={Link} to="/post-job" {...greenSolidButtonStyles}>
                Post a job
              </Button>
            </VStack>
          </GlassPanel>
        ) : null}

        {!error && jobSections.length > 0 ? (
          <VStack align="stretch" gap={10}>
            {jobSections.map((section) => (
              <ClientJobSection
                key={section.key}
                section={section}
                onEditDraft={handleEditDraft}
                onEditPosting={handleEditPosting}
                onRemove={handleRemove}
                onViewProposals={handleViewProposals}
              />
            ))}
          </VStack>
        ) : null}

        {deletingJob ? (
          <Text color="fg.muted" fontSize="sm">
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
  walletConnecting,
  walletError,
  walletSuccess,
  onConnectWallet,
  onLogout,
}) => {
  const chainHint = WEB3_CONFIG.chainName
    ? `${WEB3_CONFIG.chainName} (chain ${WEB3_CONFIG.chainId})`
    : 'Local Anvil for MVP escrow';
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
  const offeredBidCount = bids.filter((bid) => bid.status === 'OFFERED').length;
  const acceptedBidCount = bids.filter((bid) => bid.status === 'ACCEPTED').length;
  const offeredBids = bids.filter((bid) => bid.status === 'OFFERED');
  const activeContractBids = bids.filter((bid) => bid.status === 'ACCEPTED');
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
              <Text color="fg.muted" fontSize="sm" fontWeight="medium" mb={2}>
                Freelancer Workspace
              </Text>
              <Heading as="h1" size={{ base: 'xl', md: '2xl' }} color="fg.default" letterSpacing="0" lineHeight="1.08">
                Good day, {user?.username}
              </Heading>
            </Box>
            <HStack gap={3} justify={{ base: 'stretch', md: 'flex-end' }}>
              <NotificationBell />
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
                flex={{ base: 1, sm: '0 0 auto' }}
                {...subtlePillButtonStyles}
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

              {offeredBids.length > 0 ? (
                <VStack align="stretch" gap={3}>
                  <Heading as="h2" size="lg" color="fg.default" letterSpacing="0">
                    Offers awaiting response
                  </Heading>
                  <Text color="fg.muted" fontSize="sm">
                    Clients sent you offers. Accept or decline from My proposals — these jobs may no longer
                    appear in open-job search after you accept.
                  </Text>
                  <VStack align="stretch" gap={3}>
                    {offeredBids.map((bid) => (
                      <GlassPanel key={bid.id} variant="subtle" borderRadius="18px" p={4}>
                        <HStack justify="space-between" align="center" gap={4} flexWrap="wrap">
                          <Box minW="0">
                            <Text color="fg.default" fontWeight="bold">
                              {bid.job?.title || 'Job offer'}
                            </Text>
                            <Text color="fg.muted" fontSize="sm" mt={1}>
                              Offer received · respond in My proposals
                            </Text>
                          </Box>
                          <Button as={Link} to="/my-bids" size="sm" {...greenPillButtonStyles}>
                            Review offer
                          </Button>
                        </HStack>
                      </GlassPanel>
                    ))}
                  </VStack>
                </VStack>
              ) : null}

              {activeContractBids.length > 0 ? (
                <VStack align="stretch" gap={3}>
                  <Heading as="h2" size="lg" color="fg.default" letterSpacing="0">
                    Active contracts
                  </Heading>
                  <VStack align="stretch" gap={3}>
                    {activeContractBids.map((bid) => {
                      const { canSubmitWork, awaitingReview, changesRequested, contractCopy } =
                        getFreelancerWorkFlags(bid);
                      return (
                        <GlassPanel key={bid.id} variant="subtle" borderRadius="18px" p={4}>
                          <HStack justify="space-between" align="center" gap={4} flexWrap="wrap">
                            <Box minW="0">
                              <Text color="fg.default" fontWeight="bold">
                                {bid.job?.title || 'Contract'}
                              </Text>
                              <Text
                                color="fg.muted"
                                fontSize="sm"
                                mt={1}
                              >
                                {contractCopy || 'In progress · hired'}
                              </Text>
                            </Box>
                            <Button
                              as={Link}
                              to={canSubmitWork || awaitingReview ? '/my-bids' : `/jobs/${bid.job.id}`}
                              size="sm"
                              {...(canSubmitWork ? greenPillButtonStyles : subtlePillButtonStyles)}
                            >
                              {canSubmitWork ? 'Submit work' : awaitingReview ? 'Awaiting review' : 'View job'}
                            </Button>
                          </HStack>
                        </GlassPanel>
                      );
                    })}
                  </VStack>
                </VStack>
              ) : null}

              <VStack align="stretch" gap={5}>
                <Heading as="h2" size="lg" color="fg.default" letterSpacing="0">
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
          >
            <HStack align="center" gap={4}>
              <Avatar.Root size="lg" bg="ink.900" color="paper.100">
                <Avatar.Fallback name={user?.username} />
              </Avatar.Root>
              <Box minW="0">
                <Text color="fg.default" fontWeight="bold" lineHeight="1.2">
                  {user?.username}
                </Text>
                <Text
                  color="fg.muted"
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
          </SidebarCard>

          <WalletConnectionCard
            variant="card"
            walletAddress={user?.walletAddress}
            connecting={walletConnecting}
            error={walletError}
            success={walletSuccess}
            onConnect={onConnectWallet}
            roleHint="freelancer"
            chainHint={chainHint}
          />

          <SidebarCard
            title="Profile visibility"
            icon={<BadgeCheck size={19} />}
            action={<Pencil size={17} color="fg.muted" />}
          >
            <Text color="fg.muted" fontSize="sm" lineHeight="1.65">
              Connecting a wallet unlocks on-chain escrow payouts and helps clients trust your profile.
            </Text>
          </SidebarCard>

          <SidebarCard
            title={`Proposals: ${totalBidCountLabel}`}
            icon={<Coins size={19} />}
            action={<ChevronDown size={18} color="fg.muted" />}
          >
            <SimpleGrid columns={3} gap={3}>
              <Box>
                <Text color="fg.default" fontSize="2xl" fontWeight="bold">
                  {pendingBidCount}
                </Text>
                <Text color="fg.subtle" fontSize="sm">
                  Pending
                </Text>
              </Box>
              <Box>
                <Text color="fg.muted" fontSize="2xl" fontWeight="bold">
                  {offeredBidCount}
                </Text>
                <Text color="fg.subtle" fontSize="sm">
                  Offers
                </Text>
              </Box>
              <Box>
                <Text color="fg.muted" fontSize="2xl" fontWeight="bold">
                  {acceptedBidCount}
                </Text>
                <Text color="fg.subtle" fontSize="sm">
                  Hired
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
            action={<ChevronDown size={18} color="fg.muted" />}
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
                <HStack key={item} justify="space-between" color="fg.muted">
                  <Text fontWeight="medium">{item}</Text>
                  <Text fontSize="sm" color="fg.subtle">
                    Soon
                  </Text>
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
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [connectWalletMutation] = useMutation(CONNECT_WALLET);
  const [walletError, setWalletError] = React.useState('');
  const [walletSuccess, setWalletSuccess] = React.useState('');
  const [walletConnecting, setWalletConnecting] = React.useState(false);

  const persistWalletAddress = React.useCallback(
    async (address, { silent = false } = {}) => {
      if (!address) {
        if (!silent) {
          setWalletError('No wallet account was selected in MetaMask.');
        }
        return null;
      }

      const { data } = await connectWalletMutation({
        variables: { walletAddress: address },
      });
      const nextAddress = data?.connectWallet?.walletAddress || address;
      updateUser?.({ walletAddress: nextAddress });
      return nextAddress;
    },
    [connectWalletMutation, updateUser]
  );

  const handleConnectWallet = async () => {
    setWalletError('');
    setWalletSuccess('');
    setWalletConnecting(true);
    const previous = user?.walletAddress || null;

    try {
      // First visit: eth_requestAccounts already opens MetaMask.
      // Already linked: force wallet_requestPermissions so Switch wallet re-prompts
      // (same dialog UX as a fresh browser).
      const forcePermissionPrompt = Boolean(previous);
      const { address } = await connectWallet({ forcePermissionPrompt });
      const nextAddress = await persistWalletAddress(address);

      if (!nextAddress) {
        return;
      }

      if (previous && addressesEqual(previous, nextAddress)) {
        setWalletSuccess(
          `Still using ${nextAddress.slice(0, 6)}…${nextAddress.slice(-4)}. Pick another account in MetaMask if you meant to switch.`
        );
      } else if (previous) {
        setWalletSuccess(
          `Wallet switched to ${nextAddress.slice(0, 6)}…${nextAddress.slice(-4)}`
        );
      } else {
        setWalletSuccess(
          `Wallet connected: ${nextAddress.slice(0, 6)}…${nextAddress.slice(-4)}`
        );
      }
    } catch (error) {
      const message = error?.message || 'Unknown error';
      if (/MetaMask is not installed/i.test(message)) {
        setWalletError('MetaMask is not installed. Install the extension, then try again.');
      } else if (
        error?.code === 4001 ||
        error?.error?.code === 4001 ||
        /user rejected|denied|ACTION_REJECTED/i.test(message)
      ) {
        setWalletError('Connection cancelled in MetaMask. Approve the request to continue.');
      } else {
        setWalletError(`Failed to connect wallet: ${message}`);
      }
    } finally {
      setWalletConnecting(false);
    }
  };

  // Keep profile wallet in sync when the user changes account in MetaMask.
  React.useEffect(() => {
    if (!user) {
      return undefined;
    }

    return subscribeToWalletAccounts((address) => {
      if (!address) {
        setWalletSuccess('');
        setWalletError(
          'MetaMask disconnected this site. Click Connect wallet to link an account again.'
        );
        return;
      }

      if (addressesEqual(address, user.walletAddress)) {
        return;
      }

      void (async () => {
        try {
          setWalletError('');
          const next = await persistWalletAddress(address, { silent: true });
          if (next) {
            setWalletSuccess(
              `Wallet updated from MetaMask: ${next.slice(0, 6)}…${next.slice(-4)}`
            );
          }
        } catch (error) {
          setWalletError(
            `Could not sync MetaMask account: ${error?.message || 'Unknown error'}`
          );
        }
      })();
    });
  }, [user, persistWalletAddress]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const walletProps = {
    walletConnecting,
    walletError,
    walletSuccess,
    onConnectWallet: handleConnectWallet,
  };

  if (user?.role === 'CLIENT') {
    return <ClientDashboard user={user} onLogout={handleLogout} {...walletProps} />;
  }

  return (
    <FreelancerDashboard user={user} onLogout={handleLogout} {...walletProps} />
  );
};

export default Dashboard;
