"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionData } from "@/context/session";
import { useConfirmDialog } from "@/context/confirm-dialog";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import GeneratePayrollDialog from "./generate-payroll-dialog";

type PayrollRow = {
  id: string;
  companyId: string;
  empId: string;
  startDate: string;
  endDate: string;
  gross: number;
  deductions: number;
  net: number;
  regularHours: number;
  overtimeHours: number;
  isPaid: boolean;
  paidDate: string | null;
  note: string | null;
  employee: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString();
}

export default function ManagePayrollPage() {
  const { user } = useSessionData();
  const companyId = user?.companyId as string | undefined;
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(defaultTo);
  const [openDialog, setOpenDialog] = useState(false);

  const { data, isLoading } = useQuery<PayrollRow[]>({
    queryKey: ["payrolls", companyId, from, to],
    enabled: !!companyId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(
        `/api/company/${companyId}/payrolls?${params.toString()}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load payrolls");
      }
      return res.json();
    },
  });

  // Mutation to mark as paid/unpaid
  const updatePaidMutation = useMutation({
    mutationFn: async ({
      id,
      isPaid,
    }: {
      id: string;
      isPaid: boolean;
    }) => {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update payroll status");
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payrolls", companyId] });
      toast.success(
        data.isPaid ? "Marked as paid" : "Marked as unpaid"
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update payroll status");
    },
  });

  const handleTogglePaid = async (row: PayrollRow) => {
    const targetState = !row.isPaid;

    const ok = await confirm({
      title: targetState ? "Mark as Paid" : "Mark as Unpaid",
      description: targetState
        ? `Mark payroll for ${row.employee.name || "employee"} as paid?`
        : `Mark payroll for ${row.employee.name || "employee"} as unpaid?`,
      confirmText: targetState ? "Yes, mark as paid" : "Yes, mark as unpaid",
      cancelText: "Cancel",
    });

    if (!ok) return;

    updatePaidMutation.mutate({ id: row.id, isPaid: targetState });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-7 h-7" />
            <div className="flex flex-col">
              <p className="text-[16px] font-semibold text-slate-950">
                Payroll
              </p>
              <span className="text-sm text-slate-600">
                View generated payrolls, mark as paid, and create new records.
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From</span>
              <Input
                type="date"
                className="h-9 w-[140px]"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To</span>
              <Input
                type="date"
                className="h-9 w-[140px]"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={() => setOpenDialog(true)}>
              Generate Payroll
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Regular Hrs</TableHead>
                <TableHead>OT Hrs</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading payrolls...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    No payroll records found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {row.employee.name || "Unnamed"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {row.employee.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(row.startDate)} –{" "}
                      {formatDate(row.endDate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.regularHours.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.overtimeHours.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.gross.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {row.net.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {row.isPaid ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Paid
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Unpaid
                          </Badge>
                        )}
                        {row.paidDate && (
                          <span className="text-[11px] text-muted-foreground">
                            Paid on {formatDate(row.paidDate)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatePaidMutation.isPending}
                        onClick={() => handleTogglePaid(row)}
                      >
                        {row.isPaid ? "Mark Unpaid" : "Mark Paid"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {companyId && (
        <GeneratePayrollDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          companyId={companyId}
        />
      )}
    </div>
  );
}
