'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';

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
    setCount(initialCount);

    const fetchState = async () => {
      const { count: exactCount } = await supabase
        .from('issue_followers')
        .select('id', { count: 'exact', head: true })
        .eq('issue_id', issueId);

      if (exactCount !== null && exactCount !== undefined) {
        setCount(exactCount);
      }

      if (user) {
        const { data } = await supabase
          .from('issue_followers')
          .select('id')
          .eq('issue_id', issueId)
          .eq('user_id', user.id)
          .maybeSingle();

        setFollowing(Boolean(data));
      } else {
        setFollowing(false);
      }
    };

    fetchState();
  }, [issueId, user, initialCount]);

  const toggle = async () => {
    if (!user) {
      router.push(`/login?redirect=/issues/${publicId || issueId}`);
      return;
    }
    if (saving) return;

    setSaving(true);
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setCount((value) => Math.max(0, value + (wasFollowing ? -1 : 1)));

    const request = wasFollowing
      ? supabase.from('issue_followers').delete().eq('issue_id', issueId).eq('user_id', user.id)
      : supabase.from('issue_followers').insert({ issue_id: issueId, user_id: user.id });

    const { error } = await request;
    if (error) {
      setFollowing(wasFollowing);
      setCount((value) => Math.max(0, value + (wasFollowing ? 1 : -1)));
    } else {
      const { count: freshCount } = await supabase
        .from('issue_followers')
        .select('id', { count: 'exact', head: true })
        .eq('issue_id', issueId);
      if (freshCount !== null && freshCount !== undefined) {
        setCount(freshCount);
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
