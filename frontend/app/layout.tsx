import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'ALF - Real-time Conference Transcription',
  description:
    'Alien Live Feed - Real-time transcription for live conferences with instant subtitles in multiple languages',
  keywords: ['transcription', 'conference', 'real-time', 'accessibility'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
