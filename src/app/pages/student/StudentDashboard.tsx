import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/UserAvatar';
import {
  MessageSquare, CheckCircle, Clock, Users, Briefcase,
  CalendarDays, ArrowRight, UserPlus, Search, Bell,
  ChevronRight, MapPin, Building2, GraduationCap, TrendingUp, MessageCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

interface Query {
  Query_ID: number;
  alumniName: string;
  Profile_Pic?: string | null;
  Content: string;
  Status: string;
  isUnread: boolean;
  Latest_Sender_Role: 'student' | 'alumni' | null;
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
  Profile_Pic?: string | null;
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
  Talk: 'bg-purple-100 text-purple-700',
  Workshop: 'bg-emerald-100 text-emerald-700',
  Seminar: 'bg-amber-100 text-amber-700',
  Other: 'bg-gray-100 text-gray-700',
};

function StatCard({
  label, value, sub, icon: Icon,
  valueClass = 'text-foreground',
  iconClass = 'text-muted-foreground',
  trend, to,
}: {
  label: string; value: number | string; sub: string;
  icon: React.ElementType; valueClass?: string;
  iconClass?: string; trend?: string; to?: string;
}) {
  const content = (
    <Card className="relative cursor-pointer overflow-hidden border-none transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`rounded-lg bg-muted/50 p-1.5 ${iconClass}`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold tracking-tight ${valueClass}`}>{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <TrendingUp className="size-3" />{trend}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (to) return <Link to={to} className="block">{content}</Link>;
  return content;
}

export function StudentDashboard() {
  const { user } = useAuth();

  const [userQueries, setUserQueries] = useState<Query[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [suggestedAlumni, setSuggestedAlumni] = useState<Alumni[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [profile, setProfile] = useState<{ Roll_No: string; Department: string } | null>(null);
  const [applyingId, setApplyingId] = useState<number | null>(null);

  const [loadingQueries, setLoadingQueries] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAlumni, setLoadingAlumni] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    apiFetch<Query[]>('/queries')
      .then(setUserQueries)
      .catch(console.error)
      .finally(() => setLoadingQueries(false));

    apiFetch<Job[]>('/jobs')
      .then((data) => setRecentJobs(data.slice(0, 3)))
      .catch(console.error)
      .finally(() => setLoadingJobs(false));

    apiFetch<Alumni[]>('/alumni')
      .then((data) =>
        setSuggestedAlumni(
          data.filter((a: any) => a.Verification_Status).slice(0, 3)
        )
      )
      .catch(console.error)
      .finally(() => setLoadingAlumni(false));

    apiFetch<Event[]>('/events')
      .then((data) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setUpcomingEvents(
          data.filter((e) => new Date(e.Event_Date) >= today).slice(0, 3)
        );
      })
      .catch(console.error)
      .finally(() => setLoadingEvents(false));

    apiFetch<Application[]>('/applications/my')
      .then((data) => setAppliedJobIds(new Set(data.map((a) => a.Job_ID))))
      .catch(console.error);

    apiFetch<any>('/student/profile')
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoadingProfile(false));
  }, []);

  const totalQueries = userQueries.length;
  const answeredQueries = userQueries.filter((q) => q.Latest_Sender_Role === 'alumni').length;
  const pendingQueries = totalQueries - answeredQueries;

  const completedFields = [
    !!user?.name,
    !!user?.email,
    !!profile?.Department,
    !!profile?.Roll_No,
  ];
  const profileCompletion = Math.round(
    (completedFields.filter(Boolean).length / completedFields.length) * 100
  );

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const handleApply = async (jobId: number, jobTitle: string) => {
    setApplyingId(jobId);
    try {
      await apiFetch(`/applications/${jobId}`, { method: 'POST' });
      setAppliedJobIds((prev) => new Set([...prev, jobId]));
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
        <Card className="border-none">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Dashboard</p>
                <h2 className="text-2xl font-bold">{firstName}, everything is organized here.</h2>
                <p className="text-sm text-muted-foreground">
                  {pendingQueries > 0
                    ? `${pendingQueries} pending ${pendingQueries === 1 ? 'query' : 'queries'} need a reply.`
                    : 'No pending queries right now.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link to="/profile">
                    <GraduationCap className="size-4" />
                    {profileCompletion === 100 ? 'View Profile' : 'Complete Profile'}
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/search-alumni">
                    <Search className="size-4" />
                    Find Alumni
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <CompactStat title="Profile" value={loadingProfile ? '...' : `${profileCompletion}%`} hint="Completion" />
              <CompactStat title="Queries" value={loadingQueries ? '...' : totalQueries} hint="Total asked" />
              <CompactStat title="Answered" value={loadingQueries ? '...' : answeredQueries} hint="With replies" />
              <CompactStat title="Pending" value={loadingQueries ? '...' : pendingQueries} hint="Awaiting response" />
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-muted/70 p-1 sm:w-[420px]">
                <TabsTrigger value="overview" className="rounded-xl py-2">Overview</TabsTrigger>
                <TabsTrigger value="activity" className="rounded-xl py-2">Activity</TabsTrigger>
                <TabsTrigger value="discover" className="rounded-xl py-2">Discover</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-5 space-y-6">
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <Card className="border-none bg-[#f7f4ee] shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: 'Search Alumni', icon: Search, to: '/search-alumni' },
                          { label: 'My Queries', icon: MessageSquare, to: '/my-queries' },
                          { label: 'Browse Jobs', icon: Briefcase, to: '/job-postings' },
                          { label: 'My Applications', icon: CheckCircle, to: '/my-applications' },
                          { label: 'View Events', icon: CalendarDays, to: '/events' },
                          { label: 'Notifications', icon: Bell, to: '/notifications' },
                        ].map(({ label, icon: Icon, to }) => (
                          <Link key={label} to={to}>
                            <Button variant="outline" size="sm" className="h-10 gap-2 text-sm font-normal">
                              <Icon className="size-3.5 text-muted-foreground" />
                              {label}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-[#f7f4ee] shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Current Snapshot</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                      <MiniInfo title="Applications" value={appliedJobIds.size} />
                      <MiniInfo title="Upcoming Events" value={loadingEvents ? '...' : upcomingEvents.length} />
                      <MiniInfo title="Suggested Alumni" value={loadingAlumni ? '...' : suggestedAlumni.length} />
                      <MiniInfo title="Queries Awaiting Reply" value={loadingQueries ? '...' : pendingQueries} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-5 space-y-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Briefcase className="size-4 text-muted-foreground" />
                        Recent Job Postings
                      </CardTitle>
                      <Link to="/job-postings">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground">
                          View all <ChevronRight className="size-3" />
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {loadingJobs ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
                      ) : recentJobs.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No job postings yet.</p>
                      ) : (
                        recentJobs.map((job) => {
                          const hasApplied = appliedJobIds.has(job.Job_ID);
                          return (
                            <div
                              key={job.Job_ID}
                              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                                hasApplied ? 'border-emerald-200 bg-emerald-50/50' : 'border-border hover:bg-muted/30'
                              }`}
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                                  <Building2 className="size-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium leading-tight">{job.Job_Title}</p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">{job.Company_Name}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant={hasApplied ? 'secondary' : 'default'}
                                disabled={hasApplied || applyingId === job.Job_ID}
                                onClick={() => !hasApplied && handleApply(job.Job_ID, job.Job_Title)}
                                className="ml-2 h-8 shrink-0 text-xs"
                              >
                                {applyingId === job.Job_ID
                                  ? 'Applying...'
                                  : hasApplied
                                    ? <span className="flex items-center gap-1"><CheckCircle className="size-3" />Applied</span>
                                    : 'Apply'}
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CalendarDays className="size-4 text-muted-foreground" />
                        Upcoming Events
                      </CardTitle>
                      <Link to="/events">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground">
                          View all <ChevronRight className="size-3" />
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="space-y-1 pt-0">
                      {loadingEvents ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
                      ) : upcomingEvents.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No upcoming events.</p>
                      ) : (
                        upcomingEvents.map((event) => {
                          const d = new Date(event.Event_Date);
                          return (
                            <Link
                              key={event.Event_ID}
                              to="/events"
                              className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                            >
                              <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted/30 py-1.5">
                                <span className="text-base font-bold leading-none text-foreground">{d.getDate()}</span>
                                <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                  {d.toLocaleString('default', { month: 'short' })}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                                  {event.Title}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="size-2.5 shrink-0" />
                                  {event.Mode || 'TBD'}
                                  {event.Event_Time && <><span className="text-border">·</span>{event.Event_Time}</>}
                                </p>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[event.Type] ?? typeColors.Other}`}>
                                {event.Type}
                              </span>
                            </Link>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="discover" className="mt-5 space-y-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MessageSquare className="size-4 text-muted-foreground" />
                        Recent Queries
                      </CardTitle>
                      <Link to="/my-queries">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground">
                          View all <ChevronRight className="size-3" />
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {loadingQueries ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
                      ) : userQueries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                            <MessageSquare className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">No queries yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">Search for alumni and start a conversation</p>
                          </div>
                          <Link to="/search-alumni">
                            <Button size="sm" className="mt-1 gap-2">
                              <Search className="size-3.5" />Search Alumni
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {userQueries.slice(0, 5).map((query) => {
                            const isWaitingForAlumni = query.Latest_Sender_Role === 'student' || !query.Latest_Sender_Role;

                            return (
                              <Link
                                key={query.Query_ID}
                                to={`/chat/${query.Query_ID}`}
                                className="group flex items-center justify-between rounded-lg border border-transparent p-3 transition-all hover:border-border hover:bg-muted/30"
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                  <UserAvatar profilePic={query.Profile_Pic} name={query.alumniName} className="size-9 text-xs" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium transition-colors group-hover:text-primary">
                                      {query.alumniName}
                                    </p>
                                    <p className={`mt-0.5 truncate text-xs ${query.isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                      {query.Content?.substring(0, 70)}...
                                    </p>
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                      {new Date(query.Query_Date).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="ml-3 flex shrink-0 items-center gap-2">
                                  <Badge variant={query.isUnread ? 'default' : 'secondary'} className="text-xs">
                                    {query.isUnread ? (
                                      <span className="flex items-center gap-1">
                                        <MessageCircle className="size-2.5" />New Reply
                                      </span>
                                    ) : isWaitingForAlumni ? (
                                      <span className="flex items-center gap-1">
                                        <Clock className="size-2.5" />Pending
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle className="size-2.5" />Answered
                                      </span>
                                    )}
                                  </Badge>
                                  <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="size-4 text-muted-foreground" />
                        Suggested Alumni
                      </CardTitle>
                      <Link to="/search-alumni">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground">
                          See all <ChevronRight className="size-3" />
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="space-y-1 pt-0">
                      {loadingAlumni ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
                      ) : suggestedAlumni.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No alumni yet.</p>
                      ) : (
                        suggestedAlumni.map((alumni) => (
                          <Link
                            key={alumni.Alumni_ID}
                            to={`/alumni/${alumni.Alumni_ID}`}
                            className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                          >
                            <UserAvatar profilePic={alumni.Profile_Pic} name={alumni.Name} className="size-10 text-sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{alumni.Name}</p>
                              <p className="truncate text-xs text-muted-foreground">{alumni.Department || 'Alumni'}</p>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function CompactStat({ title, value, hint }: { title: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function MiniInfo({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
