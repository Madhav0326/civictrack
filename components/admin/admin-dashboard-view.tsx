'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LayoutDashboard, ShieldCheck, AlertOctagon, FileCheck, CheckCircle2,
  Clock, Activity, ArrowRight, ShieldAlert, FileText, RefreshCw, UserCheck,
  Ban, Shield, X, EyeOff, Loader2,
} from 'lucide-react';
import {
  fetchReports,
  fetchAuditLogs,
  adminReviewReport,
  adminToggleUserBanStatus,
  adminToggleUserSuspensionStatus,
} from '@/lib/queries';
import { formatRelativeTime } from '@/lib/format';
import type { Category, GeoState } from '@/lib/types';

interface AdminDashboardViewProps {
  stats: any;
  categories: Category[];
  states: GeoState[];
}

export function AdminDashboardView({ stats, categories, states }: AdminDashboardViewProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // User Governance State
  const [targetUserId, setTargetUserId] = useState('');
  const [govReason, setGovReason] = useState('');
  const [govMessage, setGovMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [repRes, auditRes] = await Promise.all([
      fetchReports().catch(() => []),
      fetchAuditLogs().catch(() => []),
    ]);
    setReports(repRes);
    setAuditLogs(auditRes);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewReport = async (reportId: string, status: 'dismissed' | 'action_taken', actionType?: string) => {
    setActionLoading(reportId);
    try {
      await adminReviewReport({
        reportId,
        status,
        actionType,
        notes: actionType ? `Action taken: ${actionType}` : 'Report dismissed by moderator',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message ?? 'Failed to review report.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserBan = async (isBanned: boolean) => {
    if (!targetUserId.trim()) return;
    setActionLoading('gov');
    setGovMessage(null);
    try {
      await adminToggleUserBanStatus(targetUserId.trim(), isBanned, govReason || undefined);
      setGovMessage(`User ${isBanned ? 'banned' : 'unbanned'} successfully.`);
      setTargetUserId('');
      setGovReason('');
      await loadData();
    } catch (err: any) {
      setGovMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserSuspend = async (isSuspended: boolean) => {
    if (!targetUserId.trim()) return;
    setActionLoading('gov');
    setGovMessage(null);
    try {
      await adminToggleUserSuspensionStatus(targetUserId.trim(), isSuspended, govReason || undefined);
      setGovMessage(`User ${isSuspended ? 'suspended' : 'unsuspended'} successfully.`);
      setTargetUserId('');
      setGovReason('');
      await loadData();
    } catch (err: any) {
      setGovMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const total = stats?.total ?? 0;
  const unresolved = stats?.unresolved ?? 0;
  const inProgress = stats?.inProgress ?? 0;
  const resolved = stats?.resolved ?? 0;
  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" /> Authority Control Center
            </Badge>
            <span className="text-xs text-muted-foreground">Admin & Moderation Portal</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Civic Governance Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review civic issues, manage content reports, update department assignments, and maintain platform security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/issues">
            <Button className="gap-2">
              <FileText className="h-4 w-4" /> Go to Issues Portal
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Total Issues</span>
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">{total}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Unresolved Reports</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{unresolved}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">In Progress</span>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgress}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Pending Reports</span>
            <AlertOctagon className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-destructive">{pendingReportsCount}</div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="issues" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
          <TabsTrigger value="issues" className="gap-2">
            <FileText className="h-4 w-4" /> Issue Management
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <AlertOctagon className="h-4 w-4" /> Content Reports
            {pendingReportsCount > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                {pendingReportsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <ShieldAlert className="h-4 w-4" /> Audit & Governance
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Issues Portal */}
        <TabsContent value="issues" className="space-y-4 pt-4">
          <Card className="p-6 text-center space-y-4">
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold">Manage Reported Civic Issues</h3>
              <p className="text-sm text-muted-foreground">
                Filter issues by state, district, status, or public ID to acknowledge, assign departments, and update issue lifecycle statuses.
              </p>
              <div className="pt-2">
                <Link href="/admin/issues">
                  <Button className="gap-2">
                    Open Issue Management Portal <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Content Reports */}
        <TabsContent value="reports" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>User Content Reports ({reports.length})</span>
                {pendingReportsCount > 0 && (
                  <Badge variant="destructive">{pendingReportsCount} Pending Review</Badge>
                )}
              </CardTitle>
              <CardDescription>Review citizen flag reports for issues, comments, solutions, or users.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No content reports filed yet.</div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize text-xs">{report.target_type}</Badge>
                          <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'} className="capitalize text-xs">
                            {report.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(report.created_at)}</span>
                        </div>
                        <p className="text-sm font-medium">{report.reason}</p>
                        {report.description && <p className="text-xs text-muted-foreground">{report.description}</p>}
                        <p className="text-xs text-muted-foreground">Reported by: @{report.reporter?.username ?? 'user'}</p>
                      </div>

                      {report.status === 'pending' && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewReport(report.id, 'dismissed')}
                            disabled={actionLoading === report.id}
                            className="text-xs"
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleReviewReport(
                                report.id,
                                'action_taken',
                                report.target_type === 'comment' ? 'hide_comment' : 'hide_issue'
                              )
                            }
                            disabled={actionLoading === report.id}
                            className="text-xs gap-1"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            Hide Content
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Audit Logs & Governance */}
        <TabsContent value="audit" className="space-y-6 pt-4">
          {/* User Governance Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" /> Account Governance (Suspend / Ban User)
              </CardTitle>
              <CardDescription>Enforce platform rules and prevent abusive content submissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Target User ID (UUID)</Label>
                  <Input
                    placeholder="User profile UUID..."
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reason / Moderation Note</Label>
                  <Input
                    placeholder="Reason for suspension or ban..."
                    value={govReason}
                    onChange={(e) => setGovReason(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {govMessage && (
                <p className="text-xs font-medium text-destructive">{govMessage}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUserSuspend(true)}
                  disabled={!targetUserId || actionLoading === 'gov'}
                  className="text-xs gap-1"
                >
                  Suspend Account
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUserSuspend(false)}
                  disabled={!targetUserId || actionLoading === 'gov'}
                  className="text-xs gap-1"
                >
                  Unsuspend Account
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleUserBan(true)}
                  disabled={!targetUserId || actionLoading === 'gov'}
                  className="text-xs gap-1"
                >
                  Ban Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Audit Trail</CardTitle>
              <CardDescription>Append-only record of privileged status changes, moderation events, and authority updates.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading audit trail...</div>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No audit entries recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between gap-3 p-3 rounded-md border text-xs bg-muted/20">
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                          <Badge variant="outline" className="text-[10px]">{log.entity_type}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-0.5">
                          Actor: @{log.actor?.username ?? 'system'} · Entity ID: {log.entity_id}
                        </p>
                        {log.details && (
                          <pre className="mt-1 font-mono text-[11px] text-muted-foreground bg-background p-1.5 rounded overflow-x-auto">
                            {JSON.stringify(log.details)}
                          </pre>
                        )}
                      </div>
                      <span className="text-muted-foreground shrink-0">{formatRelativeTime(log.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
