import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../../components/ui/dialog';
import { Eye } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

interface Query {
  Query_ID: number;
  studentName: string;
  alumniName: string;
  Content: string;
  Status: 'pending' | 'answered';
  Query_Date: string;
}

interface Reply {
  Reply_ID: number;
  senderName: string;
  Content: string;
  Reply_Date: string;
}

interface ThreadDetail extends Query {
  messages: Reply[];
}

export function QueryMonitor() {
  const [queries, setQueries]           = useState<Query[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedThread, setSelectedThread] = useState<ThreadDetail | null>(null);
  const [threadLoading, setThreadLoading]   = useState(false);

  useEffect(() => {
    apiFetch<Query[]>('/admin/queries')
      .then(setQueries)
      .catch(err => {
        console.error('Failed to load queries:', err);
        toast.error('Failed to load queries');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleView = async (queryId: number) => {
    setSelectedThread(null);
    setThreadLoading(true);
    try {
      const data = await apiFetch<ThreadDetail>(`/queries/${queryId}`);
      setSelectedThread(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load conversation');
    } finally {
      setThreadLoading(false);
    }
  };

  return (
    <DashboardLayout title="Query Monitor">
      <Card>
        <CardHeader>
          <CardTitle>
            All Platform Queries
            {!loading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({queries.length} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Student</th>
                  <th className="text-left py-3 px-4 font-medium">Alumni</th>
                  <th className="text-left py-3 px-4 font-medium">Question Preview</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : queries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      No queries found.
                    </td>
                  </tr>
                ) : (
                  queries.map(query => (
                    <tr
                      key={query.Query_ID}
                      className="border-b border-border hover:bg-secondary/50"
                    >
                      <td className="py-4 px-4 font-medium">{query.studentName}</td>
                      <td className="py-4 px-4 font-medium">{query.alumniName}</td>
                      <td className="py-4 px-4 max-w-md">
                        <p className="truncate text-muted-foreground">{query.Content}</p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={query.Status === 'answered' ? 'default' : 'secondary'}>
                          {query.Status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {new Date(query.Query_Date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-primary"
                          onClick={() => handleView(query.Query_ID)}
                        >
                          <Eye className="size-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Thread detail dialog */}
      <Dialog
        open={!!selectedThread || threadLoading}
        onOpenChange={open => { if (!open) setSelectedThread(null); }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {threadLoading
                ? 'Loading conversation...'
                : `${selectedThread?.studentName} → ${selectedThread?.alumniName}`}
            </DialogTitle>
            <DialogDescription>
              {selectedThread && (
                <span className="flex items-center gap-2">
                  Started {new Date(selectedThread.Query_Date).toLocaleDateString()}
                  <Badge variant={selectedThread.Status === 'answered' ? 'default' : 'secondary'}>
                    {selectedThread.Status}
                  </Badge>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {threadLoading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : selectedThread && (
            <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">

              {/* Initial query */}
              <div className="flex justify-end">
                <div className="max-w-[70%]">
                  <div className="rounded-lg px-4 py-3 bg-primary text-primary-foreground">
                    <p className="text-sm">{selectedThread.Content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1 justify-end">
                    <p className="text-xs text-muted-foreground">{selectedThread.studentName}</p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedThread.Query_Date).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit', hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {selectedThread.messages.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No replies yet
                </div>
              ) : (
                selectedThread.messages.map(msg => {
                  const isStudent = msg.senderName === selectedThread.studentName;
                  return (
                    <div
                      key={msg.Reply_ID}
                      className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[70%]">
                        <div className={`rounded-lg px-4 py-3 ${
                          isStudent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground'
                        }`}>
                          <p className="text-sm">{msg.Content}</p>
                        </div>
                        <div className={`flex items-center gap-2 mt-1 px-1 ${isStudent ? 'justify-end' : 'justify-start'}`}>
                          <p className="text-xs text-muted-foreground">{msg.senderName}</p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(msg.Reply_Date).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short',
                              hour: '2-digit', minute: '2-digit', hour12: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}