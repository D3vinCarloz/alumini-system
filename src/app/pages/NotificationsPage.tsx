import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Bell, MessageSquare, Briefcase, CheckCircle, Trash2, BellOff } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';

interface Notification {
  Notification_ID: number;
  Title: string;
  Message: string;
  Type: 'query' | 'reply' | 'application' | 'verification' | 'job' | 'event';
  Is_Read: boolean;
  Link: string | null;
  created_at: string;
}

const typeConfig = {
  query:        { icon: MessageSquare, color: 'text-blue-600',    bg: 'bg-blue-100' },
  reply:        { icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  application:  { icon: Briefcase,     color: 'text-purple-600',  bg: 'bg-purple-100' },
  verification: { icon: CheckCircle,   color: 'text-green-600',   bg: 'bg-green-100' },
  job:          { icon: Briefcase,     color: 'text-amber-600',   bg: 'bg-amber-100' },
  event:        { icon: Bell,          color: 'text-pink-600',    bg: 'bg-pink-100' },
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [markingAll, setMarkingAll]       = useState(false);

  useEffect(() => {
    apiFetch<Notification[]>('/notifications')
      .then(setNotifications)
      .catch(err => {
        console.error(err);
        toast.error('Failed to load notifications');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev =>
        prev.map(n => n.Notification_ID === id ? { ...n, Is_Read: true } : n)
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, Is_Read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.Notification_ID !== id));
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.Is_Read) {
      await handleMarkRead(notification.Notification_ID);
    }
    if (notification.Link) {
      navigate(notification.Link);
    }
  };

  const unreadCount = notifications.filter(n => !n.Is_Read).length;

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-2xl space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Notifications</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {loading ? '' : `${unreadCount} unread · ${notifications.length} total`}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="gap-2"
            >
              <CheckCircle className="size-4" />
              {markingAll ? 'Marking...' : 'Mark all read'}
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-16 text-center">
                <BellOff className="size-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll be notified when someone sends you a query or replies.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map(notification => {
                  const cfg  = typeConfig[notification.Type] ?? typeConfig.query;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={notification.Notification_ID}
                      className={`flex items-start gap-4 p-4 transition-colors ${
                        !notification.Is_Read
                          ? 'bg-primary/5 hover:bg-primary/10'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Icon className={`size-5 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.Is_Read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.Title}
                          </p>
                          {!notification.Is_Read && (
                            <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.Message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true,
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.Is_Read && (
                          <button
                            onClick={() => handleMarkRead(notification.Notification_ID)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle className="size-4 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.Notification_ID)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}