'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, FileUp, Loader2, MapPin, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { fetchCities, fetchDistricts, fetchLocalities, fetchSubcategories } from '@/lib/queries';
import { FREQUENCY_OPTIONS, ISSUE_SEVERITIES } from '@/lib/constants';
import type { Category, EvidenceType, GeoCity, GeoDistrict, GeoLocality, GeoState, IssueSeverity, LocationPrivacy, Subcategory } from '@/lib/types';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function evidenceTypeFor(file: File): EvidenceType | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf') return 'document';
  return null;
}

function idFrom(value: string) {
  return value === 'none' ? undefined : Number(value);
}

export function IssueReportForm({ categories, states }: { categories: Category[]; states: GeoState[] }) {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [localities, setLocalities] = useState<GeoLocality[]>([]);

  const [categoryId, setCategoryId] = useState<number>();
  const [subcategoryId, setSubcategoryId] = useState<number>();
  const [stateId, setStateId] = useState<number>();
  const [districtId, setDistrictId] = useState<number>();
  const [cityId, setCityId] = useState<number>();
  const [localityId, setLocalityId] = useState<number>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IssueSeverity>('medium');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [privacy, setPrivacy] = useState<LocationPrivacy>('approximate');
  const [dateStarted, setDateStarted] = useState('');
  const [frequency, setFrequency] = useState('');
  const [peopleAffected, setPeopleAffected] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingLocalities, setLoadingLocalities] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = categories.find((category) => category.id === categoryId);

  useEffect(() => {
    if (!categoryId) { setSubcategories([]); return; }
    fetchSubcategories(categoryId).then(setSubcategories).catch(() => setSubcategories([]));
  }, [categoryId]);

  useEffect(() => {
    setDistrictId(undefined);
    setCityId(undefined);
    setLocalityId(undefined);
    if (!stateId) {
      setDistricts([]);
      setCities([]);
      setLocalities([]);
      return;
    }
    setLoadingDistricts(true);
    setGeoError(null);
    fetchDistricts(stateId)
      .then((data) => {
        setDistricts(data);
      })
      .catch((err) => {
        setGeoError(err instanceof Error ? err.message : 'Failed to load districts.');
        setDistricts([]);
      })
      .finally(() => {
        setLoadingDistricts(false);
      });
  }, [stateId]);


  useEffect(() => {
    if (!districtId) {
      setCities([]);
      setCityId(undefined);
      setLocalities([]);
      setLocalityId(undefined);
      return;
    }
    setLoadingCities(true);
    setGeoError(null);
    fetchCities(districtId)
      .then((data) => {
        setCities(data);
      })
      .catch((err) => {
        setGeoError(err instanceof Error ? err.message : 'Failed to load cities.');
        setCities([]);
      })
      .finally(() => {
        setLoadingCities(false);
      });
  }, [districtId]);

  useEffect(() => {
    if (!cityId) {
      setLocalities([]);
      setLocalityId(undefined);
      return;
    }
    setLoadingLocalities(true);
    setGeoError(null);
    fetchLocalities(cityId)
      .then((data) => {
        setLocalities(data);
      })
      .catch((err) => {
        setGeoError(err instanceof Error ? err.message : 'Failed to load localities.');
        setLocalities([]);
      })
      .finally(() => {
        setLoadingLocalities(false);
      });
  }, [cityId]);

  const chooseFiles = useCallback((chosen: FileList | null) => {
    if (!chosen) return;
    const incoming = Array.from(chosen);
    if (files.length + incoming.length > MAX_FILES) { setError(`You can attach up to ${MAX_FILES} files.`); return; }
    for (const file of incoming) {
      if (!evidenceTypeFor(file)) { setError('Evidence must be an image, video, or PDF.'); return; }
      if (file.size > MAX_FILE_SIZE) { setError('Each evidence file must be 10 MB or smaller.'); return; }
    }
    setError(null);
    setFiles((current) => [...current, ...incoming]);
  }, [files.length]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) { router.push('/login?redirect=/report'); return; }
    if (!categoryId || !stateId || title.trim().length < 10 || description.trim().length < 30) {
      setError('Choose a category and state, use a title of at least 10 characters, and describe the issue in at least 30 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        user_id: user.id, category_id: categoryId, subcategory_id: subcategoryId ?? null,
        title: title.trim(), description: description.trim(), severity, status: 'reported',
        state_id: stateId, district_id: districtId ?? null, city_id: cityId ?? null, locality_id: localityId ?? null,
        address: address.trim() || null, pincode: pincode.trim() || null, location_privacy: privacy,
        date_started: dateStarted || null, frequency: frequency || null,
        people_affected_estimate: peopleAffected ? Number(peopleAffected) : null,
        reference_number: referenceNumber.trim() || null, is_sensitive: selectedCategory?.is_sensitive ?? false,
      })
      .select('id, public_id')
      .single();

    if (issueError || !issue) { setError(issueError?.message ?? 'Unable to create the issue.'); setSubmitting(false); return; }

    const uploadedPaths: string[] = [];
    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${user.id}/${issue.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('issue-evidence').upload(path, file, { contentType: file.type });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        const fileType = evidenceTypeFor(file);
        const { error: evidenceError } = await supabase.from('issue_evidence').insert({
          issue_id: issue.id, user_id: user.id, file_path: path, file_type: fileType,
          file_name: file.name, file_size: file.size,
        });
        if (evidenceError) throw evidenceError;
      }
      router.push(`/issues/${issue.public_id}`);
      router.refresh();
    } catch (uploadError) {
      if (uploadedPaths.length) await supabase.storage.from('issue-evidence').remove(uploadedPaths);
      setError(uploadError instanceof Error ? `Issue was created, but evidence could not be saved: ${uploadError.message}` : 'Issue was created, but evidence could not be saved.');
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="container mx-auto max-w-3xl px-4 py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <div className="container mx-auto max-w-xl px-4 py-12"><Card><CardHeader><CardTitle>Sign in to report an issue</CardTitle><CardDescription>Reporting is tied to an account so the community can follow up responsibly.</CardDescription></CardHeader><CardContent><Link href="/login?redirect=/report"><Button>Sign in to continue</Button></Link></CardContent></Card></div>;
  if (profile?.is_suspended || profile?.is_banned) return <div className="container mx-auto max-w-xl px-4 py-12"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Reporting is unavailable</AlertTitle><AlertDescription>Your account cannot submit new issues at this time.</AlertDescription></Alert></div>;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-8"><h1 className="text-3xl font-bold tracking-tight">Report a civic issue</h1><p className="mt-2 text-muted-foreground">Give your community a clear, factual record of the problem. Avoid personal accusations and private information.</p></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Unable to submit</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        {geoError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Location error</AlertTitle><AlertDescription>{geoError}</AlertDescription></Alert>}
        {selectedCategory?.is_sensitive && <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Sensitive issue</AlertTitle><AlertDescription>Keep this report factual. Do not name individuals or include personal information.</AlertDescription></Alert>}
        <Card><CardHeader><CardTitle>What happened?</CardTitle><CardDescription>Describe the issue clearly enough for others to identify and verify it.</CardDescription></CardHeader><CardContent className="space-y-4">
          <Field label="Issue title" htmlFor="title"><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} minLength={10} maxLength={160} placeholder="e.g. Large pothole on the main road near the bus stop" required /></Field>
          <Field label="Description" htmlFor="description"><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} minLength={30} maxLength={5000} rows={7} placeholder="What is the problem, when did you notice it, and how is it affecting people?" required /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><SelectField label="Category" value={categoryId ? String(categoryId) : 'none'} onValueChange={(value) => { setCategoryId(idFrom(value)); setSubcategoryId(undefined); }}><SelectItem value="none">Select a category</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectField><SelectField label="Subcategory (optional)" value={subcategoryId ? String(subcategoryId) : 'none'} onValueChange={(value) => setSubcategoryId(idFrom(value))} disabled={!categoryId}><SelectItem value="none">Select a subcategory</SelectItem>{subcategories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectField></div>
          <SelectField label="Severity" value={severity} onValueChange={(value) => setSeverity(value as IssueSeverity)}>{ISSUE_SEVERITIES.map((option) => <SelectItem key={option.value} value={option.value}>{option.label} — {option.description}</SelectItem>)}</SelectField>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Where is it?</CardTitle><CardDescription>Your exact address is optional. Choose how much location detail is public.</CardDescription></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="State / Union Territory"
              value={stateId ? String(stateId) : 'none'}
              onValueChange={(value) => {
                const newId = idFrom(value);
                setStateId(newId);
                setDistrictId(undefined);
                setCityId(undefined);
                setLocalityId(undefined);
              }}
            >
              <SelectItem value="none">Select a state / UT</SelectItem>
              {states.map((state) => (
                <SelectItem key={state.id} value={String(state.id)}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectField>

            <SelectField
              label="District (optional)"
              value={districtId ? String(districtId) : 'none'}
              onValueChange={(value) => {
                const newId = idFrom(value);
                setDistrictId(newId);
                setCityId(undefined);
                setLocalityId(undefined);
              }}
              disabled={!stateId || loadingDistricts}
            >
              {loadingDistricts ? (
                <SelectItem value="none" disabled>
                  Loading districts...
                </SelectItem>
              ) : !stateId ? (
                <SelectItem value="none" disabled>
                  Select a state first
                </SelectItem>
              ) : districts.length === 0 ? (
                <SelectItem value="none" disabled>
                  No districts recorded for this state
                </SelectItem>
              ) : (
                <>
                  <SelectItem value="none">Select a district</SelectItem>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={String(district.id)}>
                      {district.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectField>

            <SelectField
              label="City / Town (optional)"
              value={cityId ? String(cityId) : 'none'}
              onValueChange={(value) => {
                const newId = idFrom(value);
                setCityId(newId);
                setLocalityId(undefined);
              }}
              disabled={!districtId || loadingCities}
            >
              {loadingCities ? (
                <SelectItem value="none" disabled>
                  Loading cities...
                </SelectItem>
              ) : !districtId ? (
                <SelectItem value="none" disabled>
                  Select a district first
                </SelectItem>
              ) : cities.length === 0 ? (
                <SelectItem value="none" disabled>
                  No cities recorded for this district
                </SelectItem>
              ) : (
                <>
                  <SelectItem value="none">Select a city / town</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={String(city.id)}>
                      {city.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectField>

            <SelectField
              label="Locality / Area (optional)"
              value={localityId ? String(localityId) : 'none'}
              onValueChange={(value) => setLocalityId(idFrom(value))}
              disabled={!cityId || loadingLocalities}
            >
              {loadingLocalities ? (
                <SelectItem value="none" disabled>
                  Loading localities...
                </SelectItem>
              ) : !cityId ? (
                <SelectItem value="none" disabled>
                  Select a city first
                </SelectItem>
              ) : localities.length === 0 ? (
                <SelectItem value="none" disabled>
                  No localities recorded for this city
                </SelectItem>
              ) : (
                <>
                  <SelectItem value="none">Select a locality / area</SelectItem>
                  {localities.map((locality) => (
                    <SelectItem key={locality.id} value={String(locality.id)}>
                      {locality.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectField>
          </div>
          <Field label="Address or landmark (optional)" htmlFor="address"><Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="PIN code (optional)" htmlFor="pincode"><Input id="pincode" inputMode="numeric" value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={10} /></Field><SelectField label="Location privacy" value={privacy} onValueChange={(value) => setPrivacy(value as LocationPrivacy)}><SelectItem value="exact">Show exact location</SelectItem><SelectItem value="approximate">Show approximate area</SelectItem><SelectItem value="area_only">Show area only</SelectItem></SelectField></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Helpful details</CardTitle><CardDescription>Optional information that makes the report easier to understand and verify.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="When did this start?" htmlFor="date-started"><Input id="date-started" type="date" value={dateStarted} onChange={(e) => setDateStarted(e.target.value)} /></Field><SelectField label="How often does it occur?" value={frequency || 'none'} onValueChange={(value) => setFrequency(value === 'none' ? '' : value)}><SelectItem value="none">Select frequency</SelectItem>{FREQUENCY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectField><Field label="Estimated people affected" htmlFor="people-affected"><Input id="people-affected" type="number" min="0" value={peopleAffected} onChange={(e) => setPeopleAffected(e.target.value)} /></Field><Field label="Reference number (optional)" htmlFor="reference"><Input id="reference" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} maxLength={100} /></Field></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Evidence</CardTitle><CardDescription>Attach up to {MAX_FILES} images, videos, or PDFs (10 MB each). Evidence is public with the issue.</CardDescription></CardHeader><CardContent className="space-y-3"><Label htmlFor="evidence" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:bg-secondary"><FileUp className="h-5 w-5" />Choose files<Input id="evidence" type="file" className="hidden" accept="image/*,video/*,application/pdf" multiple onChange={(e) => { chooseFiles(e.target.files); e.target.value = ''; }} /></Label>{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm"><span className="truncate">{file.name}</span><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X className="h-4 w-4" /></Button></div>)}</CardContent></Card>
        <div className="flex items-center justify-end gap-3"><Link href="/issues"><Button type="button" variant="outline">Cancel</Button></Link><Button type="submit" disabled={submitting}>{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Submit issue</>}</Button></div>
      </form>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) { return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>; }

function SelectField({ label, value, onValueChange, children, disabled }: { label: string; value: string; onValueChange: (value: string) => void; children: React.ReactNode; disabled?: boolean }) { return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onValueChange} disabled={disabled}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>; }

