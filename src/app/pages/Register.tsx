import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';
import {
  GraduationCap, User, Lock, Mail, BookOpen,
  Hash, Calendar, ArrowRight, Eye, EyeOff, CheckCircle, Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

type Role = 'student' | 'alumni';

export function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('student');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [department, setDepartment] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [batch, setBatch] = useState('');

  const handleStep1 = () => {
    if (!name.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPass) {
      toast.error('Passwords do not match');
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          department: department.trim(),
          rollNo: rollNo.trim(),
          graduationYear: graduationYear ? parseInt(graduationYear) : null,
          batch: batch.trim(),
        }),
      });
      toast.success('Account created! You can now log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'student' as Role, label: 'Student', icon: GraduationCap, desc: 'Discover alumni and career guidance' },
    { value: 'alumni' as Role, label: 'Alumni', icon: User, desc: 'Mentor students and share opportunities' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f2ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,122,109,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(24,59,91,0.14),transparent_35%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary shadow-sm backdrop-blur">
            <Sparkles className="size-3.5" />
            Create Account
          </div>
          <div className="space-y-3">
            <h1 className="max-w-xl text-4xl font-bold tracking-tight md:text-5xl">
              Join the alumni network.
            </h1>
            <p className="text-lg font-medium text-muted-foreground">2 quick steps.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-none bg-white/70">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 1</p>
                <h3 className="mt-2 text-lg font-semibold">Basic Info</h3>
              </CardContent>
            </Card>
            <Card className="border-none bg-white/70">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 2</p>
                <h3 className="mt-2 text-lg font-semibold">Profile</h3>
              </CardContent>
            </Card>
            <Card className="border-none bg-white/70">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Then</p>
                <h3 className="mt-2 text-lg font-semibold">Get Started</h3>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-[2rem] border border-border/70 bg-white/82 p-7 shadow-[0_35px_90px_rgba(24,59,91,0.14)] backdrop-blur md:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Create account</h2>
                <p className="mt-2 text-sm text-muted-foreground">{step === 1 ? 'Step 1' : 'Step 2'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-10 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`h-2.5 w-10 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`rounded-[1.5rem] border p-4 text-left transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/70 bg-[#fbfaf7] hover:border-primary/30'}`}
                      >
                        <Icon className={`size-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em]">{r.label}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{r.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <Field label="Full Name *" icon={User}>
                  <input
                    type="text"
                    placeholder="e.g., Abhishek S A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </Field>

                <Field label="Email Address *" icon={Mail}>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </Field>

                <Field label="Password *" icon={Lock}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent pr-10 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </Field>

                <Field label="Confirm Password *" icon={Lock}>
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                  {confirmPass && confirmPass === password && (
                    <CheckCircle className="size-4 text-emerald-500" />
                  )}
                </Field>
                {confirmPass && confirmPass !== password && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}

                <button
                  type="button"
                  onClick={handleStep1}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(24,59,91,0.18)] transition-transform hover:-translate-y-0.5"
                >
                  Continue
                  <ArrowRight className="size-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back
                </button>

                <div className="flex items-center gap-3 rounded-[1.5rem] border border-border/70 bg-[#fbfaf7] p-4">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-xs font-bold text-primary">
                    {name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">{email} · {role}</p>
                  </div>
                  <CheckCircle className="ml-auto size-4 shrink-0 text-emerald-500" />
                </div>

                <Field label="Department" icon={BookOpen}>
                  <input
                    type="text"
                    placeholder="e.g., Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </Field>

                {role === 'student' ? (
                  <Field label="Roll Number" icon={Hash}>
                    <input
                      type="text"
                      placeholder="e.g., CS2021001"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </Field>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Graduation Year" icon={Calendar}>
                      <input
                        type="number"
                        placeholder="e.g., 2022"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </Field>
                    <Field label="Batch" icon={Hash}>
                      <input
                        type="text"
                        placeholder="e.g., 2018-2022"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </Field>
                  </div>
                )}

                {role === 'alumni' && (
                  <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                    Alumni accounts require admin verification before students can discover the profile publicly.
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(24,59,91,0.18)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading ? <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Create Account'}
                  {!loading && <ArrowRight className="size-4" />}
                </button>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-3 rounded-[1.25rem] border border-border/70 bg-[#fbfaf7] px-4 py-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}
