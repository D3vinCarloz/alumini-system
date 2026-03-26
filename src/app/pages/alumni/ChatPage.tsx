import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Send } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface Reply {
  Reply_ID: number;
  User_ID: number;
  senderName: string;
  Content: string;
  Reply_Date: string;
}

interface Query {
  Query_ID: number;
  studentName: string;
  alumniName: string;
  Content: string;
  Status: string;
  Query_Date: string;
  messages: Reply[];
}

export function ChatPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [query, setQuery] = useState<Query | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadQuery = async () => {
    if (!id) return;
    try {
      const data = await apiFetch<Query>(`/queries/${id}`);
      setQuery(data);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuery();
  }, [id]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [query?.messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/replies/${id}`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessage }),
      });
      setNewMessage('');
      await loadQuery();
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !sending) handleSendMessage();
  };

  if (loading) {
    return (
      <DashboardLayout title="Chat">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading conversation...</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (notFound || !query) {
    return (
      <DashboardLayout title="Chat">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Conversation not found.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const isStudent   = user?.role === 'student';
  const otherPerson = isStudent ? query.alumniName : query.studentName;

  return (
    <DashboardLayout title={`Chat with ${otherPerson}`}>
      <div className="max-w-4xl mx-auto">
        <Card className="h-[calc(100vh-220px)] flex flex-col">
          <CardHeader className="border-b border-border">
            <CardTitle>Conversation with {otherPerson}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Started on {new Date(query.Query_Date).toLocaleDateString()}
            </p>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">

            {/* Initial query as first bubble */}
            <div className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[70%]">
                <div className={`rounded-lg px-4 py-3 ${
                  isStudent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground'
                }`}>
                  <p className="text-sm">{query.Content}</p>
                </div>
                <div className={`flex items-center gap-2 mt-1 px-1 ${isStudent ? 'justify-end' : 'justify-start'}`}>
                  <p className="text-xs text-muted-foreground">{query.studentName}</p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">
                    {new Date(query.Query_Date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Replies */}
            {query.messages.map((message) => {
              const isSentByMe = message.User_ID === user?.id;

              return (
                <div
                  key={message.Reply_ID}
                  className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[70%]">
                    <div className={`rounded-lg px-4 py-3 ${
                      isSentByMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    }`}>
                      <p className="text-sm">{message.Content}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 px-1 ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                      <p className="text-xs text-muted-foreground">{message.senderName}</p>
                      <span className="text-xs text-muted-foreground">•</span>
<p className="text-xs text-muted-foreground">
  {new Date(message.Reply_Date).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })}
</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Auto-scroll anchor */}
            <div ref={bottomRef} />
          </CardContent>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending}
                className="flex-1 bg-input-background"
              />
              <Button onClick={handleSendMessage} size="icon" disabled={sending}>
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}