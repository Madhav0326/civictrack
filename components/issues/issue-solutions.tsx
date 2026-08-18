'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Lightbulb, Loader2, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/format';
import type { IssueSolution } from '@/lib/types';

export function IssueSolutions({ issueId }: { issueId: string }) {
  const { user } = useAuth(); const [solutions, setSolutions] = useState<IssueSolution[]>([]); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); const { data, error } = await supabase.from('issue_solutions').select('*').eq('issue_id', issueId).eq('is_hidden', false).order('vote_count', { ascending: false }).order('created_at'); if (error) setError(error.message); else setSolutions((data ?? []) as IssueSolution[]); setLoading(false); }, [issueId]);
  useEffect(() => { load(); }, [load]);
  const add = async () => { if (!user || title.trim().length < 3 || description.trim().length < 10) return; setSaving(true); setError(null); const { error } = await supabase.from('issue_solutions').insert({ issue_id: issueId, user_id: user.id, title: title.trim(), description: description.trim() }); if (error) setError(error.message); else { setTitle(''); setDescription(''); await load(); } setSaving(false); };
  const vote = async (solution: IssueSolution) => { if (!user) return; const { data: existing } = await supabase.from('solution_votes').select('id').eq('solution_id', solution.id).eq('user_id', user.id).maybeSingle(); const { error } = existing ? await supabase.from('solution_votes').delete().eq('id', existing.id) : await supabase.from('solution_votes').insert({ solution_id: solution.id, user_id: user.id }); if (error) setError(error.message); else await load(); };
  return <Card className="mt-4"><CardHeader><CardTitle className="text-lg">Proposed solutions</CardTitle></CardHeader><CardContent className="space-y-5">{user ? <div className="space-y-2 rounded-lg bg-secondary/30 p-3"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Solution title" maxLength={160} /><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Suggest a practical solution…" maxLength={3000} rows={3} /><div className="flex justify-end"><Button size="sm" onClick={add} disabled={saving || title.trim().length < 3 || description.trim().length < 10}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post solution'}</Button></div></div> : <p className="rounded-md bg-secondary/40 p-3 text-sm text-muted-foreground"><Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link> to propose a solution.</p>}{error && <p className="text-sm text-destructive">{error}</p>}{loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> : !solutions.length ? <div className="py-5 text-center text-sm text-muted-foreground"><Lightbulb className="mx-auto mb-2 h-5 w-5" />No solutions have been proposed yet.</div> : <div className="space-y-4">{solutions.map((solution) => <div key={solution.id} className="rounded-lg border p-4"><div className="flex gap-3"><Button variant="outline" size="sm" className="shrink-0 gap-1" disabled={!user} onClick={() => vote(solution)}><ThumbsUp className="h-4 w-4" />{solution.vote_count}</Button><div><h3 className="font-medium">{solution.title}</h3><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{solution.description}</p><p className="mt-2 text-xs text-muted-foreground">Proposed {formatRelativeTime(solution.created_at)}</p></div></div></div>)}</div>}</CardContent></Card>;
}
