import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CivicTrack — Report, Track, and Resolve Civic Issues Across India',
  description:
    'A public platform where citizens can report government-related issues, support issues affecting their community, share evidence and solutions, and track progress toward resolution.',
  openGraph: {
    title: 'CivicTrack — Report, Track, and Resolve Civic Issues Across India',
    description:
      'See the problems. Track the progress. Know what is happening in your area.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivicTrack — Civic Accountability Platform for India',
    description:
      'See the problems. Track the progress. Know what is happening in your area.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
