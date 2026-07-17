import type { MetadataRoute } from 'next'

// PWA manifest — makes Mantis installable on mobile home screens.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mantis',
    short_name: 'Mantis',
    description: 'Networking CRM — track people, companies, and follow-ups.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbfbf9',
    theme_color: '#2f6b4f',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }
}
