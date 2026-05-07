"use client";

import { AppShell } from "@/components/layout/AppShell";
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Clock,
  Users,
  ArrowUpRight,
  MoreHorizontal,
  Calendar,
  Flame,
  ListTodo,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { useDashboard } from "@/hooks/useData";
import { KpiCard } from "@/components/ui/KpiCard";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  TODO: { label: "To Do", color: "#94a3b8", bg: "bg-slate-100 text-slate-500" },
  IN_PROGRESS: { label: "In Progress", color: "#6366f1", bg: "bg-indigo-50 text-indigo-600" },
  DONE: { label: "Done", color: "#10b981", bg: "bg-emerald-50 text-emerald-600" },
};

const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "#94a3b8" },
  MEDIUM: { label: "Medium", color: "#f59e0b" },
  HIGH: { label: "High", color: "#ef4444" },
  URGENT: { label: "Urgent", color: "#dc2626" },
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function initials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#eff2f7] bg-white px-4 py-3 shadow-xl">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#adb5bd] mb-1">
        {label}
      </p>
      <p className="text-lg font-extrabold text-[#343a40]">{payload[0].value}</p>
    </div>
  );
};

// ─── Loading State ───────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-52 rounded-xl" />
            <Skeleton className="h-4 w-80 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="lg:col-span-8 h-80 rounded-2xl" />
          <Skeleton className="lg:col-span-4 h-80 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    </AppShell>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  // Chart data derived from API
  const statusData = [
    { name: "To Do", value: stats?.tasksByStatus?.todo ?? 0, color: "#94a3b8" },
    { name: "In Progress", value: stats?.tasksByStatus?.inProgress ?? 0, color: "#6366f1" },
    { name: "Done", value: stats?.tasksByStatus?.done ?? 0, color: "#10b981" },
  ];

  const priorityData = [
    { name: "Low", value: stats?.tasksByPriority?.low ?? 0, color: "#94a3b8" },
    { name: "Medium", value: stats?.tasksByPriority?.medium ?? 0, color: "#f59e0b" },
    { name: "High", value: stats?.tasksByPriority?.high ?? 0, color: "#ef4444" },
    { name: "Urgent", value: stats?.tasksByPriority?.urgent ?? 0, color: "#dc2626" },
  ];

  const completionRate = stats?.completionRate ?? 0;
  const totalTasks = stats?.totalTasks ?? 0;
  const doneTasks = stats?.tasksByStatus?.done ?? 0;
  const overdueTasks = stats?.overdueTasks ?? 0;
  const inProgressTasks = stats?.tasksByStatus?.inProgress ?? 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#343a40]">
              Good morning, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="mt-0.5 text-sm text-[#6c757d]">
              Here's what's happening across your workspace today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#adb5bd] uppercase tracking-wider">
            <Calendar size={13} />
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            icon={Target}
            value={totalTasks}
            label="Total Tasks"
            iconColor="primary"
            sub={totalTasks > 0 ? `${inProgressTasks} active` : undefined}
            trend="neutral"
          />
          <KpiCard
            icon={CheckCircle2}
            value={doneTasks}
            label="Completed"
            iconColor="success"
            sub={totalTasks > 0 ? `${completionRate}% rate` : undefined}
            trend="up"
          />
          <KpiCard
            icon={AlertCircle}
            value={overdueTasks}
            label="Overdue"
            iconColor="danger"
            sub={overdueTasks > 0 ? "Needs attention" : "All on time"}
            trend={overdueTasks > 0 ? "down" : "neutral"}
          />
          <KpiCard
            icon={TrendingUp}
            value={`${completionRate}%`}
            label="Completion Rate"
            iconColor="warning"
            sub={completionRate >= 50 ? "On track" : "Behind"}
            trend={completionRate >= 50 ? "up" : "down"}
          />
        </div>

        {/* ── Completion Progress Bar ── */}
        <div className="rounded-2xl border border-[#eff2f7] bg-white px-6 py-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={15} className="text-warning" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#6c757d]">
                Overall Progress
              </span>
            </div>
            <span className="text-[12px] font-extrabold text-[#343a40]">
              {doneTasks} / {totalTasks} tasks done
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f1f3f5]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-info transition-all duration-700 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="mt-3 flex gap-5">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="text-[11px] font-bold text-[#adb5bd]">
                  {s.name}: {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Charts Row ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* Bar Chart — Task Status Distribution */}
          <div className="lg:col-span-8 rounded-2xl border border-[#eff2f7] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#343a40]">Task Status</h3>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#adb5bd]">
                  Distribution by current status
                </p>
              </div>
              <MoreHorizontal size={18} className="text-[#ced4da] cursor-pointer hover:text-[#6c757d]" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  barCategoryGap="35%"
                >
                  <CartesianGrid
                    strokeDasharray="6 6"
                    vertical={false}
                    stroke="#f1f3f5"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: "#adb5bd" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: "#adb5bd" }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8f9fa", radius: 8 }} />
                  <Bar dataKey="value" radius={[8, 8, 4, 4]}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart — Priority Breakdown */}
          <div className="lg:col-span-4 rounded-2xl border border-[#eff2f7] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#343a40]">Priority Mix</h3>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#adb5bd]">
                  By urgency level
                </p>
              </div>
            </div>

            {priorityData.every((p) => p.value === 0) ? (
              <div className="flex h-52 flex-col items-center justify-center text-center">
                <ListTodo size={32} className="mb-3 text-[#dee2e6]" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#adb5bd]">
                  No tasks yet
                </p>
              </div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {priorityData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Legend */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {priorityData.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="text-[11px] font-bold text-[#6c757d]">
                    {p.name}
                    <span className="ml-1 text-[#adb5bd]">({p.value})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Team Members */}
          <div className="rounded-2xl border border-[#eff2f7] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <h3 className="text-base font-extrabold text-[#343a40]">Team Load</h3>
              </div>
              <span className="text-[11px] font-bold text-[#adb5bd]">
                {stats?.tasksPerUser?.length ?? 0} members
              </span>
            </div>

            {!stats?.tasksPerUser?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users size={28} className="mb-3 text-[#dee2e6]" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#adb5bd]">
                  No team data yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.tasksPerUser.slice(0, 5).map((member: any) => {
                  const pct =
                    member.totalAssigned > 0
                      ? Math.round((member.completed / member.totalAssigned) * 100)
                      : 0;
                  return (
                    <div key={member.userId}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-extrabold text-primary">
                            {initials(member.userName)}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-[#343a40]">
                              {member.userName}
                            </p>
                            <p className="text-[10px] text-[#adb5bd]">
                              {member.completed}/{member.totalAssigned} done
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-extrabold ${
                            pct >= 75
                              ? "text-success"
                              : pct >= 40
                              ? "text-warning"
                              : "text-danger"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f3f5]">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            pct >= 75
                              ? "bg-success"
                              : pct >= 40
                              ? "bg-warning"
                              : "bg-danger"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div className="rounded-2xl border border-[#eff2f7] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <h3 className="text-base font-extrabold text-[#343a40]">Recent Tasks</h3>
              </div>
              <button className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">
                View all <ArrowUpRight size={12} />
              </button>
            </div>

            {!stats?.recentTasks?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ListTodo size={28} className="mb-3 text-[#dee2e6]" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#adb5bd]">
                  No tasks created yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentTasks.slice(0, 6).map((task: any) => {
                  const cfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.TODO;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2.5 transition-all hover:border-[#eff2f7] hover:bg-[#f8f9fa]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ background: cfg.color }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[#343a40]">
                            {task.title}
                          </p>
                          <p className="text-[10px] text-[#adb5bd]">
                            {task.assignedTo?.name ?? "Unassigned"} ·{" "}
                            {formatDate(task.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`ml-3 flex-shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${cfg.bg}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Overdue Alert Banner (only if any) ── */}
        {overdueTasks > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-danger/20 bg-danger/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="flex-shrink-0 text-danger" />
              <p className="text-sm font-semibold text-danger">
                <span className="font-extrabold">{overdueTasks} task{overdueTasks > 1 ? "s are" : " is"} overdue.</span>{" "}
                Review and update their status or due dates.
              </p>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}