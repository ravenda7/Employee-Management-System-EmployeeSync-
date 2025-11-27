"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmployeeMultiSelect } from "./employee-multi-select";

const schema = z
  .object({
    empIds: z.array(z.string()).min(1, "Select at least one employee"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    manualDeductions: z
      .string()
      .optional()
      .refine(
        (v) => v === undefined || v === "" || !Number.isNaN(Number(v)),
        { message: "Manual deductions must be a valid number" }
      ),
    note: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      new Date(data.startDate) <= new Date(data.endDate),
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    }
  );

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

interface PayrollResponse {
  summary?: {
    net?: number;
  };
  // add other fields from your API if you need them later
}

export default function GeneratePayrollDialog({
  open,
  onOpenChange,
  companyId,
}: Props) {
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      empIds: [],
      startDate: "",
      endDate: "",
      manualDeductions: "0",
      note: "",
    },
  });

  const mutation = useMutation<PayrollResponse[], Error, FormData>({
    mutationFn: async (values) => {
      // Normalize manualDeductions to number
      const manualDeductionsNumber = values.manualDeductions
        ? Number(values.manualDeductions)
        : 0;

      // call the same POST endpoint for each employee
      const results = await Promise.all(
        values.empIds.map(async (empId) => {
          const res = await fetch(`/api/company/${companyId}/payrolls`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              empId,
              startDate: values.startDate,
              endDate: values.endDate,
              manualDeductions: manualDeductionsNumber,
              note: values.note || undefined,
              simulateOnly: false,
            }),
          });

          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as {
              message?: string;
            };
            throw new Error(
              err.message ||
                `Failed to create payroll for employee ${empId}`
            );
          }

          return (await res.json()) as PayrollResponse;
        })
      );

      return results;
    },
    onSuccess: (data) => {
      const count = Array.isArray(data) ? data.length : 1;
      toast.success(`Payroll generated for ${count} employee(s).`);
      queryClient.invalidateQueries({ queryKey: ["payrolls", companyId] });

      form.reset({
        empIds: [],
        startDate: "",
        endDate: "",
        manualDeductions: "0",
        note: "",
      });

      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate payroll");
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset({
        empIds: [],
        startDate: "",
        endDate: "",
        manualDeductions: "0",
        note: "",
      });
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Payroll</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Employee multi-select */}
            <FormField
              control={form.control}
              name="empIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employees</FormLabel>
                  <FormControl>
                    <EmployeeMultiSelect
                      companyId={companyId}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Manual deductions */}
            <FormField
              control={form.control}
              name="manualDeductions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manual Deductions (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Note for this payroll batch..."
                      {...field}
                      disabled={mutation.isPending}
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
                onClick={() => handleDialogChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Generating..." : "Generate Payroll"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
