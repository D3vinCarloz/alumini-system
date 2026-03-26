import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../../components/ui/dialog';
import { User, Mail, Calendar, Shield, GraduationCap, Hash, BookOpen } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

interface User {
  User_ID: number;
  Name: string;
  Email: string;
  Role: 'student' | 'alumni' | 'admin';
  created_at: string;
}

interface UserDetail extends User {
  // Student fields
  Student_ID?: number;
  Roll_No?: string;
  Department?: string;
  // Alumni fields
  Alumni_ID?: number;
  Graduation_Year?: number;
  Batch?: string;
  Contact_Info?: string;
  Bio?: string;
  Verification_Status?: boolean;
  Status?: string;
}

export function UsersPage() {
  const [users, setUsers]               = useState<User[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    apiFetch<User[]>('/admin/users')
      .then(setUsers)
      .catch(err => {
        console.error('Failed to load users:', err);
        toast.error('Failed to load users');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRowClick = async (user: User) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      if (user.Role === 'student') {
        const data = await apiFetch<any>(`/admin/user-detail/student/${user.User_ID}`);
        setSelectedUser({ ...user, ...data });
      } else if (user.Role === 'alumni') {
        const data = await apiFetch<any>(`/admin/user-detail/alumni/${user.User_ID}`);
        setSelectedUser({ ...user, ...data });
      }
    } catch {
      // Admin has no sub-table — just show base user info
    } finally {
      setDetailLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':  return 'destructive';
      case 'alumni': return 'default';
      default:       return 'secondary';
    }
  };

  const roleColors = {
    admin:   'bg-red-50 border-red-200',
    alumni:  'bg-blue-50 border-blue-200',
    student: 'bg-gray-50 border-gray-200',
  };

  return (
    <DashboardLayout title="User Management">
      <Card>
        <CardHeader>
          <CardTitle>
            All Users
            {!loading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({users.length} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr
                      key={user.User_ID}
                      className="border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(user)}
                    >
                      <td className="py-4 px-4 font-medium">{user.Name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{user.Email}</td>
                      <td className="py-4 px-4">
                        <Badge variant={getRoleBadgeVariant(user.Role)}>
                          {user.Role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={open => { if (!open) setSelectedUser(null); }}
      >
        <DialogContent className="max-w-md">
<DialogHeader>
  <DialogTitle>User Details</DialogTitle>
  <DialogDescription>
    Complete profile information for this user
  </DialogDescription>
</DialogHeader>

          {selectedUser && (
            <div className="space-y-4 mt-2">

              {/* Role banner */}
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${roleColors[selectedUser.Role]}`}>
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">
                    {selectedUser.Name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{selectedUser.Name}</p>
                  <Badge variant={getRoleBadgeVariant(selectedUser.Role)} className="mt-1">
                    {selectedUser.Role.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {detailLoading ? (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  Loading details...
                </div>
              ) : (
                <div className="space-y-3">

                  {/* Common fields */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Mail className="size-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{selectedUser.Email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Calendar className="size-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Joined</p>
                        <p className="text-sm font-medium">
                          {new Date(selectedUser.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'long', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Student-specific fields */}
                  {selectedUser.Role === 'student' && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Student Info
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <Hash className="size-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Roll No</p>
                            <p className="text-sm font-medium">{selectedUser.Roll_No || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <BookOpen className="size-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Department</p>
                            <p className="text-sm font-medium">{selectedUser.Department || '—'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alumni-specific fields */}
                  {selectedUser.Role === 'alumni' && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Alumni Info
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <BookOpen className="size-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Department</p>
                            <p className="text-sm font-medium">{selectedUser.Department || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <GraduationCap className="size-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Graduation</p>
                            <p className="text-sm font-medium">{selectedUser.Graduation_Year || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <Hash className="size-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Batch</p>
                            <p className="text-sm font-medium">{selectedUser.Batch || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <Shield className="size-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                              selectedUser.Status === 'verified'
                                ? 'bg-green-100 text-green-700'
                                : selectedUser.Status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {selectedUser.Status
                                ? selectedUser.Status.charAt(0).toUpperCase() + selectedUser.Status.slice(1)
                                : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedUser.Contact_Info && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <User className="size-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Contact</p>
                            <p className="text-sm font-medium">{selectedUser.Contact_Info}</p>
                          </div>
                        </div>
                      )}

                      {selectedUser.Bio && (
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Bio</p>
                          <p className="text-sm">{selectedUser.Bio}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin — no extra fields */}
                  {selectedUser.Role === 'admin' && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                      <Shield className="size-4 text-red-600 shrink-0" />
                      <p className="text-sm text-red-700 font-medium">
                        System Administrator — Full Access
                      </p>
                    </div>
                  )}

                </div>
              )}

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}