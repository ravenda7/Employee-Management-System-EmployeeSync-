"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Loader2 } from "lucide-react";
import { useSessionData } from "@/context/session";

type AttType = "CHECK_IN" | "CHECK_OUT";

type AttendanceRecord = {
  id: string;
  timestamp: string;
  type: AttType;
  shift: {
    name: string;
    startTime: string;
    endTime: string;
  } | null;
};

type DayRow = {
  dateKey: string;            // "2025-11-26"
  displayDate: string;        // localized
  firstCheckIn: string | null;
  lastCheckOut: string | null;
  recordsCount: number;
  shiftNames: string[];       // for tooltip if needed
};

function toDateKey(ts: string) {
  const d = new Date(ts);
  // ISO date part
  return d.toISOString().slice(0, 10);
}

function formatTime(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString();
}

function formatDisplayDate(ts: string) {
  return new Date(ts).toLocaleDateString();
}

export default function EmployeeAttendance() {
  const { user } = useSessionData();

  // date range filters (default: last 30 days, same as API)
  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const defaultFromObj = new Date(now);
  defaultFromObj.setDate(defaultFromObj.getDate() - 30);
  const defaultFrom = defaultFromObj.toISOString().slice(0, 10);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const { data, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "history", from, to],
    enabled: !!user,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/attendance/my?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load attendance history");
      }
      return res.json();
    },
  });

  const rows: DayRow[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    const map = new Map<string, DayRow>();

    for (const rec of data) {
      const dateKey = toDateKey(rec.timestamp);

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          dateKey,
          displayDate: formatDisplayDate(rec.timestamp),
          firstCheckIn: null,
          lastCheckOut: null,
          recordsCount: 0,
          shiftNames: [],
        });
      }

      const entry = map.get(dateKey)!;
      entry.recordsCount += 1;

      if (rec.shift?.name && !entry.shiftNames.includes(rec.shift.name)) {
        entry.shiftNames.push(rec.shift.name);
      }

      if (rec.type === "CHECK_IN") {
        if (!entry.firstCheckIn) {
          entry.firstCheckIn = rec.timestamp;
        } else {
          // keep earliest
          if (new Date(rec.timestamp) < new Date(entry.firstCheckIn)) {
            entry.firstCheckIn = rec.timestamp;
          }
        }
      } else if (rec.type === "CHECK_OUT") {
        if (!entry.lastCheckOut) {
          entry.lastCheckOut = rec.timestamp;
        } else {
          // keep latest
          if (new Date(rec.timestamp) > new Date(entry.lastCheckOut)) {
            entry.lastCheckOut = rec.timestamp;
          }
        }
      }
    }

    // sort by date descending (recent first)
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime()
    );
  }, [data]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-7 h-7" />
            <div className="flex flex-col">
              <p className="text-[16px] font-semibold text-slate-950">
                My Attendance
              </p>
              <span className="text-sm text-slate-600">
                View your recent check-in and check-out history.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                className="h-9 w-[140px]"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">To</label>
              <Input
                type="date"
                className="h-9 w-[140px]"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFrom(defaultFrom);
                setTo(defaultTo);
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Shift</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading attendance...
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-sm text-slate-500"
                  >
                    No attendance records found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.dateKey}>
                    <TableCell className="pl-6 font-medium">
                      {row.displayDate}
                    </TableCell>
                    <TableCell>{formatTime(row.firstCheckIn)}</TableCell>
                    <TableCell>{formatTime(row.lastCheckOut)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.recordsCount}</Badge>
                    </TableCell>
                    <TableCell>
                      {row.shiftNames.length > 0 ? (
                        <span className="text-xs text-slate-700">
                          {row.shiftNames.join(", ")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          —
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
