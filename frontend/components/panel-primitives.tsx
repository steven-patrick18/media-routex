import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "cyan" | "emerald" | "amber" | "rose" | "violet";
}) {
  const styles = {
    neutral: "border-white/10 bg-white/[0.04] text-slate-200",
    cyan: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
    amber: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    rose: "border-rose-300/25 bg-rose-300/10 text-rose-100",
    violet: "border-violet-300/25 bg-violet-300/10 text-violet-100",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.24em] ${styles}`}
    >
      {children}
    </span>
  );
}

export function SectionCard({
  title,
  eyebrow,
  badge,
  action,
  children,
}: {
  title: string;
  eyebrow: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-slate-400">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-xl font-semibold uppercase tracking-[0.12em] text-white">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {action}
          {badge}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-slate-400">{label}</p>
      <p className={`mt-4 text-4xl font-semibold tracking-[0.1em] ${tone}`}>{value}</p>
      <p className="mt-3 text-sm uppercase tracking-[0.12em] text-slate-300">{detail}</p>
    </article>
  );
}

export function SimpleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-slate-950/35">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/8">
          <thead>
            <tr className="bg-white/[0.03]">
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left font-mono text-[0.62rem] uppercase tracking-[0.26em] text-slate-400"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {rows.map((row, index) => (
              <tr key={index} className="align-top">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 text-sm text-slate-200">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ActionButton({
  children,
  tone = "neutral",
  onClick,
  type = "button",
}: {
  children: ReactNode;
  tone?: "neutral" | "cyan" | "emerald" | "amber" | "rose" | "primary" | "muted" | "danger";
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const styles = {
    neutral: "border-white/10 bg-white/[0.04] text-slate-100",
    cyan: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
    amber: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    rose: "border-rose-300/25 bg-rose-300/10 text-rose-100",
    primary: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
    muted: "border-white/10 bg-white/[0.04] text-slate-100",
    danger: "border-rose-300/25 bg-rose-300/10 text-rose-100",
  }[tone];

  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition hover:bg-white/[0.08] ${styles}`}
    >
      {children}
    </button>
  );
}

export function ActionsRow({
  children,
  actions,
}: {
  children?: ReactNode;
  actions?: Array<{ label: string; href?: string; onClick?: () => void; tone?: "neutral" | "muted" | "primary" | "danger" | "amber" | "emerald" | "cyan" | "rose" }>;
}) {
  if (actions) {
    return (
      <div className="flex flex-wrap gap-2">
        {actions.map((action) =>
          action.href ? (
            <a
              key={`${action.label}-${action.href}`}
              href={action.href}
              className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100 transition hover:bg-white/[0.08]"
            >
              {action.label}
            </a>
          ) : (
            <ActionButton key={action.label} tone={action.tone ?? "neutral"} onClick={action.onClick}>
              {action.label}
            </ActionButton>
          ),
        )}
      </div>
    );
  }

  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function OverlayPanel({
  open = true,
  title,
  eyebrow = "Edit Panel",
  description,
  onClose,
  footer,
  children,
}: {
  open?: boolean;
  title: string;
  eyebrow?: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(7,19,34,0.98),rgba(3,8,20,0.98))] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.55)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-slate-400">{eyebrow}</p>
            <h3 className="mt-2 text-xl font-semibold uppercase tracking-[0.12em] text-white">{title}</h3>
          </div>
          <ActionButton tone="muted" onClick={onClose}>
            Close
          </ActionButton>
        </div>
        {description ? <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p> : null}
        <div className="mt-5">{children}</div>
        {footer ? <div className="mt-6 border-t border-white/8 pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
