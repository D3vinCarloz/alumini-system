import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BellOff, MessageSquare, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';

interface NotificationItem {
  Notification_ID: number;
  Title: string;
  Message: string;
  Is_Read: boolean;
  Link?: string;
  created_at: string;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshBell = () => {
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const loadNotifications = async () => {
    try {
      const data = await apiFetch<NotificationItem[]>('/notifications');
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
    e.stopPropagation();
    try {
      await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.Notification_ID !== id));
      refreshBell();
      toast.success('Notification removed');
    } catch (err) {
      toast.error('Could not delete notification');
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.Is_Read) {
      await apiFetch(`/notifications/${n.Notification_ID}/read`, { method: 'PATCH' });
    }
    if (n.Link) {
      navigate(n.Link);
    } else {
      loadNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => !n.Is_Read).length;

  return (
    <DashboardLayout title="Notifications">
      <div className="space-y-6">
        <Card className="border-none">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Inbox</p>
                <h2 className="mt-2 text-2xl font-bold">Notifications</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[430px]">
                <MiniStat title="Total" value={loading ? '...' : notifications.length} />
                <MiniStat title="Unread" value={loading ? '...' : unreadCount} />
                <MiniStat title="Read" value={loading ? '...' : Math.max(notifications.length - unreadCount, 0)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto max-w-4xl">
          <Card className="overflow-hidden border-none">
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-[1.5rem] bg-muted" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-20 text-center">
                  <BellOff className="mx-auto mb-4 size-14 opacity-30" />
                  <p className="text-lg font-semibold">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-4 p-4 md:p-6">
                  {notifications.map((n) => (
                    <div
                      key={n.Notification_ID}
                      onClick={() => handleNotificationClick(n)}
                      className={`group flex cursor-pointer items-start justify-between gap-4 rounded-[1.5rem] border p-5 transition-all ${
                        !n.Is_Read
                          ? 'border-primary/20 bg-primary/5 shadow-[0_18px_45px_rgba(24,59,91,0.06)]'
                          : 'border-border/70 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl ${!n.Is_Read ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'}`}>
                          <MessageSquare className="size-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`text-sm ${!n.Is_Read ? 'font-bold' : 'font-semibold'}`}>{n.Title}</p>
                            {!n.Is_Read && (
                              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                                New
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{n.Message}</p>
                          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MiniStat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
