import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'JobPulse — Live Job Discovery (BDJobs, LinkedIn & Remote) & Application Tracker',
    template: '%s | JobPulse',
  },
  description:
    'All-in-one job application tracker, PDF CV vault, smart URL clipper, and real-time job discovery engine for Bangladesh (LinkedIn BD & BDJobs) and International Remote roles. Created by Gazi Asif Imtiaz.',
  keywords: [
    'JobPulse',
    'job tracker',
    'job application tracker',
    'Bangladesh jobs',
    'BDJobs aggregator',
    'LinkedIn Bangladesh jobs',
    'remote jobs Bangladesh',
    'international remote jobs',
    'CV vault',
    'resume manager',
    'kanban job tracker',
    'Gazi Asif Imtiaz',
    't14z',
  ],
  authors: [{ name: 'Gazi Asif Imtiaz', url: 'https://t14z.vercel.app' }],
  creator: 'Gazi Asif Imtiaz',
  publisher: 'Gazi Asif Imtiaz',
  applicationName: 'JobPulse',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'JobPulse',
    title: 'JobPulse — Live Job Discovery & Application Pipeline Tracker',
    description:
      'Discover live Bangladesh (LinkedIn & BDJobs) and International Remote jobs, store your PDF CVs, and track every application in one place. Built by Gazi Asif Imtiaz.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobPulse — Live Job Discovery & Application Tracker',
    description:
      'Real-time Bangladesh & International Remote job aggregator, CV Vault, and Kanban application tracker by Gazi Asif Imtiaz.',
    creator: '@t14z',
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%2318181b'/%3E%3Cpath d='M22 54h16l10-24 12 40 10-16h8' stroke='%23ffffff' stroke-width='8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'JobPulse',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'All-in-one job application tracker, CV vault, and real-time job discovery platform for Bangladesh (LinkedIn BD & BDJobs) and International Remote roles.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Person',
    name: 'Gazi Asif Imtiaz',
    url: 'https://t14z.vercel.app',
  },
  creator: {
    '@type': 'Person',
    name: 'Gazi Asif Imtiaz',
    url: 'https://t14z.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen font-sans selection:bg-zinc-900/15 selection:text-zinc-900 dark:selection:bg-zinc-100/20 dark:selection:text-zinc-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
