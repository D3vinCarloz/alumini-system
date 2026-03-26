import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogTrigger,
} from '../../components/ui/dialog';
import { GraduationCap, Briefcase, Mail, Phone, Send } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

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
}

interface Alumni {
  Alumni_ID: number;
  Name: string;
  Email: string;
  Department: string;
  Graduation_Year: number;
  Batch: string;
  Contact_Info: string;
  Bio: string;
  Verification_Status: boolean;
  careerHistory: CareerEntry[];
  jobPostings: JobPosting[];
}

interface Reply {
  Reply_ID: number;
  User_ID: number;
  senderName: string;
  Content: string;
  Reply_Date: string;
}

export function AlumniProfile() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [alumni, setAlumni]                     = useState<Alumni | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [notFound, setNotFound]                 = useState(false);
  const [queryText, setQueryText]               = useState('');
  const [isDialogOpen, setIsDialogOpen]         = useState(false);
  const [sending, setSending]                   = useState(false);
  const [existingQueryId, setExistingQueryId]   = useState<number | null>(null);
  const [existingMessages, setExistingMessages] = useState<Reply[]>([]);

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

    // Check if existing thread with this alumni
    apiFetch<any[]>('/queries')
      .then(queries => {
        const existing = queries.find(q => q.Alumni_ID === parseInt(id!));
        if (existing) {
          setExistingQueryId(existing.Query_ID);
          // Load full thread
          apiFetch<any>(`/queries/${existing.Query_ID}`)
            .then(thread => {
              // First message is the initial query content stored in QUERY table
              const firstMessage: Reply = {
                Reply_ID:   0,
                User_ID:    -1,
                senderName: thread.studentName,
                Content:    thread.Content,
                Reply_Date: thread.Query_Date,
              };
              // Combine initial query + all replies into one list
              setExistingMessages([firstMessage, ...(thread.messages || [])]);
            })
            .catch(console.error);
        }
      })
      .catch(console.error);
  }, [id]);

  const handleSendQuery = async () => {
    if (!queryText.trim()) {
      toast.error('Please enter your query');
      return;
    }
    setSending(true);
    try {
      const data = await apiFetch<{ queryId: number; existing: boolean }>('/queries', {
        method: 'POST',
        body: JSON.stringify({
          alumniId: alumni?.Alumni_ID,
          content:  queryText,
        }),
      });

      if (data.existing) {
        toast.success('Message added to your existing conversation!');
      } else {
        toast.success('Query sent successfully!');
      }

      setQueryText('');
      setIsDialogOpen(false);
      setTimeout(() => navigate(`/chat/${data.queryId}`), 1000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send query. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Alumni Profile">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (notFound || !alumni) {
    return (
      <DashboardLayout title="Alumni Profile">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Alumni not found.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Alumni Profile">
      <div className="max-w-4xl space-y-6">

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="size-12 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{alumni.Name}</h2>
                    <p className="text-muted-foreground mt-1">{alumni.Department}</p>
                    <p className="text-sm text-muted-foreground">
                      Class of {alumni.Graduation_Year}
                      {alumni.Batch ? ` · Batch ${alumni.Batch}` : ''}
                    </p>
                  </div>
                  {alumni.Verification_Status && (
                    <Badge variant="default" className="bg-green-600">Verified</Badge>
                  )}
                </div>
                <p className="mt-4 text-foreground">{alumni.Bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <span>{alumni.Email}</span>
            </div>
            {alumni.Contact_Info && (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" />
                <span>{alumni.Contact_Info}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Career History */}
        <Card>
          <CardHeader>
            <CardTitle>Career History</CardTitle>
          </CardHeader>
          <CardContent>
            {alumni.careerHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No career history available.
              </p>
            ) : (
              <div className="space-y-4">
                {alumni.careerHistory.map(career => (
                  <div
                    key={career.Career_ID}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border"
                  >
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="size-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{career.Job_Role}</h4>
                      <p className="text-sm text-muted-foreground">{career.Company_Name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {career.Start_Year} – {career.End_Year ?? 'Present'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Postings */}
        {alumni.jobPostings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Job Postings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alumni.jobPostings.map(job => (
                <div key={job.Job_ID} className="p-4 rounded-lg border border-border">
                  <h4 className="font-semibold">{job.Job_Title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{job.Company_Name}</p>
                  <p className="text-sm mt-2">{job.Description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Posted on {new Date(job.Posting_Date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Send Query Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="w-full">
            <div className="w-full flex items-center justify-center gap-2 h-11 px-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer">
              <Send className="size-4" />
              {existingQueryId ? 'Continue Conversation' : 'Send Query'}
            </div>
          </DialogTrigger>

          <DialogContent className="max-w-lg p-0 overflow-hidden">

            {/* Hidden accessibility */}
            <DialogHeader className="sr-only">
              <DialogTitle>
                {existingQueryId
                  ? `Continue conversation with ${alumni.Name}`
                  : `Send Query to ${alumni.Name}`}
              </DialogTitle>
              <DialogDescription>
                Type your message to send to {alumni.Name}
              </DialogDescription>
            </DialogHeader>

            {/* Coloured header */}
            <div className="bg-primary px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">
                    {alumni.Name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{alumni.Name}</h3>
                  <p className="text-white/70 text-xs">
                    {alumni.Department || 'Alumni'}
                    {alumni.Graduation_Year ? ` · Class of ${alumni.Graduation_Year}` : ''}
                  </p>
                </div>
                {existingQueryId && (
                  <span className="ml-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
                    Existing conversation
                  </span>
                )}
              </div>
            </div>

            {/* Chat preview area */}
            <div className="bg-muted/30 px-6 py-4 min-h-[160px] max-h-[220px] overflow-y-auto flex flex-col justify-end space-y-3">

              {existingQueryId && existingMessages.length > 0 ? (
                <>
                  <div className="flex justify-center mb-1">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      Previous messages
                    </span>
                  </div>
                  {existingMessages.slice(-2).map((msg: Reply) => {
                    const isMe = msg.senderName !== alumni.Name;
                    return (
                      <div
                        key={msg.Reply_ID}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted text-foreground rounded-bl-sm'
                        }`}>
                          <p>{msg.Content}</p>
                          <p className={`text-[9px] mt-0.5 ${
                            isMe
                              ? 'text-primary-foreground/60 text-right'
                              : 'text-muted-foreground'
                          }`}>
                            {msg.senderName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="flex justify-center">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {existingQueryId
                      ? 'Continue your conversation'
                      : `Start a conversation with ${alumni.Name.split(' ')[0]}`}
                  </span>
                </div>
              )}

              {/* Live preview of typed message */}
              {queryText.trim() && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
                    <p className="text-sm leading-relaxed">{queryText}</p>
                    <p className="text-[10px] text-primary-foreground/60 mt-1 text-right">
                      You · now
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tips — only for new conversations */}
            {!queryText.trim() && !existingQueryId && (
              <div className="px-6 py-2 border-t border-border bg-background">
                <p className="text-xs text-muted-foreground">
                  💡 <span className="font-medium">Tips:</span> Ask about career advice, interview tips, or opportunities at their company.
                </p>
              </div>
            )}

            {/* Input area */}
            <div className="px-4 py-4 border-t border-border bg-background">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    placeholder={
                      existingQueryId
                        ? 'Type your message...'
                        : 'Type your question here...'
                    }
                    value={queryText}
                    onChange={e => setQueryText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendQuery();
                      }
                    }}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 text-right pr-1">
                    Enter to send · Shift+Enter for new line
                  </p>
                </div>
                <Button
                  onClick={handleSendQuery}
                  disabled={sending || !queryText.trim()}
                  size="icon"
                  className="size-11 rounded-full shrink-0 mb-5"
                >
                  {sending
                    ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send className="size-4" />}
                </Button>
              </div>
            </div>

          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}