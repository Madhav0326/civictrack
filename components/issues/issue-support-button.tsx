'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

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
    let isMounted = true;

    const fetchState = async () => {
      // 1. Fetch exact total supporter count
      const { count: exactCount, error: countError } = await supabase
        .from('issue_supporters')
        .select('id', { count: 'exact', head: true })
        .eq('issue_id', issueId);

      if (countError) {
        console.error('[IssueSupportButton] Error fetching supporter count:', {
          message: countError.message,
          details: countError.details,
          hint: countError.hint,
          code: countError.code,
        });
      } else if (isMounted && exactCount !== null && exactCount !== undefined) {
        setCount(exactCount);
      }

      // 2. Fetch current logged in user support status
      if (user?.id) {
        const { data, error: userError } = await supabase
          .from('issue_supporters')
          .select('id')
          .eq('issue_id', issueId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (userError) {
          console.error('[IssueSupportButton] Error checking user support status:', {
            message: userError.message,
            details: userError.details,
            hint: userError.hint,
            code: userError.code,
          });
        } else if (isMounted) {
          setSupported(Boolean(data));
        }
      } else if (isMounted) {
        setSupported(false);
      }
    };

    fetchState();

    return () => {
      isMounted = false;
    };
  }, [issueId, user?.id]);

  const toggle = async () => {
    if (!user) {
      router.push(`/login?redirect=/issues/${publicId || issueId}`);
      return;
    }
    if (saving) return;

    setSaving(true);
    const wasSupported = supported;

    const request = wasSupported
      ? supabase.from('issue_supporters').delete().eq('issue_id', issueId).eq('user_id', user.id)
      : supabase
          .from('issue_supporters')
          .insert({ issue_id: issueId, user_id: user.id })
          .select();

    const { error } = await request;

    if (error) {
      console.error('[IssueSupportButton] Error toggling support:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      toast({
        title: 'Action failed',
        description: 'Unable to update your action. Please try again.',
        variant: 'destructive',
      });
    } else {
      const nextSupported = !wasSupported;
      setSupported(nextSupported);

      // Re-fetch authoritative count from database
      const { count: freshCount, error: freshError } = await supabase
        .from('issue_supporters')
        .select('id', { count: 'exact', head: true })
        .eq('issue_id', issueId);

      if (!freshError && freshCount !== null && freshCount !== undefined) {
        setCount(freshCount);
      } else {
        setCount((prev) => Math.max(0, prev + (wasSupported ? -1 : 1)));
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
