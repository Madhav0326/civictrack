'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart3, CheckCircle2, Clock, Activity, AlertCircle, MapPin,
  ArrowRight, ShieldCheck, TrendingUp, Layers, ChevronRight, ChevronLeft, Filter,
  ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-react';
import { fetchDistricts } from '@/lib/queries';
import type { DashboardStats, StateBreakdown, DistrictBreakdown, TimeTrendItem } from '@/lib/queries';
import type { Category, GeoState, GeoDistrict } from '@/lib/types';

type StateSortField = 'name' | 'total' | 'resolved' | 'inProgress' | 'resolutionRate';

interface DashboardViewProps {
  stats: DashboardStats | null;
  stateBreakdown: StateBreakdown[];
  districtBreakdown: DistrictBreakdown[];
  categories: Category[];
  states: GeoState[];
  selectedStateId?: number;
  selectedDistrictId?: number;
  timeTrends: TimeTrendItem[];
}

export function DashboardView({
  stats,
  stateBreakdown,
  districtBreakdown,
  categories,
  states,
  selectedStateId,
  selectedDistrictId,
  timeTrends,
}: DashboardViewProps) {
  const router = useRouter();

  const [currentStateId, setCurrentStateId] = useState<string>(
    selectedStateId ? String(selectedStateId) : 'all'
  );
  const [currentDistrictId, setCurrentDistrictId] = useState<string>(
    selectedDistrictId ? String(selectedDistrictId) : 'all'
  );

  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // State Table Sorting & Pagination
  const [sortField, setSortField] = useState<StateSortField>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;


  const selectedState = states.find((s) => s.id === (currentStateId !== 'all' ? Number(currentStateId) : undefined));

  // Load districts when state selection changes
  useEffect(() => {
    if (currentStateId === 'all') {
      setDistricts([]);
      setCurrentDistrictId('all');
      return;
    }
    const stateId = Number(currentStateId);
    if (Number.isNaN(stateId)) return;

    setLoadingDistricts(true);
    fetchDistricts(stateId)
      .then((data) => setDistricts(data))
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, [currentStateId]);

  const handleStateChange = (val: string) => {
    setCurrentStateId(val);
    setCurrentDistrictId('all');
    if (val === 'all') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard?state_id=${val}`);
    }
  };

  const handleDistrictChange = (val: string) => {
    setCurrentDistrictId(val);
    if (val === 'all') {
      router.push(`/dashboard?state_id=${currentStateId}`);
    } else {
      router.push(`/dashboard?state_id=${currentStateId}&district_id=${val}`);
    }
  };

  const total = stats?.total ?? 0;
  const resolved = stats?.resolved ?? 0;
  const inProgress = stats?.inProgress ?? 0;
  const unresolved = stats?.unresolved ?? 0;
  const resolutionRate = stats?.resolutionRate ? Math.round(stats.resolutionRate * 10) / 10 : 0;

  // Build filter query for navigating to /issues
  const buildIssuesUrl = (extraParams?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (currentStateId !== 'all') params.set('state', currentStateId);
    if (currentDistrictId !== 'all') params.set('district', currentDistrictId);
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    }
    const str = params.toString();
    return str ? `/issues?${str}` : '/issues';
  };

  const handleSort = (field: StateSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
    setCurrentPage(1);
  };

  const sortedStateBreakdown = [...stateBreakdown].sort((a, b) => {
    let valA: string | number = a[sortField];
    let valB: string | number = b[sortField];

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return sortOrder === 'asc'
      ? (valA as number) - (valB as number)
      : (valB as number) - (valA as number);
  });

  const totalPages = Math.max(1, Math.ceil(sortedStateBreakdown.length / ITEMS_PER_PAGE));
  const paginatedStateBreakdown = sortedStateBreakdown.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderSortIcon = (field: StateSortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-40 inline shrink-0" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-primary inline shrink-0" />
    ) : (
      <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-primary inline shrink-0" />
    );
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header & Location Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" /> Civic Accountability
            </Badge>
            <span className="text-xs text-muted-foreground">Public Data Portal</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedState ? `${selectedState.name} Civic Dashboard` : 'India Civic Accountability Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time public transparency metrics for civic issues, resolution rates, and state progress.
          </p>
        </div>

        {/* Geographic Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={currentStateId} onValueChange={handleStateChange}>
            <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue placeholder="All India" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All India (National)</SelectItem>
              {states.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentDistrictId}
            onValueChange={handleDistrictChange}
            disabled={currentStateId === 'all' || loadingDistricts}
          >
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder={loadingDistricts ? 'Loading...' : 'All Districts'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Public Issues
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>Reported across geography</span>
              <Link href={buildIssuesUrl()} className="text-primary hover:underline font-medium">View all &rarr;</Link>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resolved Issues
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{resolved.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>{resolutionRate}% resolution rate</span>
              <Link href={buildIssuesUrl({ status: 'resolved' })} className="text-emerald-600 hover:underline font-medium">Resolved &rarr;</Link>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              In Progress
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgress.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>Active authority action</span>
              <Link href={buildIssuesUrl({ status: 'in_progress' })} className="text-blue-600 hover:underline font-medium">Active &rarr;</Link>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending / Unresolved
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{unresolved.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>Awaiting resolution</span>
              <Link href={buildIssuesUrl({ status: 'reported' })} className="text-amber-600 hover:underline font-medium">Pending &rarr;</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* District Breakdown Table (When a State is Selected) */}
      {currentStateId !== 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> District Breakdown for {selectedState?.name}
            </CardTitle>
            <CardDescription>Performance metrics across districts within {selectedState?.name}.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {districtBreakdown.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No issues recorded for districts in this state yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>District</TableHead>
                      <TableHead className="text-right">Total Issues</TableHead>
                      <TableHead className="text-right">Resolved</TableHead>
                      <TableHead className="text-right">In Progress</TableHead>
                      <TableHead className="text-right">Resolution Rate</TableHead>
                      <TableHead className="text-right">Explore</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {districtBreakdown.map((dt) => (
                      <TableRow key={dt.id}>
                        <TableCell className="font-medium text-sm">
                          <Link href={`/dashboard?state_id=${currentStateId}&district_id=${dt.id}`} className="hover:underline text-primary">
                            {dt.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold">{dt.total}</TableCell>
                        <TableCell className="text-right text-xs text-emerald-600 font-semibold">{dt.resolved}</TableCell>
                        <TableCell className="text-right text-xs text-blue-600 font-semibold">{dt.inProgress}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">
                          {dt.total > 0 ? `${dt.resolutionRate}%` : '0%'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/issues?state=${currentStateId}&district=${dt.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                              Issues <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* State Comparison Table (When National View) */}
      {currentStateId === 'all' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> State-level Civic Comparison
              </CardTitle>
              <CardDescription>Public issue metrics across Indian States and Union Territories.</CardDescription>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md border">
              10 states / page
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        <span>State / UT</span>
                        {renderSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer select-none hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Total Issues</span>
                        {renderSortIcon('total')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer select-none hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort('resolved')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Resolved</span>
                        {renderSortIcon('resolved')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer select-none hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort('inProgress')}
                    >
                      <div className="flex items-center justify-end">
                        <span>In Progress</span>
                        {renderSortIcon('inProgress')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer select-none hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort('resolutionRate')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Resolution Rate</span>
                        {renderSortIcon('resolutionRate')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Explore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStateBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                        No states found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStateBreakdown.map((st) => (
                      <TableRow key={st.id}>
                        <TableCell className="font-medium text-sm">
                          <Link href={`/dashboard?state_id=${st.id}`} className="hover:underline text-primary">
                            {st.name} <span className="text-xs text-muted-foreground">({st.code})</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold">{st.total}</TableCell>
                        <TableCell className="text-right text-xs text-emerald-600 font-semibold">{st.resolved}</TableCell>
                        <TableCell className="text-right text-xs text-blue-600 font-semibold">{st.inProgress}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">
                          {st.total > 0 ? `${st.resolutionRate}%` : '0%'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard?state_id=${st.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                              Drill Down <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {sortedStateBreakdown.length > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/10">
                <span className="text-xs text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, sortedStateBreakdown.length)} of {sortedStateBreakdown.length} states
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </Button>
                  <span className="text-xs font-medium px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown & Time Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Category Distribution
            </CardTitle>
            <CardDescription>Civic issue breakdown by reported category.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats?.byCategory || stats.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No categories recorded yet.</p>
            ) : (
              stats.byCategory.map((cat: { category_id: number; category_name: string; count: number }) => (

                <div key={cat.category_id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      href={buildIssuesUrl({ category: String(cat.category_id) })}
                      className="font-medium hover:underline text-foreground"
                    >
                      {cat.category_name}
                    </Link>
                    <span className="font-semibold text-muted-foreground">{cat.count} issues</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(5, (cat.count / (total || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Time trend activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Time Activity Trends
            </CardTitle>
            <CardDescription>Monthly public reporting and resolution activity.</CardDescription>
          </CardHeader>
          <CardContent>
            {timeTrends.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Insufficient timeline data.</p>
            ) : (
              <div className="space-y-3">
                {timeTrends.map((trend, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-md border text-xs bg-muted/20">
                    <span className="font-semibold text-foreground">{trend.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        Reported: <strong className="text-foreground">{trend.reported}</strong>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Resolved: <strong>{trend.resolved}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
