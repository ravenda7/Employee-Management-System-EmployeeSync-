"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

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
import { Loader2, Wallet, Download } from "lucide-react";

type EmployeePayroll = {
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
};

function formatDate(d: string | null) {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function EmployeePayrollPage() {
  const now = new Date();

  const defaultTo = now.toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    .toISOString()
    .slice(0, 10);

  const [from, setFrom] = useState(sixMonthsAgo);
  const [to, setTo] = useState(defaultTo);

  const { data, isLoading } = useQuery<EmployeePayroll[], Error>({
    queryKey: ["employeePayrolls", from, to],
    queryFn: async (): Promise<EmployeePayroll[]> => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/employees/payrolls?${params.toString()}`);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(err.message || "Failed to load payslips");
      }
      return (await res.json()) as EmployeePayroll[];
    }
  });

  const totalNet = data?.reduce((sum, p) => sum + p.net, 0) ?? 0;

  return (
    <div className="space-y-4">
      {/* Header / Filters */}
      <Card>
        <CardContent className="pt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-7 h-7" />
            <div className="flex flex-col">
              <p className="text-[16px] font-semibold text-slate-950">
                My Payslips
              </p>
              <span className="text-sm text-slate-600">
                View your salary breakdown, payment status, and download
                payslips.
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
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Total net pay in selected period
          </span>
          <span className="text-lg font-semibold">
            {totalNet.toFixed(2)}
          </span>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Period</TableHead>
                <TableHead>Regular Hrs</TableHead>
                <TableHead>OT Hrs</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Payslip</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading payslips...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    No payslips found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-6 text-sm">
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
                    <TableCell className="text-sm">
                      {row.deductions.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {row.net.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col gap-1">
                        {row.isPaid ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                            Pending
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
                        className="h-8 px-2 text-xs"
                        asChild
                      >
                        <a
                          href={`/api/employees/payrolls/${row.id}/payslip`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
