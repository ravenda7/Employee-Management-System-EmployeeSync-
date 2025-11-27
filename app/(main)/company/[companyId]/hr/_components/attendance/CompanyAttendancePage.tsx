"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionData } from "@/context/session";
import { useConfirmDialog } from "@/context/confirm-dialog";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Loader2,
} from "lucide-react";

import AdjustAttendanceDialog from "./AdjustAttendanceDialog";

type VerificationStatus = "IN_OFFICE" | "REMOTE" | "MANUAL_ADJUSTMENT";
type AttType = "CHECK_IN" | "CHECK_OUT";

type AttendanceRow = {
  id: string;
  companyId: string;
  empId: string;
  timestamp: string;
  type: AttType;
  loggedIp: string;
  deviceId: string;
  verificationStatus: VerificationStatus;
  isSuspicious: boolean;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  checkInDelayMinutes: number | null;
  earlyCheckoutMinutes: number | null;
  employee: {
    id: string;
    name: string | null;
    email: string | null;
    department: {
      name: string | null;
    } | null;
  };
  shift: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  } | null;
};

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString();
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString();
}

const statusTag = (status: VerificationStatus) => {
  switch (status) {
    case "IN_OFFICE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "REMOTE":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "MANUAL_ADJUSTMENT":
      return "bg-purple-50 text-purple-700 border-purple-200";
  }
};

export default function CompanyAttendancePage() {
  const { user } = useSessionData();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();

  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [onlySuspicious, setOnlySuspicious] = useState(false);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustRecord, setAdjustRecord] = useState<AttendanceRow | null>(null);

  const { data, isLoading } = useQuery<AttendanceRow[]>({
    queryKey: ["companyAttendance", companyId, date, onlySuspicious],
    enabled: !!companyId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (onlySuspicious) params.set("suspicious", "true");

      const res = await fetch(
        `/api/company/${companyId}/attendance?${params.toString()}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load attendance");
      }
      return res.json();
    },
  });

  const approveDeviceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/attendance/${id}/approve-device`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to approve device");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Device approved and attendance updated");
      queryClient.invalidateQueries({ queryKey: ["companyAttendance"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  const handleApproveDevice = async (row: AttendanceRow) => {
    const ok = await confirm({
      title: "Approve this device?",
      description: `This will mark the device "${row.deviceId}" as trusted for ${row.employee.name || "employee"} and re-evaluate attendance verification.`,
      confirmText: "Approve device",
      cancelText: "Cancel",
    });
    if (!ok) return;
    approveDeviceMutation.mutate(row.id);
  };

  const handleOpenAdjust = (row: AttendanceRow) => {
    setAdjustRecord(row);
    setAdjustOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-7 h-7" />
            <div className="flex flex-col">
              <p className="text-[16px] font-semibold text-slate-950">
                Attendance Overview
              </p>
              <span className="text-sm text-slate-600">
                Track daily attendance and handle suspicious sessions.
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">
                Date:
              </label>
              <Input
                type="date"
                className="h-9 w-[150px]"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button
              variant={onlySuspicious ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlySuspicious((v) => !v)}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              {onlySuspicious ? "Showing suspicious only" : "Show suspicious only"}
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
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Shift / Lateness</TableHead>
                <TableHead>IP / Device</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading attendance...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-sm text-slate-500"
                  >
                    No attendance records found for this date.
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
                      <div className="flex flex-col text-sm">
                        <span>{formatTime(row.timestamp)}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(row.timestamp)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {row.type === "CHECK_IN" ? "Check-in" : "Check-out"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusTag(row.verificationStatus)}
                      >
                        {row.verificationStatus}
                      </Badge>
                      {row.isSuspicious && (
                        <div className="text-[11px] text-amber-600 flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          Suspicious
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col text-xs text-slate-700">
                        {row.shift ? (
                          <>
                            <span>
                              {row.shift.name} (
                              {formatTime(row.shift.startTime)} -{" "}
                              {formatTime(row.shift.endTime)})
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            No shift assigned
                          </span>
                        )}
                        {row.type === "CHECK_IN" &&
                          row.checkInDelayMinutes != null && (
                            <span>
                              Delay: {row.checkInDelayMinutes} min
                            </span>
                          )}
                        {row.type === "CHECK_OUT" &&
                          row.earlyCheckoutMinutes != null && (
                            <span>
                              Left early: {row.earlyCheckoutMinutes} min
                            </span>
                          )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col text-xs text-slate-700">
                        <span>IP: {row.loggedIp}</span>
                        <span className="truncate max-w-[160px]">
                          Device: {row.deviceId}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right pr-6 space-x-2">
                      {row.isSuspicious && (
                        <Button
                          size="icon"
                          variant="outline"
                          title="Approve device"
                          disabled={approveDeviceMutation.isPending}
                          onClick={() => handleApproveDevice(row)}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="outline"
                        title="Manual adjustment"
                        onClick={() => handleOpenAdjust(row)}
                      >
                        <Wrench className="w-4 h-4 text-slate-700" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdjustAttendanceDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        attendanceId={adjustRecord?.id ?? null}
        initialTimestamp={adjustRecord?.timestamp}
        initialStatus={adjustRecord?.verificationStatus}
      />
    </div>
  );
}
