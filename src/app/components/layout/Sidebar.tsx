import { useEffect, useState } from 'react';
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
import { apiFetch } from '../../lib/api';
import { UserAvatar } from '../UserAvatar';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="size-5" />, path: '/dashboard', roles: ['student', 'alumni', 'admin'] },
  { label: 'Search Alumni', icon: <Search className="size-5" />, path: '/search-alumni', roles: ['student', 'alumni'] },
  { label: 'My Queries', icon: <MessageSquare className="size-5" />, path: '/my-queries', roles: ['student'] },
  { label: 'My Applications', icon: <Briefcase className="size-5" />, path: '/my-applications', roles: ['student'] },
  { label: 'My Profile', icon: <User className="size-5" />, path: '/alumni-profile', roles: ['alumni'] },
  { label: 'Query Management', icon: <MessageSquare className="size-5" />, path: '/query-management', roles: ['alumni'] },
  { label: 'Career Management', icon: <Briefcase className="size-5" />, path: '/career-management', roles: ['alumni'] },
  { label: 'Job Postings', icon: <FileText className="size-5" />, path: '/job-postings', roles: ['alumni', 'student'] },
  { label: 'Verify Alumni', icon: <CheckCircle className="size-5" />, path: '/verify-alumni', roles: ['admin'] },
  { label: 'Users', icon: <Users className="size-5" />, path: '/users', roles: ['admin'] },
  { label: 'Query Monitor', icon: <MessageSquare className="size-5" />, path: '/query-monitor', roles: ['admin'] },
  { label: 'Events', icon: <CalendarDays className="size-5" />, path: '/events', roles: ['student', 'alumni', 'admin'] },
];

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.profilePic) setProfilePic(parsed.profilePic);
    }

    const endpoint = user.role === 'student'
      ? '/student/profile'
      : user.role === 'alumni'
        ? '/alumni/my-profile'
        : null;

    if (endpoint) {
      apiFetch<any>(endpoint)
        .then((data) => setProfilePic(data.Profile_Pic ?? null))
        .catch(console.error);
    }
  }, [user]);

  if (!user) return null;

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));
  const profilePath =
    user.role === 'alumni' ? '/alumni-profile'
      : user.role === 'student' ? '/profile'
        : null;

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col p-4 lg:flex">
      <div className="flex h-full flex-col rounded-[2rem] border border-sidebar-border/80 bg-sidebar/85 shadow-[0_30px_60px_rgba(24,59,91,0.08)] backdrop-blur-xl">
        <div className="border-b border-sidebar-border/80 p-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <span className="size-2 rounded-full bg-emerald-500" />
            Original Campus Network
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-primary">Alumni Network</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Thoughtful connections between students, mentors, careers, and campus moments.
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(24,59,91,0.22)]'
                    : 'text-foreground hover:bg-sidebar-accent'
                )}
              >
                <span
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl transition-colors',
                    isActive ? 'bg-white/12' : 'bg-white/70 text-primary group-hover:bg-white'
                  )}
                >
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border/80 p-4">
          {profilePath ? (
            <Link
              to={profilePath}
              className="flex items-center gap-3 rounded-[1.5rem] bg-white/75 px-4 py-3 transition-colors hover:bg-white"
            >
              <UserAvatar profilePic={profilePic} name={user.name} className="size-10 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 rounded-[1.5rem] bg-white/75 px-4 py-3">
              <UserAvatar profilePic={profilePic} name={user.name} className="size-10 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
