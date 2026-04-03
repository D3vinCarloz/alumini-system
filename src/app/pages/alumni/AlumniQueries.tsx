import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Link } from 'react-router';
import { MessageSquare } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/UserAvatar';

interface Query {
  Query_ID: number;
  Thread_ID: string;
  counterpartName: string;
  counterpartRole: 'student' | 'alumni';
  Profile_Pic?: string | null;
  Content: string;
  Status: string;
  Query_Date: string;
}

export function AlumniQueries() {
  const [receivedQueries, setReceivedQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    apiFetch<Query[]>('/queries')
      .then(setReceivedQueries)
      .catch((err) => {
        console.error('Failed to load queries:', err);
        toast.error('Failed to load queries');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Query Management">
      <Card>
        <CardHeader>
          <CardTitle>
            Conversations
            {!loading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({receivedQueries.length} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium">Person</th>
                  <th className="px-4 py-3 text-left font-medium">Latest Message</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : receivedQueries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No conversations yet.
                    </td>
                  </tr>
                ) : (
                  receivedQueries.map((query) => (
                    <tr key={query.Thread_ID} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            profilePic={query.Profile_Pic}
                            name={query.counterpartName}
                            className="size-8 text-xs"
                          />
                          <span className="font-medium">{query.counterpartName}</span>
                        </div>
                      </td>
                      <td className="max-w-md px-4 py-4">
                        <p className="truncate text-muted-foreground">{query.Content}</p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline">{query.counterpartRole}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={query.Status === 'unread' ? 'default' : 'secondary'}>
                          {query.Status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {formatDate(query.Query_Date)}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          to={`/chat/${query.Thread_ID}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <MessageSquare className="size-4" />
                          Open Chat
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
