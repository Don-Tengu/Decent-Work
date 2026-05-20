import { gql } from '@apollo/client';

const JOB_DETAILS_FRAGMENT = gql`
  fragment JobDetails on Job {
    id
    title
    description
    status
    draftStep
    scopeSize
    scopeDurationAmount
    scopeDurationUnit
    scopeDurationDays
    experienceLevel
    contractToHire
    budgetType
    hourlyRateMin
    hourlyRateMax
    fixedBudget
    currencyCode
    paymentModel
    category {
      id
      name
    }
    specialty {
      id
      name
    }
    jobSkillTags {
      id
      skillId
      name
      custom
      displayOrder
      skill {
        id
        name
      }
    }
    attachments {
      id
      fileName
      contentType
      fileSizeBytes
      publicUrl
    }
    bids {
      id
      status
    }
    client {
      id
      username
    }
    createdAt
    updatedAt
    publishedAt
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        username
        role
      }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        username
        role
        walletAddress
      }
    }
  }
`;

export const GET_ME = gql`
  query Me {
    me {
      id
      email
      username
      role
      walletAddress
      profile {
        fullName
        bio
        skills
        hourlyRate
        profileImage
      }
    }
  }
`;

export const GET_JOBS = gql`
  query Jobs($status: JobStatus, $limit: Int, $offset: Int) {
    jobs(status: $status, limit: $limit, offset: $offset) {
      id
      title
      description
      status
      scopeSize
      scopeDurationAmount
      scopeDurationUnit
      scopeDurationDays
      experienceLevel
      budgetType
      hourlyRateMin
      hourlyRateMax
      fixedBudget
      createdAt
      client {
        id
        username
      }
    }
  }
`;

export const GET_MY_JOBS = gql`
  ${JOB_DETAILS_FRAGMENT}
  query MyJobs($statuses: [JobStatus!]) {
    myJobs(statuses: $statuses) {
      ...JobDetails
    }
  }
`;

export const GET_JOB = gql`
  ${JOB_DETAILS_FRAGMENT}
  query Job($id: ID!) {
    job(id: $id) {
      ...JobDetails
    }
  }
`;

export const GET_SKILLS = gql`
  query Skills($query: String, $limit: Int) {
    skills(query: $query, limit: $limit) {
      id
      name
      slug
      isVerified
    }
  }
`;

export const GET_SKILL_TAXONOMY = gql`
  query SkillTaxonomy {
    skillTaxonomy {
      id
      name
      slug
      level
      displayOrder
      parent {
        id
        name
        displayOrder
        parent {
          id
        }
      }
    }
  }
`;

export const CREATE_JOB = gql`
  ${JOB_DETAILS_FRAGMENT}
  mutation CreateJob($input: CreateJobInput!) {
    createJob(input: $input) {
      ...JobDetails
    }
  }
`;

export const SAVE_JOB_DRAFT = gql`
  ${JOB_DETAILS_FRAGMENT}
  mutation SaveJobDraft($id: ID, $input: SaveJobDraftInput!) {
    saveJobDraft(id: $id, input: $input) {
      ...JobDetails
    }
  }
`;

export const PUBLISH_JOB = gql`
  ${JOB_DETAILS_FRAGMENT}
  mutation PublishJob($id: ID, $input: CreateJobInput!) {
    publishJob(id: $id, input: $input) {
      ...JobDetails
    }
  }
`;

export const UPDATE_JOB = gql`
  ${JOB_DETAILS_FRAGMENT}
  mutation UpdateJob($id: ID!, $input: UpdateJobInput!) {
    updateJob(id: $id, input: $input) {
      ...JobDetails
    }
  }
`;

export const CANCEL_JOB = gql`
  mutation CancelJob($id: ID!) {
    cancelJob(id: $id) {
      id
      status
    }
  }
`;

export const PLACE_BID = gql`
  mutation PlaceBid($input: PlaceBidInput!) {
    placeBid(input: $input) {
      id
      amount
      proposal
      deliveryTime
      status
    }
  }
`;

export const GET_MY_BIDS = gql`
  query MyBids {
    myBids {
      id
      amount
      proposal
      deliveryTime
      status
      job {
        id
        title
        budgetType
        hourlyRateMin
        hourlyRateMax
        fixedBudget
      }
    }
  }
`;

export const GET_JOB_BIDS = gql`
  query JobBids($jobId: ID!) {
    jobBids(jobId: $jobId) {
      id
      amount
      proposal
      deliveryTime
      status
      freelancer {
        id
        username
      }
      createdAt
    }
  }
`;

export const CONNECT_WALLET = gql`
  mutation ConnectWallet($walletAddress: String!) {
    connectWallet(walletAddress: $walletAddress) {
      id
      walletAddress
    }
  }
`;
