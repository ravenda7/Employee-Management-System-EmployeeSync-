"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

import { Building2, Plus, Users, Globe2, Network, Eye, PenSquare } from "lucide-react";
import { useSessionData } from "@/context/session";
import ManageCompanyDialog from "../_components/manage-company-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

type CompanyRow = {
  id: string;
  name: string;
  adminEmail: string;
  createdAt: string;
  isActive: boolean;
  deactivatedAt: string | null;
  employeesCount: number;
  ipRangeCount: number;
  departmentCount: number;
};

export default function SuperAdminTenantsPage() {
  const { user } = useSessionData();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<CompanyRow | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<CompanyRow[]>({
    queryKey: ["superadmin", "companies"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/companies");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load tenants");
      }
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (payload: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/superadmin/companies/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: payload.isActive }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update tenant status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Tenant status updated");
      queryClient.invalidateQueries({ queryKey: ["superadmin", "companies"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.adminEmail.toLowerCase().includes(q)
    );
  }, [data, search]);

  const totalTenants = data?.length ?? 0;
  const totalEmployees =
    data?.reduce((sum, c) => sum + c.employeesCount, 0) ?? 0;
  const totalIpRanges =
    data?.reduce((sum, c) => sum + c.ipRangeCount, 0) ?? 0;

  const handleCreate = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (row: CompanyRow) => {
    setEditData(row);
    setDialogOpen(true);
  };

  if (user && user.role !== "SUPER_ADMIN") {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You don&apos;t have permission to view this page.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header / Hero */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            Super Admin – Tenants
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all companies (tenants) in the EMS multi-tenant
            environment.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New Tenant
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total tenants</p>
              <p className="text-2xl font-semibold">{totalTenants}</p>
            </div>
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total employees</p>
              <p className="text-2xl font-semibold">{totalEmployees}</p>
            </div>
            <Users className="w-6 h-6 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total IP ranges</p>
              <p className="text-2xl font-semibold">{totalIpRanges}</p>
            </div>
            <Globe2 className="w-6 h-6 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Search + table */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">Tenants</p>
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search by name or admin email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 w-[40px]">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Admin email</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Employees
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    IP ranges
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Departments
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="pr-4 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Loading tenants...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No tenants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c, idx) => {
                    const created = new Date(
                      c.createdAt
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    });

                    return (
                      <TableRow key={c.id}>
                        <TableCell className="pl-4 text-xs">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {c.name}
                        </TableCell>
                        <TableCell className="text-xs">
                          {c.adminEmail}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          {c.employeesCount}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          {c.ipRangeCount}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          {c.departmentCount}
                        </TableCell>

                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                c.isActive ? "outline" : "destructive"
                              }
                              className="text-[10px]"
                            >
                              {c.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Switch
                              checked={c.isActive}
                              disabled={toggleMutation.isPending}
                              onCheckedChange={(val) =>
                                toggleMutation.mutate({
                                  id: c.id,
                                  isActive: val,
                                })
                              }
                            />
                          </div>
                        </TableCell>

                        <TableCell className="text-xs">
                          {created}
                        </TableCell>

                        <TableCell className="pr-4 text-right space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleEdit(c)}
                          >
                            <PenSquare />
                          </Button>

                          <Link href={`/super-admin/tenants/${c.id}`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                            >
                              <span className="sr-only">
                                View details
                              </span>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ManageCompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editData={
          editData
            ? {
                id: editData.id,
                name: editData.name,
                adminEmail: editData.adminEmail,
              }
            : null
        }
      />
    </div>
  );
}
