'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquare, Send, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/format';
import type { IssueComment } from '@/lib/types';

export function IssueComments({
  issueId,
  issueOwnerId,
  publicId,
}: {
  issueId: string;
  issueOwnerId: string;
  publicId?: string;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Primary query with explicit FK relationship hint
    const { data, error: primaryErr } = await supabase
      .from('issue_comments')
      .select('*, profiles:profiles!issue_comments_user_id_profiles_fkey(*)')
      .eq('issue_id', issueId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (primaryErr) {
      console.warn('[IssueComments] Primary FK query warning, trying general embed:', primaryErr.message);
      // Fallback query
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('issue_comments')
        .select('*, profiles:profiles(*)')
        .eq('issue_id', issueId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (fallbackErr) {
        console.error('[IssueComments] Comment query error:', fallbackErr.message);
        setError(`Unable to load discussion comments (${fallbackErr.message})`);
        setComments([]);
      } else {
        setComments((fallbackData ?? []) as IssueComment[]);
      }
    } else {
      setComments((data ?? []) as IssueComment[]);
    }
    setLoading(false);
  }, [issueId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!user || body.trim().length < 2) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('issue_comments').insert({
      issue_id: issueId,
      user_id: user.id,
      body: body.trim(),
    });
    if (error) {
      setError(`Failed to post comment: ${error.message}`);
    } else {
      setBody('');
      await load();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('issue_comments').delete().eq('id', id);
    if (error) {
      setError(`Failed to delete comment: ${error.message}`);
    } else {
      setComments((items) => items.filter((item) => item.id !== id));
    }
  };

  const redirectUrl = publicId ? `/issues/${publicId}` : `/issues`;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Discussion & Updates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {user ? (
          <div className="space-y-2">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Add a factual, helpful comment…"
              maxLength={3000}
              rows={3}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={add} disabled={saving || body.trim().length < 2}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-1 h-4 w-4" />Comment</>}
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-md bg-secondary/40 p-3 text-sm text-muted-foreground">
            <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="font-medium text-primary hover:underline">
              Sign in
            </Link>{' '}
            to join the discussion.
          </p>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        ) : !error && !comments.length ? (
          <div className="py-5 text-center text-sm text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-5 w-5" />
            No comments yet.
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isOfficial = (comment as any).is_official === true;
              const isReporter = comment.user_id === issueOwnerId;
              const authorProfile = comment.profiles;

              return (
                <div
                  key={comment.id}
                  className={`rounded-lg border p-4 ${
                    isOfficial
                      ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        {authorProfile?.avatar_url && (
                          <AvatarImage src={authorProfile.avatar_url} alt={authorProfile?.username} />
                        )}
                        <AvatarFallback className="text-xs font-semibold">
                          {authorProfile?.username?.[0]?.toUpperCase() ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {authorProfile?.full_name || authorProfile?.username || 'User'}
                          </span>
                          {isOfficial ? (
                            <Badge className="bg-primary text-primary-foreground text-[10px] gap-1 px-1.5 py-0">
                              <ShieldCheck className="h-3 w-3" /> Official Authority Update
                            </Badge>
                          ) : isReporter ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Reporter
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(comment.created_at)}</p>
                      </div>
                    </div>

                    {user?.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Delete comment"
                        onClick={() => remove(comment.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed">{comment.body}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
