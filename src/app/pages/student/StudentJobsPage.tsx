import { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../../components/ui/dialog';
import { Briefcase, Building2, Search, CheckCircle, Upload, FileText, X, AlertCircle, Clock } from 'lucide-react';
import { apiFetch, apiUpload } from '../../lib/api';
import { toast } from 'sonner';

interface Job {
  Job_ID: number;
  Job_Title: string;
  Company_Name: string;
  Description: string;
  Posting_Date: string;
  postedByName: string;
}

interface Application {
  Job_ID: number;
  Status: string;
}

export function StudentJobsPage() {
  const [allJobs, setAllJobs]               = useState<Job[]>([]);
  const [applicationMap, setApplicationMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState('');

  // Apply dialog state
  const [applyJob, setApplyJob]             = useState<Job | null>(null);
  const [resumeFile, setResumeFile]         = useState<File | null>(null);
  const [submitting, setSubmitting]         = useState(false);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  // 🟢 FIXED: Check for token to avoid 401 error
  useEffect(() => {
    if (!localStorage.getItem('token')) return; 

    apiFetch('/notifications/read-by-type', {
      method: 'PUT',
      body: JSON.stringify({ types: ['application', 'job', 'application_status'] })
    })
    .then(() => window.dispatchEvent(new Event('notifications-updated')))
    .catch(err => console.error('Failed to clear job notifications', err));
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      // 🟢 FIXED: Check for token to avoid 401 error
      if (!localStorage.getItem('token')) {
        setLoading(false);
        return;
      }

      try {
        const [jobsData, appsData] = await Promise.all([
          apiFetch<Job[]>('/jobs'),
          apiFetch<Application[]>('/applications/my'),
        ]);
        setAllJobs(jobsData);
        
        const statusMap = new Map();
        appsData.forEach(app => statusMap.set(app.Job_ID, app.Status.toLowerCase()));
        setApplicationMap(statusMap);
        
      } catch (err) {
        console.error(err);
        toast.error('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleApply = async () => {
    if (!applyJob) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (resumeFile) formData.append('resume', resumeFile);

      await apiUpload(`/applications/${applyJob.Job_ID}`, formData);
      
      // Update local state to show 'applied' immediately
      setApplicationMap(prev => new Map(prev).set(applyJob.Job_ID, 'applied'));
      
      toast.success(`Applied for "${applyJob.Job_Title}" successfully!`);
      setApplyJob(null);
      setResumeFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = allJobs.filter(job =>
    job.Job_Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.Company_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.postedByName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Job Postings">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Browse Job Postings</h2>
            <p className="text-muted-foreground mt-1">
              Opportunities posted by alumni{!loading && ` — ${allJobs.length} available`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
            <CheckCircle className="size-4 text-emerald-600" />
            <span className="font-medium">{applicationMap.size}</span> Total Applications
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, company or alumni name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Jobs */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-3">
                    <div className="flex gap-4">
                      <div className="size-12 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Briefcase className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="font-medium text-muted-foreground text-lg">
                {allJobs.length === 0 ? 'No job postings yet.' : 'No jobs match your search.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map(job => {
              const appStatus = applicationMap.get(job.Job_ID);
              const isRejected = appStatus === 'rejected';
              const isShortlisted = appStatus === 'shortlisted';
              const isApplied = appStatus === 'applied' || appStatus === 'viewed';

              return (
                <Card
                  key={job.Job_ID}
                  className={`transition-shadow hover:shadow-md ${
                    isShortlisted ? 'border-emerald-200 bg-emerald-50/10' :
                    isRejected ? 'border-red-200 bg-red-50/10 opacity-70' :
                    isApplied ? 'border-blue-200' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`size-12 rounded-lg border border-border flex items-center justify-center shrink-0 ${isRejected ? 'bg-red-50/50' : 'bg-muted/50'}`}>
                          <Building2 className={`size-6 ${isRejected ? 'text-red-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <CardTitle className={`text-lg ${isRejected ? 'line-through text-muted-foreground' : ''}`}>
                            {job.Job_Title}
                          </CardTitle>
                          <p className="text-sm font-medium text-muted-foreground mt-0.5">{job.Company_Name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Posted by <span className="font-medium text-foreground">{job.postedByName}</span>
                            {' · '}{new Date(job.Posting_Date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 self-start">
                        {isShortlisted ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300">
                            <CheckCircle className="size-3.5" /> Shortlisted
                          </span>
                        ) : isRejected ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-full border border-red-200">
                            <X className="size-3.5" /> Rejected
                          </span>
                        ) : isApplied ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200">
                            <Clock className="size-3.5" /> Applied / Pending
                          </span>
                        ) : (
                          <Button size="sm" onClick={() => setApplyJob(job)} className="w-full sm:w-auto">
                            Apply Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className={`text-sm leading-relaxed ${isRejected ? 'text-muted-foreground/60 line-clamp-2' : 'text-muted-foreground'}`}>
                      {job.Description}
                    </p>
                    
                    {isShortlisted && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-md border border-emerald-100">
                        <CheckCircle className="size-4" />
                        Congratulations! You have been shortlisted for this position.
                      </div>
                    )}
                    {isRejected && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-red-600 font-medium">
                        <AlertCircle className="size-3.5" />
                        Your application was not selected for this role.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>

      {/* Apply Dialog */}
      <Dialog open={!!applyJob} onOpenChange={open => { if (!open) { setApplyJob(null); setResumeFile(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for {applyJob?.Job_Title}</DialogTitle>
            <DialogDescription>
              {applyJob?.Company_Name} · Upload your resume to apply
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium">{applyJob?.Job_Title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{applyJob?.Company_Name}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{applyJob?.Description}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Resume (PDF)</p>

              {resumeFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                  <FileText className="size-5 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-700 truncate">{resumeFile.name}</p>
                    <p className="text-xs text-emerald-600">
                      {(resumeFile.size / 1024).toFixed(0)} KB · PDF
                    </p>
                  </div>
                  <button
                    onClick={() => { setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="p-1 rounded hover:bg-emerald-100 transition-colors shrink-0"
                  >
                    <X className="size-4 text-emerald-600" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Click to upload resume</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF only · Max 5MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.type !== 'application/pdf') {
                    toast.error('Only PDF files are allowed');
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('File size must be under 5MB');
                    return;
                  }
                  setResumeFile(file);
                }}
              />
              <p className="text-xs text-muted-foreground">* Resume is optional but recommended</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setApplyJob(null); setResumeFile(null); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleApply}
                disabled={submitting}
              >
                {submitting
                  ? <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  : 'Submit Application'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}