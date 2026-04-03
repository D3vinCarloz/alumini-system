import { useEffect, useState, useCallback } from 'react';
import { LogOut, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router';
import { apiFetch } from '../../lib/api';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '../ui/dialog';

export function Header({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const data = await apiFetch<{ count: number }>(`/notifications/unread-count?t=${Date.now()}`);
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Header count fetch failed', err);
    }
  }, []);

  useEffect(() => {
    fetchCount();

    window.addEventListener('notifications-updated', fetchCount);
    const interval = setInterval(fetchCount, 15000);

    return () => {
      window.removeEventListener('notifications-updated', fetchCount);
      clearInterval(interval);
    };
  }, [fetchCount, location.key]);

  const handleLogoutConfirm = () => {
    setIsLogoutOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[1.75rem] border border-border/70 bg-white/72 px-4 py-3 shadow-[0_10px_45px_rgba(24,59,91,0.08)] backdrop-blur-xl sm:px-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Experience Layer
          </p>
          <h1 className="truncate text-xl font-bold">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/notifications" className="relative group outline-none">
            <div className="relative rounded-full border border-border/70 bg-white/80 p-2.5 transition-colors hover:bg-muted">
              <Bell className="size-5 text-foreground/80 transition-colors group-hover:text-primary" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-red-600 text-[10px] font-bold text-white animate-in zoom-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-3 border-l border-border pl-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{user?.role}</p>
            </div>

            <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-border/70 bg-white/80 px-3 text-sm font-medium outline-none transition-colors hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="size-4" />
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-sm rounded-[1.75rem] border-none bg-[#fffdf8] p-6 shadow-[0_30px_80px_rgba(24,59,91,0.18)]">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl font-bold">Ready to leave?</DialogTitle>
                  <DialogDescription className="mt-2 text-center text-base">
                    Are you sure you want to log out of your account?
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleLogoutConfirm}
                    className="w-full rounded-full py-5"
                  >
                    Yes, Log out
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsLogoutOpen(false)}
                    className="w-full border-none bg-muted/60 py-5 hover:bg-muted"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
}
