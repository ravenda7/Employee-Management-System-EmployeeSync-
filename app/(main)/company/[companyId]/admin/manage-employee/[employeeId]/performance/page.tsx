"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BarChart3 } from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/company/site-header";

type PerformanceResponse = {
  employee: {
    id: string;
    name: string | null;
    email: string | null;
    departmentName: string | null;
    shiftName: string | null;
  };
  period: {
    start: string;
    end: string;
    workingDays: number;
  };
  performance: {
    score: number; // 0-1
    attendanceRatio: number;
    punctualityRatio: number;
    leaveRatio: number;
  };
  attendanceSummary: {
    presentDays: number;
    onTimeDays: number;
    totalDaysWithCheckIn: number;
  };
  leaveSummary: {
    totalLeaveDays: number;
  };
  leaveTrend: {
    monthLabel: string;
    days: number;
  }[];
  nextMonthPrediction: {
    monthLabel: string;
    predictedDays: number;
    trendIncreasing: boolean;
  };
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString();
}

export default function EmployeePerformance() {
  const params = useParams<{ companyId: string; employeeId: string }>();
  const router = useRouter();

  const companyId = params.companyId;
  const employeeId = params.employeeId;

  const { data, isLoading } = useQuery<PerformanceResponse>({
    queryKey: ["employeePerformance", companyId, employeeId],
    enabled: !!companyId && !!employeeId,
    queryFn: async () => {
      const res = await fetch(
        `/api/company/${companyId}/employee/${employeeId}/performance`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load performance data");
      }
      return res.json();
    }
  });

  const scorePercent = data ? Math.round(data.performance.score * 100) : 0;

  const chartData =
    data?.leaveTrend.map((m) => ({
      name: m.monthLabel,
      days: m.days,
      type: "Actual",
    })) ?? [];

  if (data) {
    chartData.push({
      name: data.nextMonthPrediction.monthLabel,
      days: data.nextMonthPrediction.predictedDays,
      type: "Predicted",
    });
  }

  return (
    <>
    <SiteHeader title="Track Employee Performance & Leave Analytics" />
        <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
            <div className="space-y-4">
            {/* Page header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="hidden sm:inline-flex"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    <h1 className="text-lg sm:text-xl font-semibold">
                        Employee Performance & Leave Analytics
                    </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    View attendance-based performance score and leave patterns for
                    this employee.
                    </p>
                </div>
                </div>

                <Button
                variant="outline"
                size="sm"
                className="sm:hidden"
                onClick={() => router.back()}
                >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
                </Button>
            </div>

            {isLoading || !data ? (
                <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-56 w-full" />
                </div>
            ) : (
                <>
                {/* Employee info + period */}
                <Card>
                    <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <p className="font-semibold text-base sm:text-lg">
                        {data.employee.name || "Employee"}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                        {data.employee.email}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {data.employee.departmentName && (
                            <Badge variant="outline">
                            Dept: {data.employee.departmentName}
                            </Badge>
                        )}
                        {data.employee.shiftName && (
                            <Badge variant="outline">
                            Shift: {data.employee.shiftName}
                            </Badge>
                        )}
                        </div>
                    </div>

                    <div className="text-xs sm:text-sm text-muted-foreground text-right space-y-1">
                        <div>
                        Period:{" "}
                        <span className="font-medium">
                            {formatDate(data.period.start)} –{" "}
                            {formatDate(data.period.end)}
                        </span>
                        </div>
                        <div>Working days: {data.period.workingDays}</div>
                    </div>
                    </CardContent>
                </Card>

                {/* Performance score & metrics */}
                <Card>
                    <CardContent className="pt-4 flex flex-col sm:flex-row gap-6">
                    {/* Score */}
                    <div className="sm:w-1/3 flex flex-col items-start gap-3">
                        <p className="text-sm font-medium">Performance Score</p>
                        <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-semibold">
                            {scorePercent}
                        </span>
                        <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                        <Progress value={scorePercent} className="w-full" />
                        <span className="text-xs text-muted-foreground">
                        Combined weight of attendance, punctuality and leave usage.
                        </span>
                    </div>

                    {/* Ratios */}
                    <div className="sm:flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1">
                        <p className="text-muted-foreground">Attendance</p>
                        <p className="text-lg font-semibold">
                            {(data.performance.attendanceRatio * 100).toFixed(0)}%
                        </p>
                        <p className="text-muted-foreground">
                            Present days: {data.attendanceSummary.presentDays} /{" "}
                            {data.period.workingDays}
                        </p>
                        </div>
                        <div className="space-y-1">
                        <p className="text-muted-foreground">Punctuality</p>
                        <p className="text-lg font-semibold">
                            {(data.performance.punctualityRatio * 100).toFixed(0)}%
                        </p>
                        <p className="text-muted-foreground">
                            On-time days: {data.attendanceSummary.onTimeDays} /{" "}
                            {data.attendanceSummary.totalDaysWithCheckIn}
                        </p>
                        </div>
                        <div className="space-y-1">
                        <p className="text-muted-foreground">Leave Usage</p>
                        <p className="text-lg font-semibold">
                            {data.leaveSummary.totalLeaveDays} days
                        </p>
                        <p className="text-muted-foreground">
                            {(data.performance.leaveRatio * 100).toFixed(0)}% of work
                            days taken as leave
                        </p>
                        </div>
                    </div>
                    </CardContent>
                </Card>

                {/* Leave trend + prediction */}
                <Card>
                    <CardContent className="pt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                        <p className="text-sm font-medium">
                            Leave Trend & Next Month Prediction
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Last 3 months of approved leave days, plus predicted next
                            month.
                        </p>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground text-right">
                        <span
                            className={cn(
                            "font-semibold",
                            data.nextMonthPrediction.trendIncreasing
                                ? "text-amber-600"
                                : "text-emerald-600"
                            )}
                        >
                            {data.nextMonthPrediction.trendIncreasing
                            ? "Trend: increasing leave usage"
                            : "Trend: stable or decreasing leave usage"}
                        </span>
                        <div>
                            Next month:{" "}
                            <span className="font-medium">
                            {data.nextMonthPrediction.predictedDays} days
                            </span>
                        </div>
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line
                            type="monotone"
                            dataKey="days"
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
