"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Building2,
  Users,
  Activity,
  Globe2,
  ArrowRight,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import Link from "next/link";

type OverviewResponse = {
  totals: {
    totalTenants: number;
    activeTenants: number;
    totalEmployees: number;
    totalAttendance: number;
    leaves: {
      pending: number;
      approved: number;
      rejected: number;
    };
  };
  topTenants: {
    id: string;
    name: string;
    isActive: boolean;
    employeesCount: number;
  }[];
  tenantTrend: {
    label: string;
    count: number;
  }[];
};

export default function SuperAdminDashboardPage() {
  const { data, isLoading } = useQuery<OverviewResponse>({
    queryKey: ["superadmin", "overview"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/overview");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load overview");
      }
      return res.json();
    }
  });

  if (isLoading || !data) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading super admin dashboard...
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totals, topTenants, tenantTrend } = data;

  const totalLeaves =
    totals.leaves.pending +
    totals.leaves.approved +
    totals.leaves.rejected;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            High-level view of all tenants and activity in the EMS.
          </p>
        </div>
        <Link href="/super-admin/tenants">
          <Button variant="outline" className="gap-2">
            Manage tenants
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Total tenants
              </p>
              <p className="text-2xl font-semibold">
                {totals.totalTenants}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {totals.activeTenants} active
              </p>
            </div>
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Total employees
              </p>
              <p className="text-2xl font-semibold">
                {totals.totalEmployees}
              </p>
            </div>
            <Users className="w-6 h-6 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Attendance records
              </p>
              <p className="text-2xl font-semibold">
                {totals.totalAttendance}
              </p>
            </div>
            <Activity className="w-6 h-6 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Leave status
              </p>
              <p className="text-2xl font-semibold">{totalLeaves}</p>
              <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                <Badge variant="outline">
                  Pending {totals.leaves.pending}
                </Badge>
                <Badge variant="outline">
                  Approved {totals.leaves.approved}
                </Badge>
                <Badge variant="outline">
                  Rejected {totals.leaves.rejected}
                </Badge>
              </div>
            </div>
            <Globe2 className="w-6 h-6 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.5fr] gap-4">
        {/* Tenant trend */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                New tenants – last 6 months
              </p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tenantTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    strokeWidth={2}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top tenants */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Top tenants by headcount
              </p>
            </div>

            {topTenants.length === 0 ? (
              <p className="text-xs text-muted-foreground pt-4">
                No tenants yet.
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTenants}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="employeesCount" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
