import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JobPulse — Live Job Discovery & Application Tracker',
    short_name: 'JobPulse',
    description:
      'Track job applications, manage your PDF CV vault, and discover live Bangladesh & International Remote roles. Created by Gazi Asif Imtiaz.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
