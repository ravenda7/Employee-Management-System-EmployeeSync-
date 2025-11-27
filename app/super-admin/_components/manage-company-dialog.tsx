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
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect } from "react";

const schema = z.object({
  name: z.string().min(1, "Company name is required"),
  adminEmail: z.string().email("Invalid admin email"),
});

type CompanyFormData = z.infer<typeof schema>;

type CompanyEditData = {
  id: string;
  name: string;
  adminEmail: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: CompanyEditData | null;
}

export default function ManageCompanyDialog({
  open,
  onOpenChange,
  editData,
}: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: editData?.name || "",
      adminEmail: editData?.adminEmail || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: editData?.name || "",
        adminEmail: editData?.adminEmail || "",
      });
    }
  }, [open, editData, form]);

  const mutation = useMutation({
    mutationFn: async (values: CompanyFormData) => {
      const url = isEdit
        ? `/api/superadmin/companies/${editData!.id}`
        : "/api/superadmin/companies";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Request failed");
      }

      return res.json();
    },
    onSuccess: () => {
      toast(isEdit ? "Company updated" : "Company created");
      queryClient.invalidateQueries({ queryKey: ["superadmin", "companies"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast(error.message || "Something went wrong");
    },
  });

  const onSubmit = (values: CompanyFormData) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Tenant" : "Create Tenant"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@company.com"
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
