"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Activity, Calendar, Clock3 } from "lucide-react";

type AttendanceTrendItem = {
  date: string;
  dateLabel: string;
  present: number; // 0/1
  lateMinutes: number | null;
};

type Punctuality = {
  onTime: number;
  late: number;
  veryLate: number;
  total: number;
};

type LeaveSummaryItem = {
  leaveTypeId: string;
  name: string;
  code: string;
  usedDays: number;
  yearlyLimit: number | null;
};

type UpcomingLeave = {
  id: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  leaveType: {
    name: string;
    code: string;
  } | null;
};

type EmployeeDashboardOverview = {
  attendanceTrend: AttendanceTrendItem[];
  punctuality: Punctuality;
  leaveSummary: LeaveSummaryItem[];
  upcomingLeaves: UpcomingLeave[];
};

const PUNCT_COLORS = ["#22c55e", "#eab308", "#ef4444"]; 

export default function EmployeeAnalytics() {
  const { data, isLoading } = useQuery<EmployeeDashboardOverview>({
    queryKey: ["employeeDashboardOverview"],
    queryFn: async () => {
      const res = await fetch("/api/employees/dashboard/overview");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load analytics");
      }
      return res.json();
    }
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading your stats...
        </CardContent>
      </Card>
    );
  }

  const { attendanceTrend, punctuality, leaveSummary, upcomingLeaves } = data;

  const punctualityChartData = [
    { name: "On time", value: punctuality.onTime },
    { name: "Late", value: punctuality.late },
    { name: "Very late", value: punctuality.veryLate },
  ].filter((d) => d.value > 0);

  const totalWorkingDays = attendanceTrend.filter((d) => d.present).length;

  return (
    <div className="space-y-4">
      {/* Top charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance trend */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Attendance (last 30 days)
                </p>
              </div>
              <Badge variant="outline" className="text-[11px]">
                {totalWorkingDays} days present
              </Badge>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, 1]}
                    ticks={[0, 1]}
                    tickFormatter={(v) => (v === 1 ? "Present" : "Absent")}
                  />
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => {
                      if (name === "present") {
                        return value === 1 ? "Present" : "Absent";
                      }
                      if (name === "lateMinutes") {
                        return value != null ? `${value} min late` : "On time";
                      }
                      return value;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="present"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Each point represents whether you checked in that day. On-time /
              late details are used in the punctuality chart.
            </p>
          </CardContent>
        </Card>

        {/* Punctuality pie */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Punctuality</p>
              </div>
              <Badge variant="outline" className="text-[11px]">
                {punctuality.total} check-in days
              </Badge>
            </div>

            {punctuality.total === 0 ? (
              <p className="text-xs text-muted-foreground pt-4">
                Not enough data yet to calculate punctuality.
              </p>
            ) : (
              <div className="flex flex-col justify-center items-center gap-3">
                <div className="w-full h-42">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={punctualityChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={32}
                        outerRadius={50}
                      >
                        {punctualityChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PUNCT_COLORS[index] || "#8884d8"}
                          />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={40} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-1 text-xs">
                  <p>
                    <span className="inline-block w-2 h-2 rounded-full mr-1 bg-[color:var(--on-time,color-maybe)]" />
                    On time (≤ 5 min late):{" "}
                    <strong>{punctuality.onTime}</strong>
                  </p>
                  <p>
                    <span className="inline-block w-2 h-2 rounded-full mr-1" />
                    Late (6–30 min): <strong>{punctuality.late}</strong>
                  </p>
                  <p>
                    <span className="inline-block w-2 h-2 rounded-full mr-1" />
                    Very late (&gt; 30 min):{" "}
                    <strong>{punctuality.veryLate}</strong>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leave usage + Upcoming leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leave usage */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Leave usage (this year)
                </p>
              </div>
            </div>

            {leaveSummary.length === 0 ? (
              <p className="text-xs text-muted-foreground pt-3">
                You have no approved leaves this year yet.
              </p>
            ) : (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaveSummary}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="code" />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(value: any, name: any, props: any) => {
                          if (name === "usedDays") {
                            return `${value} day(s) used`;
                          }
                          if (name === "yearlyLimit") {
                            return value
                              ? `${value} day limit`
                              : "No limit";
                          }
                          return value;
                        }}
                      />
                      <Bar dataKey="usedDays" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <ul className="text-[11px] text-muted-foreground space-y-1">
                  {leaveSummary.map((ls) => (
                    <li key={ls.leaveTypeId}>
                      <span className="font-medium">
                        {ls.name} ({ls.code})
                      </span>
                      : {ls.usedDays} day(s) used{" "}
                      {ls.yearlyLimit != null &&
                        `(limit: ${ls.yearlyLimit} days)`}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming leaves */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Upcoming approved leaves</p>
              <Badge variant="outline" className="text-[11px]">
                {upcomingLeaves.length} upcoming
              </Badge>
            </div>

            {upcomingLeaves.length === 0 ? (
              <p className="text-xs text-muted-foreground pt-3">
                You have no upcoming approved leaves.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {upcomingLeaves.map((leave) => {
                  const start = new Date(leave.startDate);
                  const end = new Date(leave.endDate);
                  const range = `${start.toLocaleDateString(undefined, {
                    month: "short",
                    day: "2-digit",
                  })} - ${end.toLocaleDateString(undefined, {
                    month: "short",
                    day: "2-digit",
                  })}`;

                  return (
                    <li
                      key={leave.id}
                      className="flex items-center justify-between border rounded-md px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">
                          {leave.leaveType?.name || "Leave"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {range} • {leave.duration} day(s)
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        APPROVED
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
