'use client'
import { SiteHeader } from "@/components/layout/company/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSessionData } from "@/context/session"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { MoveLeft } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import ImageUpload from "../../_components/image-upload"

const employeeSchema = z.object({
    email: z.email(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    name: z.string().min(1, "Name is required"),
    departmentId: z.uuid("Invalid department ID"),
    baseSalary: z.number().min(0, "Base salary must be a positive number"),
    role: z.enum(['EMPLOYEE', 'COMPANY_HR'])
})

// Extract the options from the Zod enum and export them
export const ROLE_OPTIONS = employeeSchema.shape.role.options; 
// ROLE_OPTIONS is now ['EMPLOYEE', 'COMPANY_HR']

// Helper function (optional, but good practice)
export const formatRoleForDisplay = (role: string): string => {
    return role
        .replace('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

type EmployeeFormData = z.infer<typeof employeeSchema>

export default function NewEmployeePage() {
    const { user } = useSessionData();
    const companyId = user?.companyId;
    const [image, setImage] = useState<File | null>(null);
    const queryClient = useQueryClient();
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm<EmployeeFormData>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
            departmentId: "",
            baseSalary: 0,
            role: "EMPLOYEE"
        }
    })

    const { data: departments } = useQuery({
        queryKey: ["departments"],
        queryFn: async () => {
        const res = await fetch(`/api/company/${companyId}/department`);
            return res.json()
        },
    })

    const mutation = useMutation({
        mutationFn: async (data: EmployeeFormData) => {

        if (!image) {
            throw new Error("Profile image is required");
        }

        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("name", data.name);
        formData.append("departmentId", data.departmentId);
        formData.append("baseSalary", String(data.baseSalary));
        formData.append("role", data.role);
        formData.append("image", image); // File object

        const response = await fetch(`/api/company/${companyId}/employee`, {
            method: "POST",
            body: formData, // No Content-Type here! Let browser set it.
        });

        const result = await response.json();

        if (!response.ok) {
        throw new Error(result.message || "Failed to create employee");
        }

        return result;
        },
        onSuccess: () => {
            toast.success("Employee created successfully");
            queryClient.invalidateQueries({ queryKey: ["admins"] });
            reset();
            setImage(null);
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create employee");
        }
    })
    
    const onSubmit = (data: EmployeeFormData) => {
        mutation.mutate(data);
    }
    return (
        <>
        <SiteHeader title="Create Employee Accounts" />
        <div className="flex flex-col gap-5 px-4">
           <div className="flex items-center gap-6">
                <Button variant='outline' onClick={() => window.history.back()}>
                    <MoveLeft />
                    <p>Back</p>
                </Button>
           </div>
           <div className="px-10">
                <div className="flex flex-col gap-4 px-6 py-8 rounded-md bg-white shadow-lg border border-slate-200">
                    <form className="flex flex-col gap-y-4"
                    onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                            <div className="space-y-3 flex-1">
                                <Label>Employee Name</Label>
                                <Input placeholder="Enter Employee Name"
                                className=""
                                {...register("name")}  />
                                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-3 flex-1">
                                <Label>Email</Label>
                                <Input placeholder="Enter Email"
                                className=""
                                {...register("email")}  />
                                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                            <div className="space-y-3 flex-1">
                                <Label>Password</Label>
                                <Input placeholder="Enter Password"
                                className=""
                                {...register("password")}  />
                                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                            </div>
                            <div className="space-y-3 flex-1">
                                <Label>Department</Label>
                                <Select  onValueChange={(value) => setValue("departmentId", value)}>
                                    <SelectTrigger className="w-full" >
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
                                {errors.departmentId && <p className="text-red-500 text-sm">{errors.departmentId.message}</p>}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                            <div className="space-y-3 flex-1">
                                <Label>Base Salary</Label>
                                <Input placeholder="Enter Base Salary"
                                type="number"
                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min="0"
                                onInput={(e) => {
                                    const input = e.target as HTMLInputElement;
                                    if (Number(input.value) < 0) input.value = "0";
                                }}
                                {...register("baseSalary", { valueAsNumber: true })} />
                                {errors.baseSalary && <p className="text-red-500 text-sm">{errors.baseSalary.message}</p>}
                            </div>
                            <div className="space-y-3 flex-1">
                                <Label>Role</Label>
                                <Select 
                                    onValueChange={(value) => setValue("role", value as "EMPLOYEE" | "COMPANY_HR")} 
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_OPTIONS.map((roleValue) => (
                                            <SelectItem 
                                                key={roleValue} 
                                                value={roleValue} // value sent to the form (e.g., 'COMPANY_HR')
                                            >
                                                {formatRoleForDisplay(roleValue)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            <Label>Profile Picture</Label>
                            <ImageUpload 
                                image={image}
                                setImage={setImage}
                            />
                        </div>
                        <Button 
                        type="submit" 
                        disabled={mutation.isPending} 
                        className="w-full">
                            {mutation.isPending ? "Creating..." : "Create Employee"}
                        </Button>
                    </form>
                </div>
           </div>
        </div>
        </>
    )
}