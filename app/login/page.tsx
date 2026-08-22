'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const messageParam = searchParams.get('message');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleResendConfirmation = async (emailToResend: string) => {
    if (!emailToResend) {
      setResendStatus({ type: 'error', message: 'Please enter your email address to receive a confirmation link.' });
      return;
    }
    setResendLoading(true);
    setResendStatus(null);

    const { error: resendErr } = await supabase.auth.resend({
      type: 'signup',
      email: emailToResend,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setResendLoading(false);
    if (resendErr) {
      if (resendErr.message.toLowerCase().includes('already confirmed')) {
        setResendStatus({ type: 'success', message: 'This email is already confirmed! Please log in above.' });
      } else {
        setResendStatus({ type: 'error', message: resendErr.message });
      }
    } else {
      setResendStatus({
        type: 'success',
        message: `Confirmation email sent to ${emailToResend}. Please check your inbox and spam folder.`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsUnconfirmed(false);
    setResendStatus(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setLoading(false);
      const msgLower = authError.message.toLowerCase();
      if (msgLower.includes('email not confirmed') || msgLower.includes('unconfirmed')) {
        setIsUnconfirmed(true);
        setError('Your email address has not been confirmed yet.');
      } else {
        setError(authError.message);
      }
    } else {
      router.push(redirect);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <Link href="/" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Log in to report issues, comment, and track progress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {messageParam === 'check-email' && (
            <Alert className="border-primary/20 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle>Check your email</AlertTitle>
              <AlertDescription className="text-sm">
                We sent a confirmation link to your email address. Please click the link to activate your account before logging in.
              </AlertDescription>
            </Alert>
          )}

          {(messageParam === 'invalid-link' || messageParam === 'link-expired') && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid or Expired Verification Link</AlertTitle>
              <AlertDescription className="text-sm">
                The email confirmation link is invalid or has expired. Enter your email below to resend a new verification link.
              </AlertDescription>
            </Alert>
          )}


          {messageParam === 'password-reset' && (
            <Alert className="border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle>Password Reset Successful</AlertTitle>
              <AlertDescription className="text-sm">
                Your password has been updated successfully. Log in with your new password below.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="space-y-2">
                <p>{error}</p>
                {(isUnconfirmed || messageParam === 'check-email' || messageParam === 'invalid-link') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1 text-xs"
                    onClick={() => handleResendConfirmation(email)}
                    disabled={resendLoading || !email}
                  >
                    {resendLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Resend confirmation email
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {resendStatus && (
            <Alert variant={resendStatus.type === 'error' ? 'destructive' : 'default'} className={resendStatus.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' : ''}>
              {resendStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{resendStatus.message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log in'}
            </Button>
          </form>

          {(messageParam === 'check-email' || messageParam === 'invalid-link' || isUnconfirmed) && !resendStatus && (
            <div className="pt-2 text-center text-xs text-muted-foreground">
              Didn&apos;t get the confirmation email?{' '}
              <button
                type="button"
                onClick={() => handleResendConfirmation(email)}
                disabled={resendLoading || !email}
                className="font-medium text-primary hover:underline disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : 'Resend confirmation link'}
              </button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/reset-password" className="text-sm text-muted-foreground hover:text-foreground">
            Forgot your password?
          </Link>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

