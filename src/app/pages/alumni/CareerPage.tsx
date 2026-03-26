import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

interface CareerEntry {
  Career_ID: number;
  Company_Name: string;
  Job_Role: string;
  Start_Year: number;
  End_Year: number | null;
}

export function CareerPage() {
  const [careerHistory, setCareerHistory] = useState<CareerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
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
  };

  const handleAddCareer = async () => {
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
      await apiFetch('/career', {
        method: 'POST',
        body: JSON.stringify({
          companyName: company.trim(),
          jobRole:     role.trim(),
          startYear:   start,
          endYear:     end,
        }),
      });
      toast.success('Career entry added successfully!');
      resetForm();
      setIsDialogOpen(false);
      await loadCareer();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add career entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (careerId: number) => {
    setDeletingId(careerId);
    try {
      await apiFetch(`/career/${careerId}`, { method: 'DELETE' });
      setCareerHistory(prev => prev.filter(c => c.Career_ID !== careerId));
      toast.success('Career entry deleted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete career entry. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout title="Career Management">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Your Career History</h2>
            <p className="text-muted-foreground mt-1">Manage your professional experience</p>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
          <DialogTrigger>
  <Button>
    <Plus className="size-4 mr-2" />
    Add Career Entry
  </Button>
</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Career Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    placeholder="e.g., Google"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
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
                <Button
                  onClick={handleAddCareer}
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Entry'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading career history...</p>
              </div>
            ) : careerHistory.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No career entries yet. Add your first one!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Company</th>
                      <th className="text-left py-3 px-4 font-medium">Role</th>
                      <th className="text-left py-3 px-4 font-medium">Duration</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {careerHistory.map((career) => (
                      <tr
                        key={career.Career_ID}
                        className="border-b border-border hover:bg-secondary/50"
                      >
                        <td className="py-4 px-4 font-medium">{career.Company_Name}</td>
                        <td className="py-4 px-4">{career.Job_Role}</td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {career.Start_Year} – {career.End_Year ?? 'Present'}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === career.Career_ID}
                            onClick={() => handleDelete(career.Career_ID)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}