import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogTrigger,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import {
  GraduationCap, Mail, Briefcase,
  MapPin, BookOpen, ExternalLink, MessageSquare, Send, ChevronUp, Phone,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/UserAvatar';
import { useAuth } from '../../context/AuthContext';

interface CareerEntry {
  Career_ID: number;
  Company_Name: string;
  Job_Role: string;
  Start_Year: number;
  End_Year: number | null;
}

interface JobPosting {
  Job_ID: number;
  Job_Title: string;
  Company_Name: string;
  Description: string;
  Posting_Date: string;
  Location?: string;
}

interface Alumni {
  Alumni_ID: number;
  User_ID: number;
  Name: string;
  Email: string;
  Department: string;
  Graduation_Year: number;
  Batch: string;
  Contact_Info: string;
  Bio: string;
  LinkedIn?: string;
  Verification_Status: boolean;
  Profile_Pic: string | null;
  careerHistory: CareerEntry[];
  jobPostings: JobPosting[];
}

export function AlumniProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [existingQueryId, setExistingQueryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'career' | 'jobs' | 'details' | 'connect'>('career');

  useEffect(() => {
    if (!id) return;

    apiFetch<Alumni>(`/alumni/${id}`)
      .then(setAlumni)
      .catch((err) => {
        console.error('Failed to load alumni profile:', err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));

    apiFetch<any[]>('/queries')
      .then((queries) => {
        const targetId = parseInt(id, 10);
        const existing = queries.find((q) => {
          if (user?.role === 'student') return q.counterpartAlumniId === targetId || q.Alumni_ID === targetId;
          return q.counterpartAlumniId === targetId;
        });
        if (existing) {
          setExistingQueryId(existing.Thread_ID || String(existing.Query_ID));
        }
      })
      .catch(console.error);
  }, [id, user?.role]);

  const handleSendFirstMessage = async () => {
    if (!queryText.trim()) return;
    setSending(true);
    try {
      const data = await apiFetch<{ queryId: number; threadId: string }>('/queries', {
        method: 'POST',
        body: JSON.stringify({
          alumniId: user?.role === 'student' ? alumni?.Alumni_ID : undefined,
          recipientAlumniId: user?.role === 'alumni' ? alumni?.Alumni_ID : undefined,
          content: queryText,
        }),
      });

      toast.success('Conversation started!');
      setQueryText('');
      setIsDialogOpen(false);
      navigate(`/chat/${data.threadId || data.queryId}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to start conversation. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Alumni Profile">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="animate-pulse text-muted-foreground">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !alumni) {
    return (
      <DashboardLayout title="Alumni Profile">
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">Alumni not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const sortedCareerHistory = alumni.careerHistory
    ? [...alumni.careerHistory].sort((a, b) => b.Start_Year - a.Start_Year)
    : [];

  const profileTabs = [
    { id: 'career' as const, label: 'Career History', icon: Briefcase },
    { id: 'jobs' as const, label: 'Job Postings', icon: MapPin },
    { id: 'details' as const, label: 'Details', icon: BookOpen },
    { id: 'connect' as const, label: 'Connect', icon: Mail },
  ];

  return (
    <DashboardLayout title="Alumni Profile">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary/5 via-background to-background shadow-md">
          <div className="absolute left-0 top-0 h-2 w-full bg-primary/20" />
          <CardContent className="pt-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <UserAvatar
                profilePic={alumni.Profile_Pic}
                name={alumni.Name}
                className="size-24 shrink-0 border-4 border-background text-3xl shadow-sm sm:size-32"
              />
              <div className="w-full flex-1 space-y-3">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
                      {alumni.Name}
                      {alumni.Verification_Status && (
                        <Badge variant="default" className="bg-emerald-500 text-xs hover:bg-emerald-600">Verified</Badge>
                      )}
                    </h1>
                    <p className="mt-1 font-medium text-muted-foreground">
                      {sortedCareerHistory?.[0]?.Job_Role
                        ? `${sortedCareerHistory[0].Job_Role} at ${sortedCareerHistory[0].Company_Name}`
                        : 'Alumni Member'}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-3">
                    {existingQueryId ? (
                      <Button onClick={() => navigate(`/chat/${existingQueryId}`)} className="rounded-full px-6">
                        <MessageSquare className="mr-2 size-4" /> Message
                      </Button>
                    ) : (
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="rounded-full px-6">
                            <MessageSquare className="mr-2 size-4" /> Message
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-lg overflow-hidden rounded-2xl p-0">
                          <DialogHeader className="sr-only">
                            <DialogTitle>Start conversation with {alumni.Name}</DialogTitle>
                            <DialogDescription>Send your first message</DialogDescription>
                          </DialogHeader>

                          <div className="flex items-center gap-3 bg-primary px-6 py-4 text-white">
                            <UserAvatar profilePic={alumni.Profile_Pic} name={alumni.Name} className="size-10 border border-white/20" />
                            <div>
                              <h3 className="font-semibold leading-tight">{alumni.Name}</h3>
                              <p className="text-xs text-white/70">{alumni.Department}</p>
                            </div>
                          </div>

                          <div className="p-6">
                            <p className="mb-4 text-sm text-muted-foreground">
                              Send a message to start a conversation. You&apos;ll be notified when they reply.
                            </p>

                            <Textarea
                              placeholder="Type your message here..."
                              value={queryText}
                              onChange={(e) => setQueryText(e.target.value)}
                              rows={5}
                              className="min-h-[140px] resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm"
                            />

                            <div className="mt-4 flex justify-end">
                              <Button
                                onClick={handleSendFirstMessage}
                                disabled={sending || !queryText.trim()}
                                className="w-full rounded-full px-8 sm:w-auto"
                              >
                                {sending ? 'Sending...' : 'Send Message'}
                                <Send className="ml-2 size-4" />
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                {alumni.Bio && (
                  <p className="mt-4 max-w-3xl rounded-lg border border-border/50 bg-muted/30 p-4 text-sm italic leading-relaxed text-foreground/80">
                    "{alumni.Bio}"
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            {profileTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border/70 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardContent className="p-0">
              {activeTab === 'career' && (
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="p-8 sm:p-10">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <Briefcase className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">Career History</h3>
                        <p className="mt-1 text-sm text-muted-foreground">A timeline of roles, growth, and professional milestones.</p>
                      </div>
                    </div>

                    {sortedCareerHistory.length > 0 ? (
                      <div className="relative ml-2">
                        <div className="absolute bottom-2 left-[11px] top-2 z-0 w-[2px] bg-border" />
                        <div className="relative z-10 space-y-8 pt-1">
                          {sortedCareerHistory.map((career, index) => (
                            <div key={career.Career_ID} className="relative pl-11">
                              <div className="absolute left-0 top-1 flex size-6 items-center justify-center rounded-full border-2 border-primary bg-background shadow-sm">
                                <div className="size-2 rounded-full bg-primary" />
                              </div>
                              {index !== sortedCareerHistory.length - 1 && (
                                <div className="absolute left-[12px] top-[50px] z-10 -translate-x-1/2 bg-background py-1 text-muted-foreground/40">
                                  <ChevronUp className="size-5" />
                                </div>
                              )}

                              <div className="rounded-2xl border border-border/70 bg-card px-5 py-4 shadow-sm">
                                <h4 className="text-lg font-semibold text-foreground">{career.Job_Role}</h4>
                                <p className="mt-1 text-sm font-semibold text-primary">{career.Company_Name}</p>
                                <p className="mt-3 text-xs text-muted-foreground">
                                  <span className="rounded-md border border-border/50 bg-muted px-2.5 py-1 font-medium text-foreground/70">
                                    {career.Start_Year} - {career.End_Year || 'Present'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="rounded-xl bg-muted/20 py-6 text-center text-sm text-muted-foreground">
                        No career history provided.
                      </p>
                    )}
                  </div>

                  <div className="border-t bg-muted/10 p-8 lg:border-l lg:border-t-0">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Snapshot</h4>
                    <div className="mt-6 space-y-4">
                      <div className="rounded-2xl border bg-background p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Current Role</p>
                        <p className="mt-3 text-lg font-semibold text-foreground">{sortedCareerHistory?.[0]?.Job_Role || 'No role added'}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{sortedCareerHistory?.[0]?.Company_Name || 'Company not available'}</p>
                      </div>
                      <div className="rounded-2xl border bg-background p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Milestones</p>
                        <p className="mt-3 text-3xl font-bold text-foreground">{sortedCareerHistory.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'jobs' && (
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="p-8 sm:p-10">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <MapPin className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">Job Postings</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Open roles and opportunities shared by this alumni.</p>
                      </div>
                    </div>

                    {alumni.jobPostings?.length > 0 ? (
                      <div className="grid gap-4">
                        {alumni.jobPostings.map((job) => (
                          <div key={job.Job_ID} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                            <h4 className="text-lg font-bold text-foreground">{job.Job_Title}</h4>
                            <p className="mt-1 text-sm font-semibold text-primary">{job.Company_Name}</p>
                            <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{job.Description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-muted/20 py-6 text-center text-sm text-muted-foreground">
                        No opportunities posted yet.
                      </p>
                    )}
                  </div>

                  <div className="border-t bg-muted/10 p-8 lg:border-l lg:border-t-0">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Overview</h4>
                    <div className="mt-6 rounded-2xl border bg-background p-5 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Total Posts</p>
                      <p className="mt-3 text-3xl font-bold text-foreground">{alumni.jobPostings?.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="p-8 sm:p-10">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <BookOpen className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">Academic Details</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Background information and graduation details.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border bg-card p-6 shadow-sm">
                        <BookOpen className="size-5 text-primary" />
                        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Department</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{alumni.Department}</p>
                      </div>
                      <div className="rounded-2xl border bg-card p-6 shadow-sm">
                        <GraduationCap className="size-5 text-primary" />
                        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Class Of</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{alumni.Graduation_Year}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t bg-muted/10 p-8 lg:border-l lg:border-t-0">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Profile</h4>
                    <div className="mt-6 rounded-2xl border bg-background p-5 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Batch</p>
                      <p className="mt-3 text-lg font-semibold text-foreground">{alumni.Batch || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'connect' && (
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="p-8 sm:p-10">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <Mail className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">Connect</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Ways to reach out and continue the conversation professionally.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                        <Mail className="size-5 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Email</p>
                          <p className="mt-1 truncate text-base font-semibold text-foreground">{alumni.Email}</p>
                        </div>
                      </div>

                      {alumni.Contact_Info && alumni.Contact_Info.trim() !== '' && (
                        <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                          <Phone className="size-5 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Phone</p>
                            <p className="mt-1 truncate text-base font-semibold text-foreground">{alumni.Contact_Info}</p>
                          </div>
                        </div>
                      )}

                      {alumni.LinkedIn && alumni.LinkedIn.trim() !== '' && (
                        <a
                          href={alumni.LinkedIn.startsWith('http') ? alumni.LinkedIn : `https://${alumni.LinkedIn}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-4 rounded-2xl border border-[#0077b5]/20 bg-[#0077b5]/10 p-5 text-[#0077b5] transition-colors hover:bg-[#0077b5]/20"
                        >
                          <ExternalLink className="size-5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em]">LinkedIn</p>
                            <p className="mt-1 text-base font-semibold">View profile</p>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="border-t bg-muted/10 p-8 lg:border-l lg:border-t-0">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Availability</h4>
                    <div className="mt-6 rounded-2xl border bg-background p-5 shadow-sm">
                      <p className="text-sm leading-6 text-muted-foreground">
                        Use the message button for a warm introduction, then continue through the contact options shared on this profile.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
