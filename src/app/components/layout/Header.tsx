import { useEffect, useState } from 'react';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { useNavigate, Link } from 'react-router';
import { apiFetch } from '../../lib/api';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ count: number }>('/notifications/unread-count')
      .then(data => setUnreadCount(data.count))
      .catch(console.error);

    // Poll every 30 seconds for new notifications
    const interval = setInterval(() => {
      apiFetch<{ count: number }>('/notifications/unread-count')
        .then(data => setUnreadCount(data.count))
        .catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex items-center gap-3">

          {/* Notification bell */}
          <Link to="/notifications" className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 size-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          {/* User info */}
{user?.role === 'admin' ? (
  <div className="text-right">
    <p className="text-sm font-medium">{user?.name}</p>
    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
  </div>
) : (
  <Link
    to={user?.role === 'alumni' ? '/alumni-profile' : '/profile'}
    className="text-right hover:opacity-80 transition-opacity"
  >
    <p className="text-sm font-medium">{user?.name}</p>
    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
  </Link>
)}

          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}