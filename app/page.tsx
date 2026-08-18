import Link from 'next/link';
import { ArrowRight, Users, CheckCircle2, Clock, AlertCircle, TrendingUp, FileSearch, MapPin, Lightbulb, ShieldCheck, Eye, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { formatNumber, formatPercentage } from '@/lib/format';

async function getStats() {
  const { count: total } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .eq('is_hidden', false);

  const { count: resolved } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'resolved')
    .eq('is_hidden', false);

  const { count: inProgress } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .in('status', ['in_progress', 'acknowledged', 'under_review'])
    .eq('is_hidden', false);

  const { count: pending } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .in('status', ['reported', 'reopened'])
    .eq('is_hidden', false);

  const { count: citizens } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_banned', false);

  const totalNum = total ?? 0;
  const resolvedNum = resolved ?? 0;
  const resolutionRate = totalNum > 0 ? (resolvedNum / totalNum) * 100 : 0;

  return {
    total: totalNum,
    resolved: resolvedNum,
    inProgress: inProgress ?? 0,
    pending: pending ?? 0,
    citizens: citizens ?? 0,
    resolutionRate,
  };
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Politically neutral · Community driven · Evidence based</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-balance md:text-6xl">
              See the problems. Track the progress.
              <br />
              <span className="text-primary">Know what is happening in your area.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
              A public platform where citizens can report government-related issues, support issues
              affecting their community, share evidence and solutions, and track progress toward resolution.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/report">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Report an Issue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/issues">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                  <FileSearch className="h-4 w-4" />
                  Explore Issues
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="ghost" className="gap-2 w-full sm:w-auto">
                  <TrendingUp className="h-4 w-4" />
                  View Civic Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="border-y border-border bg-secondary/20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={FileSearch} label="Issues Reported" value={formatNumber(stats.total)} />
            <StatCard icon={CheckCircle2} label="Resolved" value={formatNumber(stats.resolved)} color="text-emerald-600" />
            <StatCard icon={Clock} label="In Progress" value={formatNumber(stats.inProgress)} color="text-cyan-600" />
            <StatCard icon={AlertCircle} label="Pending" value={formatNumber(stats.pending)} color="text-amber-600" />
            <StatCard icon={Users} label="Citizens" value={formatNumber(stats.citizens)} />
            <StatCard icon={TrendingUp} label="Resolution Rate" value={formatPercentage(stats.resolutionRate)} color="text-emerald-600" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">How CivicTrack Works</h2>
          <p className="mt-3 text-muted-foreground">
            Don't just report the problem. Track what happens to it.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-5">
          {[
            { icon: FileSearch, title: 'Report', desc: 'Citizens report civic issues with location and evidence.' },
            { icon: Users, title: 'Community', desc: 'Others confirm they are affected and add information.' },
            { icon: Eye, title: 'Track', desc: 'Follow the issue through its lifecycle with full transparency.' },
            { icon: CheckCircle2, title: 'Resolve', desc: 'Issues are marked resolved and citizens verify the outcome.' },
            { icon: Vote, title: 'Verify', desc: 'Community verification ensures resolutions are real.' },
          ].map((step, i) => (
            <div key={step.title} className="relative">
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Step {i + 1}</div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-border bg-secondary/20">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">What You Can Report</h2>
            <p className="mt-3 text-muted-foreground">
              From potholes to pension delays, from water supply to integrity concerns.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: 'Building2', title: 'Infrastructure', desc: 'Roads, potholes, streetlights, drainage, water supply, garbage, public transport.' },
              { icon: 'Landmark', title: 'Government Services', desc: 'Hospitals, schools, ration/PDS, pensions, certificates, licenses.' },
              { icon: 'Clock', title: 'Administrative Problems', desc: 'Delays, unprocessed applications, repeated visits, missing responses.' },
              { icon: 'Users', title: 'Public Service Experience', desc: 'Unprofessional behaviour, refusal of service, misleading information.' },
              { icon: 'ShieldAlert', title: 'Integrity Concerns', desc: 'Allegations of bribe demands, misuse of resources, irregularities. Reported as allegations, not facts.' },
              { icon: 'MapPin', title: 'Location-Based', desc: 'Every issue is mapped to a state, district, city, and locality across India.' },
            ].map((cat) => (
              <Card key={cat.title}>
                <CardContent className="p-6">
                  <h3 className="font-semibold">{cat.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{cat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/issues">
              <Button variant="outline">Browse Issues by Category</Button>
            </Link>
          </div>

        </div>
      </section>

      {/* Principles */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Our Principles</h2>
          <p className="mt-3 text-muted-foreground">
            A structured civic information platform, not a social network for complaining.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: FileSearch, title: 'Evidence over Outrage', desc: 'Every issue is backed by evidence, not just emotion.' },
            { icon: Users, title: 'Issues over Personalities', desc: 'We focus on problems and solutions, not personal attacks.' },
            { icon: Vote, title: 'Verification over Rumours', desc: 'Community verification ensures resolutions are real.' },
            { icon: Lightbulb, title: 'Solutions over Complaints', desc: 'Citizens can propose practical solutions to issues.' },
            { icon: ShieldCheck, title: 'Transparency over Bias', desc: 'Politically neutral. No party promotion or attacks.' },
            { icon: CheckCircle2, title: 'Resolution over Engagement', desc: 'We measure success by issues resolved, not clicks.' },
          ].map((principle) => (
            <div key={principle.title} className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <principle.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{principle.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{principle.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary/5">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Start tracking what is happening in your area</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Browse issues, explore the dashboard, or report a problem you have noticed. Your report could help your entire community.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/report">
              <Button size="lg" className="gap-2">
                Report an Issue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">View Civic Dashboard</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 text-center">
        <Icon className={`mx-auto mb-2 h-5 w-5 ${color ?? 'text-primary'}`} />
        <div className={`text-2xl font-bold ${color ?? ''}`}>{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
