'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import type { IssueStatus, ResolutionVerification as Verification } from '@/lib/types';

export function ResolutionVerification({ issueId, issueStatus }: { issueId: string; issueStatus: IssueStatus }) {
  const { user } = useAuth(); const [items, setItems] = useState<Verification[]>([]); const [comment, setComment] = useState(''); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { const { data, error } = await supabase.from('resolution_verifications').select('*').eq('issue_id', issueId).order('created_at', { ascending: false }); if (error) setError(error.message); else setItems((data ?? []) as Verification[]); }, [issueId]);
  useEffect(() => { load(); }, [load]);
  const submit = async (isResolved: boolean) => { if (!user) return; setSaving(true); setError(null); const { error } = await supabase.from('resolution_verifications').upsert({ issue_id: issueId, user_id: user.id, is_resolved: isResolved, comment: comment.trim() || null }, { onConflict: 'issue_id,user_id' }); if (error) setError(error.message); else { setComment(''); await load(); } setSaving(false); };
  const resolved = items.filter((item) => item.is_resolved).length; const unresolved = items.length - resolved;
  return <Card className="mt-4"><CardHeader><CardTitle className="text-lg">Community verification</CardTitle></CardHeader><CardContent className="space-y-4">{issueStatus !== 'resolved' ? <p className="text-sm text-muted-foreground">Verification opens once this issue is marked resolved.</p> : <>{<p className="text-sm text-muted-foreground"><span className="font-medium text-emerald-700">{resolved} confirmed</span> and <span className="font-medium text-orange-700">{unresolved} reported unresolved</span>.</p>}{user && <div className="space-y-2"><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add an optional note about the outcome…" maxLength={1000} rows={3} /><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => submit(true)} disabled={saving}><CheckCircle2 className="mr-1 h-4 w-4" />Resolved for me</Button><Button size="sm" variant="outline" onClick={() => submit(false)} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="mr-1 h-4 w-4" />Still not resolved</>}</Button></div></div>}</>}{error && <p className="text-sm text-destructive">{error}</p>}</CardContent></Card>;
}
