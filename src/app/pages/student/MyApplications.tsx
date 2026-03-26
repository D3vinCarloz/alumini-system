import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Briefcase } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

interface Application {
  Application_ID: number;
  Job_ID: number;
  Job_Title: string;
  Company_Name: string;
  Description: string;
  postedByName: string;
  Applied_Date: string;
  Status: 'applied' | 'viewed' | 'shortlisted' | 'rejected';
}

const statusConfig = {
  applied:     { label: 'Applied',     class: 'bg-blue-100 text-blue-700' },
  viewed:      { label: 'Viewed',      class: 'bg-purple-100 text-purple-700' },
  shortlisted: { label: 'Shortlisted', class: 'bg-emerald-100 text-emerald-700' },
  rejected:    { label: 'Rejected',    class: 'bg-red-100 text-red-700' },
};

export function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Application[]>('/applications/my')
      .then(setApplications)
      .catch(err => {
        console.error(err);
        toast.error('Failed to load applications');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="My Applications">
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold">My Job Applications</h2>
          <p className="text-muted-foreground mt-1">Track all the jobs you've applied to</p>
        </div>

        {/* Stats row */}
        {!loading && applications.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['applied', 'viewed', 'shortlisted', 'rejected'] as const).map(status => {
              const count = applications.filter(a => a.Status === status).length;
              const cfg   = statusConfig[status];
              return (
                <Card key={status}>
                  <CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-bold">{count}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${cfg.class}`}>
                      {cfg.label}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Applications list */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Applications
              {!loading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({applications.length} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-12 text-muted-foreground">Loading...</p>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="size-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No applications yet</p>
                <p className="text-sm text-muted-foreground mt-1">Browse job postings and start applying!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map(app => {
                  const cfg = statusConfig[app.Status];
                  return (
                    <div key={app.Application_ID} className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="size-10 rounded-lg border border-border bg-muted/50 flex items-center justify-center shrink-0">
                            <Briefcase className="size-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{app.Job_Title}</p>
                            <p className="text-sm text-muted-foreground">{app.Company_Name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Posted by {app.postedByName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{app.Description}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.class}`}>
                            {cfg.label}
                          </span>
                          <p className="text-xs text-muted-foreground mt-2">
                            Applied {new Date(app.Applied_Date).toLocaleDateString()}
                          </p>
                        </div>
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