import Link from 'next/link';
import Image from 'next/image';
import NerdVibeathon from '../components/NerdVibeathon';
import HowItWorksShowcase from '../components/HowItWorksShowcase';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#140b07] text-[#f3e6dc] selection:bg-[#c4622d] selection:text-white">
      {/* Warm ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_25%,rgba(196,98,45,0.32),transparent_60%)]"
      />

      {/* Hero Section */}
      <section className="relative mx-auto flex min-h-[85vh] max-w-6xl flex-col-reverse items-center justify-center gap-12 px-6 py-16 md:py-24 md:flex-row md:justify-between md:gap-16">
        <div className="max-w-xl text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
            <span className="inline-block rounded-full border border-[#f3e6dc]/20 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-[#f3e6dc]/70">
              Vibeathon 2026 · Open Source
            </span>
            <span className="inline-block rounded-full border border-[#f3e6dc]/15 bg-[#1f120c] px-3 py-1 font-mono text-xs text-[#f3e6dc]/70">
              Gemini Live API + Flash
            </span>
          </div>

          <h1 className="text-4xl font-medium leading-tight tracking-tight md:text-6xl">
            ¿Te acordás de ALF?
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[#f3e6dc]/75 md:text-xl">
            Volvió en forma de <strong className="text-white font-semibold">Audio Live Feed (ALF)</strong>, un transcriptor open source para la
          </p>
          <NerdVibeathon className="mt-3 text-5xl md:text-7xl" />

          <div className="mt-8 flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <Link
              href="/watch"
              className="inline-flex items-center gap-3 rounded-full bg-[#f3e6dc] py-2.5 pl-6 pr-2.5 font-medium text-[#140b07] transition hover:bg-white shadow-[0_0_25px_rgba(243,230,220,0.2)] active:scale-95"
            >
              Ver subtítulos en vivo
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#140b07] text-[#f3e6dc]">
                →
              </span>
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-[#f3e6dc]/20 px-5 py-3 text-xs font-mono uppercase tracking-wider text-[#f3e6dc]/70 transition hover:border-[#f3e6dc]/50 hover:text-white"
            >
              Operadores
            </Link>

            <a
              href="#como-funciona"
              className="rounded-full border border-[#f3e6dc]/15 bg-[#f3e6dc]/5 px-4 py-3 font-mono text-xs text-[#f3e6dc]/80 hover:bg-[#f3e6dc]/15 transition"
            >
              ¿Cómo funciona? ↓
            </a>
          </div>
        </div>

        <div className="relative h-64 w-64 shrink-0 overflow-hidden rounded-full ring-1 ring-[#f3e6dc]/10 md:h-[26rem] md:w-[26rem] shadow-2xl">
          <Image
            src="/alf.png"
            alt="ALF - Audio Live Feed"
            fill
            priority
            sizes="(min-width: 768px) 26rem, 16rem"
            className="scale-125 object-cover"
          />
        </div>
      </section>

      {/* How it works & Showcase for Judges */}
      <HowItWorksShowcase />

      {/* Creator / Engineer Profile Section */}
      <section id="autor" className="relative z-10 mx-auto max-w-6xl px-6 py-16 text-[#f3e6dc]">
        <div className="overflow-hidden rounded-3xl border border-[#f3e6dc]/20 bg-gradient-to-br from-[#1f120c]/90 via-[#180d08]/80 to-[#120905]/95 p-8 md:p-12 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-4 ring-[#f3e6dc]/10">
                <Image
                  src="/foto_facundo.jpg"
                  alt="Facundo Flores - Ingeniero en Sistemas"
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>

              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
                    Creado por
                  </span>
                  <span className="rounded-full bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300">
                    Ingeniero en Sistemas
                  </span>
                </div>
                <h3 className="mt-1 text-2xl font-medium tracking-tight text-white md:text-3xl">
                  Facundo Flores
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#f3e6dc]/75 max-w-lg">
                  Creador y desarrollador de <strong className="text-white">ALF (Audio Live Feed)</strong> para la{' '}
                  <strong className="text-white">Vibeathon 2026</strong> de Nerdearla.
                  Ingeniero en Sistemas enfocado en arquitecturas distribuidas, IA generativa en tiempo real y aplicaciones de alto impacto.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col sm:flex-row items-center gap-4">
              <a
                href="https://www.linkedin.com/in/floresfacundo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#0077b5] px-6 py-3 font-medium text-white transition hover:bg-[#006097] shadow-[0_0_20px_rgba(0,119,181,0.3)] active:scale-95 text-xs font-mono tracking-wide"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span>Conectar en LinkedIn</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[#f3e6dc]/15 bg-[#0f0704] py-12 text-[#f3e6dc]/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <span className="font-mono text-xs uppercase tracking-wider text-[#f3e6dc]/90 font-bold">
              ALF (Audio Live Feed)
            </span>
            <span className="hidden sm:inline text-[#f3e6dc]/30">|</span>
            <span className="text-xs text-[#f3e6dc]/70">
              Creado por <strong className="text-white">Facundo Flores</strong> (Ingeniero en Sistemas)
            </span>
            <span className="hidden sm:inline text-[#f3e6dc]/30">|</span>
            <span className="text-xs">MIT License</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
            <a
              href="https://www.linkedin.com/in/floresfacundo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0077b5] hover:text-white transition font-medium"
            >
              LinkedIn ↗
            </a>
            <a
              href="#como-funciona"
              className="text-[#f3e6dc]/70 hover:text-white transition"
            >
              Arquitectura
            </a>
            <Link
              href="/watch"
              className="text-[#f3e6dc]/70 hover:text-white transition"
            >
              Salas en Vivo
            </Link>
            <Link
              href="/login"
              className="text-[#f3e6dc]/70 hover:text-white transition"
            >
              Consola Operadores
            </Link>
            <a
              href="https://github.com/facufedee/alf-transcription"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f3e6dc]/70 hover:text-white transition"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
