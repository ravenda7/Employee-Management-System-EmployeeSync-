"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect } from "react";

const schema = z.object({
  timestamp: z.string().min(1, "Timestamp is required"),
  verificationStatus: z.enum(["IN_OFFICE", "REMOTE", "MANUAL_ADJUSTMENT"]),
  manualNote: z.string().optional(),
});

type AdjustFormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: string | null;
  initialTimestamp?: string; // ISO
  initialStatus?: "IN_OFFICE" | "REMOTE" | "MANUAL_ADJUSTMENT";
}

export default function AdjustAttendanceDialog({
  open,
  onOpenChange,
  attendanceId,
  initialTimestamp,
  initialStatus = "MANUAL_ADJUSTMENT",
}: Props) {
  const queryClient = useQueryClient();

  const form = useForm<AdjustFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      timestamp: initialTimestamp
        ? new Date(initialTimestamp).toISOString().slice(0, 16) // for datetime-local
        : new Date().toISOString().slice(0, 16),
      verificationStatus: initialStatus,
      manualNote: "",
    },
  });

  // reset when dialog opens for a different record
useEffect(() => {
    if (!open || !attendanceId) return;
    form.reset({
      timestamp: initialTimestamp
        ? new Date(initialTimestamp).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      verificationStatus: initialStatus,
      manualNote: "",
    });
  }, [open, attendanceId, initialTimestamp, initialStatus, form]);

  const mutation = useMutation({
    mutationFn: async (values: AdjustFormData) => {
      if (!attendanceId) throw new Error("Missing attendance id");

      const res = await fetch(`/api/attendance/${attendanceId}/manual-adjustment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date(values.timestamp).toISOString(),
          verificationStatus: values.verificationStatus,
          manualNote: values.manualNote,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to adjust attendance");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Attendance adjusted");
      queryClient.invalidateQueries({ queryKey: ["companyAttendance"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  const onSubmit = (data: AdjustFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Attendance Adjustment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="timestamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timestamp</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="verificationStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Status</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN_OFFICE">IN_OFFICE</SelectItem>
                        <SelectItem value="REMOTE">REMOTE</SelectItem>
                        <SelectItem value="MANUAL_ADJUSTMENT">
                          MANUAL_ADJUSTMENT
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manualNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Reason for manual adjustment..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
