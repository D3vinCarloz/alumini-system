import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Briefcase, Plus, Trash2, Edit2,
  ClipboardCheck, Users, TrendingUp, Handshake, Lightbulb 
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
  { border: 'border-rose-500',   text: 'text-rose-600',   bg: 'bg-rose-50',     Icon: ClipboardCheck },
  { border: 'border-amber-500',  text: 'text-amber-600',  bg: 'bg-amber-50',    Icon: Users },
  { border: 'border-teal-500',   text: 'text-teal-600',   bg: 'bg-teal-50',     Icon: TrendingUp },
  { border: 'border-blue-500',   text: 'text-blue-600',   bg: 'bg-blue-50',     Icon: Handshake },
  { border: 'border-purple-500', text: 'text-purple-600', bg: 'bg-purple-50',   Icon: Lightbulb },
];

export function CareerPage() {
  const [careerHistory, setCareerHistory] = useState<CareerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const [editingId, setEditingId] = useState<number | null>(null);

  const [company, setCompany]     = useState('');
  const [role, setRole]           = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear]     = useState('');

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

    const start = parseInt(startYear);
    const end   = endYear ? parseInt(endYear) : null;

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
        jobRole:     role.trim(),
        startYear:   start,
        endYear:     end,
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
      setCareerHistory(prev => prev.filter(c => c.Career_ID !== careerId));
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Career Path Timeline</h2>
            <p className="text-muted-foreground mt-1">Manage and visualize your professional journey</p>
          </div>

          <Button onClick={openAddDialog} className="shrink-0 rounded-full px-6 shadow-sm">
            <Plus className="size-4 mr-2" /> Add Milestone
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Milestone' : 'Add Career Milestone'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
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
                  {submitting ? 'Saving...' : (editingId ? 'Update Milestone' : 'Add Milestone')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Timeline Visualization Card */}
        <Card className="border-none shadow-sm bg-background overflow-hidden">
          <CardContent className="pt-10 pb-16 px-0 sm:px-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground animate-pulse">Loading timeline...</p>
              </div>
            ) : sortedHistory.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No career milestones yet</h3>
                <p className="text-muted-foreground mt-1 text-sm">Add your first entry to start building your timeline.</p>
              </div>
            ) : (
              <div className="relative w-full overflow-x-auto pb-4 hide-scrollbar">
                {/* Timeline Container */}
                <div className="min-w-max flex items-start justify-start py-8 px-4">
                  
                  {sortedHistory.map((career, index) => {
                    const theme = timelineStyles[index % timelineStyles.length];
                    const Icon = theme.Icon;
                    
                    return (
                      <div key={career.Career_ID} className="relative z-10 flex flex-col items-center w-72 shrink-0 group">
                        
                        {/* Perfect Horizontal Line extending to the right (except on last item) */}
                        {index !== sortedHistory.length - 1 && (
                          <div className="absolute top-[40px] left-[50%] w-full h-[2px] bg-border z-0 -translate-y-1/2"></div>
                        )}

                        {/* Centered Arrow (except on last item) */}
                        {index !== sortedHistory.length - 1 && (
                          <div className="absolute top-[40px] right-0 translate-x-1/2 -translate-y-1/2 text-muted-foreground/40 z-10 bg-background px-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m9 18 6-6-6-6"/>
                            </svg>
                          </div>
                        )}
                        
                        {/* Year Circle (Size 20 = 80px, Center is at 40px) */}
                        <div className={`size-20 rounded-full border-[6px] ${theme.border} bg-background flex items-center justify-center shadow-sm relative z-20 group-hover:scale-105 transition-transform duration-300`}>
                          <span className="text-xl font-black text-foreground tracking-tight">
                            {career.Start_Year}
                          </span>
                        </div>

                        {/* Connector Line (Vertical) */}
                        <div className="w-[2px] h-8 bg-border my-2"></div>

                        {/* Icon */}
                        <div className={`p-3 rounded-full ${theme.bg} ${theme.text} mb-4 shadow-sm ring-1 ring-border/50 relative z-20`}>
                          <Icon className="size-5" />
                        </div>

                        {/* Detail Card */}
                        <div className={`w-64 flex flex-col text-center rounded-2xl p-5 bg-card border-2 shadow-sm relative transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${theme.border.replace('border-', 'hover:border-')}`}>
                          
                          {/* Edit and Delete Buttons Container */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

                          <h3 className="font-bold text-foreground text-lg mb-1 leading-tight mt-1">{career.Job_Role}</h3>
                          <p className="text-sm font-medium text-muted-foreground mb-4">{career.Company_Name}</p>
                          
                          <div className={`mt-auto pt-3 border-t border-border/50 text-xs font-semibold ${theme.text}`}>
                            {career.Start_Year} — {career.End_Year ?? 'Present'}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}