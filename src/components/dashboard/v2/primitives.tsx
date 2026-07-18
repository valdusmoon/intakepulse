"use client";

import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/** Wraps a Material Symbols Outlined glyph name (e.g. "call", "phone_in_talk"). */
export function Icon({
  name,
  className = "",
  filled = false,
  style,
}: {
  name: string;
  className?: string;
  filled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`material-symbols-outlined ${filled ? "fill" : ""} ${className}`} style={style}>
      {name}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-cv-surface border border-cv-border rounded-xl shadow-cv-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-5 py-[18px] border-b border-cv-border flex justify-between items-center gap-3.5 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h3 className={`font-cv-heading text-xl tracking-tight text-cv-ink ${className}`}>{children}</h3>;
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

type BtnVariant = "default" | "primary" | "danger" | "ghost";
type BtnSize = "sm" | "md" | "lg";

const btnVariants: Record<BtnVariant, string> = {
  default: "bg-cv-surface text-cv-ink border-cv-border-strong hover:bg-cv-surface-subtle",
  primary: "bg-cv-primary text-white border-cv-primary hover:bg-cv-primary-dark",
  danger: "bg-cv-red text-white border-cv-red hover:opacity-90",
  ghost: "bg-transparent text-cv-primary border-transparent hover:bg-cv-surface-subtle",
};

const btnSizes: Record<BtnSize, string> = {
  sm: "min-h-[34px] px-[11px] text-xs",
  md: "min-h-10 px-3.5 text-[13px]",
  lg: "min-h-[46px] px-[18px] text-sm",
};

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-[9px] border font-bold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

export function Button({
  variant = "default",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  return (
    <button className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "default",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}>
      {children}
    </Link>
  );
}

export type BadgeColor = "green" | "amber" | "red" | "blue" | "purple" | "gray";

const badgeColors: Record<BadgeColor, string> = {
  green: "bg-cv-green-soft text-cv-green border-[#c9ead8]",
  amber: "bg-cv-amber-soft text-cv-amber border-[#f3d99d]",
  red: "bg-cv-red-soft text-cv-red border-[#f3c9c3]",
  blue: "bg-cv-primary-soft text-cv-primary-dark border-[#cfdbff]",
  purple: "bg-cv-purple-soft text-cv-purple border-[#ddd2ff]",
  gray: "bg-cv-gray-soft text-[#475467] border-[#e4e7ec]",
};

export function Badge({
  color = "gray",
  children,
  className = "",
}: {
  color?: BadgeColor;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-[5px] text-[11px] font-extrabold whitespace-nowrap ${badgeColors[color]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusPill({
  color = "gray",
  children,
  dot = false,
}: {
  color?: BadgeColor;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[7px] text-[11px] font-extrabold whitespace-nowrap ${badgeColors[color]}`}
    >
      {dot && <span className="w-[7px] h-[7px] rounded-full bg-current shrink-0" />}
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <label className="relative inline-block w-10 h-[23px] shrink-0 cursor-pointer" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`absolute inset-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-cv-primary" : "bg-cv-border-strong"
        } before:content-[''] before:absolute before:w-[17px] before:h-[17px] before:left-[3px] before:top-[3px] before:bg-white before:rounded-full before:shadow-[0_1px_3px_rgba(16,24,40,.25)] before:transition-transform before:duration-200 ${
          checked ? "before:translate-x-[17px]" : ""
        }`}
      />
    </label>
  );
}

const fieldBase =
  "h-10 w-full border rounded-[9px] px-[11px] outline-none focus:ring-[3px] focus:ring-cv-primary/10";
const fieldNormal = "border-cv-border-strong bg-cv-surface text-cv-ink focus:border-cv-primary";
// Read-only / disabled fields (e.g. the provisioned Callverted number, ring time)
// render greyed with a not-allowed cursor so it's obvious they aren't editable.
const fieldReadOnly = "border-cv-border bg-cv-surface-subtle text-cv-muted cursor-not-allowed focus:border-cv-border";

export function Field({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const state = props.readOnly || props.disabled ? fieldReadOnly : fieldNormal;
  return <input className={`${fieldBase} ${state} ${className}`} {...props} />;
}

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const state = props.disabled ? fieldReadOnly : fieldNormal;
  return (
    <select className={`${fieldBase} ${state} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-[92px] w-full border border-cv-border-strong rounded-[9px] bg-cv-surface text-cv-ink px-[11px] py-2.5 outline-none focus:border-cv-primary focus:ring-[3px] focus:ring-cv-primary/10 resize-y ${className}`}
      {...props}
    />
  );
}

export function FormGroup({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] text-[#475467] font-extrabold mb-[7px]">{label}</label>
      {children}
      {help && <div className="mt-1.5 text-[10px] text-cv-muted leading-relaxed">{help}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  note,
  primary = false,
  valueColor,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  primary?: boolean;
  valueColor?: string;
}) {
  return (
    <Card className={`p-[18px] min-h-[133px] relative overflow-hidden ${primary ? "cv-metric-primary" : ""}`}>
      <div className="text-xs text-cv-muted font-bold">{label}</div>
      <div
        className="mt-3 font-cv-heading font-bold text-[31px] leading-none tracking-tight"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      {note && <div className="mt-[9px] text-[11px] text-cv-muted">{note}</div>}
    </Card>
  );
}

export function Trend({ direction = "up", children }: { direction?: "up" | "down"; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[3px] text-cv-green text-[11px] font-extrabold ml-1.5">
      <Icon name={direction === "up" ? "trending_up" : "south"} className="!text-sm" />
      {children}
    </span>
  );
}
