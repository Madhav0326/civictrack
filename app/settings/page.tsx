'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Eye, EyeOff, Check, X, ShieldCheck, LogOut, ArrowLeft, CheckCircle2, User, Mail, ShieldAlert } from 'lucide-react';

import { supabase } from '@/lib/supabase/client';
import { updateProfile } from '@/lib/queries';
import { PASSWORD_REQUIREMENTS, isValidPassword, passwordStrength } from '@/lib/password';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Privacy state
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacySuccess, setPrivacySuccess] = useState<string | null>(null);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  const strength = password ? passwordStrength(password) : null;
  const passwordsMatch = confirmPassword.length > 0 ? password === confirmPassword : true;

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to access settings</CardTitle>
            <CardDescription>Account settings are only accessible when signed in.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login?redirect=/settings">
              <Button className="w-full">Sign in to continue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!isValidPassword(password)) {
      setPasswordError('Please ensure your new password meets all security requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    const { error: updateErr } = await supabase.auth.updateUser({ password });

    setPasswordLoading(false);
    if (updateErr) {
      setPasswordError(updateErr.message);
    } else {
      setPasswordSuccess('Password changed successfully!');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handlePrivacyToggle = async (isPrivate: boolean) => {
    setPrivacyError(null);
    setPrivacySuccess(null);
    setPrivacyLoading(true);

    try {
      await updateProfile(profile.id, { is_private: isPrivate });
      await refreshProfile();
      setPrivacySuccess(isPrivate ? 'Profile is now private.' : 'Profile is now public.');
    } catch (err: any) {
      setPrivacyError(err.message ?? 'Failed to update privacy settings.');
    } finally {
      setPrivacyLoading(false);
    }
  };

  const formattedJoinedDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12 space-y-6">
      <div>
        <Link href="/" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account information, security, and privacy settings.</p>
      </div>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Account Overview
          </CardTitle>
          <CardDescription>Your registered identity and account metadata.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground text-xs block">Email Address</span>
              <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {user.email}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Username</span>
              <span className="font-medium text-foreground mt-0.5 block">@{profile.username}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Full Name</span>
              <span className="font-medium text-foreground mt-0.5 block">{profile.full_name || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Account Role</span>
              <Badge variant="outline" className="capitalize mt-0.5">
                {profile.role}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Member Since</span>
              <span className="font-medium text-foreground mt-0.5 block">{formattedJoinedDate}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t px-6 py-3">
          <Link href={`/profile/${profile.username}`} className="text-xs font-medium text-primary hover:underline">
            View Public Profile &rarr;
          </Link>
        </CardFooter>
      </Card>

      {/* Privacy Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Profile Privacy
          </CardTitle>

          <CardDescription>Control who can view your profile and reported activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {privacyError && (
            <Alert variant="destructive">
              <AlertDescription>{privacyError}</AlertDescription>
            </Alert>
          )}

          {privacySuccess && (
            <Alert className="border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription>{privacySuccess}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5 pr-4">
              <div className="font-medium text-sm">Private Account</div>
              <p className="text-xs text-muted-foreground">
                When enabled, your profile page and reported issues will be hidden from public view and only accessible to you and moderators.
              </p>
            </div>
            <Switch
              checked={profile.is_private}
              onCheckedChange={handlePrivacyToggle}
              disabled={privacyLoading}
              aria-label="Toggle profile privacy"
            />
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Security & Password
          </CardTitle>
          <CardDescription>Update your login password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            {passwordSuccess && (
              <Alert className="border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertDescription>{passwordSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter a new strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  autoComplete="new-password"
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

              {password.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className="font-medium">{strength?.label}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength?.className}`}
                      style={{
                        width:
                          strength?.label === 'Weak'
                            ? '33%'
                            : strength?.label === 'Fair'
                            ? '66%'
                            : '100%',
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 rounded-md bg-muted/40 p-2.5 text-xs">
                <p className="font-medium text-muted-foreground mb-1">Password requirements:</p>
                {PASSWORD_REQUIREMENTS.map((req, idx) => {
                  const passed = req.test(password);
                  return (
                    <div key={idx} className="flex items-center gap-1.5">
                      {passed ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className={passed ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match.</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={passwordLoading || !isValidPassword(password) || password !== confirmPassword}
            >
              {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Actions & Sign Out */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <LogOut className="h-5 w-5" /> Account Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="font-medium text-sm">Sign Out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account on this device.</p>
            </div>
            <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>

          <div className="rounded-lg bg-muted/40 p-4 border text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Account Deletion Policy
            </p>
            <p>
              To maintain public record integrity and audit compliance for reported civic issues, full account deletion requires administrator review or a server-side cascade execution. Contact administrator or support to request complete data purge.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
