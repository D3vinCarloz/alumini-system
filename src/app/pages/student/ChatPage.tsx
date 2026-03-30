import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router'; // 👈 Added Link
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Send, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/UserAvatar'; // 👈 Added UserAvatar

export function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 👈 Signal the Header to refresh the unread notification count
  const refreshBell = () => {
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const loadQuery = async (quiet = false) => {
    if (!id) return;
    if (!quiet) setLoading(true);
    try {
      // Use timestamp ?t= to bypass browser cache
      const data = await apiFetch<any>(`/queries/${id}?t=${Date.now()}`);
      setQuery(data);
      
      // 👈 Clear the red badge in the header instantly
      refreshBell(); 
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => { loadQuery(); }, [id]);

  // Always scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [query?.messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !query) return;
    setSending(true);
    const content = newMessage;
    setNewMessage('');

    // Optimistic UI: Add the message to the screen before the server responds
    const tempMsg = {
      Reply_ID: Date.now(),
      User_ID: user.id,
      senderName: user.name,
      Content: content,
      Reply_Date: new Date().toISOString(),
    };
    setQuery((prev: any) => prev ? { ...prev, messages: [...prev.messages, tempMsg] } : null);

    try {
      await apiFetch(`/replies/${id}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      // Quietly reload to sync final timestamps and IDs
      await loadQuery(true); 
    } catch (err) {
      toast.error('Failed to send message.');
      await loadQuery(true); // Rollback optimistic update on error
    } finally {
      setSending(false);
    }
  };

  if (loading) return <DashboardLayout title="Chat"><div className="p-12 text-center text-muted-foreground">Loading Chat...</div></DashboardLayout>;
  if (!query) return <DashboardLayout title="Chat"><div className="p-12 text-center text-muted-foreground">Conversation not found.</div></DashboardLayout>;

  const isMe = (uid: number) => uid === user?.id;
  
  // 👈 NEW: Dynamic identity logic for the Header
  const isStudent = user?.role === 'student';
  const otherPersonName = isStudent ? query.alumniName : query.studentName;
  const otherPersonPic = isStudent ? query.alumniProfilePic : query.studentProfilePic;
  const profileLink = isStudent ? `/alumni/${query.Alumni_ID}` : `/student/${query.Student_ID}`;

  return (
    <DashboardLayout title={`Chat with ${otherPersonName}`}>
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2 pl-0 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </Button>

        <Card className="h-[calc(100vh-220px)] flex flex-col shadow-lg border-none bg-background overflow-hidden">
          
          {/* 👈 UPDATED HEADER: Now clickable with Avatar */}
          <CardHeader className="border-b bg-muted/10 px-6 py-3">
            <Link to={profileLink} className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit group outline-none">
              <UserAvatar 
                profilePic={otherPersonPic} 
                name={otherPersonName} 
                className="size-11 border bg-background group-hover:border-primary/50 transition-colors" 
              />
              <div className="flex flex-col">
                <CardTitle className="text-base font-bold text-foreground/90 group-hover:text-primary transition-colors">
                  {otherPersonName}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                  {isStudent ? 'Alumni' : 'Student'}
                </p>
              </div>
            </Link>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10">
            {/* Initial Question */}
            <div className={`flex ${user?.role === 'student' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${user?.role === 'student' ? 'bg-primary text-white rounded-br-none' : 'bg-card border rounded-bl-none'}`}>
                {query.Content}
                <p className={`text-[9px] mt-1 opacity-60 text-right ${user?.role === 'student' ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {new Date(query.Query_Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Conversation History */}
            {query.messages.map((m: any) => (
              <div key={m.Reply_ID} className={`flex ${isMe(m.User_ID) ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMe(m.User_ID) ? 'bg-primary text-white rounded-br-none' : 'bg-card border rounded-bl-none'}`}>
                  {m.Content}
                  <p className={`text-[9px] mt-1 opacity-60 text-right ${isMe(m.User_ID) ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {new Date(m.Reply_Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </CardContent>

          {/* Messenger Input */}
          <div className="p-4 border-t bg-card">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                className="flex-1 bg-muted/30 border-none rounded-full px-4"
              />
              <Button onClick={handleSendMessage} size="icon" disabled={sending || !newMessage.trim()} className="rounded-full shadow-md shrink-0">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}