'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';

export function IssueSupportButton({ issueId, initialCount }: { issueId: string; initialCount: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('issue_supporters')
      .select('id')
      .eq('issue_id', issueId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setSupported(Boolean(data)));
  }, [issueId, user]);

  const toggle = async () => {
    if (!user) {
      router.push(`/login?redirect=/issues/${issueId}`);
      return;
    }
    if (saving) return;

    setSaving(true);
    const wasSupported = supported;
    setSupported(!wasSupported);
    setCount((value) => Math.max(0, value + (wasSupported ? -1 : 1)));

    const request = wasSupported
      ? supabase.from('issue_supporters').delete().eq('issue_id', issueId).eq('user_id', user.id)
      : supabase.from('issue_supporters').insert({ issue_id: issueId, user_id: user.id });

    const { error } = await request;
    if (error) {
      setSupported(wasSupported);
      setCount((value) => Math.max(0, value + (wasSupported ? 1 : -1)));
    }
    setSaving(false);
  };

  return (
    <Button
      variant={supported ? 'default' : 'outline'}
      className="w-full gap-2 text-sm"
      onClick={toggle}
      disabled={saving}
    >
      <Users className="h-4 w-4" />
      {supported ? 'You are affected' : 'I am affected too'}
      <span className="text-xs opacity-80">({count})</span>
    </Button>
  );
}
