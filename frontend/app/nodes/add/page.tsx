import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/panel-primitives";

const purposeOptions = ["MONITORING", "SIP + MEDIA", "ROUTING / GATEWAY"];

export default function AddNodePage() {
  return (
    <AppShell
      title="Add Node"
      eyebrow="Node provisioning"
      description="Register a new infrastructure node with access credentials, platform profile, and regional role. SSH scanning and service discovery stay intentionally out of scope in this version."
      activePath="/nodes"
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Core connection details" eyebrow="Secure intake" badge={<Badge tone="cyan">Node form</Badge>}>
          <form className="space-y-4">
            {[
              ["Node Name", "DEL-SBC-01"],
              ["Main IP", "10.10.0.11"],
              ["SSH Port", "22"],
              ["SSH Username", "noc-admin"],
              ["SSH Password", "Enter secure password"],
              ["OS Type", "Ubuntu 24.04"],
              ["Region", "Delhi"],
            ].map(([label, placeholder]) => (
              <label key={label} className="block">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">{label}</span>
                <input
                  type={label === "SSH Password" ? "password" : "text"}
                  placeholder={placeholder}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
                />
              </label>
            ))}
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Purpose</span>
              <select className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70">
                {purposeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Selected SIP IP</span>
              <input
                placeholder="Choose one IP from the node pool for signaling"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Notes</span>
              <textarea className="mt-3 w-full rounded-[1.6rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/70" rows={5} placeholder="Rack details, routing notes, or maintenance window context" />
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Test connection
              </button>
              <button type="submit" className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Save node
              </button>
            </div>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Provisioning notes" eyebrow="Current scope" badge={<Badge tone="amber">Scaffold only</Badge>}>
            <div className="space-y-3 text-sm leading-7 text-slate-300">
              <p>Each node must have one dedicated SIP IP for signaling.</p>
              <p>Customers and vendors whitelist the SIP IP, not the media IPs.</p>
              <p>All remaining usable IPs on the node become media IP candidates.</p>
              <p>Monitoring is treated as the first base software role installed on a node.</p>
              <p>Real SSH scanning, agent checks, and media service install automation are intentionally deferred.</p>
            </div>
          </SectionCard>
          <SectionCard title="Software order" eyebrow="Purpose shortcuts" badge={<Badge tone="violet">Simplified</Badge>}>
            <div className="space-y-3">
              <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/40 p-4 text-sm text-slate-100">
                <p className="font-semibold uppercase tracking-[0.12em] text-cyan-100">MONITORING</p>
                <p className="mt-2 leading-6 text-slate-300">Base software role. Install this first on the node for health, logs, and control-plane visibility.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4 text-sm text-slate-100">
                <p className="font-semibold uppercase tracking-[0.12em]">SIP + MEDIA</p>
                <p className="mt-2 leading-6 text-slate-300">Use when the node will host signaling and media-facing IPs for active call handling.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4 text-sm text-slate-100">
                <p className="font-semibold uppercase tracking-[0.12em]">ROUTING / GATEWAY</p>
                <p className="mt-2 leading-6 text-slate-300">Use when the node will sit between customer traffic and vendor traffic as the route handoff point.</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </section>
    </AppShell>
  );
}
