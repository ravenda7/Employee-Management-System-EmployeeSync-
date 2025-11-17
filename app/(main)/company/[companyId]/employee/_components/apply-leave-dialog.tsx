// app/(somewhere)/employee/ApplyLeaveDialog.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSessionData } from "@/context/session";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const todayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const leaveRequestSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Leave type is required"),
    startDate: z.date({
      message: "Start date is required",
    }),
    endDate: z.date({
      message: "End date is required",
    }),
    reason: z.string().optional(),
  })
  // start >= today
  .refine((data) => {
    const start = new Date(data.startDate);
    start.setHours(0, 0, 0, 0);
    return start >= todayMidnight();
  }, {
    path: ["startDate"],
    message: "Start date cannot be in the past",
  })
  // end >= today
  .refine((data) => {
    const end = new Date(data.endDate);
    end.setHours(0, 0, 0, 0);
    return end >= todayMidnight();
  }, {
    path: ["endDate"],
    message: "End date cannot be in the past",
  })
  // end >= start
  .refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return end >= start;
  }, {
    path: ["endDate"],
    message: "End date must be on or after start date",
  });

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

type LeaveType = {
  id: string;
  name: string;
  code: string;
  yearlyLimit: number | null;
};

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type EmployeeLeaveRow = {
  id: string;
  leaveTypeId: string;
  duration: number;
  status: LeaveStatus;
  startDate: string;
};

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ApplyLeaveDialog({ isOpen, onOpenChange }: Props) {
  const { user } = useSessionData();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();

  const defaultValues: LeaveRequestFormData = {
    leaveTypeId: "",
    reason: "",
    startDate: todayMidnight(),
    endDate: todayMidnight(),
  };

  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, form]);

  const { data: leaveTypes, isLoading: typesLoading } = useQuery<LeaveType[]>({
    queryKey: ["leaveTypes", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(`/api/company/${companyId}/leave-types`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load leave types");
      }
      return res.json();
    },
  });

  const { data: myLeaves } = useQuery<EmployeeLeaveRow[]>({
    queryKey: ["employeeLeaves"],
    queryFn: async () => {
      const res = await fetch("/api/employees/leave-requests");
      if (!res.ok) throw new Error("Failed to load leave requests");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: LeaveRequestFormData) => {
      const payload = {
        leaveTypeId: values.leaveTypeId,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        reason: values.reason ?? "",
      };

      // NOTE: if your route is /api/employees/leave-requests, change it here
      const res = await fetch("/api/employees/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit leave request");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeLeaves"] });
      toast.success("Leave request submitted");
      onOpenChange(false);
      form.reset(defaultValues);
    },
    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const selectedLeaveTypeId = form.watch("leaveTypeId");

  // live requested days
  const requestedDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (end < start) return null;
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / msPerDay) + 1;
  }, [startDate, endDate]);

  // balance summary
  const { usedDays, yearlyLimit, afterThis, isNearLimit } = useMemo(() => {
    if (!selectedLeaveTypeId || !myLeaves || !leaveTypes) {
      return {
        usedDays: null as number | null,
        yearlyLimit: null as number | null,
        afterThis: null as number | null,
        isNearLimit: false,
      };
    }

    const lt = leaveTypes.find((l) => l.id === selectedLeaveTypeId);
    if (!lt || lt.yearlyLimit == null) {
      return {
        usedDays: null,
        yearlyLimit: null,
        afterThis: null,
        isNearLimit: false,
      };
    }

    const currentYear = new Date().getFullYear();
    const used = myLeaves
      .filter(
        (leave) =>
          leave.leaveTypeId === selectedLeaveTypeId &&
          (leave.status === "APPROVED" || leave.status === "PENDING") &&
          new Date(leave.startDate).getFullYear() === currentYear
      )
      .reduce((sum, leave) => sum + leave.duration, 0);

    const afterward =
      requestedDays != null ? used + requestedDays : used;

    const near =
      afterward >= lt.yearlyLimit * 0.8 && afterward <= lt.yearlyLimit;

    return {
      usedDays: used,
      yearlyLimit: lt.yearlyLimit,
      afterThis: requestedDays != null ? afterward : null,
      isNearLimit: near,
    };
  }, [selectedLeaveTypeId, myLeaves, leaveTypes, requestedDays]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4 mt-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-10 pl-3 text-left font-normal border-border/50 hover:border-primary transition-colors w-full justify-start",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick start date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const selectedMidnight = new Date(date);
                            selectedMidnight.setHours(0, 0, 0, 0);
                            return selectedMidnight < todayMidnight();
                          }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-10 pl-3 text-left font-normal border-border/50 hover:border-primary transition-colors w-full justify-start",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const dateMidnight = new Date(date);
                            dateMidnight.setHours(0, 0, 0, 0);

                            const today = todayMidnight();
                            if (dateMidnight < today) return true;

                            const fromDate = form.getValues("startDate");
                            if (fromDate) {
                              const fromMidnight = new Date(fromDate);
                              fromMidnight.setHours(0, 0, 0, 0);
                              return dateMidnight < fromMidnight;
                            }

                            return false;
                          }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={typesLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={typesLoading ? "Loading..." : "Select type"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes?.map((lt) => (
                          <SelectItem key={lt.id} value={lt.id}>
                            {lt.name}
                            {lt.yearlyLimit != null
                              ? ` (${lt.yearlyLimit} days/year)`
                              : " (Unlimited)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Days + balance summary */}
            {(requestedDays !== null || yearlyLimit != null) && (
              <div className="text-xs text-muted-foreground -mt-2 space-y-1">
                {requestedDays !== null && (
                  <p>
                    You&apos;re applying for{" "}
                    <span className="font-semibold">{requestedDays}</span>{" "}
                    {requestedDays === 1 ? "day" : "days"} of leave.
                  </p>
                )}
                {yearlyLimit != null && usedDays !== null && (
                  <p>
                    This year:{" "}
                    <span className="font-semibold">{usedDays}</span> used /
                    limit:{" "}
                    <span className="font-semibold">{yearlyLimit}</span>
                    {afterThis != null && requestedDays !== null && (
                      <>
                        , after this:{" "}
                        <span className="font-semibold">{afterThis}</span>{" "}
                        planned.
                      </>
                    )}
                  </p>
                )}
                {isNearLimit && (
                  <p className="text-amber-600">
                    You are close to your yearly limit for this leave type.
                  </p>
                )}
              </div>
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Reason for leave..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center gap-x-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset(defaultValues);
                }}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
