// app/(dashboard)/employee/components/RecentLeaveDecision.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Bell } from "lucide-react";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type RecentLeave = {
  id: string;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  updatedAt: string;
  reason: string | null;
  leaveType: {
    name: string;
    code: string;
  };
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString();
}

export default function RecentLeaveDecision() {
  const [dismissed, setDismissed] = useState(false);

  const { data, isLoading } = useQuery<RecentLeave | null>({
    queryKey: ["employeeRecentLeaveDecision"],
    queryFn: async () => {
      const res = await fetch("/api/employees/leave-requests/recent");
      if (!res.ok) throw new Error("Failed to load recent leave decision");
      return res.json();
    },
  });

  if (isLoading || dismissed || !data) return null;

  const isApproved = data.status === "APPROVED";
  const isRejected = data.status === "REJECTED";

  return (
    <Card>
      <CardContent className="pt-3 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {isApproved ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  isApproved
                    ? "border-emerald-500 text-emerald-700"
                    : "border-red-500 text-red-700"
                }
              >
                {data.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(data.updatedAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm font-medium">
              {isApproved ? "Your leave has been approved" : "Your leave was rejected"}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.leaveType.name} ({formatDate(data.startDate)} -{" "}
              {formatDate(data.endDate)})
            </p>
            {data.reason && (
              <p className="text-xs text-muted-foreground">
                Reason: {data.reason}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="mt-1"
          onClick={() => setDismissed(true)}
        >
          <Bell className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
