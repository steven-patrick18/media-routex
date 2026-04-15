"use client";

import { type ReactNode, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ActionButton, Badge, SectionCard } from "@/components/panel-primitives";
import { getSettings, saveSettings } from "@/lib/api";
import type { AppSettings } from "@/lib/types";

const initialSettings: AppSettings = {
  selectionStrategy: "Balanced",
  defaultMaxCalls: 30,
  defaultMaxCps: 5,
  sourceIdentityRule: "Source dialer IP only",
  customerPoolRule: "Customers do not receive media pools directly",
  sipWhitelistRule: "Customers and vendors whitelist the selected node SIP IP",
  notes: "No prefix matching, no real SIP or RTP engine, and no SSH scan automation in this phase.",
};

export default function SettingsPage() {
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [workingSettings, setWorkingSettings] = useState(initialSettings);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await getSettings();
      if (!cancelled && response) {
        setSavedSettings(response);
        setWorkingSettings(response);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    const response = await saveSettings(workingSettings);
    if (!response) {
      setStatusMessage("Settings save did not reach the backend.");
      return;
    }

    setSavedSettings(response);
    setWorkingSettings(response);
    setStatusMessage("Settings saved to persistent storage.");
  }

  function handleCancel() {
    setWorkingSettings(savedSettings);
    setStatusMessage("Unsaved changes discarded.");
  }

  return (
    <AppShell
      title="Settings"
      eyebrow="Control plane settings"
      description="Platform defaults, media selection policy, and operator-facing rules stay editable here while heavier config management is still out of scope."
      activePath="/settings"
    >
      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Selection Policy Defaults" eyebrow="Media IP logic" badge={<Badge tone="emerald">Editable</Badge>}>
          <div className="space-y-4">
            <Field label="Selection Strategy">
              <select className={inputClassName} value={workingSettings.selectionStrategy} onChange={(event) => setWorkingSettings({ ...workingSettings, selectionStrategy: event.target.value })}>
                <option>Balanced</option>
                <option>Round Robin</option>
                <option>Priority Failover</option>
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Default Max Calls Per Media IP">
                <input className={inputClassName} type="number" value={workingSettings.defaultMaxCalls} onChange={(event) => setWorkingSettings({ ...workingSettings, defaultMaxCalls: Number(event.target.value) || 30 })} />
              </Field>
              <Field label="Default Max CPS Per Media IP">
                <input className={inputClassName} type="number" value={workingSettings.defaultMaxCps} onChange={(event) => setWorkingSettings({ ...workingSettings, defaultMaxCps: Number(event.target.value) || 5 })} />
              </Field>
            </div>
            <Field label="Customer Identity Rule">
              <input className={inputClassName} value={workingSettings.sourceIdentityRule} onChange={(event) => setWorkingSettings({ ...workingSettings, sourceIdentityRule: event.target.value })} />
            </Field>
            <Field label="Customer Pool Rule">
              <input className={inputClassName} value={workingSettings.customerPoolRule} onChange={(event) => setWorkingSettings({ ...workingSettings, customerPoolRule: event.target.value })} />
            </Field>
            <Field label="SIP Whitelist Rule">
              <input className={inputClassName} value={workingSettings.sipWhitelistRule} onChange={(event) => setWorkingSettings({ ...workingSettings, sipWhitelistRule: event.target.value })} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Platform Scope" eyebrow="Phase 1 guardrails" badge={<Badge tone="amber">Saveable</Badge>}>
          <Field label="Scope Notes">
            <textarea className={textareaClassName} rows={8} value={workingSettings.notes} onChange={(event) => setWorkingSettings({ ...workingSettings, notes: event.target.value })} />
          </Field>
          {statusMessage ? <p className="mt-4 text-sm text-slate-300">{statusMessage}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton tone="muted" onClick={handleCancel}>Cancel</ActionButton>
            <ActionButton tone="primary" onClick={() => void handleSave()}>Save</ActionButton>
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">{label}</span>
      <div className="mt-3">{children}</div>
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70";

const textareaClassName =
  "w-full rounded-[1.6rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/70";
