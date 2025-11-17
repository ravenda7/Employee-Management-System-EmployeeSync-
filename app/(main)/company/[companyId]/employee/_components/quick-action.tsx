
// import React, { useState } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Clock, LogIn, LogOut } from 'lucide-react';
// import { toast } from 'sonner';

// const QuickActions = () => {
//   const [isCheckedIn, setIsCheckedIn] = useState(false);
//   const [checkInTime, setCheckInTime] = useState<string | null>(null);

//   const handleCheckIn = () => {
//     const currentTime = new Date().toLocaleTimeString();
//     setIsCheckedIn(true);
//     setCheckInTime(currentTime);
//     toast("Checked In Successfully");
//   };

//   const handleCheckOut = () => {
//     const currentTime = new Date().toLocaleTimeString();
//     setIsCheckedIn(false);
    
//     if (checkInTime) {
//       const totalHours = 4;
//       toast("Checked Out Successfully");
//     }
//     setCheckInTime(null);
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Quick Actions</CardTitle>
//         <CardDescription>Mark your attendance for today</CardDescription>
//       </CardHeader>
//       <CardContent className='w-full sm:w-[320px]'>
//         <div className="flex items-center space-x-4">
//           {!isCheckedIn ? (
//             <Button onClick={handleCheckIn} className="flex items-center space-x-2">
//               <LogIn className="h-4 w-4" />
//               <span>Check In</span>
//             </Button>
//           ) : (
//             <Button onClick={handleCheckOut} variant="outline" className="flex items-center space-x-2">
//               <LogOut className="h-4 w-4" />
//               <span>Check Out</span>
//             </Button>
//           )}
          
//           {isCheckedIn && checkInTime && (
//             <div className="flex-1 flex items-center space-x-2 text-sm text-muted-foreground">
//               <Clock className="h-4 w-4" />
//               <span>Checked in at {checkInTime}</span>
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default QuickActions;

































"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useVisitorData } from "@fingerprintjs/fingerprintjs-pro-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Flame, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";

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

// helper: get deviceId via FingerprintJS Pro and cache in localStorage
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

const QuickActions: React.FC = () => {
  const queryClient = useQueryClient();
  const { getDeviceId } = useDeviceIdWithCache();

  // load today's attendance
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

  // check-in mutation
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
      toast.success("Checked in successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Check-in failed");
    },
  });

  // check-out mutation
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
      toast.success("Checked out successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Check-out failed");
    },
  });

  const isCheckingIn = checkInMutation.isPending;
  const isCheckingOut = checkOutMutation.isPending;

  const handleCheckIn = () => {
    if (checkedIn) return;
    checkInMutation.mutate();
  };

  const handleCheckOut = () => {
    if (!checkedIn || checkedOut) return;
    checkOutMutation.mutate();
  };

  const checkInLabel = data?.checkedInAt
    ? new Date(data.checkedInAt).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">Quick Actions <Flame /></CardTitle>
        <CardDescription>Mark your attendance for today</CardDescription>
      </CardHeader>

      <CardContent className="w-full sm:w-[350px] space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <div className="flex items-center space-x-4">
              {/* Button logic based on real attendance */}
              {!checkedIn ? (
                <Button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{isCheckingIn ? "Checking in..." : "Check In"}</span>
                </Button>
              ) : (
                <Button
                  onClick={handleCheckOut}
                  disabled={checkedOut || isCheckingOut}
                  variant="outline"
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>
                    {checkedOut
                      ? "Checked Out"
                      : isCheckingOut
                      ? "Checking out..."
                      : "Check Out"}
                  </span>
                </Button>
              )}

              {checkedIn && checkInLabel && (
                <div className="flex-1 flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Checked in at {checkInLabel}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
