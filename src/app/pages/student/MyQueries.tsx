import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router'; 
import { DashboardLayout } from '../../components/layout/DashboardLayout'; // 👈 Fixed path
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'; // 👈 Fixed path
import { MessageSquareOff, Search, Clock, CheckCircle, MessageCircle, ChevronRight, CornerDownRight } from 'lucide-react';
import { apiFetch } from '../../lib/api'; // 👈 Fixed path
import { toast } from 'sonner';
import { UserAvatar } from '../../components/UserAvatar'; // 👈 Fixed path
import { Input } from '../../components/ui/input'; // 👈 Fixed path
import { useAuth } from '../../context/AuthContext'; // 👈 Fixed path

interface Query {
  Query_ID: number;
  alumniName?: string;
  studentName?: string;
  Profile_Pic?: string | null;
  Content: string;
  Status: string; 
  isUnread: boolean;
  Latest_Sender_Role: 'student' | 'alumni' | null;
  Query_Date: string;
}

export function MyQueries() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<Query[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  useEffect(() => {
    setLoading(true); 
    
    apiFetch<Query[]>('/queries')
      .then((data) => {
        const sorted = data.sort((a, b) => new Date(b.Query_Date).getTime() - new Date(a.Query_Date).getTime());
        setQueries(sorted);
        setFilteredQueries(sorted);
      })
      .catch((err) => {
        console.error('Failed to load queries:', err);
        toast.error('Failed to load your messages');
      })
      .finally(() => setLoading(false));
  }, [location.key]);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredQueries(queries);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredQueries(queries.filter(q => {
        const name = (q.alumniName || q.studentName || '').toLowerCase();
        const content = (q.Content || '').toLowerCase();
        return name.includes(lowerQuery) || content.includes(lowerQuery);
      }));
    }
  }, [searchQuery, queries]);

  return (
    <DashboardLayout title="Messages">
      <div className="mx-auto flex h-[calc(100vh-120px)] max-w-5xl flex-col gap-4">
        <Card className="border-none">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Inbox</p>
              <h2 className="mt-2 text-2xl font-bold">Messages</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 sm:min-w-[360px]">
              <MiniInboxStat title="Total" value={queries.length} />
              <MiniInboxStat title="Unread" value={queries.filter(q => q.isUnread).length} />
              <MiniInboxStat title="Visible" value={filteredQueries.length} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm flex flex-col h-full bg-background">
          <CardHeader className="border-b bg-muted/10 pb-4 pt-6 px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-xl flex items-center gap-2">
                Inbox
                <span className="bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full font-semibold">
                  {queries.length} Total
                </span>
              </CardTitle>
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search messages..." 
                  className="pl-9 bg-background border-muted-foreground/20 rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-y-auto bg-muted/5">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground animate-pulse">
                Loading inbox...
              </div>
            ) : queries.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center h-full">
                <MessageSquareOff className="size-12 text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-lg font-medium">No messages yet</h3>
                <p className="text-muted-foreground mt-1 text-sm">Conversations you start will appear here.</p>
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground">
                No messages match your search.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredQueries.map((query) => {
                  const displayName = user?.role === 'student' ? query.alumniName : query.studentName;
                  const isUnread = query.isUnread;
                  
                  // Logic to determine turn
                  const isWaitingForReply = 
                    query.Latest_Sender_Role === user?.role || 
                    (!query.Latest_Sender_Role && user?.role === 'student');

                  return (
                    <Link
                      key={query.Query_ID}
                      to={`/chat/${query.Query_ID}`}
                      className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:px-6 transition-all group ${
                        isUnread ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50 bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <UserAvatar 
                            profilePic={query.Profile_Pic} 
                            name={displayName || 'User'} 
                            className="size-12 sm:size-14 border" 
                          />
                          {isUnread && (
                            <span className="absolute -top-1 -right-1 size-3.5 bg-primary border-2 border-background rounded-full"></span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className={`truncate text-base ${isUnread ? 'font-bold text-foreground' : 'font-semibold text-foreground/90'}`}>
                              {displayName}
                            </h3>
                            <span className={`text-xs whitespace-nowrap ml-2 ${isUnread ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                              {new Date(query.Query_Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className={`text-sm truncate pr-4 ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {query.Content}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 sm:w-40 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          {isUnread ? (
                            <span className="flex items-center text-primary bg-primary/10 px-2 py-1 rounded-full">
                              <MessageCircle className="size-3 mr-1" /> New Message
                            </span>
                          ) : isWaitingForReply ? (
                            <span className="flex items-center text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                              <Clock className="size-3 mr-1" /> Pending
                            </span>
                          ) : (
                            <span className="flex items-center text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                              <CornerDownRight className="size-3 mr-1" /> Your turn
                            </span>
                          )}
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                      </div>
                    </Link>
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

function MiniInboxStat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-[1.1rem] border border-border/70 bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
