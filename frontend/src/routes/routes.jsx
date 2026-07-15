import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Jobs from '../pages/Jobs';
import JobDetailPage from '../pages/jobs/JobDetailPage.jsx';
import SubmitProposalPage from '../pages/jobs/SubmitProposalPage.jsx';
import ProposalsPage from '../pages/jobs/ProposalsPage.jsx';
import FreelancerProfilePage from '../pages/profile/FreelancerProfilePage.jsx';
import MyBids from '../pages/MyBids';
import PostJob from '../pages/post-job/PostJob.jsx';

export const privateRoutes = [
  { path: '/dashboard', element: Dashboard },
  { path: '/jobs', element: Jobs },
  { path: '/jobs/:jobId', element: JobDetailPage },
  { path: '/jobs/:jobId/proposal', element: SubmitProposalPage },
  { path: '/jobs/:jobId/proposals', element: ProposalsPage },
  { path: '/freelancers/:userId', element: FreelancerProfilePage },
  { path: '/my-bids', element: MyBids },
  { path: '/post-job', element: PostJob },
  { path: '/post-job/:jobId', element: PostJob },
];

export const publicRoutes = [
  { path: '/login', element: Login },
  { path: '/register', element: Register },
];
