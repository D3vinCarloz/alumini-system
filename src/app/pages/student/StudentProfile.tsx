import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  User, Mail, Hash, BookOpen, CheckCircle, Link as LinkIcon, CalendarDays, Calendar, ExternalLink, GraduationCap
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { ProfilePicUpload } from '../../components/ProfilePicUpload';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../../components/UserAvatar';

interface StudentProfile {
  User_ID: number;
  Name: string;
  Email: string;
  Profile_Pic: string | null;
  DOB?: string;
  Gender?: string;
  LinkedIn?: string;
  Student_ID: number;
  Roll_No: string;
  Department: string;
  Start_Year?: number;
  End_Year?: number;
}

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

export function StudentProfile() {
  const { id } = useParams(); // 👈 Grab ID if an alumni is viewing this
  const { user } = useAuth();
  
  // 👈 Determine if we are editing our own profile, or viewing someone else's
  const isOwnProfile = !id || (user?.role === 'student' && user?.subId === parseInt(id));

  const [profile, setProfile]     = useState<StudentProfile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [notFound, setNotFound]   = useState(false);

  // Editable fields
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [name, setName]           = useState('');
  const [dob, setDob]             = useState('');
  const [gender, setGender]       = useState('');
  const [rollNo, setRollNo]       = useState('');
  const [department, setDepartment] = useState('');
  const [customDepartment, setCustomDepartment] = useState(''); 
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear]     = useState('');
  const [linkedIn, setLinkedIn]   = useState('');

  useEffect(() => {
    // 👈 Dynamically choose the endpoint based on context
    const endpoint = isOwnProfile ? '/student/profile' : `/student/${id}`;

    apiFetch<StudentProfile>(endpoint)
      .then(data => {
        setProfile(data);
        setProfilePic(data.Profile_Pic ?? null);
        setName(data.Name ?? '');
        setDob(data.DOB ? new Date(data.DOB).toISOString().split('T')[0] : '');
        setGender(data.Gender ?? '');
        setRollNo(data.Roll_No ?? '');
        setStartYear(data.Start_Year?.toString() ?? '');
        setEndYear(data.End_Year?.toString() ?? '');
        setLinkedIn(data.LinkedIn ?? '');
        
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
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id, isOwnProfile]);

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

    setSaving(true);
    try {
      await apiFetch('/student/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name:       name.trim(),
          dob:        dob || null,
          gender:     gender || null,
          linkedin:   linkedIn.trim(),
          rollNo:     rollNo.trim(),
          department: finalDepartment,
          startYear:  startYear ? parseInt(startYear) : null,
          endYear:    endYear ? parseInt(endYear) : null,
        }),
      });
      toast.success('Profile updated successfully!');
      setProfile(prev => prev ? { ...prev, Name: name, Roll_No: rollNo, Department: finalDepartment } : prev);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Profile">
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-muted-foreground animate-pulse">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !profile) {
    return (
      <DashboardLayout title="Student Profile">
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <p className="text-muted-foreground text-lg">Student profile not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================================
  // 🟢 READ-ONLY VIEW (For Alumni & Admins viewing a student)
  // =========================================================================
  if (!isOwnProfile) {
    return (
      <DashboardLayout title={`${profile.Name}'s Profile`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary/20"></div>
            <CardContent className="pt-8 sm:p-10">
              <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                <UserAvatar 
                  profilePic={profile.Profile_Pic} 
                  name={profile.Name} 
                  className="size-24 sm:size-32 text-3xl border-4 border-background shadow-sm shrink-0" 
                />
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold">{profile.Name}</h1>
                  <p className="text-muted-foreground font-medium text-lg flex items-center justify-center sm:justify-start gap-2">
                    <GraduationCap className="size-5" /> Student
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Academic Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                    <BookOpen className="size-5 text-primary" />
                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Department</p><p className="text-sm font-medium">{profile.Department || 'Not specified'}</p></div>
                </div>
                <div className="flex items-center gap-3">
                    <Hash className="size-5 text-primary" />
                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Roll Number</p><p className="text-sm font-medium">{profile.Roll_No || 'Not specified'}</p></div>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="size-5 text-primary" />
                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Batch</p><p className="text-sm font-medium">{profile.Start_Year} — {profile.End_Year || 'Present'}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Contact & Links</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                    <Mail className="size-5 text-primary" />
                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Email</p><p className="text-sm font-medium">{profile.Email}</p></div>
                </div>
                {profile.LinkedIn && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <a 
                      href={profile.LinkedIn.startsWith('http') ? profile.LinkedIn : `https://${profile.LinkedIn}`} 
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#0077b5]/10 text-[#0077b5] border border-[#0077b5]/20 hover:bg-[#0077b5]/30 transition-colors w-max"
                    >
                        <ExternalLink className="size-4 shrink-0" />
                        <span className="text-sm font-semibold">LinkedIn Profile</span>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================================
  // 🟢 EDITABLE VIEW (For the logged-in student managing their own profile)
  // =========================================================================
  const isDeptFilled = department === 'Other' ? !!customDepartment.trim() : !!department.trim();
  const fields = [
    { label: 'Name',       filled: !!name.trim() },
    { label: 'DOB',        filled: !!dob },
    { label: 'Gender',     filled: !!gender },
    { label: 'Roll No',    filled: !!rollNo.trim() },
    { label: 'Department', filled: isDeptFilled },
    { label: 'Start Year', filled: !!startYear },
    { label: 'End Year',   filled: !!endYear },
    { label: 'LinkedIn',   filled: !!linkedIn.trim() },
  ];
  const completionPct = Math.round((fields.filter(f => f.filled).length / fields.length) * 100);

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Two-column layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Edit Form (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Manage your student information and account settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">

                {/* Profile Picture Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-border">
                  <div className="shrink-0">
                    <ProfilePicUpload
                      currentPic={profilePic}
                      name={name || 'Student'}
                      size="lg"
                      onUpdate={setProfilePic}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-base">Profile Photo</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      Upload a photo to personalize your account. JPG or PNG, max 2MB.
                    </p>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personal Info</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" /> Full Name *
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., John Smith"
                        value={name}
                        onChange={e => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="size-4 text-muted-foreground" /> Email
                      </Label>
                      <Input
                        value={profile?.Email ?? ''}
                        disabled
                        className="bg-muted/50 cursor-not-allowed"
                      />
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

                {/* Academic Timeline */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Academic Timeline</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <BookOpen className="size-4 text-muted-foreground"/> Department
                      </Label>
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

                    {/* DYNAMIC "OTHER" TEXT INPUT */}
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
                      <Label className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground"/> Start Year
                      </Label>
                      <Input type="number" placeholder="e.g., 2024" value={startYear} onChange={e => setStartYear(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground"/> Expected End Year
                      </Label>
                      <Input type="number" placeholder="e.g., 2028" value={endYear} onChange={e => setEndYear(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Social & Links */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Links</h3>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <LinkIcon className="size-4 text-muted-foreground"/> LinkedIn URL
                    </Label>
                    <Input placeholder="https://linkedin.com/in/..." value={linkedIn} onChange={e => setLinkedIn(e.target.value)} />
                  </div>
                </div>

              </CardContent>
              
              {/* Action Footer */}
              <div className="bg-muted/30 px-6 py-4 border-t border-border flex items-center justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
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
                <h3 className="font-semibold text-sm mb-4">How others see you</h3>
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