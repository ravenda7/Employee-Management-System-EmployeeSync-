"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSessionData } from "@/context/session";
import { useNoteDialog } from "@/context/note-dialog";
import { useConfirmDialog } from "@/context/confirm-dialog"; // you already have this

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
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

type CompanyLeaveRow = {
  id: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: LeaveStatus;
  isPaid: boolean;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    name: string | null;
    email: string | null;
    department: {
      name: string | null;
    } | null;
  };
  leaveType: {
    id: string;
    name: string;
    code: string;
  };
  decidedBy?: {
    id: string;
    name: string | null;
  } | null;
  decisionNote?: string | null;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString();
}

const statusColor = (status: LeaveStatus) => {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

export default function ManageCompanyLeaveRequests() {
  const { user } = useSessionData();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();

  const noteDialog = useNoteDialog();
  const confirm = useConfirmDialog();

  const [filterStatus, setFilterStatus] = useState<"PENDING" | "ALL">("PENDING");

  const { data, isLoading } = useQuery<CompanyLeaveRow[]>({
    queryKey: ["companyLeaves", companyId, filterStatus],
    enabled: !!companyId,
    queryFn: async () => {
      const qs = filterStatus === "PENDING" ? "?status=PENDING" : "";
      const res = await fetch(`/api/company/${companyId}/leave-requests${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load leave requests");
      }
      return res.json();
    },
  });

  const decisionMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      decisionNote,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
      decisionNote?: string;
    }) => {
      const res = await fetch(`/api/leave-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, decisionNote }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Action failed");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "APPROVED"
          ? "Leave approved"
          : "Leave rejected"
      );
      queryClient.invalidateQueries({ queryKey: ["companyLeaves", companyId] });
      queryClient.invalidateQueries({ queryKey: ["employeeLeaves"] });
      queryClient.invalidateQueries({
        queryKey: ["employeeRecentLeaveDecision"],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  const handleDecision = async (
    row: CompanyLeaveRow,
    status: "APPROVED" | "REJECTED"
  ) => {
    // 1) Approve: just confirm, no note needed
    if (status === "APPROVED") {
      const ok = await confirm({
        title: `Approve leave for ${row.employee.name || "employee"}?`,
        description: `${formatDate(row.startDate)} - ${formatDate(
          row.endDate
        )} • ${row.duration} day(s) • ${row.leaveType.name}`,
        confirmText: "Approve",
        cancelText: "Cancel",
      });

      if (!ok) return;

      decisionMutation.mutate({
        id: row.id,
        status: "APPROVED",
      });
      return;
    }

    // 2) Reject: open note dialog
    const result = await noteDialog({
      title: `Reject leave for ${row.employee.name || "employee"}?`,
      description:
        "You can optionally add a reason for rejecting this leave. If you cancel, no action will be taken.",
      placeholder: "Write a rejection note (optional)...",
      confirmText: "Reject leave",
      cancelText: "Cancel",
      requireNote: true, // set true if you want to force a note
    });

    if (!result.confirmed) {
      // admin clicked cancel → do nothing
      return;
    }

    decisionMutation.mutate({
      id: row.id,
      status: "REJECTED",
      decisionNote: result.note || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-7 h-7" />
            <div className="flex flex-col">
              <p className="text-[16px] font-semibold text-slate-950">
                Leave Requests
              </p>
              <span className="text-sm text-slate-600">
                Review and approve or reject employees&apos; leave requests.
              </span>
            </div>
          </div>
          <div className="flex gap-2 border-2 border-slate-300 rounded-lg p-1">
            <Button
              size="sm"
              variant={filterStatus === "ALL" ? "default" : "outline"}
              onClick={() => setFilterStatus("ALL")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filterStatus === "PENDING" ? "default" : "outline"}
              onClick={() => setFilterStatus("PENDING")}
            >
              Pending
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
                <TableHead>Type</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading leave requests...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-sm text-slate-500"
                  >
                    No leave requests found.
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
                          {row.employee.department?.name
                            ? ` • ${row.employee.department.name}`
                            : ""}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {row.leaveType.name} ({row.leaveType.code})
                    </TableCell>

                    <TableCell>
                      {formatDate(row.startDate)} - {formatDate(row.endDate)}
                    </TableCell>

                    <TableCell>{row.duration}</TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColor(row.status)}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-xs text-slate-700">
                        {row.reason || "—"}
                      </p>
                    </TableCell>

                    <TableCell className="text-right pr-6 space-x-2">
                      {row.status === "PENDING" ? (
                        <>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={decisionMutation.isPending}
                                    onClick={() => handleDecision(row, "APPROVED")}
                                >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Approve leave</p>
                            </TooltipContent>
                        </Tooltip>
                          
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={decisionMutation.isPending}
                                    onClick={() => handleDecision(row, "REJECTED")}
                                >
                                    <XCircle className="w-4 h-4 text-red-600" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Reject leave</p>
                            </TooltipContent>
                        </Tooltip>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {row.decidedBy?.name
                            ? `By ${row.decidedBy.name}`
                            : "Processed"}
                        </span>
                      )}
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
