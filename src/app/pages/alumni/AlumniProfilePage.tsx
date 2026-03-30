import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  GraduationCap, User, Mail, Phone, BookOpen,
  Hash, CheckCircle, Clock, XCircle, Link as LinkIcon, CalendarDays
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { ProfilePicUpload } from '../../components/ProfilePicUpload';

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
  Profile_Pic: string | null;
  DOB?: string;
  Gender?: string;
  LinkedIn?: string;
}

const statusConfig = {
  pending:  { label: 'Pending Verification',  icon: Clock,        class: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  verified: { label: 'Verified Alumni',        icon: CheckCircle,  class: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  rejected: { label: 'Verification Rejected',  icon: XCircle,      class: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
};

const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Architecture (B.Arch)",
  "Civil Engineering",
  "Electronics and Communication Engineering (ECE)",
  "Electrical and Electronics Engineering (EEE)",
  "Master of Computer Applications (MCA)",
  "Robotics and Automation (RAI)",
  "Mechanical Engineering"
];

export function AlumniProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile]     = useState<AlumniProfile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  // Form fields
  const [profilePic, setProfilePic]       = useState<string | null>(null);
  const [name, setName]                   = useState('');
  const [dob, setDob]                     = useState('');
  const [gender, setGender]               = useState('');
  const [department, setDepartment]       = useState('');
  const [customDepartment, setCustomDepartment] = useState(''); // For "Other"
  const [graduationYear, setGraduationYear] = useState('');
  const [batch, setBatch]                 = useState('');
  const [contactInfo, setContactInfo]     = useState('');
  const [linkedIn, setLinkedIn]           = useState('');
  const [bio, setBio]                     = useState('');

  useEffect(() => {
    apiFetch<AlumniProfile>('/alumni/my-profile')
      .then(data => {
        setProfile(data);
        setProfilePic(data.Profile_Pic ?? null);
        setName(data.Name ?? '');
        setDob(data.DOB ? new Date(data.DOB).toISOString().split('T')[0] : '');
        setGender(data.Gender ?? '');
        setGraduationYear(data.Graduation_Year?.toString() ?? '');
        setBatch(data.Batch ?? '');
        setContactInfo(data.Contact_Info ?? '');
        setLinkedIn(data.LinkedIn ?? '');
        setBio(data.Bio ?? '');

        // Smart Department Loading Logic
        const fetchedDept = data.Department ?? '';
        if (fetchedDept && !DEPARTMENTS.includes(fetchedDept)) {
          setDepartment('Other');
          setCustomDepartment(fetchedDept);
        } else {
          setDepartment(fetchedDept);
          setCustomDepartment('');
        }
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

    const finalDepartment = department === 'Other' ? customDepartment.trim() : department.trim();
    if (!finalDepartment) {
      toast.error('Department cannot be empty');
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
          dob:            dob || null,
          gender:         gender || null,
          linkedin:       linkedIn.trim(),
          department:     finalDepartment,
          graduationYear: graduationYear ? parseInt(graduationYear) : null,
          batch:          batch.trim(),
          contactInfo:    contactInfo.trim(),
          bio:            bio.trim(),
        }),
      });
      setProfile(prev => prev ? {
        ...prev,
        Name:            name,
        Department:      finalDepartment,
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

  // Profile completion calculation
  const isDeptFilled = department === 'Other' ? !!customDepartment.trim() : !!department.trim();

  const fields = [
    { label: 'Name',            filled: !!name.trim() },
    { label: 'DOB',             filled: !!dob },
    { label: 'Gender',          filled: !!gender },
    { label: 'Department',      filled: isDeptFilled },
    { label: 'Graduation Year', filled: !!graduationYear },
    { label: 'Batch',           filled: !!batch.trim() },
    { label: 'LinkedIn',        filled: !!linkedIn.trim() },
    { label: 'Contact Info',    filled: !!contactInfo.trim() },
    { label: 'Bio',             filled: !!bio.trim() },
  ];
  const completionPct = Math.round(
    (fields.filter(f => f.filled).length / fields.length) * 100
  );

  if (loading) {
    return (
      <DashboardLayout title="My Profile">
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  const statusInfo = statusConfig[profile?.Status ?? 'pending'];
  const StatusIcon = statusInfo.icon;

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Verification status banner */}
        <div className={`flex items-start sm:items-center gap-4 p-4 rounded-xl border ${statusInfo.bg}`}>
          <StatusIcon className={`size-5 shrink-0 mt-0.5 sm:mt-0 ${statusInfo.class}`} />
          <div>
            <p className={`text-sm font-semibold ${statusInfo.class}`}>{statusInfo.label}</p>
            <p className="text-sm text-muted-foreground mt-1 sm:mt-0.5 leading-relaxed">
              {profile?.Status === 'pending'  && 'Your profile is awaiting admin verification. Fill in all details to speed up the process.'}
              {profile?.Status === 'verified' && 'Your profile is verified. Students can now view your profile and send queries.'}
              {profile?.Status === 'rejected' && 'Your verification was rejected. Please update your details and contact the admin.'}
            </p>
          </div>
        </div>

        {/* Two-column layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Edit Form (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Manage your public information and account settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">

                {/* Profile Picture Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-border">
                  <div className="shrink-0">
                    <ProfilePicUpload
                      currentPic={profilePic}
                      name={name || 'Alumni'}
                      size="lg"
                      onUpdate={setProfilePic}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-base">Profile Photo</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      Upload a professional photo to help students recognize you. JPG or PNG, max 2MB.
                    </p>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personal Info</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" />Full Name *
                      </Label>
                      <Input id="name" placeholder="e.g., Raji R Pillai" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="size-4 text-muted-foreground" />Email
                      </Label>
                      <Input value={profile?.Email ?? ''} disabled className="bg-muted/50 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-muted-foreground"/> Date of Birth
                      </Label>
                      <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground"/> Gender
                      </Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Academic Timeline</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="flex items-center gap-2"><BookOpen className="size-4 text-muted-foreground"/> Department</Label>
                      <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                          <SelectItem value="Other">Other (Please specify)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {department === 'Other' && (
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Specify your department</Label>
                        <Input 
                          placeholder="Type your department name..." 
                          value={customDepartment} 
                          onChange={e => setCustomDepartment(e.target.value)} 
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="gradYear" className="flex items-center gap-2">
                        <GraduationCap className="size-4 text-muted-foreground" />Graduation Year
                      </Label>
                      <Input id="gradYear" type="number" placeholder="e.g., 2022" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batch" className="flex items-center gap-2">
                        <Hash className="size-4 text-muted-foreground" />Batch
                      </Label>
                      <Input id="batch" placeholder="e.g., 2018–2022" value={batch} onChange={e => setBatch(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact & Social</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact" className="flex items-center gap-2">
                        <Phone className="size-4 text-muted-foreground" />Phone / Extra Contact
                      </Label>
                      <Input id="contact" placeholder="e.g., +91 9876543210" value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <LinkIcon className="size-4 text-muted-foreground"/> LinkedIn URL
                      </Label>
                      <Input placeholder="https://linkedin.com/in/..." value={linkedIn} onChange={e => setLinkedIn(e.target.value)} />
                    </div>
                  </div>
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
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <span className={`text-xs ${bio.length > 500 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {bio.length}/500 characters
                    </span>
                  </div>
                </div>

              </CardContent>
              
              {/* Action Footer */}
              <div className="bg-muted/30 px-6 py-4 border-t border-border flex items-center justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving || bio.length > 500}
                  className="min-w-[140px]"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6 sticky top-6">
            
            {/* Completion checklist Card - ONLY SHOWS IF NOT 100% */}
            {completionPct < 100 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center justify-between">
                    Profile Status
                    <span className="text-xl font-bold text-primary">{completionPct}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  
                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-6">
                    <div
                      className={`h-full rounded-full transition-all duration-500 bg-primary`}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>

                  <div className="space-y-3">
                    {fields.map(f => (
                      <div key={f.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <CheckCircle
                            className={`size-4 shrink-0 ${
                              f.filled ? 'text-emerald-500' : 'text-muted-foreground/30'
                            }`}
                          />
                          <span className={`text-sm ${f.filled ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {f.label}
                          </span>
                        </div>
                        {!f.filled && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                            Missing
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Preview Card */}
            <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm mb-4">How students see you</h3>
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-primary/10 overflow-hidden shrink-0 border border-border">
                    {profilePic ? (
                      <img src={`http://localhost:5000/uploads/profiles/${profilePic}`} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-primary">
                        {name ? name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '??'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight">{name || 'Your Name'}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[180px]">
                      {department === 'Other' ? customDepartment : department || 'Add department'} 
                      {graduationYear ? ` · '${graduationYear.toString().slice(-2)}` : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}