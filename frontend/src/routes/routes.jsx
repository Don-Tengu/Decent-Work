import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Jobs from '../pages/Jobs';
import MyBids from '../pages/MyBids';
import PostJob from '../pages/post-job/PostJob.jsx';

export const privateRoutes = [
  { path: '/dashboard', element: Dashboard },
  { path: '/jobs', element: Jobs },
  { path: '/my-bids', element: MyBids },
  { path: '/post-job', element: PostJob },
  { path: '/post-job/:jobId', element: PostJob },
];

export const publicRoutes = [
  { path: '/login', element: Login },
  { path: '/register', element: Register },
];
