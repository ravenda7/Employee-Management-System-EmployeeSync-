"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const leaveTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  yearlyLimit: z.string().optional(), // string in form, we parse manually
  isPaid: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
});

type LeaveTypeFormData = z.infer<typeof leaveTypeSchema>;

interface LeaveTypeEditData {
  id: string;
  name: string;
  code: string;
  yearlyLimit: number | null;
  isPaid: boolean;
  requiresApproval: boolean;
}

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leaveTypeEditData?: LeaveTypeEditData | null;
  companyId?: string;
}

export default function ManageLeaveTypeDialog({
  isOpen,
  onOpenChange,
  leaveTypeEditData,
  companyId,
}: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!leaveTypeEditData;

  const form = useForm({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      name: leaveTypeEditData?.name || "",
      code: leaveTypeEditData?.code || "",
      yearlyLimit:
        leaveTypeEditData?.yearlyLimit != null
          ? String(leaveTypeEditData.yearlyLimit)
          : "",
      isPaid: leaveTypeEditData?.isPaid ?? true,
      requiresApproval: leaveTypeEditData?.requiresApproval ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      name: leaveTypeEditData?.name || "",
      code: leaveTypeEditData?.code || "",
      yearlyLimit:
        leaveTypeEditData?.yearlyLimit != null
          ? String(leaveTypeEditData.yearlyLimit)
          : "",
      isPaid: leaveTypeEditData?.isPaid ?? true,
      requiresApproval: leaveTypeEditData?.requiresApproval ?? true,
    });
  }, [leaveTypeEditData, isOpen, form]);

  const mutation = useMutation({
    mutationFn: async (values: LeaveTypeFormData) => {
      if (!companyId && !isEdit) {
        throw new Error("Missing companyId");
      }

      // parse yearlyLimit string -> number | null
      let yearlyLimit: number | null = null;
      if (values.yearlyLimit && values.yearlyLimit.trim() !== "") {
        const n = Number(values.yearlyLimit);
        if (Number.isNaN(n)) {
          throw new Error("Yearly limit must be a valid number");
        }
        yearlyLimit = n;
      }

      const payload = {
        name: values.name.trim(),
        code: values.code.trim(),
        isPaid: values.isPaid,
        requiresApproval: values.requiresApproval,
        yearlyLimit, // null = unlimited
      };

      const url = isEdit
        ? `/api/leave-type/${leaveTypeEditData!.id}`
        : `/api/company/${companyId}/leave-types`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Request failed");
      }

      return res.json();
    },
    onSuccess: () => {
      toast(isEdit ? "Leave type updated" : "Leave type created");
      queryClient.invalidateQueries({ queryKey: ["leaveTypes", companyId] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast(error.message || "Something went wrong");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Leave Type" : "Add Leave Type"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              // let RHF infer types; we just pass to mutation
              mutation.mutate(values);
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sick Leave" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="SL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="yearlyLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yearly Limit (days)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 12 (leave blank for unlimited)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-6">
              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(val) => field.onChange(Boolean(val))}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Paid Leave</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiresApproval"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(val) => field.onChange(Boolean(val))}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Requires approval
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Saving..."
                  : isEdit
                  ? "Update"
                  : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}





// "use client" 


// export default function ManageLeaveTypes() {

//     return (
//         <div>

//         </div>
//     )
// }