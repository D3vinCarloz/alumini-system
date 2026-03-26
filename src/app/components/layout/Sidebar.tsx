import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Briefcase,
  User,
  Users,
  CheckCircle,
  FileText,
  CalendarDays,
} from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { cn } from '../ui/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard className="size-5" />,
    path: '/dashboard',
    roles: ['student', 'alumni', 'admin'],
  },
  {
    label: 'Search Alumni',
    icon: <Search className="size-5" />,
    path: '/search-alumni',
    roles: ['student'],
  },
  {
    label: 'My Queries',
    icon: <MessageSquare className="size-5" />,
    path: '/my-queries',
    roles: ['student'],
  },
  {
    label: 'My Applications',
    icon: <Briefcase className="size-5" />,
    path: '/my-applications',
    roles: ['student'],
  },
  {
    label: 'My Profile',
    icon: <User className="size-5" />,
    path: '/alumni-profile',
    roles: ['alumni'],
  },
  {
    label: 'Query Management',
    icon: <MessageSquare className="size-5" />,
    path: '/query-management',
    roles: ['alumni'],
  },
  {
    label: 'Career Management',
    icon: <Briefcase className="size-5" />,
    path: '/career-management',
    roles: ['alumni'],
  },
  {
    label: 'Job Postings',
    icon: <FileText className="size-5" />,
    path: '/job-postings',
    roles: ['alumni'],
  },
  {
    label: 'Verify Alumni',
    icon: <CheckCircle className="size-5" />,
    path: '/verify-alumni',
    roles: ['admin'],
  },
  {
    label: 'Users',
    icon: <Users className="size-5" />,
    path: '/users',
    roles: ['admin'],
  },
  {
    label: 'Query Monitor',
    icon: <MessageSquare className="size-5" />,
    path: '/query-monitor',
    roles: ['admin'],
  },
  {
    label: 'Events',
    icon: <CalendarDays className="size-5" />,
    path: '/events',
    roles: ['student', 'alumni', 'admin'],
  },
];

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user.role)
  );

  // Admin has no profile page
  const profilePath =
    user.role === 'alumni'  ? '/alumni-profile' :
    user.role === 'student' ? '/profile'        :
    null;

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col">

      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-primary">Alumni Network</h2>
        <p className="text-sm text-muted-foreground mt-1">College Connect</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="p-4 border-t border-border">
        {profilePath ? (
          // Student and Alumni — clickable to their profile
          <Link
            to={profilePath}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </Link>
        ) : (
          // Admin — not clickable, just displays info
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>

    </aside>
  );
}