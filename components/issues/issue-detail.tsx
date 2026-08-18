'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MapPin, Calendar, Users, MessageSquare, Lightbulb, Bell,
  Image as ImageIcon, FileText, Share2, AlertCircle, ChevronLeft,
  CheckCircle2, Clock, Activity, Edit3, Trash2, Loader2, Lock,
} from 'lucide-react';
import { StatusBadge, SeverityBadge } from '@/components/issues/status-badges';
import { IssueTimeline } from '@/components/issues/issue-timeline';
import { IssueComments } from '@/components/issues/issue-comments';
import { IssueSolutions } from '@/components/issues/issue-solutions';
import { IssueSupportButton } from '@/components/issues/issue-support-button';
import { IssueFollowButton } from '@/components/issues/issue-follow-button';
import { ResolutionVerification } from '@/components/issues/resolution-verification';
import { ReportButton } from '@/components/issues/report-button';
import { EvidenceGallery } from '@/components/issues/evidence-gallery';
import { EditIssueDialog } from '@/components/issues/edit-issue-dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { formatRelativeTime, formatDate, formatNumber } from '@/lib/format';
import { deleteIssue, deleteEvidence } from '@/lib/queries';
import type { Issue, IssueStatusHistory, IssueEvidence, Category, GeoState } from '@/lib/types';

interface IssueDetailProps {
  issue: Issue;
  categories?: Category[];
  states?: GeoState[];
}

export function IssueDetail({ issue: initialIssue, categories = [], states = [] }: IssueDetailProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [history, setHistory] = useState<IssueStatusHistory[]>([]);
  const [evidence, setEvidence] = useState<IssueEvidence[]>([]);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = user?.id === issue.user_id;
  const isEditableStatus = ['reported', 'under_review', 'acknowledged', 'reopened'].includes(issue.status);
  const remainingEdits = Math.max(0, 3 - (issue.edit_count ?? 0));
  const canEdit = isOwner && isEditableStatus && remainingEdits > 0;
  const canDelete = isOwner && issue.status === 'reported';

  const loadData = useCallback(async () => {
    setLoading(true);
    const [histRes, evidRes] = await Promise.all([
      supabase
        .from('issue_status_history')
        .select('*')
        .eq('issue_id', issue.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('issue_evidence')
        .select('*')
        .eq('issue_id', issue.id)
        .order('created_at', { ascending: true }),
    ]);
    setHistory(histRes.data ?? []);
    setEvidence(evidRes.data ?? []);
    setLoading(false);
  }, [issue.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const location = [issue.locality?.name, issue.city?.name, issue.district?.name, issue.state?.name]
    .filter(Boolean)
    .join(', ');

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: issue.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const handleDeleteIssue = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteIssue(issue.id);
      router.push('/issues');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete issue.');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteEvidenceItem = async (item: IssueEvidence) => {
    try {
      await deleteEvidence(item.id, item.file_path);
      setEvidence((prev) => prev.filter((e) => e.id !== item.id));
    } catch (err: any) {
      setError(err.message ?? 'Could not delete evidence file.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      <Link href="/issues" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to issues
      </Link>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-primary">{issue.public_id}</span>
            <StatusBadge status={issue.status} />
            <SeverityBadge severity={issue.severity} />
            {issue.is_sensitive && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="mr-1 h-3 w-3" /> Sensitive
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{issue.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Reported {formatRelativeTime(issue.created_at)}
            </span>
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {location}
              </span>
            )}
            {issue.category && (
              <span className="flex items-center gap-1">
                <span className="font-medium">{issue.category.name}</span>
                {issue.subcategory && <span className="text-muted-foreground/60">· {issue.subcategory.name}</span>}
              </span>
            )}
          </div>
        </div>

        {/* Owner Controls */}
        {isOwner && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canEdit ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit3 className="h-4 w-4" /> Edit Issue
                <span className="text-xs text-muted-foreground font-normal">({remainingEdits} left)</span>
              </Button>
            ) : isEditableStatus && remainingEdits <= 0 ? (
              <Badge variant="outline" className="gap-1.5 py-1 text-xs text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10">
                <Lock className="h-3.5 w-3.5" /> Edit limit reached (3/3 used)
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 py-1 text-xs text-muted-foreground bg-secondary/50">
                <Lock className="h-3.5 w-3.5" /> Editing locked ({issue.status.replace('_', ' ')})
              </Badge>
            )}

            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Delete Issue
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main content */}
        <div className="space-y-6">
          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Description</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{issue.description}</p>
              {issue.date_started && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Issue started: {formatDate(issue.date_started)}
                </div>
              )}
              {issue.frequency && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" /> Frequency: {issue.frequency}
                </div>
              )}
              {issue.people_affected_estimate != null && issue.people_affected_estimate > 0 && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> Estimated people affected: {formatNumber(issue.people_affected_estimate)}
                </div>
              )}
              {issue.reference_number && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" /> Reference: {issue.reference_number}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" /> Evidence ({evidence.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
                </div>
              ) : evidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">No evidence has been added to this issue.</p>
              ) : (
                <EvidenceGallery
                  evidence={evidence}
                  canDelete={isOwner}
                  onDelete={handleDeleteEvidenceItem}
                />
              )}
            </CardContent>
          </Card>

          {/* Tabs: Comments, Solutions, Timeline, Verification */}
          <Tabs defaultValue="comments">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="comments" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Comments</span>
                <span className="sm:hidden">{issue.comment_count}</span>
              </TabsTrigger>
              <TabsTrigger value="solutions" className="gap-1">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Solutions</span>
                <span className="sm:hidden">{issue.solution_count}</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="verify" className="gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Verify</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments">
              <IssueComments issueId={issue.id} issueOwnerId={issue.user_id} publicId={issue.public_id} />
            </TabsContent>

            <TabsContent value="solutions">
              <IssueSolutions issueId={issue.id} />
            </TabsContent>
            <TabsContent value="timeline">
              <IssueTimeline history={history} loading={loading} currentStatus={issue.status} />
            </TabsContent>
            <TabsContent value="verify">
              <ResolutionVerification issueId={issue.id} issueStatus={issue.status} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Action card */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {user ? (
                <>
                  <IssueSupportButton issueId={issue.id} initialCount={issue.supporter_count} />
                  <IssueFollowButton issueId={issue.id} initialCount={issue.follower_count} />
                  {isOwner && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">You reported this issue</p>
                      {!canEdit && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Issue is in official workflow
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2 text-center py-2">
                  <p className="text-sm text-muted-foreground">Sign in to support, follow, and comment on this issue.</p>
                  <Link href={`/login?redirect=/issues/${issue.public_id}`}>
                    <Button size="sm" className="w-full">Sign in</Button>
                  </Link>
                </div>
              )}
              <Separator />
              <Button variant="outline" size="sm" className="w-full gap-1" onClick={handleShare}>
                <Share2 className="h-4 w-4" /> {copied ? 'Link copied!' : 'Share'}
              </Button>
              {user && (
                <ReportButton targetType="issue" targetId={issue.id} />
              )}
            </CardContent>
          </Card>

          {/* Stats card */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Issue Stats</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Affected</span>
                <span className="font-medium">{formatNumber(issue.supporter_count)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><MessageSquare className="h-4 w-4" /> Comments</span>
                <span className="font-medium">{formatNumber(issue.comment_count)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Lightbulb className="h-4 w-4" /> Solutions</span>
                <span className="font-medium">{formatNumber(issue.solution_count)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Bell className="h-4 w-4" /> Followers</span>
                <span className="font-medium">{formatNumber(issue.follower_count)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><ImageIcon className="h-4 w-4" /> Evidence</span>
                <span className="font-medium">{formatNumber((issue as any).evidence_count ?? evidence.length)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Location card */}
          {issue.latitude && issue.longitude && issue.location_privacy !== 'area_only' && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Location</CardTitle></CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg bg-secondary overflow-hidden">
                  <iframe
                    title="Issue location"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${issue.longitude - 0.005},${issue.latitude - 0.005},${issue.longitude + 0.005},${issue.latitude + 0.005}&marker=${issue.latitude},${issue.longitude}`}
                  />
                </div>
                {issue.address && (
                  <p className="mt-2 text-xs text-muted-foreground">{issue.address}</p>
                )}
                {issue.pincode && (
                  <p className="text-xs text-muted-foreground">PIN: {issue.pincode}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reporter card */}
          {issue.profiles && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Reported by</CardTitle></CardHeader>
              <CardContent>
                <Link href={`/profile/${issue.profiles.username}`} className="flex items-center gap-2 hover:underline">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {issue.profiles.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{issue.profiles.username}</span>
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">Joined {formatDate(issue.profiles.created_at)}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Issue Modal */}
      {canEdit && (
        <EditIssueDialog
          issue={issue}
          categories={categories}
          states={states}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onIssueUpdated={(updated) => {
            setIssue(updated);
            loadData();
          }}
        />
      )}

      {/* Delete Issue Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reported issue?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete issue {issue.public_id} and all associated evidence files.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteIssue}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Issue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
