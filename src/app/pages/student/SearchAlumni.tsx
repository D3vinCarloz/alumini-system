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

interface Alumni {
  Alumni_ID: number;
  Name: string;
  Email: string;
  Department: string;
  Graduation_Year: number;
  Batch: string;
  Bio: string;
  Verification_Status: boolean;
}

export function SearchAlumni() {
  const [allAlumni, setAllAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('all');
  const [batch, setBatch]           = useState('all');

  useEffect(() => {
    apiFetch<Alumni[]>('/alumni')
      .then(setAllAlumni)
      .catch(err => {
        console.error('Failed to load alumni:', err);
        toast.error('Failed to load alumni');
      })
      .finally(() => setLoading(false));
  }, []);

  // Build filter options from real DB data
  const departments = [
    'all',
    ...Array.from(new Set(allAlumni.map(a => a.Department).filter(Boolean))),
  ];

  const batches = [
    'all',
    ...Array.from(new Set(allAlumni.map(a => a.Batch).filter(Boolean))).sort().reverse(),
  ];

  // Client-side filtering
  const filteredAlumni = allAlumni.filter(alumni => {
    const matchesSearch =
      alumni.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumni.Department ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = department === 'all' || alumni.Department === department;
    const matchesBatch      = batch === 'all' || alumni.Batch === batch;
    return matchesSearch && matchesDepartment && matchesBatch && alumni.Verification_Status;
  });

  return (
    <DashboardLayout title="Search Alumni">
      <div className="space-y-6">

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or department..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input-background"
                />
              </div>

              {/* Department filter */}
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="md:w-52">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept === 'all' ? 'All Departments' : dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Batch filter */}
              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger className="md:w-40">
                  <SelectValue placeholder="Filter by batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(b => (
                    <SelectItem key={b} value={b}>
                      {b === 'all' ? 'All Batches' : `Batch ${b}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear filters */}
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

            {/* Active filter count */}
            {!loading && (
              <p className="text-xs text-muted-foreground mt-3">
                Showing {filteredAlumni.length} of {allAlumni.filter(a => a.Verification_Status).length} verified alumni
              </p>
            )}
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-3">
                    <div className="flex gap-4">
                      <div className="size-12 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-9 bg-muted rounded w-full mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Alumni Grid */}
        {!loading && filteredAlumni.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlumni.map(alumni => (
              <Card key={alumni.Alumni_ID} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="size-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{alumni.Name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{alumni.Department || 'Department not set'}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
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

                  <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                    {alumni.Bio || 'No bio provided yet.'}
                  </p>

                  <Link to={`/alumni/${alumni.Alumni_ID}`}>
                    <Button className="w-full mt-4">
                      View Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredAlumni.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="size-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                {allAlumni.length === 0
                  ? 'No alumni available yet.'
                  : 'No verified alumni found matching your criteria.'}
              </p>
              {allAlumni.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-1">
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