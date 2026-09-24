import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BACKEND_URL } from '@/lib/config';

interface Stage {
  id: string;
  name: string;
  sourceLang: 'en' | 'es';
  live: boolean;
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  // Fetch stages from backend or fallback to defaults
  let stages: Stage[] = [
    { id: 'sala-1', name: 'Escenario Principal (Main Stage)', sourceLang: 'en', live: false },
    { id: 'sala-2', name: 'Escenario 2 (Workshop Room)', sourceLang: 'es', live: false },
  ];

  try {
    const res = await fetch(`${BACKEND_URL}/stages`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        stages = data;
      }
    }
  } catch {
    // Backend offline or starting up; fallback is used
  }

  return (
    <main className="min-h-screen bg-[#140b07] text-[#f3e6dc] p-6 md:p-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 border-b border-[#f3e6dc]/15 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#f3e6dc]/60">
              ALF · Control Room
            </span>
            <h1 className="mt-1 text-3xl font-medium tracking-tight">Panel de Operación</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-xs">
              <p className="font-medium text-[#f3e6dc]">{session.user.name || 'Operador'}</p>
              <p className="text-[#f3e6dc]/60">{session.user.email}</p>
            </div>

            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="rounded-full border border-[#f3e6dc]/20 px-4 py-1.5 text-xs font-medium text-[#f3e6dc]/80 transition hover:border-[#f3e6dc]/50 hover:text-white"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>

        {/* Stage List to operate */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-[#f3e6dc]">Escenarios Disponibles</h2>
              <p className="mt-1 text-xs text-[#f3e6dc]/60">
                Seleccioná una sala para abrir la consola de transmisión de audio hacia Gemini Live.
              </p>
            </div>
            <Link
              href="/watch"
              className="rounded-full border border-[#f3e6dc]/20 bg-[#f3e6dc]/5 px-4 py-2 font-mono text-xs text-[#f3e6dc]/80 hover:text-white hover:bg-[#f3e6dc]/10 transition"
            >
              Ver vista de audiencia (/watch) ↗
            </Link>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex flex-col justify-between rounded-3xl border border-[#f3e6dc]/15 bg-[#1f120c]/70 p-6 backdrop-blur-sm transition hover:border-[#f3e6dc]/30"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#f3e6dc]/50">
                      ID: {stage.id}
                    </span>
                    {stage.live ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/80 border border-red-500/40 px-3 py-1 font-mono text-xs font-medium text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        EN VIVO
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#f3e6dc]/5 border border-[#f3e6dc]/10 px-3 py-1 font-mono text-xs text-[#f3e6dc]/50">
                        EN ESPERA
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-2xl font-medium text-[#f3e6dc]">{stage.name}</h3>
                  <p className="mt-1 font-mono text-xs text-[#f3e6dc]/60">
                    Audio original esperado:{' '}
                    <span className="uppercase text-[#f3e6dc]/90 font-bold">
                      {stage.sourceLang}
                    </span>
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#f3e6dc]/10 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/admin/stage/${stage.id}`}
                    className="flex-1 rounded-full bg-[#f3e6dc] py-2.5 px-5 text-center text-xs font-semibold text-[#140b07] transition hover:bg-white"
                  >
                    Transmitir audio a esta sala →
                  </Link>

                  <Link
                    href={`/overlay/${stage.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Overlay OBS"
                    className="rounded-full border border-[#f3e6dc]/20 p-2.5 text-xs text-[#f3e6dc]/60 hover:text-white hover:border-[#f3e6dc]/50 transition"
                  >
                    OBS ↗
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
