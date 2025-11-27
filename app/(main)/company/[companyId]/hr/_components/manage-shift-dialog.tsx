"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { toast } from "sonner"; // or your toast system
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import { formatDateToTimeString } from "@/lib/time";

const TIME_REGEX = /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/;

function isValidTime(v: string) {
  return TIME_REGEX.test(v.trim());
}

const shiftSchema = z.object({
  name: z.string().min(1, "Shift name is required"),
  startTime: z.string().min(1).refine(isValidTime, "Invalid time format"),
  endTime: z.string().min(1).refine(isValidTime, "Invalid time format"),
});

type ShiftFormData = z.infer<typeof shiftSchema>;

export default function ManageShiftDialog({
  isOpen,
  onOpenChange,
  shiftEditData,
  companyId,
}: {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  shiftEditData?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  } | null;
  companyId?: string;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!shiftEditData;

  const form = useForm<ShiftFormData>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
        name: shiftEditData?.name || "",
        startTime: shiftEditData?.startTime
            ? formatDateToTimeString(shiftEditData.startTime)
            : "",
        endTime: shiftEditData?.endTime
            ? formatDateToTimeString(shiftEditData.endTime)
            : "",
    },
  });

  // Reset when editing different shift
  useEffect(() => {
    form.reset({
        name: shiftEditData?.name || "",
        startTime: shiftEditData?.startTime
            ? formatDateToTimeString(shiftEditData.startTime)
            : "",
        endTime: shiftEditData?.endTime
            ? formatDateToTimeString(shiftEditData.endTime)
            : "",
    });
  }, [shiftEditData, isOpen]);

  // ---------- DIRECT INLINE MUTATION (your style) ----------
  const mutation = useMutation({
    mutationFn: async (data: ShiftFormData) => {
      const url = isEdit
        ? `/api/shift/${shiftEditData!.id}`
        : `/api/company/${companyId}/shifts`;

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Request failed");
      }

      return res.json();
    },

    onSuccess: () => {
        // refresh shift list
        queryClient.invalidateQueries({ queryKey: ["shifts", companyId] });
        toast(isEdit ? "Shift updated" : "Shift created");
      onOpenChange(false);
      form.reset();
    },

    onError: (error: any) => {
      toast(error.message);
    },
  });

  const onSubmit = (data: ShiftFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Shift" : "Add Shift"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Shift Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Morning Shift" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Time */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input placeholder="09:00 AM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Time */}
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input placeholder="05:00 PM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="border px-3 py-2 rounded-md text-sm"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="border px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {mutation.isPending
                  ? "Saving..."
                  : isEdit
                  ? "Update"
                  : "Create"}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
