import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowRight, Briefcase, Calendar, GraduationCap, MapPin, Search, SlidersHorizontal, Users } from 'lucide-react';
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

  const departments = ['all', ...Array.from(new Set(allAlumni.map((a) => a.Department).filter(Boolean)))];
  const batches = ['all', ...Array.from(new Set(allAlumni.map((a) => a.Batch).filter(Boolean))).sort().reverse()];
  const verifiedAlumni = allAlumni.filter((a) => a.Verification_Status);

  const filteredAlumni = verifiedAlumni.filter((alumni) => {
    const isCurrentUser = user?.role === 'alumni' && user.subId === alumni.Alumni_ID;
    const matchesSearch =
      alumni.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumni.Department ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = department === 'all' || alumni.Department === department;
    const matchesBatch = batch === 'all' || alumni.Batch === batch;
    return matchesSearch && matchesDepartment && matchesBatch && !isCurrentUser;
  });

  return (
    <DashboardLayout title="Search Alumni">
      <div className="space-y-6">
        <Card className="border-none">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Directory</p>
                <h2 className="mt-2 text-2xl font-bold">Search Alumni</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[430px]">
                <MiniStat title="Verified" value={loading ? '...' : verifiedAlumni.length} />
                <MiniStat title="Departments" value={loading ? '...' : Math.max(departments.length - 1, 0)} />
                <MiniStat title="Results" value={loading ? '...' : filteredAlumni.length} />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.5fr_0.75fr_0.75fr_auto]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or department"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 rounded-2xl border-border/70 bg-input-background pl-11"
                />
              </div>

              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-12 rounded-2xl border-border/70 bg-input-background">
                  <SelectValue placeholder="Department" />
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
                <SelectTrigger className="h-12 rounded-2xl border-border/70 bg-input-background">
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b === 'all' ? 'All Batches' : `Batch ${b}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="h-12"
                onClick={() => {
                  setSearchTerm('');
                  setDepartment('all');
                  setBatch('all');
                }}
              >
                Reset
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-[1.25rem] bg-[#f7f4ee] px-4 py-3 text-sm text-muted-foreground">
              <SlidersHorizontal className="size-4" />
              {loading ? (
                <span>Loading filters...</span>
              ) : (
                <>
                  <span>{department === 'all' ? 'All departments' : department}</span>
                  <span className="text-border">•</span>
                  <span>{batch === 'all' ? 'All batches' : `Batch ${batch}`}</span>
                  <span className="text-border">•</span>
                  <span>{`${filteredAlumni.length} result${filteredAlumni.length === 1 ? '' : 's'}`}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-4 p-6">
                  <div className="h-28 animate-pulse rounded-[1.5rem] bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-10 animate-pulse rounded-full bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredAlumni.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredAlumni.map((alumni) => (
              <Card key={alumni.Alumni_ID} className="group overflow-hidden border-none">
                <div className="h-20 bg-[linear-gradient(135deg,rgba(24,59,91,0.96),rgba(31,122,109,0.84))]" />
                <CardContent className="relative space-y-5 p-6">
                  <div className="-mt-11 flex items-start gap-4">
                    <UserAvatar
                      profilePic={alumni.Profile_Pic}
                      name={alumni.Name}
                      className="size-14 border-4 border-white text-sm shadow-md"
                    />
                    <div className="min-w-0 flex-1 pt-7">
                      <h3 className="truncate text-lg font-semibold">{alumni.Name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{alumni.Department || 'Department not set'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <MetaPill icon={Calendar} text={alumni.Graduation_Year ? `Class of ${alumni.Graduation_Year}` : 'Year not set'} />
                    <MetaPill icon={Briefcase} text={alumni.Batch ? `Batch ${alumni.Batch}` : 'Batch not set'} />
                  </div>

                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {alumni.Bio || 'Profile available.'}
                  </p>

                  <div className="flex gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">Preview</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl rounded-[2rem] border-none bg-[#fffdf8] p-0 shadow-[0_35px_90px_rgba(24,59,91,0.18)]">
                        <div className="h-28 bg-[linear-gradient(135deg,rgba(24,59,91,0.96),rgba(31,122,109,0.84))]" />
                        <div className="space-y-6 p-7">
                          <DialogHeader className="space-y-3 text-left">
                            <div className="-mt-16 flex items-end gap-4">
                              <UserAvatar
                                profilePic={alumni.Profile_Pic}
                                name={alumni.Name}
                                className="size-20 border-4 border-white text-lg shadow-lg"
                              />
                              <div>
                                <DialogTitle className="text-2xl font-bold">{alumni.Name}</DialogTitle>
                                <p className="mt-1 text-sm text-muted-foreground">{alumni.Department || 'Department not set'}</p>
                              </div>
                            </div>
                          </DialogHeader>

                          <div className="grid gap-4 md:grid-cols-3">
                            <PreviewStat icon={Calendar} label="Graduation" value={alumni.Graduation_Year || 'Not set'} />
                            <PreviewStat icon={Users} label="Batch" value={alumni.Batch || 'Not set'} />
                            <PreviewStat icon={MapPin} label="Status" value="Verified" />
                          </div>

                          <div className="rounded-[1.25rem] bg-[#f7f4ee] px-5 py-4 text-sm text-muted-foreground">
                            {alumni.Bio || 'Open the full profile for details.'}
                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Link to={`/alumni/${alumni.Alumni_ID}`} className="flex-1">
                              <Button className="w-full">
                                View Profile
                                <ArrowRight className="size-4" />
                              </Button>
                            </Link>
                            <Button variant="outline" className="flex-1" asChild>
                              <Link to={`/alumni/${alumni.Alumni_ID}`}>Open</Link>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button className="flex-1" asChild>
                      <Link to={`/alumni/${alumni.Alumni_ID}`}>
                        View Profile
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredAlumni.length === 0 && (
          <Card className="border-none">
            <CardContent className="py-16 text-center">
              <GraduationCap className="mx-auto mb-4 size-14 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {verifiedAlumni.length === 0 ? 'No verified alumni yet.' : 'No results found.'}
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => {
                  setSearchTerm('');
                  setDepartment('all');
                  setBatch('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function MiniStat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function PreviewStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-white/80 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MetaPill({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-muted/70 px-4 py-2 text-xs font-medium text-muted-foreground">
      <Icon className="size-3.5" />
      <span>{text}</span>
    </div>
  );
}
