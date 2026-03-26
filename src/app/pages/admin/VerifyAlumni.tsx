import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '../../components/ui/dialog';

interface Alumni {
  Alumni_ID: number;
  Name: string;
  Email: string;
  Department: string;
  Graduation_Year: number;
  Batch: string;
  Bio: string;
  Contact_Info: string;
  Verification_Status: boolean;
  Status: 'pending' | 'verified' | 'rejected';
}

const statusConfig = {
  pending:  { label: 'Pending',  class: 'bg-amber-100 text-amber-700' },
  verified: { label: 'Verified', class: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700' },
};

export function VerifyAlumni() {
  const [alumniList, setAlumniList]         = useState<Alumni[]>([]);
  const [loading, setLoading]               = useState(true);
  const [actionId, setActionId]             = useState<number | null>(null);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);

  useEffect(() => {
    apiFetch<Alumni[]>('/admin/alumni')
      .then(setAlumniList)
      .catch(err => {
        console.error(err);
        toast.error('Failed to load alumni list');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id: number, name: string) => {
    setActionId(id);
    try {
      await apiFetch(`/alumni/${id}/verify`, { method: 'PATCH' });
      setAlumniList(prev =>
        prev.map(a => a.Alumni_ID === id
          ? { ...a, Verification_Status: true, Status: 'verified' }
          : a
        )
      );
      toast.success(`${name} has been verified!`);
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: number, name: string) => {
    setActionId(id);
    try {
      await apiFetch(`/alumni/${id}/reject`, { method: 'PATCH' });
      setAlumniList(prev =>
        prev.map(a => a.Alumni_ID === id
          ? { ...a, Verification_Status: false, Status: 'rejected' }
          : a
        )
      );
      toast.success(`${name} has been rejected.`);
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setActionId(null);
    }
  };

  const pending  = alumniList.filter(a => a.Status === 'pending').length;
  const verified = alumniList.filter(a => a.Status === 'verified').length;
  const rejected = alumniList.filter(a => a.Status === 'rejected').length;

  return (
    <DashboardLayout title="Verify Alumni">
      <div className="space-y-6">

        {/* Summary cards */}
        {!loading && alumniList.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{pending}</div>
                <p className="text-xs text-muted-foreground mt-1">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-green-600">{verified}</div>
                <p className="text-xs text-muted-foreground mt-1">Verified</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-red-600">{rejected}</div>
                <p className="text-xs text-muted-foreground mt-1">Rejected</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main table */}
        <Card>
          <CardHeader>
            <CardTitle>Alumni Verification Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Department</th>
                    <th className="text-left py-3 px-4 font-medium">Batch</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Details</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : alumniList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        No alumni found.
                      </td>
                    </tr>
                  ) : (
                    alumniList.map(alumni => {
                      const cfg = statusConfig[alumni.Status];
                      return (
                        <tr
                          key={alumni.Alumni_ID}
                          className="border-b border-border hover:bg-secondary/50"
                        >
                          <td className="py-4 px-4 font-medium">{alumni.Name}</td>
                          <td className="py-4 px-4 text-muted-foreground text-sm">{alumni.Email}</td>
                          <td className="py-4 px-4">{alumni.Department || '—'}</td>
                          <td className="py-4 px-4">{alumni.Batch || '—'}</td>
                          <td className="py-4 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.class}`}>
                              {cfg.label}
                            </span>
                          </td>

                          {/* View details */}
                          <td className="py-4 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAlumni(alumni)}
                              className="gap-1 text-xs"
                            >
                              <Eye className="size-3.5" />
                              View
                            </Button>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              {alumni.Status !== 'verified' && (
                                <Button
                                  size="sm"
                                  disabled={actionId === alumni.Alumni_ID}
                                  onClick={() => handleVerify(alumni.Alumni_ID, alumni.Name)}
                                  className="gap-1 bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                                >
                                  <CheckCircle className="size-3.5" />
                                  {actionId === alumni.Alumni_ID ? '...' : 'Verify'}
                                </Button>
                              )}
                              {alumni.Status !== 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={actionId === alumni.Alumni_ID}
                                  onClick={() => handleReject(alumni.Alumni_ID, alumni.Name)}
                                  className="gap-1 text-xs h-7"
                                >
                                  <XCircle className="size-3.5" />
                                  {actionId === alumni.Alumni_ID ? '...' : 'Reject'}
                                </Button>
                              )}
                              {alumni.Status === 'verified' && (
                                <span className="text-sm text-muted-foreground">Verified ✓</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Alumni detail dialog */}
        <Dialog
          open={!!selectedAlumni}
          onOpenChange={open => { if (!open) setSelectedAlumni(null); }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Alumni Details</DialogTitle>
            </DialogHeader>
            {selectedAlumni && (
              <div className="space-y-4 mt-2">

                {/* Status badge */}
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig[selectedAlumni.Status].class}`}>
                  {statusConfig[selectedAlumni.Status].label}
                </span>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedAlumni.Name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedAlumni.Email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedAlumni.Department || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Graduation Year</p>
                    <p className="font-medium">{selectedAlumni.Graduation_Year || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Batch</p>
                    <p className="font-medium">{selectedAlumni.Batch || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="font-medium">{selectedAlumni.Contact_Info || '—'}</p>
                  </div>
                </div>

                {/* Bio */}
                {selectedAlumni.Bio && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Bio</p>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedAlumni.Bio}</p>
                  </div>
                )}

                {/* Action buttons in dialog */}
                <div className="flex gap-3 pt-2">
                  {selectedAlumni.Status !== 'verified' && (
                    <Button
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                      disabled={actionId === selectedAlumni.Alumni_ID}
                      onClick={async () => {
                        await handleVerify(selectedAlumni.Alumni_ID, selectedAlumni.Name);
                        setSelectedAlumni(prev =>
                          prev ? { ...prev, Status: 'verified', Verification_Status: true } : null
                        );
                      }}
                    >
                      <CheckCircle className="size-4" />
                      Verify Alumni
                    </Button>
                  )}
                  {selectedAlumni.Status !== 'rejected' && (
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      disabled={actionId === selectedAlumni.Alumni_ID}
                      onClick={async () => {
                        await handleReject(selectedAlumni.Alumni_ID, selectedAlumni.Name);
                        setSelectedAlumni(prev =>
                          prev ? { ...prev, Status: 'rejected', Verification_Status: false } : null
                        );
                      }}
                    >
                      <XCircle className="size-4" />
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}