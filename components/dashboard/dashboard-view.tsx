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
  ArrowRight, ShieldCheck, TrendingUp, Layers, ChevronRight, Filter,
} from 'lucide-react';
import { fetchDistricts } from '@/lib/queries';
import type { DashboardStats, StateBreakdown, DistrictBreakdown, TimeTrendItem } from '@/lib/queries';
import type { Category, GeoState, GeoDistrict } from '@/lib/types';


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

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href={buildIssuesUrl()} className="group">
          <Card className="p-4 transition-all hover:shadow-md hover:border-primary/40 h-full">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Total Public Issues</span>
              <Layers className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-0.5">
              View all issues <ChevronRight className="h-3 w-3" />
            </p>
          </Card>
        </Link>

        <Link href={buildIssuesUrl({ status: 'resolved' })} className="group">
          <Card className="p-4 transition-all hover:shadow-md hover:border-emerald-500/40 h-full">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Resolved Issues</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{resolved}</div>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 flex items-center gap-0.5">
              View resolved <ChevronRight className="h-3 w-3" />
            </p>
          </Card>
        </Link>

        <Link href={buildIssuesUrl({ status: 'in_progress' })} className="group">
          <Card className="p-4 transition-all hover:shadow-md hover:border-blue-500/40 h-full">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">In Progress</span>
              <Activity className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgress}</div>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1 flex items-center gap-0.5">
              View in progress <ChevronRight className="h-3 w-3" />
            </p>
          </Card>
        </Link>

        <Link href={buildIssuesUrl({ status: 'unresolved' })} className="group">
          <Card className="p-4 transition-all hover:shadow-md hover:border-amber-500/40 h-full">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Unresolved / Open</span>
              <Clock className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{unresolved}</div>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1 flex items-center gap-0.5">
              View open issues <ChevronRight className="h-3 w-3" />
            </p>
          </Card>
        </Link>

        <Card className="p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Resolution Rate</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">{total > 0 ? `${resolutionRate}%` : 'No data'}</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {total > 0 ? `${resolved} of ${total} issues resolved` : 'No issues recorded yet'}
          </p>
        </Card>
      </div>

      {/* District Breakdown (When State Selected) */}
      {currentStateId !== 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              District Breakdown — {selectedState?.name} ({districtBreakdown.length} Districts)
            </CardTitle>
            <CardDescription>Metrics across districts in {selectedState?.name}.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {districtBreakdown.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No districts recorded for {selectedState?.name}.
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
                      <TableHead className="text-right">Action</TableHead>
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
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> State-level Civic Comparison
            </CardTitle>
            <CardDescription>Public issue metrics across Indian States and Union Territories.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State / UT</TableHead>
                    <TableHead className="text-right">Total Issues</TableHead>
                    <TableHead className="text-right">Resolved</TableHead>
                    <TableHead className="text-right">In Progress</TableHead>
                    <TableHead className="text-right">Resolution Rate</TableHead>
                    <TableHead className="text-right">Explore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stateBreakdown.map((st) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
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
