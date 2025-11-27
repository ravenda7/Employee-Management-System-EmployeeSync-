// app/super-admin/tenants/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Building2, Mail, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type TenantDetail = {
  id: string;
  name: string;
  adminEmail: string;
  createdAt: string;
  isActive: boolean;
  deactivatedAt: string | null;
  counts: {
    employees: number;
    ipRanges: number;
    departments: number;
    attendances: number;
    leaves: number;
    shifts: number;
  };
  recentEmployees: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  }[];
};

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<TenantDetail>({
    queryKey: ["superadmin", "company", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/superadmin/companies/${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load tenant detail");
      }
      const json = await res.json();
      return {
        ...json,
        createdAt: new Date(json.createdAt).toISOString(),
        deactivatedAt: json.deactivatedAt
          ? new Date(json.deactivatedAt).toISOString()
          : null,
      };
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await fetch(`/api/superadmin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Tenant status updated");
      queryClient.invalidateQueries({ queryKey: ["superadmin", "company", id] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "companies"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  if (isLoading || !data) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading tenant details...
          </CardContent>
        </Card>
      </div>
    );
  }

  const created = new Date(data.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/super-admin/tenants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              {data.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Tenant ID: {data.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={data.isActive ? "outline" : "destructive"}
            className="text-[10px]"
          >
            {data.isActive ? "Active" : "Inactive"}
          </Badge>
          <div className="flex items-center gap-2 text-xs">
            <span>Active</span>
            <Switch
              checked={data.isActive}
              disabled={toggleMutation.isPending}
              onCheckedChange={(val) => toggleMutation.mutate(val)}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Admin email</p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{data.adminEmail}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{created}</p>
            </div>
            {data.deactivatedAt && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Deactivated at
                </p>
                <p className="text-sm">
                  {new Date(data.deactivatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t mt-4">
            <div>
              <p className="text-[11px] text-muted-foreground">
                Employees
              </p>
              <p className="text-lg font-semibold">
                {data.counts.employees}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">
                Departments
              </p>
              <p className="text-lg font-semibold">
                {data.counts.departments}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">
                IP ranges
              </p>
              <p className="text-lg font-semibold">
                {data.counts.ipRanges}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">
                Shifts
              </p>
              <p className="text-lg font-semibold">
                {data.counts.shifts}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">
                Attendances
              </p>
              <p className="text-lg font-semibold">
                {data.counts.attendances}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">
                Leaves
              </p>
              <p className="text-lg font-semibold">
                {data.counts.leaves}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent employees */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">Recent employees</p>
            </div>
          </div>

          {data.recentEmployees.length === 0 ? (
            <p className="text-xs text-muted-foreground pt-2">
              No employees yet in this tenant.
            </p>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEmployees.map((e) => (
                    <tr key={e.id} className="border-t">
                      <td className="px-3 py-2">{e.name || "-"}</td>
                      <td className="px-3 py-2">{e.email || "-"}</td>
                      <td className="px-3 py-2 text-[11px]">
                        <Badge variant="outline">{e.role}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
