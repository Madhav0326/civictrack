'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Category, GeoState, GeoDistrict } from '@/lib/types';
import { ISSUE_STATUSES, ISSUE_SEVERITIES } from '@/lib/constants';
import { fetchDistricts } from '@/lib/queries';

interface Props {
  categories: Category[];
  states: GeoState[];
  currentSort: string;
  currentStatus: string;
  currentSeverity: string;
  currentCategory?: number;
  currentState?: number;
  currentDistrict?: number;
  currentSearch?: string;
  onFilterChange: (updates: Record<string, string | undefined>) => void;
}

export function IssueFeedFilters({
  categories,
  states,
  currentSort,
  currentStatus,
  currentSeverity,
  currentCategory,
  currentState,
  currentDistrict,
  currentSearch,
  onFilterChange,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(currentSearch ?? '');
  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    if (!currentState) {
      setDistricts([]);
      return;
    }
    setLoadingDistricts(true);
    fetchDistricts(currentState)
      .then((data) => setDistricts(data))
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, [currentState]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onFilterChange({ q: searchInput || undefined });
    },
    [searchInput, onFilterChange]
  );

  const hasActiveFilters =
    currentStatus !== 'all' ||
    currentSeverity !== 'all' ||
    currentCategory ||
    currentState ||
    currentDistrict ||
    currentSearch;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by issue title, ID (e.g. CIV-AP-000001), or keyword..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </form>
        <div className="flex items-center gap-2">
          <Select value={currentSort} onValueChange={(v) => onFilterChange({ sort: v })}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="most_supported">Most Supported</SelectItem>
              <SelectItem value="most_discussed">Most Discussed</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="longest_unresolved">Longest Unresolved</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="grid gap-3 rounded-lg border border-border bg-secondary/30 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={currentStatus} onValueChange={(v) => onFilterChange({ status: v })}>
              <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ISSUE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Severity</Label>
            <Select value={currentSeverity} onValueChange={(v) => onFilterChange({ severity: v })}>
              <SelectTrigger><SelectValue placeholder="All severities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                {ISSUE_SEVERITIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select
              value={currentCategory ? String(currentCategory) : 'all'}
              onValueChange={(v) => onFilterChange({ category: v === 'all' ? undefined : v })}
            >
              <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">State / UT</Label>
            <Select
              value={currentState ? String(currentState) : 'all'}
              onValueChange={(v) =>
                onFilterChange({
                  state: v === 'all' ? undefined : v,
                  district: undefined,
                })
              }
            >
              <SelectTrigger><SelectValue placeholder="All states" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">District</Label>
            <Select
              value={currentDistrict ? String(currentDistrict) : 'all'}
              onValueChange={(v) => onFilterChange({ district: v === 'all' ? undefined : v })}
              disabled={!currentState || loadingDistricts}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingDistricts ? 'Loading...' : 'All districts'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All districts</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <div className="sm:col-span-2 lg:col-span-5 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onFilterChange({
                    status: undefined,
                    severity: undefined,
                    category: undefined,
                    state: undefined,
                    district: undefined,
                    q: undefined,
                  })
                }
                className="gap-1 text-xs"
              >
                <X className="h-3 w-3" /> Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
