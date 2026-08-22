'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';

interface IssueSupportButtonProps {
  issueId: string;
  publicId?: string;
  initialCount?: number;
}

export function IssueSupportButton({ issueId, publicId, initialCount = 0 }: IssueSupportButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCount(initialCount);

    const fetchState = async () => {
      const { count: exactCount } = await supabase
        .from('issue_supporters')
        .select('id', { count: 'exact', head: true })
        .eq('issue_id', issueId);

      if (exactCount !== null && exactCount !== undefined) {
        setCount(exactCount);
      }

      if (user) {
        const { data } = await supabase
          .from('issue_supporters')
          .select('id')
          .eq('issue_id', issueId)
          .eq('user_id', user.id)
          .maybeSingle();

        setSupported(Boolean(data));
      } else {
        setSupported(false);
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
    } else {
      const { count: freshCount } = await supabase
        .from('issue_supporters')
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
      variant={supported ? 'default' : 'outline'}
      className={`w-full gap-2 text-sm transition-all ${
        supported ? 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium' : ''
      }`}
      onClick={toggle}
      disabled={saving}
    >
      <Users className="h-4 w-4 shrink-0" />
      <span>{supported ? 'I am affected' : 'I am affected too'}</span>
      <span className="text-xs font-semibold opacity-90">({count})</span>
    </Button>
  );
}
