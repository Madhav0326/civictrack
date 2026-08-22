'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertCircle, FileUp, X, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { updateIssue, fetchDistricts, fetchCities, fetchLocalities } from '@/lib/queries';
import type { Issue, Category, Subcategory, GeoState, GeoDistrict, GeoCity, GeoLocality, IssueSeverity, LocationPrivacy, EvidenceType } from '@/lib/types';

const ISSUE_SEVERITIES: { value: IssueSeverity; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Minor inconvenience' },
  { value: 'medium', label: 'Medium', description: 'Noticeable problem affecting daily life' },
  { value: 'high', label: 'High', description: 'Significant hazard or major disruption' },
  { value: 'critical', label: 'Critical', description: 'Immediate threat to public safety or health' },
];

const FREQUENCY_OPTIONS = ['One-time occurrence', 'Occurs daily', 'Occurs weekly', 'Occurs monthly', 'Continuous problem'];

function evidenceTypeFor(file: File): EvidenceType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'document';
}

function idFrom(value: string): number | undefined {
  if (!value || value === 'none') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

interface EditIssueDialogProps {
  issue: Issue;
  categories: Category[];
  states: GeoState[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssueUpdated: (updated: Issue) => void;
}

export function EditIssueDialog({
  issue,
  categories,
  states,
  open,
  onOpenChange,
  onIssueUpdated,
}: EditIssueDialogProps) {
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [severity, setSeverity] = useState<IssueSeverity>(issue.severity);
  const [categoryId, setCategoryId] = useState<number | undefined>(issue.category_id);
  const [subcategoryId, setSubcategoryId] = useState<number | undefined>(issue.subcategory_id ?? undefined);

  // Geo states
  const [stateId, setStateId] = useState<number | undefined>(issue.state_id ?? undefined);
  const [districtId, setDistrictId] = useState<number | undefined>(issue.district_id ?? undefined);
  const [cityId, setCityId] = useState<number | 'other' | undefined>(
    issue.city_id ?? (issue.custom_city ? 'other' : undefined)
  );
  const [customCity, setCustomCity] = useState(issue.custom_city ?? '');
  const [localityId, setLocalityId] = useState<number | 'other' | undefined>(
    issue.locality_id ?? (issue.custom_locality ? 'other' : undefined)
  );
  const [customLocality, setCustomLocality] = useState(issue.custom_locality ?? '');

  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [localities, setLocalities] = useState<GeoLocality[]>([]);

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingLocalities, setLoadingLocalities] = useState(false);

  const [address, setAddress] = useState(issue.address ?? '');
  const [pincode, setPincode] = useState(issue.pincode ?? '');
  const [privacy, setPrivacy] = useState<LocationPrivacy>(issue.location_privacy ?? 'exact');

  const [dateStarted, setDateStarted] = useState(issue.date_started ?? '');
  const [frequency, setFrequency] = useState(issue.frequency ?? '');
  const [peopleAffected, setPeopleAffected] = useState(
    issue.people_affected_estimate ? String(issue.people_affected_estimate) : ''
  );
  const [referenceNumber, setReferenceNumber] = useState(issue.reference_number ?? '');

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subcategories: Subcategory[] = (selectedCategory as any)?.subcategories ?? [];

  // Load dependent districts
  useEffect(() => {
    if (!stateId) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setLoadingDistricts(true);
    fetchDistricts(stateId)
      .then((data) => {
        if (!cancelled) setDistricts(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stateId]);

  // Load dependent cities
  useEffect(() => {
    if (!districtId) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingCities(true);
    fetchCities(districtId)
      .then((data) => {
        if (!cancelled) setCities(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });
    return () => {
      cancelled = true;
    };
  }, [districtId]);

  // Load dependent localities
  useEffect(() => {
    if (!cityId || typeof cityId !== 'number') {
      setLocalities([]);
      return;
    }
    let cancelled = false;
    setLoadingLocalities(true);
    fetchLocalities(cityId)
      .then((data) => {
        if (!cancelled) setLocalities(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingLocalities(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 10) {
      setError('Title must be at least 10 characters long.');
      return;
    }

    if (description.trim().length < 30) {
      setError('Description must be at least 30 characters long.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    setLoading(true);

    try {
      // 1. Update issue record
      const updated = await updateIssue(issue.id, {
        title: title.trim(),
        description: description.trim(),
        severity,
        category_id: categoryId,
        subcategory_id: subcategoryId ?? null,
        state_id: stateId ?? null,
        district_id: districtId ?? null,
        city_id: typeof cityId === 'number' ? cityId : null,
        custom_city: cityId === 'other' ? (customCity.trim() || null) : null,
        locality_id: typeof localityId === 'number' ? localityId : null,
        custom_locality: localityId === 'other' || customLocality.trim() ? (customLocality.trim() || null) : null,
        address: address.trim() || null,
        pincode: pincode.trim() || null,
        date_started: dateStarted || null,
        frequency: frequency || null,
        people_affected_estimate: peopleAffected ? Number(peopleAffected) : null,
      });


      // 2. Upload any additional evidence files
      if (newFiles.length > 0) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        if (userId) {
          for (const file of newFiles) {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${userId}/${issue.id}/${crypto.randomUUID()}-${safeName}`;

            const { error: uploadErr } = await supabase.storage
              .from('issue-evidence')
              .upload(path, file, { contentType: file.type });

            if (uploadErr) throw uploadErr;

            const fileType = evidenceTypeFor(file);
            await supabase.from('issue_evidence').insert({
              issue_id: issue.id,
              user_id: userId,
              file_path: path,
              file_type: fileType,
              file_name: file.name,
              file_size: file.size,
            });
          }
        }
      }

      onIssueUpdated(updated);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message ?? 'Failed to update issue.');
    } finally {
      setLoading(false);
    }
  };

  const remainingEdits = Math.max(0, 3 - (issue.edit_count ?? 0));
  const isLimitedEdit = ['under_review', 'acknowledged', 'reopened'].includes(issue.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Issue Details</DialogTitle>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {remainingEdits} {remainingEdits === 1 ? 'edit' : 'edits'} remaining
            </span>
          </div>
          <DialogDescription>
            Update permitted details for issue {issue.public_id}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLimitedEdit && (
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <AlertDescription>
                This issue is currently under authority review. Core routing fields (title, category, location) are locked to maintain department assignment.
              </AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Issue Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={10}
              maxLength={160}
              disabled={isLimitedEdit}
              required
            />
          </div>


          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minLength={30}
              maxLength={5000}
              rows={5}
              required
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={categoryId ? String(categoryId) : 'none'}
                onValueChange={(val) => {
                  setCategoryId(idFrom(val));
                  setSubcategoryId(undefined);
                }}
                disabled={isLimitedEdit}
              >
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select
                value={severity}
                onValueChange={(val) => setSeverity(val as IssueSeverity)}
                disabled={isLimitedEdit}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ISSUE_SEVERITIES.map((sev) => (
                    <SelectItem key={sev.value} value={sev.value}>
                      {sev.label} — {sev.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Geography Hierarchy */}
          <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Location Hierarchy
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">State / UT</Label>
                <Select
                  value={stateId ? String(stateId) : 'none'}
                  onValueChange={(val) => {
                    setStateId(idFrom(val));
                    setDistrictId(undefined);
                    setCityId(undefined);
                    setLocalityId(undefined);
                  }}
                  disabled={isLimitedEdit}
                >

                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select state / UT</SelectItem>
                    {states.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">District</Label>
                <Select
                  value={districtId ? String(districtId) : 'none'}
                  onValueChange={(val) => {
                    setDistrictId(idFrom(val));
                    setCityId(undefined);
                    setLocalityId(undefined);
                  }}
                  disabled={!stateId || loadingDistricts}
                >
                  <SelectTrigger><SelectValue placeholder={loadingDistricts ? 'Loading...' : 'Select district'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select district</SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">City / Town</Label>
                <Select
                  value={cityId === 'other' ? 'other' : cityId ? String(cityId) : 'none'}
                  onValueChange={(val) => {
                    if (val === 'other') {
                      setCityId('other' as any);
                    } else {
                      setCityId(idFrom(val));
                    }
                    setLocalityId(undefined);
                  }}
                  disabled={!districtId || loadingCities}
                >
                  <SelectTrigger><SelectValue placeholder={loadingCities ? 'Loading...' : 'Select city'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select city</SelectItem>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                    <SelectItem value="other">Other / Not listed...</SelectItem>
                  </SelectContent>
                </Select>
                {cityId === ('other' as any) && (
                  <Input
                    placeholder="Enter City / Town name"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    className="mt-1 text-xs"
                  />
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Locality / Area</Label>
                <Select
                  value={localityId === 'other' ? 'other' : localityId ? String(localityId) : 'none'}
                  onValueChange={(val) => {
                    if (val === 'other') {
                      setLocalityId('other' as any);
                    } else {
                      setLocalityId(idFrom(val));
                    }
                  }}
                  disabled={!cityId || loadingLocalities}
                >
                  <SelectTrigger><SelectValue placeholder={loadingLocalities ? 'Loading...' : 'Select locality'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select locality</SelectItem>
                    {localities.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                    ))}
                    <SelectItem value="other">Other / Not listed...</SelectItem>
                  </SelectContent>
                </Select>
                {localityId === ('other' as any) && (
                  <Input
                    placeholder="Enter Locality / Area name"
                    value={customLocality}
                    onChange={(e) => setCustomLocality(e.target.value)}
                    className="mt-1 text-xs"
                  />
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="edit-address">Address / Landmark</Label>
                <Input
                  id="edit-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs" htmlFor="edit-pincode">PIN Code</Label>
                <Input
                  id="edit-pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Details & Additional Evidence */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-date-started">When did it start?</Label>
              <Input
                id="edit-date-started"
                type="date"
                value={dateStarted}
                onChange={(e) => setDateStarted(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-people-affected">Estimated People Affected</Label>
              <Input
                id="edit-people-affected"
                type="number"
                min="0"
                value={peopleAffected}
                onChange={(e) => setPeopleAffected(e.target.value)}
              />
            </div>
          </div>

          {/* Additional Evidence Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Add Additional Evidence</Label>
            <Label
              htmlFor="edit-evidence-upload"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-xs text-muted-foreground hover:bg-secondary"
            >
              <FileUp className="h-4 w-4" />
              <span>Choose new images, videos, or documents</span>
              <Input
                id="edit-evidence-upload"
                type="file"
                className="hidden"
                accept="image/*,video/*,application/pdf"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length) {
                    setNewFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    e.target.value = '';
                  }
                }}
              />
            </Label>

            {newFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between rounded bg-secondary px-3 py-1.5 text-xs">
                <span className="truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
