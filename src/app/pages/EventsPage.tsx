import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageHero } from '../components/layout/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CalendarDays, MapPin, Plus, Trash2, Clock, Sparkles } from 'lucide-react';
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
  Networking: 'bg-sky-100 text-sky-700',
  Talk: 'bg-teal-100 text-teal-700',
  Workshop: 'bg-emerald-100 text-emerald-700',
  Seminar: 'bg-amber-100 text-amber-700',
  Other: 'bg-stone-200 text-stone-700',
};

const eventTypes = ['Networking', 'Talk', 'Workshop', 'Seminar', 'Other'];

export function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [mode, setMode] = useState('');
  const [type, setType] = useState('Other');

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

  useEffect(() => {
    loadEvents();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventDate('');
    setEventTime('');
    setMode('');
    setType('Other');
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
      setEvents((prev) => prev.filter((e) => e.Event_ID !== eventId));
      toast.success('Event deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = events.filter((e) => new Date(e.Event_Date) >= today);
  const past = events.filter((e) => new Date(e.Event_Date) < today);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      day: d.getDate().toString(),
      month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
      full: d.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    };
  };

  const EventCard = ({ event }: { event: Event }) => {
    const { day, month, full } = formatDate(event.Event_Date);
    const isPast = new Date(event.Event_Date) < today;

    return (
      <Card className={`overflow-hidden border-none ${isPast ? 'opacity-75' : ''}`}>
        <div className="grid gap-0 lg:grid-cols-[120px_1fr]">
          <div className="flex flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(24,59,91,0.96),rgba(31,122,109,0.82))] px-4 py-6 text-white">
            <span className="text-4xl font-bold">{day}</span>
            <span className="mt-1 text-xs uppercase tracking-[0.25em] text-white/70">{month}</span>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{event.Title}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {event.Mode && <span className="flex items-center gap-1.5"><MapPin className="size-4" />{event.Mode}</span>}
                  {event.Event_Time && <span className="flex items-center gap-1.5"><Clock className="size-4" />{event.Event_Time}</span>}
                  <span>{full}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeColors[event.Type] ?? typeColors.Other}`}>
                  {event.Type}
                </span>
                {canCreate && (
                  <Button variant="ghost" size="icon" disabled={deletingId === event.Event_ID} onClick={() => handleDelete(event.Event_ID)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>

            {event.Description && <p className="text-sm leading-7 text-muted-foreground">{event.Description}</p>}

            <div className="rounded-[1.25rem] bg-[#f7f4ee] px-4 py-3 text-sm text-muted-foreground">
              Added by <span className="font-semibold text-foreground">{event.createdByName}</span> ({event.createdByRole})
            </div>
          </CardContent>
        </div>
      </Card>
    );
  };

  return (
    <DashboardLayout title="Events">
      <div className="space-y-6">
        <PageHero
          eyebrow="Campus Moments"
          title="Events deserve a dedicated, polished browsing experience."
          description="Upcoming and past events now sit in clearer sections with more breathing room, stronger hierarchy, and a more original website feel."
          actions={canCreate ? (
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-[2rem] border-none bg-[#fffdf8] p-7 shadow-[0_35px_90px_rgba(24,59,91,0.18)]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Create new event</DialogTitle>
                </DialogHeader>
                <div className="mt-4 grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="rounded-2xl" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input id="date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input id="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="h-12 rounded-2xl" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="mode">Location / Mode</Label>
                      <Input id="mode" value={mode} onChange={(e) => setMode(e.target.value)} className="h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleCreate} className="mt-2 h-12 w-full" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Event'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined}
          stats={[
            { label: 'Upcoming', value: loading ? '...' : upcoming.length },
            { label: 'Past', value: loading ? '...' : past.length },
            { label: 'Total', value: loading ? '...' : events.length },
          ]}
        >
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Curation</p>
            <p className="leading-6">
              Smaller event cards stay easy to scan, while creation and detail live in dedicated layers instead of overcrowding the page.
            </p>
          </div>
        </PageHero>

        {!loading && events.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <MiniEventStat title="Network Moments" value={events.filter((e) => e.Type === 'Networking').length} />
            <MiniEventStat title="Learning Sessions" value={events.filter((e) => ['Workshop', 'Seminar', 'Talk'].includes(e.Type)).length} />
            <MiniEventStat title="Latest Mood" value={upcoming.length > 0 ? 'Active calendar' : 'Quiet period'} icon={Sparkles} />
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Card key={i}><CardContent className="h-40 animate-pulse p-6" /></Card>)}
          </div>
        ) : events.length === 0 ? (
          <Card className="border-none">
            <CardContent className="py-16 text-center">
              <CalendarDays className="mx-auto mb-4 size-14 text-muted-foreground" />
              <p className="text-lg font-semibold">No events yet</p>
              <p className="mt-2 text-sm text-muted-foreground">Once events are published, this page will become the shared calendar hub.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <SectionHeading title={`Upcoming • ${upcoming.length}`} />
              {upcoming.length > 0 ? upcoming.map((e) => <EventCard key={e.Event_ID} event={e} />) : (
                <Card className="border-none"><CardContent className="py-10 text-sm text-muted-foreground">No upcoming events.</CardContent></Card>
              )}
            </div>

            <div className="space-y-4">
              <Card className="border-none">
                <CardHeader>
                  <CardTitle className="text-lg">Past Archive</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {past.length > 0 ? past.map((event) => {
                    const { day, month } = formatDate(event.Event_Date);
                    return (
                      <div key={event.Event_ID} className="flex items-start gap-3 rounded-[1.25rem] bg-[#f7f4ee] p-4">
                        <div className="flex w-14 shrink-0 flex-col items-center rounded-2xl bg-white px-2 py-3">
                          <span className="text-xl font-bold">{day}</span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{month}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold">{event.Title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{event.Mode || 'Location TBD'}</p>
                        </div>
                      </div>
                    );
                  }) : <p className="text-sm text-muted-foreground">No past events yet.</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-lg font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h2>;
}

function MiniEventStat({ title, value, icon: Icon = CalendarDays }: { title: string; value: string | number; icon?: React.ElementType }) {
  return (
    <Card className="border-none">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
