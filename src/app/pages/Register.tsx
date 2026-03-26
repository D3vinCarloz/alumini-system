import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';
import {
  GraduationCap, User, Lock, Mail, BookOpen,
  Hash, Calendar, ArrowRight, Eye, EyeOff, CheckCircle,
} from 'lucide-react';

type Role = 'student' | 'alumni';

export function Register() {
  const navigate  = useNavigate();
  const [role, setRole]         = useState<Role>('student');
  const [step, setStep]         = useState<1 | 2>(1);
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Step 1 fields
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Step 2 fields
  const [department, setDepartment]   = useState('');
  const [rollNo, setRollNo]           = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [batch, setBatch]             = useState('');

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
          name:           name.trim(),
          email:          email.trim().toLowerCase(),
          password,
          role,
          department:     department.trim(),
          rollNo:         rollNo.trim(),
          graduationYear: graduationYear ? parseInt(graduationYear) : null,
          batch:          batch.trim(),
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
    { value: 'student' as Role, label: 'Student',  icon: GraduationCap, desc: 'Connect with alumni' },
    { value: 'alumni'  as Role, label: 'Alumni',   icon: User,          desc: 'Guide students' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">

          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                <div className={`size-2 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
                <div className={`size-2 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {step === 1 ? 'Enter your basic details to get started' : 'Tell us a bit more about yourself'}
            </p>
          </div>

          {/* Step 1 — Basic info */}
          {step === 1 && (
            <div className="space-y-5">

              {/* Role selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map(r => {
                    const Icon = r.icon;
                    const isSelected = role === r.value;
                    return (
                      <button
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 size-2 rounded-full bg-primary" />
                        )}
                        <Icon className={`size-6 mx-auto mb-1.5 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                        <p className={`text-xs font-semibold uppercase tracking-wide ${isSelected ? 'text-primary' : 'text-gray-500'}`}>
                          {r.label}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g., Abhishek S A"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleStep1()}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50 ${
                      confirmPass && confirmPass !== password
                        ? 'border-red-300'
                        : 'border-gray-200'
                    }`}
                  />
                  {confirmPass && confirmPass === password && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
                  )}
                </div>
                {confirmPass && confirmPass !== password && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              <button
                onClick={handleStep1}
                className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
              >
                Continue <ArrowRight className="size-4" />
              </button>
            </div>
          )}

          {/* Step 2 — Profile details */}
          {step === 2 && (
            <div className="space-y-5">

              {/* Back button */}
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Back
              </button>

              {/* Summary of step 1 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary text-xs font-bold">
                    {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-gray-500 truncate">{email} · {role}</p>
                </div>
                <CheckCircle className="size-4 text-emerald-500 shrink-0 ml-auto" />
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Department <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g., Computer Science"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50"
                  />
                </div>
              </div>

              {/* Student: Roll No | Alumni: Graduation Year + Batch */}
              {role === 'student' ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Roll Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g., CS2021001"
                      value={rollNo}
                      onChange={e => setRollNo(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Graduation Year <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <input
                        type="number"
                        placeholder="e.g., 2022"
                        value={graduationYear}
                        onChange={e => setGraduationYear(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Batch <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g., 2018–2022"
                        value={batch}
                        onChange={e => setBatch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Alumni notice */}
              {role === 'alumni' && (
                <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-amber-500 shrink-0 mt-0.5">ℹ</span>
                  <p className="text-xs text-amber-700">
                    Alumni accounts require admin verification before students can view your profile.
                    You can complete your profile after registration.
                  </p>
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create Account <ArrowRight className="size-4" /></>
                )}
              </button>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}