'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapContainer } from '@/components/map/map-container';
import { MapPin, SlidersHorizontal, Layers, X, ShieldCheck, RefreshCw, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { fetchDistricts, fetchMapIssues } from '@/lib/queries';
import type { MapIssueItem } from '@/lib/queries';
import type { Category, GeoState, GeoDistrict } from '@/lib/types';
import { ISSUE_STATUSES, ISSUE_SEVERITIES } from '@/lib/constants';

interface MapViewProps {
  categories: Category[];
  states: GeoState[];
  initialStateId?: number;
  initialDistrictId?: number;
  initialCategoryId?: number;
  initialStatus?: string;
  initialSeverity?: string;
}

export function MapView({
  categories,
  states,
  initialStateId,
  initialDistrictId,
  initialCategoryId,
  initialStatus = 'all',
  initialSeverity = 'all',
}: MapViewProps) {
  const router = useRouter();

  const [stateFilter, setStateFilter] = useState<string>(initialStateId ? String(initialStateId) : 'all');
  const [districtFilter, setDistrictFilter] = useState<string>(initialDistrictId ? String(initialDistrictId) : 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryId ? String(initialCategoryId) : 'all');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [severityFilter, setSeverityFilter] = useState<string>(initialSeverity);

  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [issues, setIssues] = useState<MapIssueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load districts when state filter changes
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

    const stateId = stateFilter !== 'all' ? Number(stateFilter) : undefined;
    const districtId = districtFilter !== 'all' ? Number(districtFilter) : undefined;
    const categoryId = categoryFilter !== 'all' ? Number(categoryFilter) : undefined;

    try {
      const data = await fetchMapIssues({
        state_id: stateId && !Number.isNaN(stateId) ? stateId : undefined,
        district_id: districtId && !Number.isNaN(districtId) ? districtId : undefined,
        category_id: categoryId && !Number.isNaN(categoryId) ? categoryId : undefined,
        status: statusFilter,
        severity: severityFilter,
      });
      setIssues(data);
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [stateFilter, districtFilter, categoryFilter, statusFilter, severityFilter]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleStateChange = (val: string) => {
    setStateFilter(val);
    setDistrictFilter('all');
  };

  const selectedState = states.find((s) => s.id === (stateFilter !== 'all' ? Number(stateFilter) : undefined));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
              <MapPin className="h-3.5 w-3.5" /> Public Map
            </Badge>
            <span className="text-xs text-muted-foreground">Geographic Issue Discovery</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {selectedState ? `${selectedState.name} Civic Issue Map` : 'India Civic Issue Map'}
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Button>
          </Link>
          <Link href="/issues">
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              List View <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-border">
        <CardContent className="p-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* State */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">State / UT</Label>
              <Select value={stateFilter} onValueChange={handleStateChange}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All India" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All India (National)</SelectItem>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">District</Label>
              <Select
                value={districtFilter}
                onValueChange={setDistrictFilter}
                disabled={stateFilter === 'all' || loadingDistricts}
              >
                <SelectTrigger className="h-8 text-xs">
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

            {/* Category */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Severity</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Severities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  {ISSUE_SEVERITIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ISSUE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Legend & Count Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-muted/30 p-2.5 rounded-lg border">
        <div className="flex items-center gap-2 font-medium">
          <Layers className="h-4 w-4 text-primary" />
          <span>Showing <strong>{issues.length}</strong> mapped issues</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Low
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Medium
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> High
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical
          </div>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative h-[550px] w-full overflow-hidden rounded-xl border border-border shadow-sm bg-muted/10">
        <MapContainer issues={issues} />
      </div>
    </div>
  );
}
