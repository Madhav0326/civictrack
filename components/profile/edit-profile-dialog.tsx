'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, User, ShieldCheck } from 'lucide-react';

import { supabase } from '@/lib/supabase/client';
import { updateProfile } from '@/lib/queries';
import { useAuth } from '@/components/providers/auth-provider';
import type { Profile } from '@/lib/types';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

interface EditProfileDialogProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated?: () => void;
}

export function EditProfileDialog({ profile, open, onOpenChange, onProfileUpdated }: EditProfileDialogProps) {
  const { refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [username, setUsername] = useState(profile.username ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [isPrivate, setIsPrivate] = useState(profile.is_private ?? false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Avatar must be an image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError('Avatar image size must be 5 MB or smaller.');
      return;
    }

    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setError('Username must be between 3 and 30 characters long.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = profile.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop() ?? 'jpg';
        const fileName = `${profile.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { contentType: avatarFile.type, upsert: true });

        if (uploadErr) {
          throw new Error(`Failed to upload avatar: ${uploadErr.message}`);
        }

        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = publicUrlData.publicUrl;
      }

      await updateProfile(profile.id, {
        full_name: fullName.trim() || null,
        username: cleanUsername,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        is_private: isPrivate,
      });

      await refreshProfile();
      setSuccess('Profile updated successfully!');
      if (onProfileUpdated) onProfileUpdated();

      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (err: any) {
      if (err.message?.includes('duplicate key') || err.message?.includes('unique constraint')) {
        setError('This username is already taken. Please choose another.');
      } else {
        setError(err.message ?? 'Failed to update profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public profile details and privacy settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-border">
              {avatarPreview && <AvatarImage src={avatarPreview} alt={username} />}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {username[0]?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Label
                htmlFor="avatar-upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs font-medium cursor-pointer shadow-sm transition-colors"
              >
                <Upload className="h-3.5 w-3.5" /> Upload Avatar
              </Label>

              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-xs text-muted-foreground">PNG, JPG, or WebP up to 5 MB</p>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="pl-10"
                required
                minLength={3}
                maxLength={30}
              />
            </div>
            <p className="text-xs text-muted-foreground">3 to 30 characters. Letters, numbers, and underscores only.</p>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell the community about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
          </div>

          {/* Private Profile Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-medium text-sm">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Private Profile
              </div>

              <p className="text-xs text-muted-foreground">
                Hide your profile details and reported activity from public view.
              </p>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              aria-label="Private profile toggle"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
