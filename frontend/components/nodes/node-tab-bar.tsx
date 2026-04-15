"use client";

const tabs = ["Overview", "Services", "IP Pool", "SIP IP", "Media IPs", "Usage", "Logs"] as const;

export type NodeTab = (typeof tabs)[number];

export function NodeTabBar({
  activeTab,
  onChange,
}: {
  activeTab: NodeTab;
  onChange: (tab: NodeTab) => void;
}) {
  return (
    <section className="flex flex-wrap gap-3">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] ${
            activeTab === tab
              ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
              : "border-white/10 bg-white/[0.04] text-slate-200"
          }`}
        >
          {tab}
        </button>
      ))}
    </section>
  );
}
