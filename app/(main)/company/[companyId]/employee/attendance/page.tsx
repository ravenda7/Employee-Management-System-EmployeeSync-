"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useVisitorData } from "@fingerprintjs/fingerprintjs-pro-react";

type TodayAttendance = {
  checkedInAt: string | null;
  checkedOutAt: string | null;
  status: "IN_OFFICE" | "REMOTE" | "MANUAL_ADJUSTMENT" | null;
  suspicious: boolean;
  checkInDelayMinutes: number | null;
  latenessStatus: "ON_TIME" | "LATE" | "VERY_LATE" | null;
  earlyCheckoutMinutes: number | null;
  earlyLeaveStatus: "ON_TIME" | "LEFT_EARLY" | "LEFT_VERY_EARLY" | null;
};

// small helper in same file
function useDeviceIdWithCache() {
  const { data, getData } = useVisitorData(
    { extendedResult: false },
    { immediate: false }
  );

  const getDeviceId = async () => {
    if (typeof window === "undefined") return null;

    const cached = window.localStorage.getItem("ems_device_id_v1");
    if (cached) return cached;

    if (data?.visitorId) {
      window.localStorage.setItem("ems_device_id_v1", data.visitorId);
      return data.visitorId;
    }

    const result = await getData({ ignoreCache: false });
    const id = result?.visitorId;
    if (id) {
      window.localStorage.setItem("ems_device_id_v1", id);
    }
    return id ?? null;
  };

  return { getDeviceId };
}

export default function EmployeeAttendancePage() {
  const queryClient = useQueryClient();
  const { getDeviceId } = useDeviceIdWithCache();

  const { data, isLoading } = useQuery<TodayAttendance>({
    queryKey: ["attendance", "today"],
    queryFn: async () => {
      const res = await fetch("/api/attendance/today");
      if (!res.ok) throw new Error("Failed to load attendance");
      return res.json();
    },
  });

  const checkedIn = !!data?.checkedInAt;
  const checkedOut = !!data?.checkedOutAt;

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const deviceId = await getDeviceId();
      if (!deviceId) throw new Error("Unable to get device ID");

      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Check-in failed");
      }

      return res.json();
    },
    onSuccess: () => {
      toast("Checked in successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
    onError: (error: any) => {
      toast(error.message || "Check-in failed");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const deviceId = await getDeviceId();
      if (!deviceId) throw new Error("Unable to get device ID");

      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Check-out failed");
      }

      return res.json();
    },
    onSuccess: () => {
      toast("Checked out successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
    onError: (error: any) => {
      toast(error.message || "Check-out failed");
    },
  });

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div>
            <h1 className="text-lg font-semibold">Today&apos;s Attendance</h1>
            <p className="text-sm text-muted-foreground">
              Check in and out for your workday. Your IP and device help verify
              if you are in the office.
            </p>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Check-in:</span>{" "}
                  {data?.checkedInAt
                    ? new Date(data.checkedInAt).toLocaleTimeString()
                    : "—"}
                </p>
                <p>
                  <span className="font-medium">Check-out:</span>{" "}
                  {data?.checkedOutAt
                    ? new Date(data.checkedOutAt).toLocaleTimeString()
                    : "—"}
                </p>
                {data?.status && (
                  <p>
                    <span className="font-medium">Verification:</span>{" "}
                    {data.status === "IN_OFFICE" ? "In Office" : "Remote"}
                  </p>
                )}
                {data?.latenessStatus && data.checkedInAt && (
                  <p>
                    <span className="font-medium">Punctuality:</span>{" "}
                    {data.latenessStatus === "ON_TIME" &&
                      "On time or within 5 minutes"}
                    {data.latenessStatus === "LATE" &&
                      `Late (${data.checkInDelayMinutes} min)`}
                    {data.latenessStatus === "VERY_LATE" &&
                      `Very late (${data.checkInDelayMinutes} min)`}
                  </p>
                )}
                {data?.earlyLeaveStatus && data.checkedOutAt && (
                  <p>
                    <span className="font-medium">End of day:</span>{" "}
                    {data.earlyLeaveStatus === "ON_TIME" &&
                      "Completed scheduled shift"}
                    {data.earlyLeaveStatus === "LEFT_EARLY" &&
                      `Left early (${data.earlyCheckoutMinutes} min)`}
                    {data.earlyLeaveStatus === "LEFT_VERY_EARLY" &&
                      `Left very early (${data.earlyCheckoutMinutes} min)`}
                  </p>
                )}
                {data?.suspicious && (
                  <p className="text-xs text-amber-600">
                    This session is marked as suspicious (new or unapproved
                    device/IP). HR/Admin may review it.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={checkedIn || checkInMutation.isPending}
                  onClick={() => checkInMutation.mutate()}
                >
                  {checkInMutation.isPending
                    ? "Checking in..."
                    : checkedIn
                    ? "Already Checked In"
                    : "Check In"}
                </Button>

                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={
                    !checkedIn || checkedOut || checkOutMutation.isPending
                  }
                  onClick={() => checkOutMutation.mutate()}
                >
                  {checkOutMutation.isPending
                    ? "Checking out..."
                    : checkedOut
                    ? "Already Checked Out"
                    : "Check Out"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
