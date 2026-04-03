import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { MessageSquare, Briefcase, Clock, MessageCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/badge';
import { Link } from 'react-router';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/UserAvatar';

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
        setJobsPosted(jobsData.filter(j => j.Alumni_ID === user?.subId).length);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user?.subId]);

  const totalQueries   = receivedQueries.length;
  const pendingQueries = receivedQueries.filter(q => q.isUnread).length;

  return (
    <DashboardLayout title="Alumni Dashboard">
      <div className="space-y-6">

        {/* 👈 UPDATED: Stats Cards are now Clickable Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Link to Query Management (Update the 'to' path if your route is named differently, like '/my-queries') */}
          <Link to="/query-management" className="block outline-none">
            <Card className="h-full relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer border-border/60 hover:border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Queries Received</CardTitle>
                <div className="rounded-lg p-1.5 bg-muted/50 text-muted-foreground">
                  <MessageSquare className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-primary">
                  {loading ? '—' : totalQueries}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Messages from students and alumni</p>
                {!loading && pendingQueries > 0 && (
                  <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1">
                    <Clock className="size-3" /> {pendingQueries} awaiting your reply
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Link to Job Postings */}
          <Link to="/job-postings" className="block outline-none">
            <Card className="h-full relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer border-border/60 hover:border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Jobs Posted</CardTitle>
                <div className="rounded-lg p-1.5 bg-muted/50 text-muted-foreground">
                  <Briefcase className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-emerald-600">
                  {loading ? '—' : jobsPosted}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Active job postings</p>
              </CardContent>
            </Card>
          </Link>

        </div>

        {/* Recent Queries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              ) : receivedQueries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No queries received yet.
                </p>
              ) : (
                receivedQueries.map((query) => {
                  const displayName = query.counterpartName || query.studentName || 'Conversation';
                  const isWaitingForYou = query.isUnread;

                  return (
                    <Link
                      key={query.Thread_ID || String(query.Query_ID)}
                      to={`/chat/${query.Thread_ID || query.Query_ID}`}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        query.isUnread ? 'border-primary/50 bg-primary/5 hover:bg-primary/10' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <UserAvatar 
                            profilePic={query.Profile_Pic} 
                            name={displayName} 
                            className="size-10 text-sm" 
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{displayName}</p>
                              <Badge variant={query.isUnread ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5">
                                {query.isUnread ? (
                                  <span className="flex items-center gap-1"><MessageCircle className="size-2" />New</span>
                                ) : isWaitingForYou ? (
                                  <span className="flex items-center gap-1 text-amber-600"><Clock className="size-2" />Needs Reply</span>
                                ) : (
                                  <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="size-2" />Replied</span>
                                )}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(query.Query_Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm mt-3 ml-[52px] truncate ${query.isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {query.Content}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
