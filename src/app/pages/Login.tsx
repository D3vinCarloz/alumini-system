import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { ArrowRight, Briefcase, GraduationCap, MessageSquare, Sparkles, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await login(email.trim(), password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f2ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,122,109,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(24,59,91,0.18),transparent_35%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary shadow-sm backdrop-blur">
            <Sparkles className="size-3.5" />
            Alumni Network
          </div>

          <div className="max-w-xl space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Alumni. Careers. Community.
            </h1>
            <p className="text-lg font-medium text-muted-foreground">
              Clean access for students, alumni, and admins.
            </p>
          </div>

          <div className="grid max-w-2xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: GraduationCap, label: 'Students' },
              { icon: Users, label: 'Alumni' },
              { icon: Briefcase, label: 'Jobs' },
              { icon: MessageSquare, label: 'Queries' },
            ].map(({ icon: Icon, label }) => (
              <Card key={label} className="border-none bg-white/70">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="mx-auto w-full max-w-md border-none bg-white/82 shadow-[0_35px_90px_rgba(24,59,91,0.14)]">
          <CardContent className="space-y-6 p-7 md:p-8">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-[1.5rem] bg-primary text-primary-foreground shadow-[0_20px_45px_rgba(24,59,91,0.22)]">
                <GraduationCap className="size-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Welcome back</h2>
                <p className="mt-2 text-sm text-muted-foreground">Sign in</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-border/70 bg-input-background px-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-border/70 bg-input-background px-4"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="h-12 w-full">
                Login
                <ArrowRight className="size-4" />
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  Apply for access
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
