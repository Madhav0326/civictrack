'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IssueCard } from '@/components/issues/issue-card';
import { Search, Loader2, Filter, X, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchDistricts } from '@/lib/queries';
import type { Issue, Category, GeoState, GeoDistrict } from '@/lib/types';
import { ISSUE_STATUSES, ISSUE_SEVERITIES } from '@/lib/constants';

interface PublicSearchViewProps {
  categories: Category[];
  states: GeoState[];
  searchParams: { [key: string]: string | string[] | undefined };
}

export function PublicSearchView({ categories, states, searchParams }: PublicSearchViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>(
    typeof searchParams.q === 'string' ? searchParams.q : typeof searchParams.search === 'string' ? searchParams.search : ''
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    typeof searchParams.status === 'string' ? searchParams.status : 'all'
  );
  const [severityFilter, setSeverityFilter] = useState<string>(
    typeof searchParams.severity === 'string' ? searchParams.severity : 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(
    typeof searchParams.category === 'string' ? searchParams.category : 'all'
  );
  const [stateFilter, setStateFilter] = useState<string>(
    typeof searchParams.state === 'string' ? searchParams.state : 'all'
  );
  const [districtFilter, setDistrictFilter] = useState<string>(
    typeof searchParams.district === 'string' ? searchParams.district : 'all'
  );

  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

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

  const executeSearch = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('issues')
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*),
        state:geo_states(*),
        district:geo_districts(*),
        city:geo_cities(*),
        locality:geo_localities(*)
      `)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (searchTerm.trim()) {
      const term = searchTerm.trim();
      query = query.or(`public_id.ilike.%${term}%,title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (severityFilter !== 'all') {
      query = query.eq('severity', severityFilter);
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

    const { data } = await query.limit(50);
    setIssues((data ?? []) as Issue[]);
    setLoading(false);
  }, [searchTerm, statusFilter, severityFilter, categoryFilter, stateFilter, districtFilter]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Civic Issues</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search reported public issues by ID (e.g. CIV-AP-000001), keywords, location, or status.
        </p>
      </div>

      {/* Search & Filter Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by Public Issue ID (e.g. CIV-AP-000001), keywords, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 pt-2">
            {/* Status */}
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {ISSUE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-1">
              <Label className="text-xs">Severity</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All severities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  {ISSUE_SEVERITIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
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
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All states" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
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
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={loadingDistricts ? 'Loading...' : 'All districts'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All districts</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Search Results ({issues.length})</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Searching public issues...
          </div>
        ) : issues.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground space-y-2">
            <Search className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm font-medium">No public issues found matching your search parameters.</p>
            <p className="text-xs">Try broadening your search term or clearing location and status filters.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
