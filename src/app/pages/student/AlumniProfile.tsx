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
import { 
  GraduationCap, Mail, Briefcase, 
  MapPin, BookOpen, ExternalLink, MessageSquare, Send, ChevronUp, Phone // 👈 Phone imported here
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/UserAvatar';

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
  const { id }   = useParams();
  const navigate = useNavigate();

  const [alumni, setAlumni]                   = useState<Alumni | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [notFound, setNotFound]               = useState(false);
  const [queryText, setQueryText]             = useState('');
  const [isDialogOpen, setIsDialogOpen]       = useState(false);
  const [sending, setSending]                 = useState(false);
  const [existingQueryId, setExistingQueryId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    // Load alumni profile
    apiFetch<Alumni>(`/alumni/${id}`)
      .then(setAlumni)
      .catch(err => {
        console.error('Failed to load alumni profile:', err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));

    // Check if conversation exists
    apiFetch<any[]>('/queries')
      .then(queries => {
        const existing = queries.find(q => q.Alumni_ID === parseInt(id!));
        if (existing) {
          setExistingQueryId(existing.Query_ID);
        }
      })
      .catch(console.error);
  }, [id]);

  const handleSendFirstMessage = async () => {
    if (!queryText.trim()) return;
    setSending(true);
    try {
      const data = await apiFetch<{ queryId: number }>('/queries', {
        method: 'POST',
        body: JSON.stringify({
          alumniId: alumni?.Alumni_ID,
          content:  queryText,
        }),
      });

      toast.success('Conversation started!');
      setQueryText('');
      setIsDialogOpen(false);
      navigate(`/chat/${data.queryId}`);
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
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-muted-foreground animate-pulse">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !alumni) {
    return (
      <DashboardLayout title="Alumni Profile">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Alumni not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const sortedCareerHistory = alumni.careerHistory 
    ? [...alumni.careerHistory].sort((a, b) => b.Start_Year - a.Start_Year)
    : [];

  return (
    <DashboardLayout title="Alumni Profile">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 via-background to-background relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary/20"></div>
          <CardContent className="pt-8 sm:p-10">
            <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
              <UserAvatar 
                profilePic={alumni.Profile_Pic} 
                name={alumni.Name} 
                className="size-24 sm:size-32 text-3xl border-4 border-background shadow-sm shrink-0" 
              />
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                      {alumni.Name}
                      {alumni.Verification_Status && (
                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-xs">Verified</Badge>
                      )}
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                      {sortedCareerHistory?.[0]?.Job_Role 
                        ? `${sortedCareerHistory[0].Job_Role} at ${sortedCareerHistory[0].Company_Name}` 
                        : 'Alumni Member'}
                    </p>
                  </div>
                  
                  <div className="flex gap-3 shrink-0">
                    {existingQueryId ? (
                      <Button onClick={() => navigate(`/chat/${existingQueryId}`)} className="rounded-full px-6">
                        <MessageSquare className="size-4 mr-2" /> Message
                      </Button>
                    ) : (
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="rounded-full px-6">
                            <MessageSquare className="size-4 mr-2" /> Message
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
                          <DialogHeader className="sr-only">
                            <DialogTitle>Start conversation with {alumni.Name}</DialogTitle>
                            <DialogDescription>Send your first message</DialogDescription>
                          </DialogHeader>

                          <div className="bg-primary px-6 py-4 flex items-center gap-3 text-white">
                            <UserAvatar profilePic={alumni.Profile_Pic} name={alumni.Name} className="size-10 border border-white/20" />
                            <div>
                                <h3 className="font-semibold leading-tight">{alumni.Name}</h3>
                                <p className="text-white/70 text-xs">{alumni.Department}</p>
                            </div>
                          </div>

                          <div className="p-6">
                            <p className="text-sm text-muted-foreground mb-4">
                              Send a message to start a conversation. You'll be notified when they reply.
                            </p>
                            
                            <textarea
                              placeholder="Type your message here..."
                              value={queryText}
                              onChange={e => setQueryText(e.target.value)}
                              rows={4}
                              className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />

                            <div className="flex justify-end mt-4">
                              <Button 
                                onClick={handleSendFirstMessage} 
                                disabled={sending || !queryText.trim()}
                                className="w-full sm:w-auto px-8 rounded-full"
                              >
                                {sending ? 'Sending...' : 'Send Message'}
                                <Send className="size-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
                
                {alumni.Bio && (
                  <p className="text-sm leading-relaxed text-foreground/80 max-w-3xl mt-4 bg-muted/30 p-4 rounded-lg border border-border/50 italic">
                    "{alumni.Bio}"
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* CAREER HISTORY TIMELINE */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="size-5 text-primary" /> Career History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedCareerHistory.length > 0 ? (
                  <div className="relative ml-2">
                    
                    <div className="absolute top-2 bottom-2 left-[11px] w-[2px] bg-border z-0"></div>

                    <div className="space-y-8 relative z-10 pt-1">
                      {sortedCareerHistory.map((career, index) => (
                        <div key={career.Career_ID} className="relative pl-10 group">
                          
                          <div className="absolute left-0 top-1 size-6 bg-background border-2 border-primary rounded-full flex items-center justify-center shadow-sm">
                            <div className="size-2 bg-primary rounded-full" />
                          </div>

                          {index !== sortedCareerHistory.length - 1 && (
                            <div className="absolute left-[12px] top-[50px] -translate-x-1/2 text-muted-foreground/40 bg-background py-1 z-10">
                              <ChevronUp className="size-5" />
                            </div>
                          )}

                          <div>
                            <h4 className="font-semibold text-base text-foreground">{career.Job_Role}</h4>
                            <p className="text-sm font-medium text-primary mt-0.5">{career.Company_Name}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              <span className="bg-muted px-2 py-1 rounded-md font-medium text-foreground/70 border border-border/50">
                                {career.Start_Year} — {career.End_Year || 'Present'}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">
                    No career history provided.
                  </p>
                )}
              </CardContent>
            </Card>

            {alumni.jobPostings?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="size-5 text-primary" /> Opportunities Posted
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {alumni.jobPostings.map(job => (
                            <div key={job.Job_ID} className="p-4 rounded-xl border bg-card hover:shadow-md transition-all border-border/60">
                                <h4 className="font-bold text-primary">{job.Job_Title}</h4>
                                <p className="text-sm font-semibold">{job.Company_Name}</p>
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{job.Description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                    <BookOpen className="size-4 text-primary" />
                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Department</p><p className="text-sm font-medium">{alumni.Department}</p></div>
                </div>
                <div className="flex items-center gap-3">
                    <GraduationCap className="size-4 text-primary" />
                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Class Of</p><p className="text-sm font-medium">{alumni.Graduation_Year}</p></div>
                </div>
              </CardContent>
            </Card>

            {/* 👈 UPDATED CONNECT CARD HERE */}
            <Card>
                <CardHeader><CardTitle className="text-base">Connect</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {/* Email Block */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 overflow-hidden">
                        <Mail className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate font-medium">{alumni.Email}</span>
                    </div>

                    {/* Phone Block */}
                    {alumni.Contact_Info && alumni.Contact_Info.trim() !== '' && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 overflow-hidden">
                            <Phone className="size-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate font-medium">{alumni.Contact_Info}</span>
                        </div>
                    )}

                    {/* LinkedIn Block */}
                    {alumni.LinkedIn && alumni.LinkedIn.trim() !== '' && (
                        <a 
                            href={alumni.LinkedIn.startsWith('http') ? alumni.LinkedIn : `https://${alumni.LinkedIn}`} 
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg bg-[#0077b5]/10 text-[#0077b5] border border-[#0077b5]/20 hover:bg-[#0077b5]/30 transition-colors"
                        >
                            <ExternalLink className="size-4 shrink-0" />
                            <span className="text-sm font-semibold">LinkedIn Profile</span>
                        </a>
                    )}
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}