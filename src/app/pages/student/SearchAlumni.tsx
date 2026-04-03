import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, GraduationCap, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/UserAvatar';
import { useAuth } from '../../context/AuthContext';

interface Alumni {
  Alumni_ID: number;
  Name: string;
  Email: string;
  Profile_Pic?: string | null;
  Department: string;
  Graduation_Year: number;
  Batch: string;
  Bio: string;
  Verification_Status: boolean;
}

export function SearchAlumni() {
  const { user } = useAuth();
  const [allAlumni, setAllAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('all');
  const [batch, setBatch] = useState('all');

  useEffect(() => {
    apiFetch<Alumni[]>('/alumni')
      .then(setAllAlumni)
      .catch((err) => {
        console.error('Failed to load alumni:', err);
        toast.error('Failed to load alumni');
      })
      .finally(() => setLoading(false));
  }, []);

  const departments = [
    'all',
    ...Array.from(new Set(allAlumni.map((a) => a.Department).filter(Boolean))),
  ];

  const batches = [
    'all',
    ...Array.from(new Set(allAlumni.map((a) => a.Batch).filter(Boolean))).sort().reverse(),
  ];

  const filteredAlumni = allAlumni.filter((alumni) => {
    const isCurrentUser = user?.role === 'alumni' && user.subId === alumni.Alumni_ID;
    const matchesSearch =
      alumni.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumni.Department ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = department === 'all' || alumni.Department === department;
    const matchesBatch = batch === 'all' || alumni.Batch === batch;
    return matchesSearch && matchesDepartment && matchesBatch && alumni.Verification_Status && !isCurrentUser;
  });

  return (
    <DashboardLayout title="Search Alumni">
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-input-background pl-10"
                />
              </div>

              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="md:w-52">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept === 'all' ? 'All Departments' : dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger className="md:w-40">
                  <SelectValue placeholder="Filter by batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b === 'all' ? 'All Batches' : `Batch ${b}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchTerm || department !== 'all' || batch !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setDepartment('all');
                    setBatch('all');
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            {!loading && (
              <p className="mt-3 text-xs text-muted-foreground">
                Showing {filteredAlumni.length} of {allAlumni.filter((a) => a.Verification_Status).length} verified alumni
              </p>
            )}
          </CardContent>
        </Card>

        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="space-y-3 animate-pulse">
                    <div className="flex gap-4">
                      <div className="size-12 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                      </div>
                    </div>
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="mt-2 h-9 w-full rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredAlumni.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAlumni.map((alumni) => (
              <Card key={alumni.Alumni_ID} className="transition-shadow hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <UserAvatar
                      profilePic={alumni.Profile_Pic}
                      name={alumni.Name}
                      className="size-12 text-sm"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{alumni.Name}</h3>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{alumni.Department || 'Department not set'}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="size-3 shrink-0" />
                        <span>
                          {alumni.Graduation_Year
                            ? `Class of ${alumni.Graduation_Year}`
                            : 'Year not set'}
                          {alumni.Batch ? ` · Batch ${alumni.Batch}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                    {alumni.Bio || 'No bio provided yet.'}
                  </p>

                  <Link to={`/alumni/${alumni.Alumni_ID}`}>
                    <Button className="mt-4 w-full">
                      View Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredAlumni.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="mx-auto mb-3 size-12 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">
                {allAlumni.length === 0
                  ? 'No alumni available yet.'
                  : 'No verified alumni found matching your criteria.'}
              </p>
              {allAlumni.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Alumni will appear here once they register and are verified by admin.
                </p>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setSearchTerm('');
                    setDepartment('all');
                    setBatch('all');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
