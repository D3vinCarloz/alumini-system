import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GraduationCap, User, Mail, Hash, BookOpen, CheckCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface StudentProfile {
  User_ID: number;
  Name: string;
  Email: string;
  Student_ID: number;
  Roll_No: string;
  Department: string;
}

export function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile]     = useState<StudentProfile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  // Editable fields
  const [name, setName]           = useState('');
  const [rollNo, setRollNo]       = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    apiFetch<StudentProfile>('/student/profile')
      .then(data => {
        setProfile(data);
        setName(data.Name ?? '');
        setRollNo(data.Roll_No ?? '');
        setDepartment(data.Department ?? '');
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/student/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name:       name.trim(),
          rollNo:     rollNo.trim(),
          department: department.trim(),
        }),
      });
      toast.success('Profile updated successfully!');
      setProfile(prev => prev ? { ...prev, Name: name, Roll_No: rollNo, Department: department } : prev);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Completion calculation
  const fields = [
    { label: 'Name',       filled: !!name.trim() },
    { label: 'Email',      filled: !!profile?.Email },
    { label: 'Roll No',    filled: !!rollNo.trim() },
    { label: 'Department', filled: !!department.trim() },
  ];
  const completionPct = Math.round((fields.filter(f => f.filled).length / fields.length) * 100);

  if (loading) {
    return (
      <DashboardLayout title="My Profile">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-2xl space-y-6">

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-5">
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="size-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{name || 'Your Name'}</h2>
                <p className="text-muted-foreground text-sm mt-0.5">{department || 'Department not set'}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{profile?.Email}</p>

                {/* Completion bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Profile completion</span>
                    <span className="font-medium text-foreground">{completionPct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        completionPct === 100 ? 'bg-emerald-500' : 'bg-primary'
                      }`}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {fields.map(f => (
                      <span
                        key={f.label}
                        className={`text-xs flex items-center gap-1 ${
                          f.filled ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        <CheckCircle className="size-3" />
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" /> Full Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., John Smith"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* Email — read only */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" /> Email
              </Label>
              <Input
                value={profile?.Email ?? ''}
                disabled
                className="bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            {/* Roll No */}
            <div className="space-y-2">
              <Label htmlFor="rollNo" className="flex items-center gap-2">
                <Hash className="size-4 text-muted-foreground" /> Roll Number
              </Label>
              <Input
                id="rollNo"
                placeholder="e.g., CS2021001"
                value={rollNo}
                onChange={e => setRollNo(e.target.value)}
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2">
                <BookOpen className="size-4 text-muted-foreground" /> Department
              </Label>
              <Input
                id="department"
                placeholder="e.g., Computer Science"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}