import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { MessageSquare, Briefcase, Clock, MessageCircle, CheckCircle, ArrowRight, PanelTopOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/badge';
import { Link } from 'react-router';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/UserAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';

interface Query {
  Query_ID: number;
  Thread_ID: string;
  studentName?: string;
  counterpartName?: string;
  counterpartRole?: 'student' | 'alumni';
  Profile_Pic?: string | null;
  Content: string;
  Status: string;
  isUnread: boolean;
  Latest_Sender_Role: 'student' | 'alumni' | null;
  Query_Date: string;
}

interface Job {
  Job_ID: number;
  Alumni_ID: number;
}

export function AlumniDashboard() {
  const { user } = useAuth();
  const [receivedQueries, setReceivedQueries] = useState<Query[]>([]);
  const [jobsPosted, setJobsPosted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [queriesData, jobsData] = await Promise.all([
          apiFetch<Query[]>('/queries'),
          apiFetch<Job[]>('/jobs'),
        ]);
        setReceivedQueries(queriesData);
        setJobsPosted(jobsData.filter((j) => j.Alumni_ID === user?.subId).length);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user?.subId]);

  const totalQueries = receivedQueries.length;
  const pendingQueries = receivedQueries.filter((q) => q.isUnread).length;
  const repliedQueries = Math.max(totalQueries - pendingQueries, 0);

  return (
    <DashboardLayout title="Alumni Dashboard">
      <div className="space-y-6">
        <Card className="border-none">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Workspace Summary</p>
                <h2 className="mt-2 text-2xl font-bold">Keep replies, jobs, and mentoring organized.</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <CompactStat title="Total Queries" value={loading ? '...' : totalQueries} hint="All conversations" />
                <CompactStat title="Awaiting Reply" value={loading ? '...' : pendingQueries} hint="Need attention" />
                <CompactStat title="Jobs Posted" value={loading ? '...' : jobsPosted} hint="Active listings" />
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-muted/70 p-1 sm:w-[360px]">
                  <TabsTrigger value="overview" className="rounded-xl py-2">Overview</TabsTrigger>
                  <TabsTrigger value="queries" className="rounded-xl py-2">Queries</TabsTrigger>
                  <TabsTrigger value="jobs" className="rounded-xl py-2">Jobs</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-5 space-y-5">
                  <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="border-none bg-[#f7f4ee] shadow-none">
                      <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base">Recent Queries</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/query-management">Open</Link>
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {renderQueryList(receivedQueries, loading, user?.role)}
                      </CardContent>
                    </Card>

                    <Card className="border-none bg-[#f7f4ee] shadow-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <ActionLink to="/query-management" label="Open Query Management" />
                        <ActionLink to="/job-postings" label="Manage Job Postings" />
                        <ActionLink to="/career-management" label="Update Career Timeline" />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="queries" className="mt-5">
                  <Card className="border-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-base">Conversation List</CardTitle>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/query-management">Go to Full Page</Link>
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {renderQueryList(receivedQueries, loading, user?.role, true)}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="jobs" className="mt-5">
                  <Card className="border-none">
                    <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">Job postings are handled in a dedicated page.</p>
                        <p className="mt-1 text-sm text-muted-foreground">Keep dashboard compact and open full management only when needed.</p>
                      </div>
                      <Button asChild>
                        <Link to="/job-postings">Open Job Postings</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
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

function ActionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-white/75 px-4 py-4 transition-colors hover:bg-white"
    >
      <span className="text-sm font-medium">{label}</span>
      <ArrowRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

function renderQueryList(
  receivedQueries: Query[],
  loading: boolean,
  userRole?: 'student' | 'alumni' | 'admin',
  roomy = false,
) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>;
  }

  if (receivedQueries.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No queries received yet.</p>;
  }

  return receivedQueries.slice(0, roomy ? receivedQueries.length : 5).map((query) => {
    const displayName = query.counterpartName || query.studentName || 'Conversation';
    const isWaitingForYou = (query.Latest_Sender_Role || 'student') !== userRole;

    return (
      <Link
        key={query.Thread_ID || String(query.Query_ID)}
        to={`/chat/${query.Thread_ID || query.Query_ID}`}
        className={`flex items-center justify-between gap-3 rounded-[1.25rem] border p-4 transition-colors ${
          query.isUnread ? 'border-primary/40 bg-primary/5 hover:bg-primary/10' : 'border-border/70 hover:bg-muted/40'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <UserAvatar profilePic={query.Profile_Pic} name={displayName} className="size-10 text-sm" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-foreground">{displayName}</p>
                <Badge variant={query.isUnread ? 'default' : 'secondary'} className="h-5 px-1.5 text-[10px]">
                  {query.isUnread ? (
                    <span className="flex items-center gap-1"><MessageCircle className="size-2" />New</span>
                  ) : isWaitingForYou ? (
                    <span className="flex items-center gap-1 text-amber-600"><Clock className="size-2" />Needs Reply</span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="size-2" />Replied</span>
                  )}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(query.Query_Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <p className={`mt-3 truncate pl-[52px] text-sm ${query.isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
            {query.Content}
          </p>
        </div>
        <PanelTopOpen className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
      </Link>
    );
  });
}
