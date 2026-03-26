import { createBrowserRouter, Navigate } from 'react-router';
import { Login } from './pages/Login';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { SearchAlumni } from './pages/student/SearchAlumni';
import { AlumniProfile } from './pages/student/AlumniProfile';
import { MyQueries } from './pages/student/MyQueries';
import { ChatPage as StudentChatPage } from './pages/student/ChatPage';
import { AlumniDashboard } from './pages/alumni/AlumniDashboard';
import { AlumniQueries } from './pages/alumni/AlumniQueries';
import { CareerPage } from './pages/alumni/CareerPage';
import { JobPage } from './pages/alumni/JobPage';
import { ChatPage as AlumniChatPage } from './pages/alumni/ChatPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EventsPage } from './pages/EventsPage';
import { MyApplications } from './pages/student/MyApplications';
import { VerifyAlumni } from './pages/admin/VerifyAlumni';
import { UsersPage } from './pages/admin/UsersPage';
import { QueryMonitor } from './pages/admin/QueryMonitor';
import { RoleDashboard } from './components/RoleDashboard';
import { AlumniProfilePage } from './pages/alumni/AlumniProfilePage';
import { useAuth } from './context/AuthContext';
import { Register } from './pages/Register';
import { NotificationsPage } from './pages/NotificationsPage';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentJobsPage } from './pages/student/StudentJobsPage';
// Helper component to route chat to correct component based on role
function JobsRouter() {
  const { user } = useAuth();
  if (user?.role === 'alumni') return <JobPage />;
  return <StudentJobsPage />;
}
function ChatRouter() {
  const { user } = useAuth();

  if (user?.role === 'student') return <StudentChatPage />;
  if (user?.role === 'alumni')  return <AlumniChatPage />;
  if (user?.role === 'admin')   return <StudentChatPage />; // ← ADD THIS
  return <Navigate to="/dashboard" replace />;
}

function ProfileRouter() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />;
  if (user?.role === 'alumni') return <Navigate to="/alumni-profile" replace />;
  return <StudentProfile />;
}
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  { path: '/events', element: <EventsPage /> },
  

{ path: '/profile', element: <ProfileRouter /> },
{ path: '/notifications', element: <NotificationsPage /> },
{ path: '/register', element: <Register /> },
{ path: '/alumni-profile', element: <AlumniProfilePage /> },
{ path: '/my-applications', element: <MyApplications /> },
{ path: '/profile',         element: <StudentProfile /> },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/dashboard',
    element: <RoleDashboard />
  },
  {
    path: '/search-alumni',
    element: <SearchAlumni />
  },
  {
    path: '/alumni/:id',
    element: <AlumniProfile />
  },
  {
    path: '/my-queries',
    element: <MyQueries />
  },
  {
    path: '/query-management',
    element: <AlumniQueries />
  },
  {
    path: '/career-management',
    element: <CareerPage />
  },
 {
  path: '/job-postings',
  element: <JobsRouter />
},
  {
    path: '/verify-alumni',
    element: <VerifyAlumni />
  },
  {
    path: '/users',
    element: <UsersPage />
  },
  {
    path: '/query-monitor',
    element: <QueryMonitor />
  },
  {
    path: '/chat/:id',
    element: <ChatRouter />
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);