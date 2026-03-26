import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Briefcase, Plus, Trash2, Users, FileText } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface JobPosting {
  Job_ID: number;
  Job_Title: string;
  Company_Name: string;
  Description: string;
  Posting_Date: string;
  Alumni_ID: number;
}

interface Applicant {
  Application_ID: number;
  studentName: string;
  studentEmail: string;
  Roll_No: string;
  Department: string;
  Applied_Date: string;
  Status: 'applied' | 'viewed' | 'shortlisted' | 'rejected';
  Resume_Path: string | null;
}

const statusColors: Record<string, string> = {
  applied:     'bg-blue-100 text-blue-700',
  viewed:      'bg-purple-100 text-purple-700',
  shortlisted: 'bg-emerald-100 text-emerald-700',
  rejected:    'bg-red-100 text-red-700',
};

// ─── Resume viewer helper ─────────────────────────────────────────────────────
async function openResume(filename: string) {
  try {
    const token = localStorage.getItem('token');
    const res   = await fetch(`/api/applications/resume/${filename}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load resume');
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    toast.error('Failed to open resume');
  }
}

// ─── Applicants Section ───────────────────────────────────────────────────────
function ApplicantsSection({ jobId }: { jobId: number }) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading]       = useState(true);
  const [open, setOpen]             = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<Applicant[]>(`/applications/job/${jobId}`)
      .then(setApplicants)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleStatusChange = async (appId: number, status: string) => {
    setUpdatingId(appId);
    try {
      await apiFetch(`/applications/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setApplicants(prev =>
        prev.map(a =>
          a.Application_ID === appId
            ? { ...a, Status: status as Applicant['Status'] }
            : a
        )
      );
      toast.success('Applicant status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <Users className="size-4" />
        {loading
          ? 'Loading applicants...'
          : `${applicants.length} Applicant${applicants.length !== 1 ? 's' : ''}`}
        <span className="text-xs text-muted-foreground ml-1">
          {open ? '▲ Hide' : '▼ Show'}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {applicants.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">
              No applicants yet.
            </p>
          ) : (
            applicants.map(app => (
              <div
                key={app.Application_ID}
                className="flex items-start justify-between p-3 rounded-lg border border-border bg-muted/20"
              >
                {/* Applicant info */}
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{app.studentName}</p>
                  <p className="text-xs text-muted-foreground">{app.studentEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.Department}{app.Roll_No ? ` · ${app.Roll_No}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Applied {new Date(app.Applied_Date).toLocaleDateString()}
                  </p>

                  {/* Resume button */}
                  {app.Resume_Path ? (
                    <button
                      onClick={() => openResume(app.Resume_Path!)}
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                    >
                      <FileText className="size-3.5" />
                      View Resume
                    </button>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      No resume uploaded
                    </p>
                  )}
                </div>

                {/* Status controls */}
                <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[app.Status] ?? ''}`}>
                    {app.Status.charAt(0).toUpperCase() + app.Status.slice(1)}
                  </span>
                  <select
                    disabled={updatingId === app.Application_ID}
                    value={app.Status}
                    onChange={e => handleStatusChange(app.Application_ID, e.target.value)}
                    className="text-xs border border-border rounded px-1.5 py-1 bg-background cursor-pointer"
                  >
                    <option value="applied">Applied</option>
                    <option value="viewed">Viewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function JobPage() {
  const { user }  = useAuth();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading]         = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [deletingId, setDeletingId]   = useState<number | null>(null);

  // Form state
  const [title, setTitle]             = useState('');
  const [company, setCompany]         = useState('');
  const [description, setDescription] = useState('');

  const loadJobs = async () => {
    try {
      const data = await apiFetch<JobPosting[]>('/jobs');
      setJobPostings(data.filter(j => j.Alumni_ID === user?.subId));
    } catch (err) {
      console.error('Failed to load job postings:', err);
      toast.error('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, [user?.subId]);

  const resetForm = () => {
    setTitle('');
    setCompany('');
    setDescription('');
  };

  const handleAddJob = async () => {
    if (!title.trim() || !company.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          jobTitle:    title.trim(),
          companyName: company.trim(),
          description: description.trim(),
        }),
      });
      toast.success('Job posting added successfully!');
      resetForm();
      setIsDialogOpen(false);
      await loadJobs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add job posting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    setDeletingId(jobId);
    try {
      await apiFetch(`/jobs/${jobId}`, { method: 'DELETE' });
      setJobPostings(prev => prev.filter(j => j.Job_ID !== jobId));
      toast.success('Job posting deleted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete job posting. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout title="Job Postings">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Your Job Postings</h2>
            <p className="text-muted-foreground mt-1">Share opportunities with students</p>
          </div>

          {/* Trigger button — plain div to avoid nested button */}
          <div
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer select-none"
          >
            <Plus className="size-4" />
            Add Job Posting
          </div>
        </div>

        {/* Add Job Dialog */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={open => { setIsDialogOpen(open); if (!open) resetForm(); }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Job Posting</DialogTitle>
              <DialogDescription>
                Share a job opportunity with students
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Software Engineering Intern"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  placeholder="e.g., Google"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role, requirements, and how to apply..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
              <Button
                onClick={handleAddJob}
                className="w-full"
                disabled={submitting}
              >
                {submitting ? 'Posting...' : 'Post Job'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Job list */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading job postings...</p>
            </CardContent>
          </Card>
        ) : jobPostings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No job postings yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first posting to share opportunities with students
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {jobPostings.map(job => (
              <Card key={job.Job_ID}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{job.Job_Title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{job.Company_Name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === job.Job_ID}
                      onClick={() => handleDelete(job.Job_ID)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{job.Description}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Posted on {new Date(job.Posting_Date).toLocaleDateString()}
                  </p>

                  {/* Applicants collapsible */}
                  <ApplicantsSection jobId={job.Job_ID} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}