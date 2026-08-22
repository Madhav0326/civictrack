'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

interface IssueFollowButtonProps {
  issueId: string;
  publicId?: string;
  initialCount?: number;
}

export function IssueFollowButton({ issueId, publicId, initialCount = 0 }: IssueFollowButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchState = async () => {
      // 1. Fetch exact total follower count across all users
      const { count: exactCount, error: countError } = await supabase
        .from('issue_followers')
        .select('id', { count: 'exact', head: true })
        .eq('issue_id', issueId);

      if (countError) {
        console.error('[IssueFollowButton] Error fetching follower count:', {
          message: countError.message,
          details: countError.details,
          hint: countError.hint,
          code: countError.code,
        });
      } else if (isMounted && exactCount !== null && exactCount !== undefined) {
        setCount(exactCount);
      }

      // 2. Fetch current logged in user follow status
      if (user?.id) {
        const { data, error: userError } = await supabase
          .from('issue_followers')
          .select('id')
          .eq('issue_id', issueId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (userError) {
          console.error('[IssueFollowButton] Error checking user follow status:', {
            message: userError.message,
            details: userError.details,
            hint: userError.hint,
            code: userError.code,
          });
        } else if (isMounted) {
          setFollowing(Boolean(data));
        }
      } else if (isMounted) {
        setFollowing(false);
      }
    };

    fetchState();

    return () => {
      isMounted = false;
    };
  }, [issueId, user?.id]);

  const toggle = async () => {
    // 1. Verify current authenticated session directly from Supabase client
    const { data: { user: currentUser }, error: authErr } = await supabase.auth.getUser();

    const activeUser = currentUser || user;

    if (!activeUser || authErr) {
      console.warn('[IssueFollowButton] No active auth session:', authErr?.message);
      router.push(`/login?redirect=/issues/${publicId || issueId}`);
      return;
    }

    if (saving) return;
    setSaving(true);

    const wasFollowing = following;

    if (!wasFollowing) {
      // Perform INSERT
      const { data, error } = await supabase
        .from('issue_followers')
        .insert({ issue_id: issueId, user_id: activeUser.id })
        .select();

      console.log('[IssueFollowButton] INSERT RESULT', {
        issueId,
        userId: activeUser.id,
        data,
        error: error
          ? {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            }
          : null,
      });

      if (error && error.code !== '23505') {
        // Real DB error (not duplicate)
        toast({
          title: 'Action failed',
          description: 'Unable to update your action. Please try again.',
          variant: 'destructive',
        });
      } else {
        // Success or already following (23505)
        setFollowing(true);
        const { count: freshCount } = await supabase
          .from('issue_followers')
          .select('id', { count: 'exact', head: true })
          .eq('issue_id', issueId);

        if (freshCount !== null && freshCount !== undefined) {
          setCount(freshCount);
        } else {
          setCount((prev) => prev + 1);
        }
      }
    } else {
      // Perform DELETE
      const { data, error } = await supabase
        .from('issue_followers')
        .delete()
        .eq('issue_id', issueId)
        .eq('user_id', activeUser.id)
        .select();

      console.log('[IssueFollowButton] DELETE RESULT', {
        issueId,
        userId: activeUser.id,
        data,
        error: error
          ? {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            }
          : null,
      });

      if (error) {
        toast({
          title: 'Action failed',
          description: 'Unable to update your action. Please try again.',
          variant: 'destructive',
        });
      } else {
        setFollowing(false);
        const { count: freshCount } = await supabase
          .from('issue_followers')
          .select('id', { count: 'exact', head: true })
          .eq('issue_id', issueId);

        if (freshCount !== null && freshCount !== undefined) {
          setCount(freshCount);
        } else {
          setCount((prev) => Math.max(0, prev - 1));
        }
      }
    }

    setSaving(false);
  };

  return (
    <Button
      variant={following ? 'secondary' : 'outline'}
      className={`w-full gap-2 text-sm transition-all ${
        following ? 'bg-secondary text-secondary-foreground font-medium border-primary/30' : ''
      }`}
      onClick={toggle}
      disabled={saving}
    >
      <Bell className={`h-4 w-4 shrink-0 ${following ? 'text-primary fill-primary/20' : ''}`} />
      <span>{following ? 'Following' : 'Follow updates'}</span>
      <span className="text-xs font-semibold text-muted-foreground">({count})</span>
    </Button>
  );
}
