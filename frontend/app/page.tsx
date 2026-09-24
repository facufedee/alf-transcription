import Link from 'next/link';
import Image from 'next/image';
import NerdVibeathon from '../components/NerdVibeathon';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#140b07] text-[#f3e6dc]">
      {/* Warm glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,rgba(196,98,45,0.35),transparent_60%)]"
      />

      <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col-reverse items-center justify-center gap-12 px-6 py-16 md:flex-row md:justify-between md:gap-16">
        <div className="max-w-xl text-center md:text-left">
          <span className="mb-6 inline-block rounded-full border border-[#f3e6dc]/20 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-[#f3e6dc]/70">
            Vibeathon 2026 · Open source
          </span>

          <h1 className="text-4xl font-medium leading-tight tracking-tight md:text-6xl">
            ¿Te acordás de ALF?
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[#f3e6dc]/75 md:text-xl">
            Volvió en forma de transcriptor open source para la
          </p>
          <NerdVibeathon className="mt-3 text-5xl md:text-7xl" />

          <div className="mt-10 flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <Link
              href="/watch"
              className="inline-flex items-center gap-3 rounded-full bg-[#f3e6dc] py-2 pl-6 pr-2 font-medium text-[#140b07] transition hover:bg-white"
            >
              Ver subtítulos en vivo
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#140b07] text-[#f3e6dc]">
                →
              </span>
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-[#f3e6dc]/20 px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-[#f3e6dc]/70 transition hover:border-[#f3e6dc]/50 hover:text-white"
            >
              Operadores
            </Link>
          </div>
        </div>

        <div className="relative h-64 w-64 shrink-0 overflow-hidden rounded-full ring-1 ring-[#f3e6dc]/10 md:h-[26rem] md:w-[26rem]">
          <Image
            src="/alf.png"
            alt="ALF"
            fill
            priority
            sizes="(min-width: 768px) 26rem, 16rem"
            className="scale-125 object-cover"
          />
        </div>
      </section>
    </main>
  );
}
