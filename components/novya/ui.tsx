"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { errorMessage, label } from "@/lib/sales";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Inbox,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
export function Button({
  children,
  onClick,
  href,
  primary = false,
  disabled = false,
  type = "button",
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  ariaLabel?: string;
}) {
  const cls = cn("nv-button", primary && "nv-primary", className);
  return href ? (
    <Link className={cls} href={href} aria-label={ariaLabel}>
      {children}
    </Link>
  ) : (
    <button
      type={type}
      disabled={disabled}
      className={cls}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
export function IconButton({
  children,
  onClick,
  label: aria,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className="nv-icon-button"
      aria-label={aria}
      title={aria}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function PageTitle({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="nv-page-title">
      <div>
        {eyebrow && <div className="nv-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="nv-title-actions">{action}</div>
    </div>
  );
}
export function Card({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("nv-card", className)}>
      {(title || action) && (
        <div className="nv-card-heading">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: string;
}) {
  const value = String(children).toLowerCase();
  const color =
    tone ||
    (/active|done|completed|paid|won|confirmed|eligible|valid|healthy|approved/.test(
      value,
    )
      ? "green"
      : /pending|offer|deferred|review|progress|scheduled/.test(value)
        ? "amber"
        : /lost|blocked|failed|expired|cancelled/.test(value)
          ? "red"
          : "neutral");
  return (
    <span className={`nv-badge nv-${color}`}>
      <i />
      {typeof children === "string" ? label(children) : children}
    </span>
  );
}
export function Metric({
  label: caption,
  value,
  detail,
  children,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="nv-metric">
      <span>{caption}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
      {children}
    </div>
  );
}
export function Metrics({ children }: { children: ReactNode }) {
  return <div className="nv-metrics">{children}</div>;
}
export function Progress({
  value = 0,
  tone = "",
}: {
  value?: number;
  tone?: string;
}) {
  return (
    <div className={`nv-progress ${tone}`}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
export function Tabs({
  items,
  active,
  onChange,
}: {
  items: string[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="nv-tabs" role="tablist">
      {items.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={active === t}
          className={active === t ? "active" : ""}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="nv-search">
      <Search size={14} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function Select({
  value,
  onChange,
  options,
  label: aria,
}: {
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  label?: string;
}) {
  return (
    <label className="nv-select">
      <select
        aria-label={aria || "Filter"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((x) => {
          const v = typeof x === "string" ? x : x.value;
          return (
            <option key={v} value={v}>
              {typeof x === "string" ? label(v) : x.label}
            </option>
          );
        })}
      </select>
      <ChevronDown size={12} />
    </label>
  );
}
export function Empty({
  title = "Nothing here yet",
  description = "Your records will appear here as you work.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="nv-empty">
      <span>
        <Inbox size={22} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function DataState({
  pending,
  error,
  retry,
  children,
}: {
  pending: boolean;
  error: unknown;
  retry?: () => void;
  children: ReactNode;
}) {
  if (pending)
    return (
      <div className="nv-loading" role="status">
        <Loader2 size={18} className="animate-spin" />
        Loading your workspace…
      </div>
    );
  if (error)
    return (
      <Card>
        <Empty
          title="Unable to load this view"
          description={errorMessage(error)}
          action={<Button onClick={retry}>Try again</Button>}
        />
      </Card>
    );
  return <>{children}</>;
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className={cn("nv-modal", wide && "nv-modal-wide")}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {description || "Review the details before continuing."}
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function Field({
  label: caption,
  name,
  type = "text",
  defaultValue,
  required = false,
  placeholder,
  options,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}) {
  return (
    <label className="nv-field">
      <span>{caption}</span>
      {type === "textarea" ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          rows={4}
        />
      ) : options ? (
        <select name={name} defaultValue={defaultValue} required={required}>
          <option value="">Select {caption.toLowerCase()}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          min={type === "number" ? 0 : undefined}
        />
      )}
    </label>
  );
}
export function FormModal({
  open,
  onClose,
  title,
  description,
  children,
  onSubmit,
  busy = false,
  submit = "Save",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (data: Record<string, string>) => Promise<unknown>;
  busy?: boolean;
  submit?: string;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const values = Object.fromEntries(
            new FormData(e.currentTarget).entries(),
          ) as Record<string, string>;
          setSaving(true);
          try {
            await onSubmit(values);
            onClose();
          } catch {
            /* Server errors remain visible without discarding input. */
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="nv-form-grid">{children}</div>
        <div className="nv-modal-footer">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" primary disabled={saving || busy}>
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}{" "}
            {submit}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="nv-table-scroll">
      <table className="nv-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function Avatar({
  name = "?",
  small = false,
}: {
  name?: string;
  small?: boolean;
}) {
  return (
    <span className={`nv-avatar ${small ? "small" : ""}`}>
      {name
        .split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}
export function Back({
  href,
  children = "Back",
}: {
  href: string;
  children?: ReactNode;
}) {
  return (
    <Link className="nv-back" href={href}>
      <ArrowLeft size={13} />
      {children}
    </Link>
  );
}
export function DetailRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="nv-detail-rows">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Timeline({
  items,
}: {
  items: {
    title: string;
    description?: string;
    date?: string;
    tone?: string;
    href?: string;
  }[];
}) {
  if (!items.length)
    return (
      <Empty
        title="No activity yet"
        description="Notes, meetings and commercial changes will appear here."
      />
    );
  return (
    <div className="nv-timeline">
      {items.map((x, i) => (
        <div key={i}>
          <span className={x.tone || ""} />
          <div>
            <strong>
              {x.href ? (
                <Link href={x.href}>
                  {x.title}
                  <ArrowUpRight size={12} />
                </Link>
              ) : (
                x.title
              )}
            </strong>
            {x.description && <p>{x.description}</p>}
          </div>
          <small>{x.date}</small>
        </div>
      ))}
    </div>
  );
}
export function More({
  items,
}: {
  items: { label: string; action: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="nv-more">
      <IconButton label="More actions" onClick={() => setOpen(!open)}>
        {open ? <X size={14} /> : <MoreHorizontal size={15} />}
      </IconButton>
      {open && (
        <>
          <button
            className="nv-menu-backdrop"
            aria-label="Close actions"
            onClick={() => setOpen(false)}
          />
          <div className="nv-menu">
            {items.map((i) => (
              <button
                key={i.label}
                onClick={() => {
                  setOpen(false);
                  i.action();
                }}
              >
                {i.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
export function AddButton({
  onClick,
  children = "Create",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <Button onClick={onClick}>
      <Plus size={14} />
      {children}
    </Button>
  );
}
