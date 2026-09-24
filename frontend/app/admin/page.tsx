import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
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

        <section className="mt-10">
          <div className="rounded-3xl border border-[#f3e6dc]/10 bg-[#1f120c]/60 p-8 backdrop-blur-sm">
            <h2 className="text-xl font-medium">Estado de la Sesión</h2>
            <p className="mt-2 text-sm text-[#f3e6dc]/70">
              Autenticación completada con éxito vía Google OAuth. Tu usuario tiene permisos de
              operador asignados.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/watch"
                className="inline-flex items-center gap-2 rounded-full bg-[#f3e6dc] px-5 py-2.5 text-sm font-medium text-[#140b07] transition hover:bg-white"
              >
                Ver transmisiones en vivo (/watch) →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
