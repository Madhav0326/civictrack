import Link from 'next/link';
import { MapPin, Shield, FileText, Users } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      {/* Top Footer Section */}
      <div className="container mx-auto max-w-7xl px-4 pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="font-bold tracking-tight text-foreground">CivicTrack</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A public civic accountability platform for India. Report, track, and verify issues in your community.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Platform</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Civic Dashboard</Link></li>
              <li><Link href="/issues" className="hover:text-foreground transition-colors">Browse Issues</Link></li>
              <li><Link href="/map" className="hover:text-foreground transition-colors">Civic Map</Link></li>
              <li><Link href="/report" className="hover:text-foreground transition-colors">Report an Issue</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/issues" className="hover:text-foreground transition-colors">Categories</Link></li>
              <li><Link href="/search" className="hover:text-foreground transition-colors">Search</Link></li>
              <li><Link href="/community-guidelines" className="hover:text-foreground transition-colors">Community Guidelines</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link></li>
              <li><Link href="/moderation-policy" className="hover:text-foreground transition-colors">Moderation Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Compact Bottom Bar */}
      <div className="border-t border-border/80 bg-muted/40 dark:bg-muted/20 py-5">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-[11px] leading-relaxed text-muted-foreground text-center md:text-left">
              <p>
                &copy; {new Date().getFullYear()} CivicTrack. A politically neutral civic accountability platform.
              </p>
              <p>
                This platform is not an emergency response service. For emergencies, contact the appropriate emergency services (112 in India).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground md:justify-end shrink-0">
              <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> Politically Neutral</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> Community Driven</span>
              <span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Evidence Based</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
