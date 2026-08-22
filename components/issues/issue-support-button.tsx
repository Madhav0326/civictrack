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
    // 1. Verify current authenticated session directly from Supabase client
    const { data: { user: currentUser }, error: authErr } = await supabase.auth.getUser();

    const activeUser = currentUser || user;

    if (!activeUser || authErr) {
      console.warn('[IssueSupportButton] No active auth session:', authErr?.message);
      router.push(`/login?redirect=/issues/${publicId || issueId}`);
      return;
    }

    if (saving) return;
    setSaving(true);

    const wasSupported = supported;

    if (!wasSupported) {
      // Perform INSERT
      const { data, error } = await supabase
        .from('issue_supporters')
        .insert({ issue_id: issueId, user_id: activeUser.id })
        .select();

      console.log('[IssueSupportButton] INSERT RESULT', {
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
        // Success or already supported (23505)
        setSupported(true);
        const { count: freshCount } = await supabase
          .from('issue_supporters')
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
        .from('issue_supporters')
        .delete()
        .eq('issue_id', issueId)
        .eq('user_id', activeUser.id)
        .select();

      console.log('[IssueSupportButton] DELETE RESULT', {
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
        setSupported(false);
        const { count: freshCount } = await supabase
          .from('issue_supporters')
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
