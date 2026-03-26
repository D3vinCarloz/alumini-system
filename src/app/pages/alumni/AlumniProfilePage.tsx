import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  GraduationCap, User, Mail, Phone, BookOpen,
  Hash, Calendar, CheckCircle, Clock, XCircle,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface AlumniProfile {
  User_ID: number;
  Name: string;
  Email: string;
  Alumni_ID: number;
  Department: string;
  Graduation_Year: number | null;
  Batch: string;
  Contact_Info: string;
  Bio: string;
  Verification_Status: boolean;
  Status: 'pending' | 'verified' | 'rejected';
}

const statusConfig = {
  pending:  { label: 'Pending Verification',  icon: Clock,        class: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  verified: { label: 'Verified Alumni',        icon: CheckCircle,  class: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  rejected: { label: 'Verification Rejected',  icon: XCircle,      class: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
};

export function AlumniProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile]     = useState<AlumniProfile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  // Form fields
  const [name, setName]                   = useState('');
  const [department, setDepartment]       = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [batch, setBatch]                 = useState('');
  const [contactInfo, setContactInfo]     = useState('');
  const [bio, setBio]                     = useState('');

  useEffect(() => {
    apiFetch<AlumniProfile>('/alumni/my-profile')
      .then(data => {
        setProfile(data);
        setName(data.Name ?? '');
        setDepartment(data.Department ?? '');
        setGraduationYear(data.Graduation_Year?.toString() ?? '');
        setBatch(data.Batch ?? '');
        setContactInfo(data.Contact_Info ?? '');
        setBio(data.Bio ?? '');
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
    if (graduationYear && (isNaN(Number(graduationYear)) || Number(graduationYear) < 1900 || Number(graduationYear) > 2100)) {
      toast.error('Please enter a valid graduation year');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/alumni/my-profile', {
        method: 'PUT',
        body: JSON.stringify({
          name:           name.trim(),
          department:     department.trim(),
          graduationYear: graduationYear ? parseInt(graduationYear) : null,
          batch:          batch.trim(),
          contactInfo:    contactInfo.trim(),
          bio:            bio.trim(),
        }),
      });
      setProfile(prev => prev ? {
        ...prev,
        Name:            name,
        Department:      department,
        Graduation_Year: graduationYear ? parseInt(graduationYear) : null,
        Batch:           batch,
        Contact_Info:    contactInfo,
        Bio:             bio,
      } : null);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Profile completion
  const fields = [
    { label: 'Name',            filled: !!name.trim() },
    { label: 'Department',      filled: !!department.trim() },
    { label: 'Graduation Year', filled: !!graduationYear },
    { label: 'Batch',           filled: !!batch.trim() },
    { label: 'Contact Info',    filled: !!contactInfo.trim() },
    { label: 'Bio',             filled: !!bio.trim() },
  ];
  const completionPct = Math.round(
    (fields.filter(f => f.filled).length / fields.length) * 100
  );

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

  const statusInfo = statusConfig[profile?.Status ?? 'pending'];
  const StatusIcon = statusInfo.icon;

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-2xl space-y-6">

        {/* Verification status banner */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${statusInfo.bg}`}>
          <StatusIcon className={`size-5 shrink-0 ${statusInfo.class}`} />
          <div>
            <p className={`text-sm font-semibold ${statusInfo.class}`}>{statusInfo.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile?.Status === 'pending'  && 'Your profile is awaiting admin verification. Fill in all details to speed up the process.'}
              {profile?.Status === 'verified' && 'Your profile is verified. Students can now view your profile and send queries.'}
              {profile?.Status === 'rejected' && 'Your verification was rejected. Please update your details and contact the admin.'}
            </p>
          </div>
        </div>

        {/* Profile header card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-5">
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="size-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{name || 'Your Name'}</h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {department || 'Department not set'}
                  {graduationYear ? ` · Class of ${graduationYear}` : ''}
                </p>
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

                  {/* Missing fields */}
                  {completionPct < 100 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {fields.filter(f => !f.filled).map(f => (
                        <span key={f.label} className="text-xs text-amber-600">
                          · {f.label} missing
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />Full Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g., Raji R Pillai"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* Email — read only */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />Email
              </Label>
              <Input
                value={profile?.Email ?? ''}
                disabled
                className="bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2">
                <BookOpen className="size-4 text-muted-foreground" />Department
              </Label>
              <Input
                id="department"
                placeholder="e.g., Computer Science"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              />
            </div>

            {/* Graduation Year + Batch side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gradYear" className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />Graduation Year
                </Label>
                <Input
                  id="gradYear"
                  type="number"
                  placeholder="e.g., 2022"
                  value={graduationYear}
                  onChange={e => setGraduationYear(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch" className="flex items-center gap-2">
                  <Hash className="size-4 text-muted-foreground" />Batch
                </Label>
                <Input
                  id="batch"
                  placeholder="e.g., 2018–2022"
                  value={batch}
                  onChange={e => setBatch(e.target.value)}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <Label htmlFor="contact" className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />Contact Info
              </Label>
              <Input
                id="contact"
                placeholder="e.g., +91 9876543210 | linkedin.com/in/yourname"
                value={contactInfo}
                onChange={e => setContactInfo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Phone number, LinkedIn, or any contact details
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell students about yourself — your current role, company, expertise, and what you can help with..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/500 characters
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>

          </CardContent>
        </Card>

        {/* Completion checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fields.map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <CheckCircle
                    className={`size-4 shrink-0 ${
                      f.filled ? 'text-emerald-500' : 'text-muted-foreground/30'
                    }`}
                  />
                  <span className={`text-sm ${f.filled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {f.label}
                  </span>
                  {!f.filled && (
                    <span className="text-xs text-amber-600 ml-auto">Missing</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}