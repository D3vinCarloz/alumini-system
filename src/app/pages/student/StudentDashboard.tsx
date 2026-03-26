import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import {
  MessageSquare, CheckCircle, Clock, Users, Briefcase,
  CalendarDays, ArrowRight, UserPlus, Search, Bell,
  ChevronRight, MapPin, Building2, GraduationCap, TrendingUp,
} from 'lucide-react';

interface Query {
  Query_ID: number;
  alumniName: string;
  Content: string;
  Status: 'pending' | 'answered';
  Query_Date: string;
}

interface Job {
  Job_ID: number;
  Job_Title: string;
  Company_Name: string;
  postedByName: string;
}

interface Alumni {
  Alumni_ID: number;
  Name: string;
  Department: string;
  Graduation_Year: number;
  Verification_Status: boolean;
}

interface Event {
  Event_ID: number;
  Title: string;
  Event_Date: string;
  Event_Time: string;
  Mode: string;
  Type: string;
}

interface Application {
  Job_ID: number;
}

const typeColors: Record<string, string> = {
  Networking: 'bg-blue-100 text-blue-700',
  Talk:       'bg-purple-100 text-purple-700',
  Workshop:   'bg-emerald-100 text-emerald-700',
  Seminar:    'bg-amber-100 text-amber-700',
  Other:      'bg-gray-100 text-gray-700',
};

const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon,
  valueClass = 'text-foreground',
  iconClass  = 'text-muted-foreground',
  trend, to,
}: {
  label: string; value: number | string; sub: string;
  icon: React.ElementType; valueClass?: string;
  iconClass?: string; trend?: string; to?: string;
}) {
  const content = (
    <Card className="relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`rounded-lg p-1.5 bg-muted/50 ${iconClass}`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold tracking-tight ${valueClass}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
            <TrendingUp className="size-3" />{trend}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (to) return <Link to={to} className="block">{content}</Link>;
  return content;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function StudentDashboard() {
  const { user } = useAuth();

  const [userQueries,     setUserQueries]    = useState<Query[]>([]);
  const [recentJobs,      setRecentJobs]     = useState<Job[]>([]);
  const [suggestedAlumni, setSuggestedAlumni] = useState<Alumni[]>([]);
  const [upcomingEvents,  setUpcomingEvents]  = useState<Event[]>([]);
  const [appliedJobIds,   setAppliedJobIds]  = useState<Set<number>>(new Set());
  const [profile,         setProfile]        = useState<{ Roll_No: string; Department: string } | null>(null);
  const [applyingId,      setApplyingId]     = useState<number | null>(null);

  const [loadingQueries, setLoadingQueries] = useState(true);
  const [loadingJobs,    setLoadingJobs]    = useState(true);
  const [loadingEvents,  setLoadingEvents]  = useState(true);

  useEffect(() => {
    apiFetch<Query[]>('/queries')
      .then(setUserQueries)
      .catch(console.error)
      .finally(() => setLoadingQueries(false));

    apiFetch<Job[]>('/jobs')
      .then(data => setRecentJobs(data.slice(0, 3)))
      .catch(console.error)
      .finally(() => setLoadingJobs(false));

    apiFetch<Alumni[]>('/alumni')
      .then(data =>
        setSuggestedAlumni(
          data.filter((a: any) => a.Verification_Status).slice(0, 3)
        )
      )
      .catch(console.error);

    apiFetch<Event[]>('/events')
      .then(data => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setUpcomingEvents(
          data.filter(e => new Date(e.Event_Date) >= today).slice(0, 3)
        );
      })
      .catch(console.error)
      .finally(() => setLoadingEvents(false));

    apiFetch<Application[]>('/applications/my')
      .then(data => setAppliedJobIds(new Set(data.map(a => a.Job_ID))))
      .catch(console.error);

    apiFetch<any>('/student/profile')
      .then(setProfile)
      .catch(console.error);
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalQueries    = userQueries.length;
  const answeredQueries = userQueries.filter(q => q.Status === 'answered').length;
  const pendingQueries  = totalQueries - answeredQueries;

  const completedFields = [
    !!user?.name,
    !!user?.email,
    !!profile?.Department,
    !!profile?.Roll_No,
  ];
  const profileCompletion = Math.round(
    (completedFields.filter(Boolean).length / completedFields.length) * 100
  );

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleApply = async (jobId: number, jobTitle: string) => {
    setApplyingId(jobId);
    try {
      await apiFetch(`/applications/${jobId}`, { method: 'POST' });
      setAppliedJobIds(prev => new Set([...prev, jobId]));
      toast.success(`Applied for "${jobTitle}" successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply. Please try again.');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="space-y-6">

        {/* ── Welcome Banner ─────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 size-52 rounded-full bg-primary/5" />
          <div className="pointer-events-none absolute right-20 bottom-0 size-28 rounded-full bg-primary/5" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">{greeting},</p>
              <h1 className="text-2xl font-bold tracking-tight">{firstName} 👋</h1>
              <p className="text-sm text-muted-foreground">
                {loadingQueries
                  ? 'Loading your queries...'
                  : pendingQueries > 0
                  ? `You have ${pendingQueries} pending quer${pendingQueries === 1 ? 'y' : 'ies'} awaiting a response.`
                  : 'All your queries have been answered. Keep exploring!'}
              </p>

              {/* Profile completion — hidden when 100% */}
              {profileCompletion < 100 && (
                <div className="pt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Profile completion</span>
                    <span className="font-medium text-foreground">{profileCompletion}%</span>
                  </div>
                  <div className="h-1.5 w-56 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <p className="text-xs text-amber-600">
                    {!profile?.Department && '· Department missing '}
                    {!profile?.Roll_No    && '· Roll No missing'}
                  </p>
                </div>
              )}
            </div>

            <Link to="/profile">
              <Button variant="default" size="sm" className="gap-2 shrink-0">
                <GraduationCap className="size-4" />
                {profileCompletion === 100 ? 'View Profile' : 'Complete Profile'}
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Stats — 2 cols on mobile, 4 on desktop, all clickable ──────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total Queries"
            value={loadingQueries ? '—' : totalQueries}
            sub="Questions asked to alumni"
            icon={MessageSquare}
            valueClass="text-primary"
            iconClass="text-primary"
            to="/my-queries"
          />
          <StatCard
            label="Answered"
            value={loadingQueries ? '—' : answeredQueries}
            sub="Queries with responses"
            icon={CheckCircle}
            valueClass="text-emerald-600"
            iconClass="text-emerald-600"
            to="/my-queries"
          />
          <StatCard
            label="Pending"
            value={loadingQueries ? '—' : pendingQueries}
            sub="Awaiting response"
            icon={Clock}
            valueClass="text-amber-600"
            iconClass="text-amber-600"
            to="/my-queries"
          />
          <StatCard
            label="Applied Jobs"
            value={appliedJobIds.size}
            sub="Jobs applied to"
            icon={Briefcase}
            valueClass="text-violet-600"
            iconClass="text-violet-600"
            to="/my-applications"
          />
        </div>

        {/* ── Quick Actions ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Search Alumni',   icon: Search,        to: '/search-alumni' },
                { label: 'My Queries',      icon: MessageSquare, to: '/my-queries' },
                { label: 'Browse Jobs',     icon: Briefcase,     to: '/job-postings' },
                { label: 'My Applications', icon: CheckCircle,   to: '/my-applications' },
                { label: 'View Events',     icon: CalendarDays,  to: '/events' },
                { label: 'Notifications',   icon: Bell,          to: '/notifications' },
              ].map(({ label, icon: Icon, to }) => (
                <Link key={label} to={to}>
                  <Button variant="outline" size="sm" className="gap-2 h-9 text-sm font-normal">
                    <Icon className="size-3.5 text-muted-foreground" />
                    {label}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Middle Row: Jobs + Events ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Recent Job Postings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="size-4 text-muted-foreground" />
                Recent Job Postings
              </CardTitle>
              <Link to="/job-postings">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                  View all <ChevronRight className="size-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {loadingJobs ? (
                <p className="text-center py-6 text-sm text-muted-foreground">Loading...</p>
              ) : recentJobs.length === 0 ? (
                <p className="text-center py-6 text-sm text-muted-foreground">No job postings yet.</p>
              ) : (
                recentJobs.map(job => {
                  const hasApplied = appliedJobIds.has(job.Job_ID);
                  return (
                    <div
                      key={job.Job_ID}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        hasApplied
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-border hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="size-9 rounded-lg border border-border bg-muted/50 flex items-center justify-center shrink-0">
                          <Building2 className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight truncate">{job.Job_Title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{job.Company_Name}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={hasApplied ? 'secondary' : 'default'}
                        disabled={hasApplied || applyingId === job.Job_ID}
                        onClick={() => !hasApplied && handleApply(job.Job_ID, job.Job_Title)}
                        className="shrink-0 ml-2 h-7 text-xs"
                      >
                        {applyingId === job.Job_ID
                          ? 'Applying...'
                          : hasApplied
                          ? <span className="flex items-center gap-1"><CheckCircle className="size-3" /> Applied</span>
                          : 'Apply'}
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                Upcoming Events
              </CardTitle>
              <Link to="/events">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                  View all <ChevronRight className="size-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {loadingEvents ? (
                <p className="text-center py-6 text-sm text-muted-foreground">Loading...</p>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-center py-6 text-sm text-muted-foreground">No upcoming events.</p>
              ) : (
                upcomingEvents.map(event => {
                  const d = new Date(event.Event_Date);
                  return (
                    <Link
                      key={event.Event_ID}
                      to="/events"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="shrink-0 w-11 rounded-lg border border-border bg-muted/30 flex flex-col items-center justify-center py-1.5">
                        <span className="text-base font-bold leading-none text-foreground">
                          {d.getDate()}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                          {d.toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {event.Title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="size-2.5 shrink-0" />
                          {event.Mode || 'TBD'}
                          {event.Event_Time && (
                            <><span className="text-border">·</span>{event.Event_Time}</>
                          )}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${typeColors[event.Type] ?? typeColors.Other}`}>
                        {event.Type}
                      </span>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom Row: Queries + Suggested Alumni ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent Queries */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                Recent Queries
              </CardTitle>
              <Link to="/my-queries">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                  View all <ChevronRight className="size-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingQueries ? (
                <p className="text-center py-12 text-sm text-muted-foreground">Loading...</p>
              ) : userQueries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">No queries yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Search for alumni and start a conversation
                    </p>
                  </div>
                  <Link to="/search-alumni">
                    <Button size="sm" className="gap-2 mt-1">
                      <Search className="size-3.5" />Search Alumni
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {userQueries.slice(0, 5).map(query => (
                    <Link
                      key={query.Query_ID}
                      to={`/chat/${query.Query_ID}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                          {query.alumniName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium group-hover:text-primary transition-colors">
                            {query.alumniName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {query.Content?.substring(0, 70)}...
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(query.Query_Date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <Badge
                          variant={query.Status === 'answered' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {query.Status === 'answered' ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="size-2.5" />Answered
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="size-2.5" />Pending
                            </span>
                          )}
                        </Badge>
                        <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Alumni */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                Suggested Alumni
              </CardTitle>
              <Link to="/search-alumni">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                  See all <ChevronRight className="size-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {suggestedAlumni.length === 0 ? (
                <p className="text-center py-6 text-sm text-muted-foreground">No alumni yet.</p>
              ) : (
                suggestedAlumni.map((alumni, i) => (
                  <Link
                    key={alumni.Alumni_ID}
                    to={`/alumni/${alumni.Alumni_ID}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`size-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                      {getInitials(alumni.Name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alumni.Name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {alumni.Department || 'Alumni'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <GraduationCap className="size-2.5" />
                        Class of {alumni.Graduation_Year}
                      </p>
                    </div>
                  </Link>
                ))
              )}
              <Link to="/search-alumni" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                  <UserPlus className="size-3.5" />Browse All Alumni
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}