'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge, SeverityBadge } from '@/components/issues/status-badges';
import { IssueTimeline } from '@/components/issues/issue-timeline';
import { IssueComments } from '@/components/issues/issue-comments';
import { EvidenceGallery } from '@/components/issues/evidence-gallery';
import {
  ShieldCheck, ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  Building, Send, EyeOff, Eye, FileText, Calendar, MapPin, Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  adminUpdateIssueStatus,
  adminToggleIssueHidden,
  adminAssignIssue,
  postOfficialComment,
  fetchIssueByPublicId,
} from '@/lib/queries';
import { formatRelativeTime, formatDate } from '@/lib/format';
import type { Issue, IssueStatusHistory, IssueEvidence, IssueStatus } from '@/lib/types';

export function AdminIssueDetailView({ initialIssue }: { initialIssue: Issue }) {
  const router = useRouter();
  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [history, setHistory] = useState<IssueStatusHistory[]>([]);
  const [evidence, setEvidence] = useState<IssueEvidence[]>([]);
  const [loading, setLoading] = useState(true);

  // Status transition state
  const [targetStatus, setTargetStatus] = useState<IssueStatus>(issue.status);
  const [statusNote, setStatusNote] = useState('');
  const [department, setDepartment] = useState(issue.department_name ?? '');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Official comment state
  const [officialMessage, setOfficialMessage] = useState('');
  const [postingMessage, setPostingMessage] = useState(false);

  // Moderation state
  const [hideReason, setHideReason] = useState('');
  const [togglingHide, setTogglingHide] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const reloadIssueData = useCallback(async () => {
    setLoading(true);
    try {
      const refreshed = await fetchIssueByPublicId(issue.public_id);
      if (refreshed) {
        setIssue(refreshed);
        setTargetStatus(refreshed.status);
        setDepartment(refreshed.department_name ?? '');

        const [histRes, evidRes] = await Promise.all([
          supabase.from('issue_status_history').select('*').eq('issue_id', refreshed.id).order('created_at', { ascending: true }),
          supabase.from('issue_evidence').select('*').eq('issue_id', refreshed.id).order('created_at', { ascending: true }),
        ]);
        setHistory(histRes.data ?? []);
        setEvidence(evidRes.data ?? []);
      }
    } catch {
      // Ignore background reload errors
    } finally {
      setLoading(false);
    }

  }, [issue.public_id, issue.id]);


  useEffect(() => {
    reloadIssueData();
  }, [reloadIssueData]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setUpdatingStatus(true);

    try {
      await adminUpdateIssueStatus(issue.id, targetStatus, statusNote.trim() || undefined, department.trim() || undefined);
      setMessage({ type: 'success', text: `Issue status updated to ${targetStatus.replace('_', ' ')}.` });
      setStatusNote('');
      await reloadIssueData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message ?? 'Failed to update status.' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePostOfficialUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialMessage.trim()) return;
    setMessage(null);
    setPostingMessage(true);

    try {
      await postOfficialComment(issue.id, officialMessage.trim());
      setMessage({ type: 'success', text: 'Official progress update posted.' });
      setOfficialMessage('');
      await reloadIssueData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message ?? 'Failed to post update.' });
    } finally {
      setPostingMessage(false);
    }
  };

  const handleToggleHide = async () => {
    setMessage(null);
    setTogglingHide(true);
    try {
      const shouldHide = !issue.is_hidden;
      await adminToggleIssueHidden(issue.id, shouldHide, hideReason.trim() || undefined);
      setMessage({ type: 'success', text: shouldHide ? 'Issue hidden from public view.' : 'Issue is now publicly visible.' });
      setHideReason('');
      await reloadIssueData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message ?? 'Failed to update moderation state.' });
    } finally {
      setTogglingHide(false);
    }
  };

  const locationStr = [issue.locality?.name, issue.city?.name, issue.district?.name, issue.state?.name].filter(Boolean).join(', ');

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <Link href="/admin/issues" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Issue Management
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="secondary" className="font-mono">{issue.public_id}</Badge>
            <StatusBadge status={issue.status} />
            <SeverityBadge severity={issue.severity} />
            {issue.is_hidden && (
              <Badge variant="destructive" className="gap-1">
                <EyeOff className="h-3 w-3" /> Hidden from Public
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{issue.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Reported by @{issue.profiles?.username ?? 'citizen'} · {formatRelativeTime(issue.created_at)} · {locationStr || 'India'}
          </p>
        </div>

        <Link href={`/issues/${issue.public_id}`} target="_blank">
          <Button variant="outline" size="sm" className="gap-1.5">
            View Public Page <FileText className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' : ''}>
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Issue Description</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap leading-relaxed">{issue.description}</p>
              {issue.address && <p className="text-xs text-muted-foreground">Address: {issue.address} (PIN: {issue.pincode || 'N/A'})</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Attached Evidence ({evidence.length})</CardTitle></CardHeader>
            <CardContent>
              {evidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">No evidence attached.</p>
              ) : (
                <EvidenceGallery evidence={evidence} />
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="timeline">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Status Timeline</TabsTrigger>
              <TabsTrigger value="discussion">Discussion & Official Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <IssueTimeline history={history} loading={loading} currentStatus={issue.status} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discussion">
              <IssueComments issueId={issue.id} issueOwnerId={issue.user_id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Authority Control Panel */}
        <div className="space-y-6">
          {/* Status Transition Control */}
          <Card className="border-primary/30 shadow-sm">
            <CardHeader className="bg-primary/5 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Authority Status Action
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-target-status">Select New Status</Label>
                  <Select value={targetStatus} onValueChange={(val) => setTargetStatus(val as IssueStatus)}>
                    <SelectTrigger id="admin-target-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reported">reported — Submitted by citizen</SelectItem>
                      <SelectItem value="under_review">under_review — Reviewing issue</SelectItem>
                      <SelectItem value="acknowledged">acknowledged — Officially acknowledged</SelectItem>
                      <SelectItem value="in_progress">in_progress — Active resolution in progress</SelectItem>
                      <SelectItem value="resolved">resolved — Issue resolved</SelectItem>
                      <SelectItem value="reopened">reopened — Reopen case</SelectItem>
                      <SelectItem value="closed">closed — Case closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-department">Responsible Department</Label>
                  <Input
                    id="admin-department"
                    placeholder="e.g. Roads & Infrastructure Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-status-note">Official Update Note</Label>
                  <Textarea
                    id="admin-status-note"
                    placeholder="Provide details about actions taken or next steps..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={updatingStatus}>
                  {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Execute Status Update'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Post Official Authority Update */}
          <Card>
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Building className="h-4 w-4 text-primary" /> Post Official Progress Update
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handlePostOfficialUpdate} className="space-y-3">
                <Textarea
                  placeholder="Post an official authority update to public issue discussion..."
                  value={officialMessage}
                  onChange={(e) => setOfficialMessage(e.target.value)}
                  rows={3}
                  required
                />
                <Button type="submit" size="sm" className="w-full gap-1.5" disabled={postingMessage || !officialMessage.trim()}>
                  {postingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5" /> Post Official Update</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Moderation Controls */}
          <Card>
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-sm">Content Moderation</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="hide-reason" className="text-xs">Reason for Moderation Action</Label>
                <Input
                  id="hide-reason"
                  placeholder="Optional reason for hide/unhide..."
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                  className="text-xs"
                />
              </div>
              <Button
                variant={issue.is_hidden ? 'default' : 'outline'}
                size="sm"
                className="w-full gap-1.5"
                onClick={handleToggleHide}
                disabled={togglingHide}
              >
                {togglingHide ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : issue.is_hidden ? (
                  <><Eye className="h-4 w-4" /> Unhide Issue (Make Public)</>
                ) : (
                  <><EyeOff className="h-4 w-4" /> Hide Issue from Public</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
