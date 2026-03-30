import { useEffect, useState, useCallback } from 'react';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router';
import { apiFetch } from '../../lib/api';
import { Button } from '../ui/button';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogTrigger 
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
    <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        
        <div className="flex items-center gap-4">
          
          <Link to="/notifications" className="relative group outline-none">
            <div className="p-2 rounded-full hover:bg-muted transition-colors relative">
              <Bell className="size-5 text-foreground/80 group-hover:text-primary transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 size-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-card animate-in zoom-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-3 border-l pl-4 border-border">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{user?.role}</p>
            </div>

            <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
              {/* 🟢 FIXED: Changed <Button> to <button> inside DialogTrigger to fix ref issue */}
              <DialogTrigger asChild>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive h-9 px-3 shrink-0 outline-none">
                  <LogOut className="size-4" />
                </button>
              </DialogTrigger>
              
              <DialogContent className="max-w-sm rounded-2xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-center">Ready to leave?</DialogTitle>
                  <DialogDescription className="text-center mt-2 text-base">
                    Are you sure you want to log out of your account?
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col gap-3 mt-6">
                  <Button 
                    variant="destructive" 
                    onClick={handleLogoutConfirm}
                    className="w-full rounded-xl py-5"
                  >
                    Yes, Log out
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsLogoutOpen(false)}
                    className="w-full rounded-xl py-5 bg-muted/50 hover:bg-muted border-none"
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