import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard";

type DashboardShellProps = {
  data: DashboardData;
};

export function DashboardShell({ data }: DashboardShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
        <div className="absolute left-[8%] top-[10%] h-64 w-64 rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] h-80 w-80 rounded-full bg-emerald-400/12 blur-3xl" />
      </div>

      <section className="relative z-10 min-h-[calc(100vh-3rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(7,19,34,0.94),rgba(3,8,20,0.98))] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="grid min-h-[calc(100vh-3rem)] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(7,20,37,0.92),rgba(4,11,22,0.95))] p-5 sm:p-6 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between gap-4 xl:block">
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.38em] text-cyan-200/70">
                  Secure access node
                </p>
                <h1 className="mt-3 text-3xl font-semibold uppercase tracking-[0.18em] text-white">
                  NOC360
                </h1>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.28em] text-emerald-300">
                {data.meta.systemStatus}
              </div>
            </div>

            <nav className="mt-6">
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {data.sidebarItems.map((item, index) => {
                  const active = index === 0;

                  return (
                    <li key={item}>
                      <a
                        href="#"
                        className={`group flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                          active
                            ? "border-cyan-300/30 bg-cyan-300/10 text-white"
                            : "border-white/8 bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="text-base font-medium uppercase tracking-[0.12em]">
                          {item}
                        </span>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            active ? "bg-cyan-300" : "bg-slate-600 transition group-hover:bg-slate-400"
                          }`}
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
                  Shift
                </p>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-cyan-300">
                  {data.meta.shiftDate}
                </p>
              </div>
              <p className="mt-3 text-lg font-semibold uppercase tracking-[0.12em] text-white">
                Tier 4 Operations
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Active coverage for APAC voice, routing, and media operations.
              </p>
            </div>
          </aside>

          <div className="min-w-0 border-b border-white/10 xl:border-b-0 xl:border-r">
            <header className="flex flex-col gap-5 border-b border-white/10 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.38em] text-cyan-200/70">
                  Network operations dashboard
                </p>
                <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.14em] text-white sm:text-4xl">
                  Command center
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/nodes/add"
                  className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/16"
                >
                  Add node
                </Link>
                <label className="relative min-w-0 sm:w-72">
                  <span className="sr-only">Search nodes and alerts</span>
                  <input
                    type="search"
                    placeholder="Search nodes, IP pools, incidents..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-10 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:bg-slate-950/80"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-cyan-300/60" />
                </label>

                <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <div>
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-emerald-200/80">
                      Network status
                    </p>
                    <p className="text-sm uppercase tracking-[0.12em] text-white">
                      {data.meta.networkStatus}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 font-mono text-sm uppercase tracking-[0.18em] text-cyan-200">
                    {data.meta.operatorInitials}
                  </div>
                  <div>
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-slate-400">
                      Operator
                    </p>
                    <p className="text-sm uppercase tracking-[0.12em] text-white">
                      {data.meta.operator}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            <div className="space-y-6 px-5 py-5 sm:px-6">
              <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                {data.summaryCards.map((card) => (
                  <article
                    key={card.label}
                    className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur"
                  >
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-slate-400">
                      {card.label}
                    </p>
                    <p className={`mt-4 text-4xl font-semibold tracking-[0.1em] ${card.tone}`}>
                      {card.value}
                    </p>
                    <p className="mt-3 text-sm uppercase tracking-[0.12em] text-slate-300">
                      {card.delta}
                    </p>
                  </article>
                ))}
              </section>

              <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                <div className="rounded-[1.9rem] border border-cyan-300/14 bg-cyan-300/[0.05] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-cyan-200/70">
                        Load distribution
                      </p>
                      <h3 className="mt-2 text-xl font-semibold uppercase tracking-[0.12em] text-white">
                        Core traffic matrix
                      </h3>
                    </div>
                    <p className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.28em] text-cyan-300">
                      Live feed
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-12 gap-2">
                    {[
                      "h-24 bg-cyan-300/75",
                      "h-14 bg-cyan-200/35",
                      "h-28 bg-emerald-300/80",
                      "h-16 bg-cyan-300/45",
                      "h-32 bg-cyan-300/90",
                      "h-20 bg-slate-400/35",
                      "h-36 bg-emerald-300/75",
                      "h-16 bg-cyan-300/40",
                      "h-24 bg-cyan-200/55",
                      "h-32 bg-cyan-300/65",
                      "h-20 bg-emerald-300/55",
                      "h-28 bg-cyan-300/72",
                    ].map((style, index) => (
                      <div key={index} className={`rounded-full self-end ${style}`} />
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Ingress", "12.4 Tbps", "text-cyan-300"],
                      ["Media relay", "8.7 Tbps", "text-emerald-300"],
                      ["Packet loss", "0.08%", "text-white"],
                    ].map(([label, value, tone]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3"
                      >
                        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-500">
                          {label}
                        </p>
                        <p className={`mt-2 text-xl font-semibold uppercase tracking-[0.08em] ${tone}`}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.9rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-slate-400">
                        Service posture
                      </p>
                      <h3 className="mt-2 text-xl font-semibold uppercase tracking-[0.12em] text-white">
                        Priority actions
                      </h3>
                    </div>
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-rose-300">
                      {data.meta.escalations} escalations
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      ["SIP edge failover validation", "Runbook 14B", "text-cyan-300"],
                      ["Media jitter containment", "Ops bridge active", "text-amber-300"],
                      ["IP pool fragmentation audit", "Due in 18m", "text-rose-300"],
                    ].map(([title, detail, tone]) => (
                      <div
                        key={title}
                        className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm uppercase tracking-[0.12em] text-slate-100">
                            {title}
                          </p>
                          <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.26em] text-slate-500">
                            {detail}
                          </p>
                        </div>
                        <span className={`h-2.5 w-2.5 rounded-full ${tone} bg-current`} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-cyan-200/70">
                      Managed infrastructure
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold uppercase tracking-[0.12em] text-white">
                      Node and server grid
                    </h3>
                  </div>
                  <p className="text-sm uppercase tracking-[0.12em] text-slate-400">
                    Sorted by operational impact
                  </p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {data.nodeCards.map((node) => (
                    <article
                      key={node.name}
                      className={`rounded-[1.75rem] border bg-[linear-gradient(180deg,rgba(10,24,42,0.92),rgba(5,13,24,0.96))] p-5 ${node.border}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-500">
                            {node.role}
                          </p>
                          <h4 className="mt-3 text-2xl font-semibold uppercase tracking-[0.1em] text-white">
                            {node.name}
                          </h4>
                        </div>
                        <span
                          className={`rounded-full bg-white/5 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.24em] ${node.tone}`}
                        >
                          {node.state}
                        </span>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-3">
                          <p className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-slate-500">
                            Uptime
                          </p>
                          <p className="mt-2 text-xl font-semibold uppercase tracking-[0.08em] text-white">
                            {node.uptime}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-3">
                          <p className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-slate-500">
                            Load
                          </p>
                          <p className="mt-2 text-xl font-semibold uppercase tracking-[0.08em] text-white">
                            {node.load}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.26em] text-slate-500">
                          <span>Capacity band</span>
                          <span>{node.load}</span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/8">
                          <div
                            className={`h-full rounded-full ${
                              node.tone === "text-rose-300"
                                ? "bg-rose-300"
                                : node.tone === "text-amber-300"
                                  ? "bg-amber-300"
                                  : node.tone === "text-emerald-300"
                                    ? "bg-emerald-300"
                                    : "bg-cyan-300"
                            }`}
                            style={{ width: node.load }}
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <aside className="bg-[linear-gradient(180deg,rgba(8,22,39,0.9),rgba(4,11,21,0.96))] p-5 sm:p-6">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
                    Alert rail
                  </p>
                  <h3 className="mt-2 text-xl font-semibold uppercase tracking-[0.12em] text-white">
                    Active incidents
                  </h3>
                </div>
                <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-rose-300">
                  P1 watch
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {data.alertFeed.map((alert) => (
                  <article
                    key={alert.title}
                    className="rounded-2xl border border-white/8 bg-slate-950/45 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm uppercase tracking-[0.12em] text-slate-100">
                        {alert.title}
                      </p>
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${alert.tone}`} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{alert.detail}</p>
                    <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.26em] text-slate-500">
                      {alert.time}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-cyan-300/14 bg-cyan-300/[0.05] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-cyan-200/70">
                    Activity
                  </p>
                  <h3 className="mt-2 text-xl font-semibold uppercase tracking-[0.12em] text-white">
                    Recent operations
                  </h3>
                </div>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-cyan-300">
                  {data.activityFeed.length} updates
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {data.activityFeed.map((item, index) => (
                  <div key={item} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                      {index < data.activityFeed.length - 1 ? (
                        <span className="mt-2 h-full w-px bg-white/10" />
                      ) : null}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm uppercase tracking-[0.12em] text-slate-100">
                        {item}
                      </p>
                      <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.26em] text-slate-500">
                        {6 + index * 4} min ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
                  Capacity
                </p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-emerald-300">
                  Healthy reserve
                </p>
              </div>
              <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/45 p-4">
                <p className="text-4xl font-semibold uppercase tracking-[0.1em] text-white">
                  {data.meta.capacityReserve}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Available routing and media capacity across monitored clusters.
                </p>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#31c3ff,#00ffa3)]"
                    style={{ width: data.meta.capacityReserve }}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
