'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit3, Lock, MapPin, ShieldAlert, CheckCircle2, Heart } from 'lucide-react';
import { IssueCard } from '@/components/issues/issue-card';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';
import type { Issue, Profile } from '@/lib/types';
import { fetchProfileByUsername, fetchUserIssues } from '@/lib/queries';

interface ProfileViewProps {
  targetProfile: Profile;
  initialIssues: Issue[];
}

export function ProfileView({ targetProfile: initialProfile, initialIssues }: ProfileViewProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isOwner = user?.id === profile.id;

  const handleProfileUpdated = async () => {
    try {
      const updated = await fetchProfileByUsername(profile.username);
      if (updated) {
        setProfile(updated);
        const refreshedIssues = await fetchUserIssues(updated.id);
        setIssues(refreshedIssues);
      }
    } catch {
      // Ignore background refresh errors
    }
  };

  const formattedJoinedDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;
  const totalSupport = issues.reduce((sum, i) => sum + (i.supporter_count ?? 0), 0);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      {/* Profile Header Card */}
      <Card className="mb-8 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary" />
        <CardContent className="relative pt-0 pb-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                {profile.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile.username} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                  {profile.username[0]?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {profile.full_name || profile.username}
                  </h1>
                  {profile.is_private && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Lock className="h-3 w-3" /> Private
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
            </div>

            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 self-start sm:self-auto"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit3 className="h-4 w-4" /> Edit Profile
              </Button>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-foreground/90 max-w-2xl mb-4 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Joined {formattedJoinedDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{issues.length}</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">Issues Reported</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{resolvedCount}</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">Resolved</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{totalSupport}</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">Total Support</div>
        </Card>
      </div>

      {/* Reported Issues Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Reported Issues ({issues.length})</h2>

        {issues.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {isOwner ? "You haven't reported any civic issues yet." : `@${profile.username} hasn't reported any public issues yet.`}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwner && (
        <EditProfileDialog
          profile={profile}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
}
