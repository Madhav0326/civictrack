'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, SeverityBadge } from '@/components/issues/status-badges';
import { Loader2, Search, Filter, RefreshCw, ArrowLeft, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { adminUpdateIssueStatus, fetchDistricts } from '@/lib/queries';
import { formatRelativeTime } from '@/lib/format';
import type { Issue, Category, GeoState, GeoDistrict, IssueStatus } from '@/lib/types';

interface AdminIssuesListViewProps {
  categories: Category[];
  states: GeoState[];
  searchParams: { [key: string]: string | string[] | undefined };
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'reported', label: 'Reported (New)' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'reopened', label: 'Reopened' },
  { value: 'closed', label: 'Closed' },
];

export function AdminIssuesListView({ categories, states, searchParams }: AdminIssuesListViewProps) {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<string>(
    typeof searchParams.status === 'string' ? searchParams.status : 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>(
    typeof searchParams.search === 'string' ? searchParams.search : ''
  );

  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transition Dialog state
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [nextStatus, setNextStatus] = useState<IssueStatus>('under_review');
  const [statusNote, setStatusNote] = useState('');
  const [department, setDepartment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Load districts when state changes
  useEffect(() => {
    if (stateFilter === 'all') {
      setDistricts([]);
      setDistrictFilter('all');
      return;
    }
    const stateId = Number(stateFilter);
    if (Number.isNaN(stateId)) return;

    setLoadingDistricts(true);
    fetchDistricts(stateId)
      .then((data) => setDistricts(data))
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, [stateFilter]);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('issues')
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*),
        state:geo_states(*),
        district:geo_districts(*),
        city:geo_cities(*),
        locality:geo_localities(*),
        profiles:profiles(*)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (categoryFilter !== 'all') {
      const catId = Number(categoryFilter);
      if (!Number.isNaN(catId)) query = query.eq('category_id', catId);
    }

    if (stateFilter !== 'all') {
      const stId = Number(stateFilter);
      if (!Number.isNaN(stId)) query = query.eq('state_id', stId);
    }

    if (districtFilter !== 'all') {
      const dtId = Number(districtFilter);
      if (!Number.isNaN(dtId)) query = query.eq('district_id', dtId);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim();
      query = query.or(`public_id.ilike.%${term}%,title.ilike.%${term}%`);
    }

    const { data, error: fetchErr } = await query.limit(100);

    if (fetchErr) {
      setError(fetchErr.message);
    } else {
      setIssues((data ?? []) as Issue[]);
    }
    setLoading(false);
  }, [statusFilter, categoryFilter, stateFilter, districtFilter, searchTerm]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setUpdating(true);
    setUpdateError(null);

    try {
      await adminUpdateIssueStatus(selectedIssue.id, nextStatus, statusNote.trim() || undefined, department.trim() || undefined);
      setSelectedIssue(null);
      setStatusNote('');
      setDepartment('');
      await loadIssues();
    } catch (err: any) {
      setUpdateError(err.message ?? 'Failed to update issue status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Back to Admin Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Issue Management Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review citizen reports, change status, and assign responsible departments.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadIssues} className="gap-1.5 self-start sm:self-auto">
            <RefreshCw className="h-4 w-4" /> Refresh List
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
            {/* Search */}
            <div className="space-y-1">
              <Label className="text-xs">Search (ID / Title)</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="e.g. CIV-AP or pothole"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            <div className="space-y-1">
              <Label className="text-xs">State / UT</Label>
              <Select
                value={stateFilter}
                onValueChange={(val) => {
                  setStateFilter(val);
                  setDistrictFilter('all');
                }}
              >
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District */}
            <div className="space-y-1">
              <Label className="text-xs">District</Label>
              <Select
                value={districtFilter}
                onValueChange={setDistrictFilter}
                disabled={stateFilter === 'all' || loadingDistricts}
              >
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={loadingDistricts ? 'Loading...' : 'All Districts'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Issues Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading issues...
            </div>
          ) : issues.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No issues matched your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Public ID</TableHead>
                    <TableHead>Title & Location</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => {
                    const locationStr = [issue.district?.name, issue.state?.name].filter(Boolean).join(', ');

                    return (
                      <TableRow key={issue.id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          <Link href={`/admin/issues/${issue.public_id}`} className="text-primary hover:underline flex items-center gap-1">
                            {issue.public_id}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          <div className="font-medium text-sm truncate">{issue.title}</div>
                          {locationStr && <div className="text-xs text-muted-foreground truncate">{locationStr}</div>}
                        </TableCell>
                        <TableCell className="text-xs">
                          {issue.category?.name}
                        </TableCell>
                        <TableCell>
                          <SeverityBadge severity={issue.severity} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={issue.status} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {issue.department_name ? (
                            <Badge variant="outline">{issue.department_name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(issue.created_at)}
                        </TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => {
                              setSelectedIssue(issue);
                              setNextStatus(
                                issue.status === 'reported'
                                  ? 'under_review'
                                  : issue.status === 'under_review'
                                  ? 'acknowledged'
                                  : issue.status === 'acknowledged'
                                  ? 'in_progress'
                                  : issue.status === 'in_progress'
                                  ? 'resolved'
                                  : 'closed'
                              );
                              setDepartment(issue.department_name ?? '');
                            }}
                          >
                            Update Status
                          </Button>
                          <Link href={`/admin/issues/${issue.public_id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transition Modal */}
      {selectedIssue && (
        <Dialog open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Update Status for {selectedIssue.public_id}</DialogTitle>
              <DialogDescription>
                Execute an authorized status transition for issue &ldquo;{selectedIssue.title}&rdquo;.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleExecuteTransition} className="space-y-4 py-2">
              {updateError && (
                <Alert variant="destructive">
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label>Current Status</Label>
                <div className="pt-1">
                  <StatusBadge status={selectedIssue.status} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="next-status">New Status</Label>
                <Select value={nextStatus} onValueChange={(val) => setNextStatus(val as IssueStatus)}>
                  <SelectTrigger id="next-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_review">under_review — Acknowledge & begin review</SelectItem>
                    <SelectItem value="acknowledged">acknowledged — Officially verified by authority</SelectItem>
                    <SelectItem value="in_progress">in_progress — Active work in progress</SelectItem>
                    <SelectItem value="resolved">resolved — Issue resolved</SelectItem>
                    <SelectItem value="reopened">reopened — Reopen for follow up</SelectItem>
                    <SelectItem value="closed">closed — Case closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department">Responsible Department / Authority</Label>
                <Input
                  id="department"
                  placeholder="e.g. Municipal Public Works Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status-note">Official Update Note</Label>
                <Textarea
                  id="status-note"
                  placeholder="Explain what progress was made or reason for status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedIssue(null)} disabled={updating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Execute Transition'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
