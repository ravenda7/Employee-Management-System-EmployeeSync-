// app/(dashboard)/employee/leave-requests/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { CalendarDays, PlusCircle } from "lucide-react";
import ApplyLeaveDialog from "../_components/apply-leave-dialog";
import { SiteHeader } from "@/components/layout/company/site-header";


type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type LeaveRow = {
  id: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: LeaveStatus;
  isPaid: boolean;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  leaveType: {
    id: string;
    name: string;
    code: string;
  };
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString();
}

export default function EmployeeLeaveRequestsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<LeaveRow[]>({
    queryKey: ["employeeLeaves"],
    queryFn: async () => {
      const res = await fetch("/api/employees/leave-requests");
      if (!res.ok) throw new Error("Failed to load leave requests");
      return res.json();
    },
  });

  return (
    <>
    <SiteHeader title="Manage Your Leave Requests" />
    <div className="space-y-4 px-4 lg:px-6 py-4">
      <Card>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-7 h-7" />
            <div className="flex flex-col">
              <p className="text-[16px] font-semibold text-slate-950">
                My Leave Requests
              </p>
              <span className="text-sm text-slate-600">
                Apply for leave and track approval status.
              </span>
            </div>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <PlusCircle className="w-4 h-4" />
            Apply for leave
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Date Range</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Applied On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-sm text-slate-500"
                  >
                    You have not submitted any leave requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="pl-6">
                      {formatDate(leave.startDate)} -{" "}
                      {formatDate(leave.endDate)}
                    </TableCell>
                    <TableCell>
                      {leave.leaveType.name} ({leave.leaveType.code})
                    </TableCell>
                    <TableCell>{leave.duration}</TableCell>
                    <TableCell>
                      <span
                        className={
                          leave.status === "APPROVED"
                            ? "text-emerald-600 text-xs font-medium"
                            : leave.status === "REJECTED"
                            ? "text-red-600 text-xs font-medium"
                            : "text-slate-600 text-xs font-medium"
                        }
                      >
                        {leave.status}
                      </span>
                    </TableCell>
                    <TableCell>{leave.isPaid ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {new Date(leave.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ApplyLeaveDialog isOpen={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
    </>
  );
}
