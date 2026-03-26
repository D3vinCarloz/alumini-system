import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, MessageSquare, Clock } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface Stats {
  totalUsers: number;
  totalQueries: number;
  pendingVerifications: number;
}

interface Query {
  Query_ID: number;
  studentName: string;
  alumniName: string;
  Status: string;
  Query_Date: string;
}

interface Alumni {
  Alumni_ID: number;
  Name: string;
  Department: string;
  Graduation_Year: number;
  Verification_Status: boolean;
}

interface Analytics {
  byDepartment: { Department: string; count: number; verified: number }[];
  byBatch:      { Batch: string; count: number }[];
  queryStats:   { total: number; pending: number; answered: number };
}

export function AdminDashboard() {
  const [stats, setStats]               = useState<Stats>({ totalUsers: 0, totalQueries: 0, pendingVerifications: 0 });
  const [recentQueries, setRecentQueries] = useState<Query[]>([]);
  const [pendingAlumni, setPendingAlumni] = useState<Alumni[]>([]);
  const [analytics, setAnalytics]       = useState<Analytics | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, queriesData, alumniData, analyticsData] = await Promise.all([
          apiFetch<Stats>('/admin/stats'),
          apiFetch<Query[]>('/admin/queries'),
          apiFetch<Alumni[]>('/admin/alumni'),
          apiFetch<Analytics>('/admin/analytics'),
        ]);
        setStats(statsData);
        setRecentQueries(queriesData);
        setPendingAlumni(alumniData.filter(a => !a.Verification_Status));
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">

        {/* ── Stats Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {loading ? '—' : stats.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Students, Alumni & Admins</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
              <MessageSquare className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {loading ? '—' : stats.totalQueries}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All platform queries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <Clock className="size-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {loading ? '—' : stats.pendingVerifications}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Alumni awaiting verification</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Recent Activity ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">Loading...</p>
                ) : recentQueries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">No queries yet</p>
                ) : (
                  recentQueries.slice(0, 5).map(query => (
                    <div key={query.Query_ID} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {query.studentName} → {query.alumniName}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          query.Status === 'answered'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {query.Status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(query.Query_Date).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Verifications */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">Loading...</p>
                ) : pendingAlumni.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    No pending verifications
                  </p>
                ) : (
                  pendingAlumni.map(alumni => (
                    <div key={alumni.Alumni_ID} className="p-3 rounded-lg border border-border">
                      <p className="text-sm font-medium">{alumni.Name}</p>
                      <p className="text-xs text-muted-foreground">
                        {alumni.Department || 'No department'} — Class of {alumni.Graduation_Year || 'N/A'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Analytics ────────────────────────────────────────────────────── */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Department-wise */}
            <Card>
              <CardHeader>
                <CardTitle>Alumni by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.byDepartment.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4 text-sm">
                      No department data yet
                    </p>
                  ) : (
                    analytics.byDepartment.map(row => (
                      <div key={row.Department}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="font-medium truncate mr-2">{row.Department}</span>
                          <span className="text-muted-foreground shrink-0">
                            {row.verified}/{row.count} verified
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${(row.verified / row.count) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Batch-wise + Query stats */}
            <div className="space-y-6">

              {/* Batch-wise */}
              <Card>
                <CardHeader>
                  <CardTitle>Alumni by Batch</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.byBatch.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4 text-sm">
                        No batch data yet
                      </p>
                    ) : (
                      analytics.byBatch.map(row => (
                        <div
                          key={row.Batch}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <span className="text-sm font-medium">Batch {row.Batch}</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {row.count} alumni
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Query Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Query Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{analytics.queryStats.total}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-2xl font-bold text-amber-600">{analytics.queryStats.pending}</p>
                      <p className="text-xs text-muted-foreground mt-1">Pending</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <p className="text-2xl font-bold text-emerald-600">{analytics.queryStats.answered}</p>
                      <p className="text-xs text-muted-foreground mt-1">Answered</p>
                    </div>
                  </div>

                  {/* Answer rate bar */}
                  {analytics.queryStats.total > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Answer rate</span>
                        <span>
                          {Math.round((analytics.queryStats.answered / analytics.queryStats.total) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${(analytics.queryStats.answered / analytics.queryStats.total) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}