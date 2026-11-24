import React from "react";

export function TableEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-14 px-4 text-center flex flex-col items-center justify-center space-y-2.5">
      {Icon && (
        <div className="w-11 h-11 rounded-xl bg-teal-50/80 text-teal-800 flex items-center justify-center mb-1 border border-teal-100/60 shadow-xs">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="text-sm font-semibold text-[#0b2520]">{title}</div>
      {description && <p className="text-xs text-[#526a66] max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function StatusBadge({
  variant,
  children,
  size = "md",
}: {
  variant: "success" | "warning" | "danger" | "neutral" | "info" | "purple";
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
    warning: "bg-amber-50 text-amber-800 border-amber-200/70",
    danger: "bg-rose-50 text-rose-800 border-rose-200/70",
    neutral: "bg-stone-50 text-stone-700 border-stone-200/80",
    info: "bg-teal-50 text-teal-800 border-teal-200/70",
    purple: "bg-indigo-50 text-indigo-800 border-indigo-200/70",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-[11px]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors ${sizeStyles[size]} ${styles[variant]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          variant === "success"
            ? "bg-emerald-500"
            : variant === "warning"
            ? "bg-amber-500"
            : variant === "danger"
            ? "bg-rose-500"
            : variant === "info"
            ? "bg-teal-600"
            : variant === "purple"
            ? "bg-indigo-500"
            : "bg-stone-400"
        }`}
      />
      {children}
    </span>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full divide-y divide-[#e5eeec] animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 px-5 py-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`h-4 bg-stone-100 rounded ${
                cIdx === 0 ? "w-24" : cIdx === 1 ? "w-48" : "w-20"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = false,
}: {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  icon?: React.ElementType;
  trend?: { label: string; positive?: boolean };
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
        highlight
          ? "bg-gradient-to-br from-[#0b2520] to-[#0f342c] text-white border-teal-900 shadow-md shadow-teal-950/10"
          : "bg-white text-[#0b2520] border-[#dce8e5] shadow-xs hover:border-teal-700/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-medium tracking-wide uppercase ${
            highlight ? "text-teal-200/80" : "text-[#526a66]"
          }`}
        >
          {title}
        </span>
        {Icon && (
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              highlight
                ? "bg-teal-800/60 text-teal-300"
                : "bg-teal-50 text-teal-800 border border-teal-100/60"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div
        className={`text-2xl font-bold font-mono tracking-tight mt-1.5 ${
          highlight ? "text-white" : "text-[#0b2520]"
        }`}
      >
        {value}
      </div>

      {(subtitle || trend) && (
        <div
          className={`text-[11px] mt-2 flex items-center justify-between gap-1 pt-2 border-t ${
            highlight ? "border-teal-800/60 text-teal-300/80" : "border-[#e5eeec] text-[#526a66]"
          }`}
        >
          {subtitle && <div className="truncate">{subtitle}</div>}
          {trend && (
            <span
              className={`shrink-0 font-medium ${
                trend.positive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
