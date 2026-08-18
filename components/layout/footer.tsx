import Link from 'next/link';
import { MapPin, Shield, FileText, Users } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="font-bold">CivicTrack</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              A public civic accountability platform for India. Report, track, and verify issues in your community.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Platform</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/issues" className="hover:text-foreground">Browse Issues</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground">Civic Dashboard</Link></li>
              <li><Link href="/map" className="hover:text-foreground">Civic Map</Link></li>
              <li><Link href="/report" className="hover:text-foreground">Report an Issue</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Resources</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/categories" className="hover:text-foreground">Categories</Link></li>
              <li><Link href="/search" className="hover:text-foreground">Search</Link></li>
              <li><Link href="/community-guidelines" className="hover:text-foreground">Community Guidelines</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms of Use</Link></li>
              <li><Link href="/moderation-policy" className="hover:text-foreground">Moderation Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} CivicTrack. A politically neutral civic accountability platform.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Politically Neutral</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Community Driven</span>
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Evidence Based</span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground sm:text-left">
            This platform is not an emergency response service. For emergencies, contact the appropriate emergency services (112 in India).
          </p>
        </div>
      </div>
    </footer>
  );
}
