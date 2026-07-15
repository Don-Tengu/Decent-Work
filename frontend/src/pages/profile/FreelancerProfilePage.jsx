import React from 'react';
import { useQuery } from '@apollo/client';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button, Grid, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Coins,
  FolderGit2,
  GraduationCap,
  History,
  LayoutDashboard,
  Star,
  Wallet,
} from 'lucide-react';
import { GET_USER } from '@/graphql/queries.js';
import PageShell from '../../components/ui/PageShell.jsx';
import GlassPanel from '../../components/ui/GlassPanel.jsx';
import SectionEyebrow from '../../components/ui/SectionEyebrow.jsx';
import UserAvatar from '../../components/ui/UserAvatar.jsx';
import SkillTags from '../../components/ui/SkillTags.jsx';
import IconStat from '../../components/ui/IconStat.jsx';
import { quietPillButtonStyles, subtlePillButtonStyles } from '../../components/ui/buttonStyles.js';
import JobsPageState from '../jobs/components/JobsPageState.jsx';
import ComingSoonSection from './components/ComingSoonSection.jsx';
import {
  formatHourlyRate,
  formatMemberSince,
  formatRole,
  getDisplayName,
  shortenAddress,
} from '@/utils/user.js';

const pageAccents = [
  {
    top: '-150px',
    right: '-130px',
    w: '380px',
    h: '380px',
    bg: 'rgba(6, 182, 212, 0.12)',
    filter: 'blur(36px)',
  },
  {
    bottom: '-120px',
    left: '-120px',
    w: '320px',
    h: '320px',
    bg: 'rgba(79, 70, 229, 0.16)',
    filter: 'blur(30px)',
  },
];

// Sections we cannot populate yet — there is no backing data in the model.
// Rendered as styled scaffolds so the page is layout-complete.
const COMING_SOON_SECTIONS = [
  {
    key: 'portfolio',
    label: 'Portfolio',
    icon: FolderGit2,
    description: 'Project showcases will appear here once freelancers can publish their work.',
  },
  {
    key: 'work-history',
    label: 'Work history',
    icon: History,
    description: 'Completed contracts and client feedback will be summarized here.',
  },
  {
    key: 'employment',
    label: 'Employment history',
    icon: Building2,
    description: 'Past roles and companies will appear here when employment history is supported.',
  },
  {
    key: 'education',
    label: 'Education',
    icon: GraduationCap,
    description: 'Degrees and certifications will appear here when education is supported.',
  },
  {
    key: 'reviews',
    label: 'Reviews & ratings',
    icon: Star,
    description: 'Ratings and job-success scores will appear here once reviews are collected.',
  },
];

const getBackTarget = (state) => (typeof state?.from === 'string' ? state.from : '/dashboard');

const FreelancerProfilePage = () => {
  const { userId } = useParams();
  const location = useLocation();
  const backTarget = getBackTarget(location.state);

  const { data, loading, error } = useQuery(GET_USER, {
    variables: { id: userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  const profileUser = data?.user;
  const name = getDisplayName(profileUser);
  const memberSince = formatMemberSince(profileUser?.createdAt);
  const hourlyRate = formatHourlyRate(profileUser?.profile?.hourlyRate);
  const wallet = shortenAddress(profileUser?.walletAddress);
  const bio = profileUser?.profile?.bio?.trim();
  const skills = profileUser?.profile?.skills ?? [];

  return (
    <PageShell accents={pageAccents} maxW="1080px" py={{ base: 5, md: 8 }} px={{ base: 4, lg: 8 }}>
      <VStack align="stretch" gap={6}>
        <HStack
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={4}
          flexWrap="wrap"
        >
          <Button as={Link} to={backTarget} alignSelf="start" px={3} {...quietPillButtonStyles}>
            <ArrowLeft size={18} />
            Back
          </Button>
          <Button as={Link} to="/dashboard" px={6} {...subtlePillButtonStyles}>
            <LayoutDashboard size={17} />
            Dashboard
          </Button>
        </HStack>

        {loading && !profileUser ? (
          <JobsPageState title="Loading profile" description="Fetching this freelancer's profile." />
        ) : null}

        {error ? (
          <JobsPageState title="Unable to load profile" description={error.message} tone="error" />
        ) : null}

        {!loading && !error && !profileUser ? (
          <JobsPageState
            title="Profile not found"
            description="This freelancer may no longer have an account."
          />
        ) : null}

        {profileUser ? (
          <>
            <GlassPanel variant="solid" borderRadius="28px" p={{ base: 6, md: 8 }}>
              <Grid templateColumns={{ base: '1fr', md: 'auto 1fr' }} gap={{ base: 5, md: 7 }} alignItems="start">
                <UserAvatar user={profileUser} size="2xl" justifySelf={{ base: 'start', md: 'center' }} />
                <VStack align="stretch" gap={4} minW="0">
                  <VStack align="stretch" gap={1}>
                    <Heading color="white" size={{ base: 'xl', md: '2xl' }} letterSpacing="-0.02em">
                      {name}
                    </Heading>
                    <Text color="cyan.200" fontWeight="medium">
                      {formatRole(profileUser.role)}
                    </Text>
                  </VStack>

                  <HStack gap={{ base: 4, md: 6 }} flexWrap="wrap">
                    {hourlyRate ? <IconStat icon={Coins}>{hourlyRate}</IconStat> : null}
                    {memberSince ? <IconStat icon={CalendarDays}>{memberSince}</IconStat> : null}
                    {wallet ? <IconStat icon={Wallet}>{wallet}</IconStat> : null}
                  </HStack>

                  {bio ? (
                    <Text
                      color="rgba(226, 232, 240, 0.78)"
                      lineHeight="1.8"
                      whiteSpace="pre-line"
                      overflowWrap="anywhere"
                    >
                      {bio}
                    </Text>
                  ) : (
                    <Text color="rgba(226, 232, 240, 0.5)" fontSize="sm">
                      This freelancer hasn&apos;t added an overview yet.
                    </Text>
                  )}
                </VStack>
              </Grid>
            </GlassPanel>

            <GlassPanel variant="subtle" borderRadius="24px" p={{ base: 6, md: 8 }}>
              <VStack align="stretch" gap={4}>
                <SectionEyebrow label="Skills" />
                <SkillTags skills={skills} emptyLabel="This freelancer hasn't listed any skills yet." />
              </VStack>
            </GlassPanel>

            {COMING_SOON_SECTIONS.map((section) => (
              <ComingSoonSection
                key={section.key}
                label={section.label}
                icon={section.icon}
                description={section.description}
              />
            ))}
          </>
        ) : null}
      </VStack>
    </PageShell>
  );
};

export default FreelancerProfilePage;
