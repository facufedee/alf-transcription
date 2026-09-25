import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'ALF (Audio Live Feed) — Transcripción y Traducción en Tiempo Real',
  description:
    'ALF (Audio Live Feed) — Transcripción y traducción en tiempo real para conferencias masivas (Nerdearla 2026), impulsado por Gemini Live API y Gemini Flash.',
  keywords: [
    'ALF',
    'Audio Live Feed',
    'transcription',
    'conference',
    'real-time',
    'accessibility',
    'nerdearla',
    'gemini-live',
  ],
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
