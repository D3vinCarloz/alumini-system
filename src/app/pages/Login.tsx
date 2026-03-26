import { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GraduationCap } from 'lucide-react';
import { useNavigate, Link } from 'react-router';
export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

// FIND and REPLACE only this function:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  const success = await login(email, password);
  if (success) {
    navigate('/dashboard');
  } else {
    setError('Invalid email or password');
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto size-16 bg-primary/10 rounded-full flex items-center justify-center">
            <GraduationCap className="size-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome Back</CardTitle>
          <CardDescription>
            College Alumni Networking System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input-background"
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
                className="bg-input-background"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg">
              Login
            </Button>

            {/* Replace the demo credentials div with: */}
<div className="mt-4 text-center">
  <p className="text-sm text-muted-foreground">
    Don't have an account?{' '}
    <Link to="/register" className="text-primary font-semibold hover:underline">
      Apply for access
    </Link>
  </p>
</div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}