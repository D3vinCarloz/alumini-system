import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Briefcase, Plus, Trash2, Edit2,
  ClipboardCheck, Users, TrendingUp, Handshake, Lightbulb,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

interface CareerEntry {
  Career_ID: number;
  Company_Name: string;
  Job_Role: string;
  Start_Year: number;
  End_Year: number | null;
}

const timelineStyles = [
  { border: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', Icon: ClipboardCheck },
  { border: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', Icon: Users },
  { border: 'border-teal-500', text: 'text-teal-600', bg: 'bg-teal-50', Icon: TrendingUp },
  { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', Icon: Handshake },
  { border: 'border-fuchsia-500', text: 'text-fuchsia-600', bg: 'bg-fuchsia-50', Icon: Lightbulb },
];

export function CareerPage() {
  const [careerHistory, setCareerHistory] = useState<CareerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  const loadCareer = async () => {
    try {
      const data = await apiFetch<CareerEntry[]>('/career');
      setCareerHistory(data);
    } catch (err) {
      console.error('Failed to load career history:', err);
      toast.error('Failed to load career history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareer();
  }, []);

  const resetForm = () => {
    setCompany('');
    setRole('');
    setStartYear('');
    setEndYear('');
    setEditingId(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (career: CareerEntry) => {
    setCompany(career.Company_Name);
    setRole(career.Job_Role);
    setStartYear(career.Start_Year.toString());
    setEndYear(career.End_Year ? career.End_Year.toString() : '');
    setEditingId(career.Career_ID);
    setIsDialogOpen(true);
  };

  const handleSubmitCareer = async () => {
    if (!company.trim() || !role.trim() || !startYear) {
      toast.error('Please fill in all required fields');
      return;
    }

    const start = parseInt(startYear, 10);
    const end = endYear ? parseInt(endYear, 10) : null;

    if (isNaN(start) || start < 1900 || start > new Date().getFullYear()) {
      toast.error('Please enter a valid start year');
      return;
    }

    if (end !== null && end < start) {
      toast.error('End year cannot be before start year');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        companyName: company.trim(),
        jobRole: role.trim(),
        startYear: start,
        endYear: end,
      };

      if (editingId) {
        await apiFetch(`/career/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Milestone updated successfully!');
      } else {
        await apiFetch('/career', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Milestone added successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
      await loadCareer();
    } catch (err) {
      console.error(err);
      toast.error(editingId ? 'Failed to update milestone.' : 'Failed to add milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (careerId: number) => {
    setDeletingId(careerId);
    try {
      await apiFetch(`/career/${careerId}`, { method: 'DELETE' });
      setCareerHistory((prev) => prev.filter((c) => c.Career_ID !== careerId));
      toast.success('Milestone deleted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete milestone. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const sortedHistory = [...careerHistory].sort((a, b) => a.Start_Year - b.Start_Year);

  return (
    <DashboardLayout title="Career Management">
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Career Path Timeline</h2>
            <p className="mt-1 text-muted-foreground">Manage and visualize your professional journey</p>
          </div>

          <Button onClick={openAddDialog} className="shrink-0 rounded-full px-6 shadow-sm">
            <Plus className="mr-2 size-4" /> Add Milestone
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Milestone' : 'Add Career Milestone'}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company / Organization *</Label>
                  <Input
                    id="company"
                    placeholder="e.g., Google"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role / Title *</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Software Engineer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startYear">Start Year *</Label>
                    <Input
                      id="startYear"
                      type="number"
                      placeholder="2020"
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endYear">End Year</Label>
                    <Input
                      id="endYear"
                      type="number"
                      placeholder="Leave blank if current"
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleSubmitCareer} className="w-full" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update Milestone' : 'Add Milestone'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="overflow-hidden border border-border/60 bg-background shadow-sm">
          <CardContent className="px-0 pb-14 pt-10 sm:px-6">
            {loading ? (
              <div className="py-12 text-center">
                <p className="animate-pulse text-muted-foreground">Loading timeline...</p>
              </div>
            ) : sortedHistory.length === 0 ? (
              <div className="py-16 text-center">
                <Briefcase className="mx-auto mb-4 size-12 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-medium">No career milestones yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Add your first entry to start building your timeline.</p>
              </div>
            ) : (
              <div className="hide-scrollbar relative w-full overflow-x-auto pb-4">
                <div className="min-w-max px-8 py-10">
                  <div className="flex items-start gap-4">
                    {sortedHistory.map((career, index) => {
                      const theme = timelineStyles[index % timelineStyles.length];
                      const Icon = theme.Icon;

                      return (
                        <div key={career.Career_ID} className="group relative z-10 flex w-72 shrink-0 flex-col items-center">
                          {index !== sortedHistory.length - 1 && (
                            <>
                              <div className="absolute left-1/2 top-8 h-px w-full -translate-y-1/2 bg-border/70" />
                              <div className="absolute right-0 top-8 z-10 -translate-y-1/2 bg-background px-1 text-muted-foreground/45">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m9 18 6-6-6-6" />
                                </svg>
                              </div>
                            </>
                          )}

                          <div className={`relative z-20 flex size-16 items-center justify-center rounded-full border-[4px] bg-background shadow-sm transition-transform duration-300 group-hover:scale-105 ${theme.border}`}>
                            <span className="text-lg font-black tracking-tight text-foreground">{career.Start_Year}</span>
                          </div>

                          <div className="my-3 h-7 w-px bg-border/80" />

                          <div className={`relative z-20 mb-4 rounded-full p-2.5 shadow-sm ring-1 ring-border/50 ${theme.bg} ${theme.text}`}>
                            <Icon className="size-4" />
                          </div>

                          <div className="relative flex w-44 flex-col rounded-2xl border border-border/80 bg-card px-4 py-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 text-blue-500 hover:bg-blue-500/10"
                                onClick={() => openEditDialog(career)}
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 text-destructive hover:bg-destructive/10"
                                disabled={deletingId === career.Career_ID}
                                onClick={() => handleDelete(career.Career_ID)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>

                            <h3 className="mt-1 text-base font-bold uppercase tracking-tight text-foreground">{career.Job_Role}</h3>
                            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{career.Company_Name}</p>

                            <div className={`mt-4 border-t border-border/50 pt-3 text-[11px] font-semibold ${theme.text}`}>
                              {career.Start_Year} - {career.End_Year ?? 'Present'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
