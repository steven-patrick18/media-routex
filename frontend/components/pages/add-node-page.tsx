 "use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/panel-primitives";
import { createNode, testNodeConnection } from "@/lib/api";
import type { AddNodeFormState, NodeCreatePayload } from "@/lib/types";

const roleOptions = ["MEDIA"];

const initialFormState: AddNodeFormState = {
  nodeName: "",
  mainIp: "",
  sshPort: "22",
  sshUsername: "",
  sshPassword: "",
  osType: "",
  region: "",
  trafficRole: "MEDIA",
  notes: "",
};

export function AddNodePageView() {
  const [form, setForm] = useState<AddNodeFormState>(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [connectionTone, setConnectionTone] = useState<"cyan" | "emerald" | "amber" | "rose">("cyan");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: NodeCreatePayload = {
      name: form.nodeName.trim(),
      main_ip: form.mainIp.trim(),
      ssh_port: Number(form.sshPort) || 22,
      ssh_username: form.sshUsername.trim(),
      ssh_password: form.sshPassword,
      os_type: form.osType.trim(),
      purpose: form.trafficRole,
      region: form.region.trim(),
      notes: form.notes.trim(),
      status: "Provisioning",
      sip_ip_id: null,
    };

    if (!payload.name || !payload.main_ip || !payload.ssh_username || !payload.ssh_password) {
      setStatusMessage("Fill node name, main IP, SSH username, and SSH password before saving.");
      return;
    }

    const response = await createNode(payload);
    setConnectionTone(response ? "emerald" : "amber");
    setStatusMessage(response ? "Node saved. Main IP will be used as the signaling SIP IP." : "Node payload is ready. Backend save is not available right now, so the form stayed local.");
  }

  async function handleTestConnection() {
    const response = await testNodeConnection({
      main_ip: form.mainIp.trim(),
      ssh_port: Number(form.sshPort) || 22,
      ssh_username: form.sshUsername.trim(),
      ssh_password: form.sshPassword,
    });

    if (!response) {
      setConnectionTone("rose");
      setStatusMessage("SSH connection test could not reach the backend endpoint.");
      return;
    }

    setConnectionTone(response.ok ? "emerald" : "rose");
    setStatusMessage(response.message);
  }

  return (
    <AppShell
      title="Add Node"
      eyebrow="Node provisioning"
      description="Register a new node with its access details and media IP plan. In this add flow, the Main IP is automatically treated as the signaling SIP IP."
      activePath="/nodes"
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Core connection details" eyebrow="Secure intake" badge={<Badge tone="cyan">Node form</Badge>}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Node Name</span>
              <input
                name="nodeName"
                value={form.nodeName}
                onChange={(event) => setForm({ ...form, nodeName: event.target.value })}
                placeholder="DEL-SBC-01"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Main IP</span>
              <input
                name="mainIp"
                value={form.mainIp}
                onChange={(event) => setForm({ ...form, mainIp: event.target.value })}
                placeholder="10.10.0.11"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">SSH Port</span>
              <input
                name="sshPort"
                value={form.sshPort}
                onChange={(event) => setForm({ ...form, sshPort: event.target.value })}
                placeholder="22"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">SSH Username</span>
              <input
                name="sshUsername"
                value={form.sshUsername}
                onChange={(event) => setForm({ ...form, sshUsername: event.target.value })}
                placeholder="noc-admin"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">SSH Password</span>
              <div className="mt-3 flex gap-3">
                <input
                  name="sshPassword"
                  type={showPassword ? "text" : "password"}
                  value={form.sshPassword}
                  onChange={(event) => setForm({ ...form, sshPassword: event.target.value })}
                  placeholder="Enter SSH password"
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100 transition hover:bg-white/[0.08]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">OS Type</span>
              <input
                name="osType"
                value={form.osType}
                onChange={(event) => setForm({ ...form, osType: event.target.value })}
                placeholder="Ubuntu 24.04"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Region</span>
              <input
                name="region"
                value={form.region}
                onChange={(event) => setForm({ ...form, region: event.target.value })}
                placeholder="Delhi"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Traffic Role</span>
              <select
                name="trafficRole"
                value={form.trafficRole}
                onChange={(event) => setForm({ ...form, trafficRole: event.target.value as AddNodeFormState["trafficRole"] })}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
              >
                {roleOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-6 text-slate-400">
                This add flow is simplified for media nodes. The Main IP is used as the signaling SIP IP,
                and the remaining usable IPs on the server are treated as media IPs.
              </p>
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Signaling SIP IP</span>
              <input
                placeholder="Main IP will be used automatically"
                value="Main IP"
                readOnly
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
              />
              <p className="mt-2 text-xs leading-6 text-slate-400">
                Customers and vendors whitelist the Main IP for signaling. Remaining usable IPs on the node are treated as media IPs.
              </p>
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Notes</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className="mt-3 w-full rounded-[1.6rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/70"
                rows={5}
                placeholder="Rack details, routing notes, or maintenance window context"
              />
            </label>
            {statusMessage ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3">
                <Badge tone={connectionTone}>{connectionTone === "emerald" ? "Success" : connectionTone === "rose" ? "Error" : "Status"}</Badge>
                <p className="text-sm text-slate-200">{statusMessage}</p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleTestConnection} className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Test connection
              </button>
              <button type="submit" className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Save node
              </button>
            </div>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="IP Layout Rule" eyebrow="Important" badge={<Badge tone="emerald">Per node</Badge>}>
            <div className="space-y-3 text-sm leading-7 text-slate-300">
              <p>Each node can carry up to 61 usable service IPs.</p>
              <p>In this add flow, the Main IP is the signaling SIP IP.</p>
              <p>That Main IP is the address customers and vendors whitelist.</p>
              <p>The remaining usable IPs on that node are the media IP candidates.</p>
              <p>This page is currently simplified for adding media nodes.</p>
            </div>
          </SectionCard>
          <SectionCard title="Provisioning notes" eyebrow="Current scope" badge={<Badge tone="amber">Scaffold only</Badge>}>
            <div className="space-y-3 text-sm leading-7 text-slate-300">
              <p>The Main IP is reused as the signaling SIP IP during node creation.</p>
              <p>Media capacity comes from the remaining IPs attached to the node.</p>
              <p>Real SSH scanning, agent checks, and media service install automation are intentionally deferred.</p>
            </div>
          </SectionCard>
          <SectionCard title="Media Node Meaning" eyebrow="Current add flow" badge={<Badge tone="violet">Simplified</Badge>}>
            <div className="space-y-3">
              <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/40 p-4 text-sm text-slate-100">
                <p className="font-semibold uppercase tracking-[0.12em] text-cyan-100">MEDIA</p>
                <p className="mt-2 leading-6 text-slate-300">Use this when adding a node that will provide media IPs. The Main IP acts as signaling, and the rest of the IPs are available for media use.</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </section>
    </AppShell>
  );
}
