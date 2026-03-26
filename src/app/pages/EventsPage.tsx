import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CalendarDays, MapPin, Plus, Trash2, Clock } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface Event {
  Event_ID: number;
  Title: string;
  Description: string;
  Event_Date: string;
  Event_Time: string;
  Mode: string;
  Type: string;
  createdByName: string;
  createdByRole: string;
}

const typeColors: Record<string, string> = {
  Networking: 'bg-blue-100 text-blue-700',
  Talk:       'bg-purple-100 text-purple-700',
  Workshop:   'bg-emerald-100 text-emerald-700',
  Seminar:    'bg-amber-100 text-amber-700',
  Other:      'bg-gray-100 text-gray-700',
};

const eventTypes = ['Networking', 'Talk', 'Workshop', 'Seminar', 'Other'];

export function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents]         = useState<Event[]>([]);
  const [loading, setLoading]       = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate]   = useState('');
  const [eventTime, setEventTime]   = useState('');
  const [mode, setMode]             = useState('');
  const [type, setType]             = useState('Other');

  const canCreate = user?.role === 'alumni' || user?.role === 'admin';

  const loadEvents = async () => {
    try {
      const data = await apiFetch<Event[]>('/events');
      setEvents(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const resetForm = () => {
    setTitle(''); setDescription(''); setEventDate('');
    setEventTime(''); setMode(''); setType('Other');
  };

  const handleCreate = async () => {
    if (!title.trim() || !eventDate) {
      toast.error('Title and date are required');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify({ title, description, eventDate, eventTime, mode, type }),
      });
      toast.success('Event created successfully!');
      resetForm();
      setIsDialogOpen(false);
      await loadEvents();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId: number) => {
    setDeletingId(eventId);
    try {
      await apiFetch(`/events/${eventId}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.Event_ID !== eventId));
      toast.success('Event deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  // Split into upcoming and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = events.filter(e => new Date(e.Event_Date) >= today);
  const past     = events.filter(e => new Date(e.Event_Date) <  today);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      day:   d.getDate().toString(),
      month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
      full:  d.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    };
  };

  const EventCard = ({ event }: { event: Event }) => {
    const { day, month, full } = formatDate(event.Event_Date);
    const isPast = new Date(event.Event_Date) < today;

    return (
      <Card className={`transition-shadow hover:shadow-md ${isPast ? 'opacity-60' : ''}`}>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4">
            {/* Date badge */}
            <div className="shrink-0 w-14 rounded-xl border border-border bg-muted/30 flex flex-col items-center justify-center py-2">
              <span className="text-xl font-bold leading-none text-foreground">{day}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{month}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base truncate">{event.Title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    {event.Mode && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />{event.Mode}
                      </span>
                    )}
                    {event.Event_Time && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />{event.Event_Time}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{full}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[event.Type] ?? typeColors.Other}`}>
                    {event.Type}
                  </span>
                  {canCreate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={deletingId === event.Event_ID}
                      onClick={() => handleDelete(event.Event_ID)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>

              {event.Description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.Description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Added by <span className="font-medium text-foreground">{event.createdByName}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout title="Events">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Events</h2>
            <p className="text-muted-foreground mt-1">
              {!loading && `${upcoming.length} upcoming · ${past.length} past`}
            </p>
          </div>

          {/* Only alumni/admin see Add button */}
          {canCreate && (
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}
            >
              <DialogTrigger>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" placeholder="e.g., Alumni Networking Night"
                      value={title} onChange={e => setTitle(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="What is this event about?"
                      value={description} onChange={e => setDescription(e.target.value)}
                      rows={3} className="resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input id="date" type="date"
                        value={eventDate} onChange={e => setEventDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input id="time" placeholder="e.g., 6:00 PM IST"
                        value={eventTime} onChange={e => setEventTime(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mode">Location / Mode</Label>
                      <Input id="mode" placeholder="e.g., Online or Hall A"
                        value={mode} onChange={e => setMode(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {eventTypes.map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleCreate} className="w-full" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Event'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-5">
                  <div className="animate-pulse flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CalendarDays className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-muted-foreground">No events yet</p>
              {canCreate && <p className="text-sm text-muted-foreground mt-1">Create the first event!</p>}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Upcoming — {upcoming.length}
                </h3>
                {upcoming.map(e => <EventCard key={e.Event_ID} event={e} />)}
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Past — {past.length}
                </h3>
                {past.map(e => <EventCard key={e.Event_ID} event={e} />)}
              </div>
            )}
          </>
        )}

      </div>
    </DashboardLayout>
  );
}