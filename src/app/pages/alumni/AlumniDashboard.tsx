import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { MessageSquare, Briefcase, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/badge';
import { Link } from 'react-router';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

interface Query {
  Query_ID: number;
  studentName: string;
  alumniName: string;
  Content: string;
  Status: 'pending' | 'answered';
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
        // Count only jobs posted by this alumni
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
  const pendingQueries = receivedQueries.filter(q => q.Status === 'pending').length;

  return (
    <DashboardLayout title="Alumni Dashboard">
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Queries Received</CardTitle>
              <MessageSquare className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {loading ? '—' : totalQueries}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Questions from students</p>
              {!loading && pendingQueries > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {pendingQueries} awaiting your reply
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jobs Posted</CardTitle>
              <Briefcase className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {loading ? '—' : jobsPosted}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active job postings</p>
            </CardContent>
          </Card>
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
                receivedQueries.map((query) => (
                  <Link
                    key={query.Query_ID}
                    to={`/chat/${query.Query_ID}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{query.studentName}</p>
                        <Badge variant={query.Status === 'answered' ? 'default' : 'secondary'}>
                          {query.Status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {query.Content.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(query.Query_Date).toLocaleDateString()}
                      </p>
                    </div>
                    {query.Status === 'pending' && (
                      <Clock className="size-5 text-amber-600 shrink-0 ml-4" />
                    )}
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}