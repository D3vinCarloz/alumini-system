import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MessageSquare, Trash2, BellOff } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper to shout at the Header to refresh the bell badge
  const refreshBell = () => {
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const loadNotifications = async () => {
    try {
      const data = await apiFetch<any[]>('/notifications');
      setNotifications(data);
      refreshBell();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // 👈 Prevents the click from opening the chat link
    try {
      await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.Notification_ID !== id));
      refreshBell(); // Update bell icon immediately
      toast.success('Notification removed');
    } catch (err) {
      toast.error('Could not delete notification');
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.Is_Read) {
      await apiFetch(`/notifications/${n.Notification_ID}/read`, { method: 'PATCH' });
    }
    if (n.Link) {
      navigate(n.Link);
    } else {
      loadNotifications();
    }
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold">Your Notifications</h2>
        
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-20 text-center">
                <BellOff className="size-12 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.Notification_ID}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !n.Is_Read ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1 p-2 bg-secondary rounded-full">
                      <MessageSquare className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className={`text-sm ${!n.Is_Read ? 'font-bold' : 'font-medium'}`}>{n.Title}</p>
                      <p className="text-xs text-muted-foreground">{n.Message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, n.Notification_ID)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}