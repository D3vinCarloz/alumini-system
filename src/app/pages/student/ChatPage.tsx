import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Send, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/UserAvatar';

export function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshBell = () => {
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const loadQuery = async (quiet = false) => {
    if (!id) return;
    if (!quiet) setLoading(true);
    try {
      const data = await apiFetch<any>(`/queries/${id}?t=${Date.now()}`);
      setQuery(data);
      refreshBell();
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    loadQuery();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [query?.messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !query) return;
    setSending(true);
    const content = newMessage;
    setNewMessage('');

    const tempMsg = {
      Reply_ID: Date.now(),
      User_ID: user.id,
      senderName: user.name,
      Content: content,
      Reply_Date: new Date().toISOString(),
    };
    setQuery((prev: any) => (prev ? { ...prev, messages: [...prev.messages, tempMsg] } : null));

    try {
      await apiFetch(`/replies/${id}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      await loadQuery(true);
    } catch (err) {
      toast.error('Failed to send message.');
      await loadQuery(true);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <DashboardLayout title="Chat"><div className="p-12 text-center text-muted-foreground">Loading Chat...</div></DashboardLayout>;
  if (!query) return <DashboardLayout title="Chat"><div className="p-12 text-center text-muted-foreground">Conversation not found.</div></DashboardLayout>;

  const isMe = (uid: number) => uid === user?.id;
  const counterpartRole = query.counterpartRole || (user?.role === 'student' ? 'alumni' : 'student');
  const otherPersonName = query.counterpartName || (user?.role === 'student' ? query.alumniName : query.studentName);
  const otherPersonPic = query.counterpartProfilePic || (user?.role === 'student' ? query.alumniProfilePic : query.studentProfilePic);
  const profileLink = counterpartRole === 'alumni'
    ? `/alumni/${query.counterpartAlumniId || query.Alumni_ID}`
    : `/student/${query.Student_ID}`;

  return (
    <DashboardLayout title={`Chat with ${otherPersonName}`}>
      <div className="mx-auto max-w-4xl space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2 pl-0 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </Button>

        <Card className="flex h-[calc(100vh-220px)] flex-col overflow-hidden border-none bg-background shadow-lg">
          <CardHeader className="border-b bg-muted/10 px-6 py-3">
            <Link to={profileLink} className="group flex w-fit items-center gap-3 outline-none transition-opacity hover:opacity-80">
              <UserAvatar
                profilePic={otherPersonPic}
                name={otherPersonName}
                className="size-11 border bg-background transition-colors group-hover:border-primary/50"
              />
              <div className="flex flex-col">
                <CardTitle className="text-base font-bold text-foreground/90 transition-colors group-hover:text-primary">
                  {otherPersonName}
                </CardTitle>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {counterpartRole}
                </p>
              </div>
            </Link>
          </CardHeader>

          <CardContent className="flex-1 space-y-4 overflow-y-auto bg-muted/10 p-6">
            <div className={`flex ${isMe(query.messages?.[0]?.User_ID) ? 'justify-end' : user?.role === 'student' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${user?.role === 'student' || query.counterpartRole === 'student' ? 'bg-primary text-white rounded-br-none' : 'rounded-bl-none border bg-card'}`}>
                {query.Content}
                <p className={`mt-1 text-right text-[9px] opacity-60 ${user?.role === 'student' || query.counterpartRole === 'student' ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {new Date(query.Query_Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {query.messages.map((m: any) => (
              <div key={m.Reply_ID} className={`flex ${isMe(m.User_ID) ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMe(m.User_ID) ? 'rounded-br-none bg-primary text-white' : 'rounded-bl-none border bg-card'}`}>
                  {m.Content}
                  <p className={`mt-1 text-right text-[9px] opacity-60 ${isMe(m.User_ID) ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {new Date(m.Reply_Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </CardContent>

          <div className="border-t bg-card p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                className="flex-1 rounded-full border-none bg-muted/30 px-4"
              />
              <Button onClick={handleSendMessage} size="icon" disabled={sending || !newMessage.trim()} className="shrink-0 rounded-full shadow-md">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
