import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Link } from 'react-router';
import { MessageSquare } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

interface Query {
  Query_ID: number;
  studentName: string;
  Content: string;
  Status: 'pending' | 'answered';
  Query_Date: string;
}

export function AlumniQueries() {
  const [receivedQueries, setReceivedQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);

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
            All Received Queries
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
                  <th className="text-left py-3 px-4 font-medium">Student</th>
                  <th className="text-left py-3 px-4 font-medium">Question</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : receivedQueries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      No queries received yet.
                    </td>
                  </tr>
                ) : (
                  receivedQueries.map((query) => (
                    <tr
                      key={query.Query_ID}
                      className="border-b border-border hover:bg-secondary/50"
                    >
                      <td className="py-4 px-4 font-medium">{query.studentName}</td>
                      <td className="py-4 px-4 max-w-md">
                        <p className="truncate text-muted-foreground">
                          {query.Content}
                        </p>
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
                        <Link
                          to={`/chat/${query.Query_ID}`}
                          className="text-primary hover:underline flex items-center gap-2"
                        >
                          <MessageSquare className="size-4" />
                          {query.Status === 'pending' ? 'Reply' : 'View Chat'}
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