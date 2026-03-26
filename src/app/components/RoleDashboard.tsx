import { useAuth } from '../context/AuthContext';
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { AlumniDashboard } from '../pages/alumni/AlumniDashboard';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { Navigate } from 'react-router';

export function RoleDashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'alumni':
      return <AlumniDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
}
