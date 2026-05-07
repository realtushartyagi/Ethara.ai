"use client";

import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconColor: "primary" | "success" | "danger" | "warning" | "info";
  sub?: string; // e.g. "+3 this week"
  trend?: "up" | "down" | "neutral";
}

export const KpiCard = ({
  icon: Icon,
  value,
  label,
  iconColor,
  sub,
  trend = "neutral",
}: KpiCardProps) => {
  const palette = {
    primary: {
      icon: "bg-primary/8 text-primary",
      glow: "group-hover:shadow-primary/10",
      bar: "bg-primary",
    },
    success: {
      icon: "bg-success/8 text-success",
      glow: "group-hover:shadow-success/10",
      bar: "bg-success",
    },
    danger: {
      icon: "bg-danger/8 text-danger",
      glow: "group-hover:shadow-danger/10",
      bar: "bg-danger",
    },
    warning: {
      icon: "bg-warning/8 text-warning",
      glow: "group-hover:shadow-warning/10",
      bar: "bg-warning",
    },
    info: {
      icon: "bg-info/8 text-info",
      glow: "group-hover:shadow-info/10",
      bar: "bg-info",
    },
  };

  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
      ? "text-danger"
      : "text-[#adb5bd]";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-[#eff2f7] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${palette[iconColor].glow}`}
    >
      {/* Subtle top accent bar */}
      <div
        className={`absolute left-0 top-0 h-0.5 w-full ${palette[iconColor].bar} opacity-60`}
      />

      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${palette[iconColor].icon} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon size={22} strokeWidth={1.8} />
        </div>

        {sub && (
          <span className={`text-[11px] font-bold ${trendColor}`}>{sub}</span>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#adb5bd]">
          {label}
        </p>
        <h3 className="mt-1.5 text-3xl font-extrabold tracking-tight text-[#343a40]">
          {value}
        </h3>
      </div>
    </div>
  );
};