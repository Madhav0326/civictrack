'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';

export function IssueFollowButton({ issueId, initialCount }: { issueId: string; initialCount: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('issue_followers')
      .select('id')
      .eq('issue_id', issueId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setFollowing(Boolean(data)));
  }, [issueId, user]);

  const toggle = async () => {
    if (!user) {
      router.push(`/login?redirect=/issues/${issueId}`);
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
    }
    setSaving(false);
  };

  return (
    <Button
      variant="outline"
      className="w-full gap-2 text-sm"
      onClick={toggle}
      disabled={saving}
    >
      {following ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {following ? 'Following updates' : 'Follow updates'}
      <span className="text-xs text-muted-foreground">({count})</span>
    </Button>
  );
}
