"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  AlertTriangle,
  CalendarCheck2,
  Banknote,
  Activity,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSessionData } from "@/context/session";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SiteHeader } from "@/components/layout/company/site-header";

type DashboardOverview = {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    pendingLeaves: number;
    suspiciousRecent: number;
    unpaidPayrolls: number;
  };
  today: {
    checkIns: number;
    lateCheckIns: number;
    approvedLeaves: number;
    date: string;
  };
  attendanceTrend: {
    dateLabel: string;
    checkIns: number;
  }[];
};

export default function AdminDashboardPage() {
  const params = useParams<{ companyId: string }>();
  const companyIdFromRoute = params.companyId;
  const { user } = useSessionData();
  const router = useRouter();

  const companyId = companyIdFromRoute ?? user?.companyId ?? "";

  const { data, isLoading } = useQuery<DashboardOverview>({
    queryKey: ["dashboardOverview", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(`/api/company/${companyId}/dashboard/overview`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load dashboard");
      }
      return res.json();
    }
  });

  const todayDate = data
    ? new Date(data.today.date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : "";

  return (
    <>
    <SiteHeader title="Company Dashboard Overview" />
        <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
            <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                <h1 className="text-xl sm:text-2xl font-semibold">
                    Company Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                    Quick overview of employees, attendance, leaves and payroll status.
                </p>
                </div>

                {user?.role && (
                <Badge variant="outline" className="self-start sm:self-auto">
                    {user.role === "COMPANY_ADMIN"
                    ? "Company Admin"
                    : user.role === "COMPANY_HR"
                    ? "HR"
                    : user.role}
                </Badge>
                )}
            </div>

            {isLoading || !data ? (
                <Card>
                <CardContent className="py-10 text-sm text-muted-foreground text-center">
                    Loading dashboard...
                </CardContent>
                </Card>
            ) : (
                <>
                {/* Top stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Employees */}
                    <Card>
                    <CardContent className="pt-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Total Employees
                        </div>
                        <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-semibold">
                        {data.stats.totalEmployees}
                        </div>
                        <span className="text-xs text-muted-foreground">
                        {data.stats.activeEmployees} active
                        </span>
                    </CardContent>
                    </Card>

                    {/* Pending Leaves */}
                    <Card>
                    <CardContent className="pt-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Pending Leave Requests
                        </div>
                        <CalendarCheck2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-semibold">
                        {data.stats.pendingLeaves}
                        </div>
                        <span className="text-xs text-muted-foreground">
                        Awaiting approval
                        </span>
                    </CardContent>
                    </Card>

                    {/* Suspicious Sessions */}
                    <Card>
                    <CardContent className="pt-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Suspicious Sessions (7 days)
                        </div>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-semibold">
                        {data.stats.suspiciousRecent}
                        </div>
                        <span className="text-xs text-muted-foreground">
                        Review unapproved IP/device
                        </span>
                    </CardContent>
                    </Card>

                    {/* Unpaid Payrolls */}
                    <Card>
                    <CardContent className="pt-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Unpaid Payrolls
                        </div>
                        <Banknote className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-semibold">
                        {data.stats.unpaidPayrolls}
                        </div>
                        <span className="text-xs text-muted-foreground">
                        Mark as paid after processing
                        </span>
                    </CardContent>
                    </Card>
                </div>

                {/* Today overview + Quick actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Today overview */}
                    <Card>
                    <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Today&apos;s Overview</p>
                            <p className="text-xs text-muted-foreground">
                            {todayDate || "Today"}
                            </p>
                        </div>
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                            <p className="text-muted-foreground mb-1">Check-ins</p>
                            <p className="text-xl font-semibold">
                            {data.today.checkIns}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">Late check-ins</p>
                            <p className="text-xl font-semibold">
                            {data.today.lateCheckIns}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">
                            Approved leaves
                            </p>
                            <p className="text-xl font-semibold">
                            {data.today.approvedLeaves}
                            </p>
                        </div>
                        </div>

                        {/* simple progress feel: active vs total */}
                        <div className="space-y-1 pt-1">
                        <p className="text-xs text-muted-foreground">
                            Active employees vs total
                        </p>
                        <Progress
                            value={
                            data.stats.totalEmployees > 0
                                ? (data.stats.activeEmployees /
                                    data.stats.totalEmployees) *
                                100
                                : 0
                            }
                        />
                        </div>
                    </CardContent>
                    </Card>

                    {/* Quick actions */}
                    <Card>
                    <CardContent className="pt-4 space-y-3">
                        <p className="text-sm font-medium">Quick Actions</p>
                        <p className="text-xs text-muted-foreground mb-2">
                        Jump directly to the most common admin/HR tasks.
                        </p>

                        <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() =>
                            router.push(`/company/${companyId}/admin/manage-employee`)
                            }
                        >
                            <span className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4" />
                            Manage employees
                            </span>
                            <ArrowRight className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() =>
                            router.push(`/company/${companyId}/admin/leave/requests`)
                            }
                        >
                            <span className="flex items-center gap-2">
                            <CalendarCheck2 className="w-4 h-4" />
                            Review leave requests
                            </span>
                            <ArrowRight className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() =>
                            router.push(`/company/${companyId}/admin/attendance`)
                            }
                        >
                            <span className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Attendance & suspicious sessions
                            </span>
                            <ArrowRight className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() =>
                            router.push(`/company/${companyId}/admin/payroll`)
                            }
                        >
                            <span className="flex items-center gap-2">
                            <Banknote className="w-4 h-4" />
                            Run & review payroll
                            </span>
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                        </div>
                    </CardContent>
                    </Card>
                </div>

                {/* Attendance trend chart */}
                <Card>
                    <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm font-medium">
                            Attendance Trend (Last 7 Days)
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Daily check-in count for your company.
                        </p>
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.attendanceTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dateLabel" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line
                            type="monotone"
                            dataKey="checkIns"
                            strokeWidth={2}
                            dot
                            />
                        </LineChart>
                        </ResponsiveContainer>
                    </div>
                    </CardContent>
                </Card>
                </>
            )}
            </div>
        </section>
    </>
  );
}
