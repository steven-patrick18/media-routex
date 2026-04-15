import type { ReactNode } from "react";
import Link from "next/link";
import { navigation } from "@/lib/navigation";

export function AppShell({
  title,
  eyebrow,
  description,
  activePath,
  headerActions,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  activePath: string;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  const activeGroup = navigation.find((item) => item.href === activePath)?.label ?? "Dashboard";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
        <div className="absolute left-[8%] top-[10%] h-64 w-64 rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] h-80 w-80 rounded-full bg-emerald-400/12 blur-3xl" />
      </div>

      <section className="relative z-10 min-h-[calc(100vh-3rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(7,19,34,0.94),rgba(3,8,20,0.98))] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="grid min-h-[calc(100vh-3rem)] xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(7,20,37,0.92),rgba(4,11,22,0.95))] p-5 sm:p-6 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between gap-4 xl:block">
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.38em] text-cyan-200/70">
                  Telecom media routing control
                </p>
                <h1 className="mt-3 text-3xl font-semibold uppercase tracking-[0.18em] text-white">
                  MediaRouteX
                </h1>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.28em] text-emerald-300">
                Phase 1 control panel
              </div>
            </div>

            <nav className="mt-6">
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {navigation.map((item) => {
                  const active = item.href === activePath;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`group flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                          active
                            ? "border-cyan-300/30 bg-cyan-300/10 text-white"
                            : "border-white/8 bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="text-base font-medium uppercase tracking-[0.12em]">
                          {item.label}
                        </span>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            active ? "bg-cyan-300" : "bg-slate-600 transition group-hover:bg-slate-400"
                          }`}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
                  Active module
                </p>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-cyan-300">
                  {activeGroup}
                </p>
              </div>
              <p className="mt-3 text-lg font-semibold uppercase tracking-[0.12em] text-white">
                Production-style scaffold
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Control plane UI and API scaffold for customer, vendor, node, media pool,
                usage, and log management.
              </p>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="border-b border-white/10 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.38em] text-cyan-200/70">
                    {eyebrow}
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.14em] text-white sm:text-4xl">
                    {title}
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
                    {description}
                  </p>
                </div>
                {headerActions ? <div className="flex flex-wrap gap-3">{headerActions}</div> : null}
              </div>
            </header>

            <div className="space-y-6 px-5 py-5 sm:px-6">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
