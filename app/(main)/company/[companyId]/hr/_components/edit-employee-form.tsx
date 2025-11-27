'use client'

import { useSessionData } from "@/context/session";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoveLeft, X } from "lucide-react";
import ImageUpload from "./image-upload";
import { useRouter } from "next/navigation";
import { formatDateToTimeString } from "@/lib/time";

interface EmployeeById {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  departmentId: string | null;
  shiftId: string | null;
  baseSalary: number | null;
}

const employeeSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  departmentId: z.string().uuid("Invalid department ID"),
  baseSalary: z.number().min(0, "Base salary must be a positive number"),
  shiftId: z.string().uuid("Invalid shift ID"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Props {
  initialData: EmployeeById;
}

export default function EditEmployeeForm({ initialData }: Props) {
  const { user } = useSessionData();
  const queryClient = useQueryClient();
  const router = useRouter();
  const companyId = user?.companyId;

  // ✅ We store both the current image URL (from DB) and the new image file (if changed)
  const [imageUrl, setImageUrl] = useState(initialData.avatarUrl || "");
  const [image, setImage] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      email: initialData.email,
      name: initialData.name,
      departmentId: initialData.departmentId ?? "",
      shiftId: initialData.shiftId ?? "",
      baseSalary: initialData.baseSalary ?? 0,
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/company/${companyId}/department`);
      return res.json();
    },
  });

  const { data: shifts } = useQuery({
    queryKey: ["shifts", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/company/${companyId}/shifts`);
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("name", data.name);
      formData.append("departmentId", data.departmentId);
      formData.append("shiftId", data.shiftId);
      formData.append("baseSalary", String(data.baseSalary));

      // ✅ Only append the file if a new one is selected
      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(`/api/employees/${initialData.id}`, {
        method: "PATCH",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update employee");
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Employee updated successfully");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      reset();
      setImage(null);
      router.push(`/company/${companyId}/admin/manage-employee`)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update employee");
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    mutation.mutate(data);
  };

  return (
        <div className="flex flex-col gap-4 px-6 py-8 rounded-md bg-white shadow-lg border border-slate-200">
          <form className="flex flex-col gap-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* --- Name & Email --- */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div className="space-y-3 flex-1">
                <Label>Employee Name</Label>
                <Input
                  placeholder="Enter Employee Name"
                  {...register("name")}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
              <div className="space-y-3 flex-1">
                <Label>Email</Label>
                <Input
                  placeholder="Enter Email"
                  {...register("email")}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>
            </div>

            {/* --- Department --- */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div className="space-y-3 flex-1">
                <Label>Department</Label>
                <Select
                value={watch("departmentId") || ""}
                onValueChange={(value) => setValue("departmentId", value)}
                >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                    {departments?.data?.map((department: any) => (
                    <SelectItem key={department.id} value={String(department.id)}>
                        {department.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                {errors.departmentId && (
                  <p className="text-red-500 text-sm">{errors.departmentId.message}</p>
                )}
              </div>
            </div>

            {/* --- Base Salary --- */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div className="space-y-3 flex-1">
                <Label>Base Salary</Label>
                <Input
                  placeholder="Enter Base Salary"
                  type="number"
                  min="0"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    if (Number(input.value) < 0) input.value = "0";
                  }}
                  {...register("baseSalary", { valueAsNumber: true })}
                />
                {errors.baseSalary && (
                  <p className="text-red-500 text-sm">{errors.baseSalary.message}</p>
                )}
              </div>
            </div>

            {/* --- Shifts --- */}
             <div className="space-y-3 flex-1">
                <Label>Shift</Label>
                <Select
                value={watch("shiftId") || ""}
                onValueChange={(value) => setValue("shiftId", value)}
                >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Shift" />
                </SelectTrigger>
                <SelectContent>
                    {shifts?.map((shift: any) => (
                    <SelectItem key={shift.id} value={shift.id}>
                        {shift.name} {formatDateToTimeString(shift.startTime)} - {formatDateToTimeString(shift.endTime)}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                {errors.shiftId && (
                  <p className="text-red-500 text-sm">{errors.shiftId.message}</p>
                )}
              </div>

            {/* --- Profile Image --- */}
            <div className="space-y-3 flex-1">
              <Label>Profile Picture</Label>
              {imageUrl && !image ? (
                <div className="relative group w-[72px] h-[72px] border border-gray-300 rounded-[8px] overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Current avatar"
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageUrl("")}}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                        aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <ImageUpload image={image} setImage={setImage} />
              )}
            </div>

            {/* --- Submit --- */}
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Updating..." : "Update Employee"}
            </Button>
          </form>
        </div>
  );
}
