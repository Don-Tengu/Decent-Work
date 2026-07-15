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
      currencyCode
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
      bids {
        id
        status
      }
      createdAt
      publishedAt
      client {
        id
        username
      }
    }
  }
`;

export const GET_JOBS_PAGE = gql`
  query JobsPage(
    $status: JobStatus
    $query: String
    $categoryId: ID
    $categoryIds: [ID!]
    $specialtyIds: [ID!]
    $experienceLevels: [ExperienceLevel!]
    $budgetTypes: [BudgetType!]
    $page: Int
    $size: Int
    $sort: JobSort
  ) {
    jobsPage(
      status: $status
      query: $query
      categoryId: $categoryId
      categoryIds: $categoryIds
      specialtyIds: $specialtyIds
      experienceLevels: $experienceLevels
      budgetTypes: $budgetTypes
      page: $page
      size: $size
      sort: $sort
    ) {
      content {
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
        currencyCode
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
        bids {
          id
          status
        }
        client {
          id
          username
        }
        createdAt
        publishedAt
      }
      totalElements
      totalPages
      page
      size
      hasNext
      hasPrevious
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

export const GET_MY_SAVED_JOBS = gql`
  ${JOB_DETAILS_FRAGMENT}
  query MySavedJobs {
    mySavedJobs {
      ...JobDetails
    }
  }
`;

export const GET_SAVED_JOB_IDS = gql`
  query SavedJobIds {
    savedJobIds
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

export const SAVE_JOB = gql`
  mutation SaveJob($id: ID!) {
    saveJob(id: $id) {
      id
      status
    }
  }
`;

export const UNSAVE_JOB = gql`
  mutation UnsaveJob($id: ID!) {
    unsaveJob(id: $id) {
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
      relevantExperience
      deliveryTime
      status
      attachments {
        id
        fileName
        contentType
        fileSizeBytes
        publicUrl
      }
    }
  }
`;

export const GET_MY_BID_FOR_JOB = gql`
  query MyBidForJob($jobId: ID!) {
    myBidForJob(jobId: $jobId) {
      id
      amount
      proposal
      relevantExperience
      deliveryTime
      status
      createdAt
      attachments {
        id
        fileName
        contentType
        fileSizeBytes
        publicUrl
      }
    }
  }
`;

export const GET_MY_BIDS = gql`
  query MyBids {
    myBids {
      id
      amount
      proposal
      relevantExperience
      deliveryTime
      status
      attachments {
        id
        fileName
        contentType
        fileSizeBytes
        publicUrl
      }
      job {
        id
        title
        status
        budgetType
        hourlyRateMin
        hourlyRateMax
        fixedBudget
        currencyCode
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
      relevantExperience
      deliveryTime
      status
      freelancer {
        id
        username
        role
        walletAddress
        createdAt
        profile {
          fullName
          bio
          skills
          hourlyRate
          profileImage
        }
      }
      createdAt
      attachments {
        id
        fileName
        contentType
        fileSizeBytes
        publicUrl
      }
    }
  }
`;

export const GET_USER = gql`
  query User($id: ID!) {
    user(id: $id) {
      id
      username
      role
      walletAddress
      createdAt
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

export const ACCEPT_BID = gql`
  mutation AcceptBid($bidId: ID!) {
    acceptBid(bidId: $bidId) {
      id
      status
      amount
      job {
        id
        status
      }
    }
  }
`;

export const RELEASE_PAYMENT = gql`
  mutation ReleasePayment($paymentId: ID!) {
    releasePayment(paymentId: $paymentId) {
      id
      status
      job {
        id
        status
      }
    }
  }
`;

export const GET_PAYMENT_FOR_JOB = gql`
  query PaymentForJob($jobId: ID!) {
    paymentForJob(jobId: $jobId) {
      id
      status
      amount
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
