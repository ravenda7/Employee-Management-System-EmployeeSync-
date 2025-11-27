"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useSessionData } from "@/context/session";
import { SiteHeader } from "@/components/layout/company/site-header";

// ---------- Schemas ----------

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

type ProfileResponse = {
  id: string;
  name: string | null;
  email: string | null;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "COMPANY_HR" | "EMPLOYEE";
  avatarUrl: string | null;
  companyId: string | null;
  departmentName: string | null;
  shiftName: string | null;
  joinDate: string;
  isActive: boolean;
};

export default function ProfilePage() {
  const params = useParams<{ employeeId: string }>();
  const { user } = useSessionData();
  const queryClient = useQueryClient();

  const employeeId = params.employeeId;

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // --- Profile form ---
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  });

  // --- Password form ---
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Fetch profile
  const { data, isLoading } = useQuery<ProfileResponse>({
    queryKey: ["profile", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const res = await fetch(`/api/profile/${employeeId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load profile");
      }
      return res.json();
    },
  });

  // Init forms when data loads
  useEffect(() => {
    if (data) {
      profileForm.reset({
        name: data.name ?? "",
      });
      setAvatarPreview(data.avatarUrl ?? null);
    }
  }, [data, profileForm]);

  const isOwnProfile = user?.id === employeeId;

  // ------- Profile update mutation -------
  const profileMutation = useMutation({
    mutationFn: async (values: ProfileFormData) => {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      if (file) {
        formData.append("image", file);
      }

      const res = await fetch(`/api/profile/${employeeId}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update profile");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Profile updated");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["profile", employeeId] });

      // (Optional) if own profile: trigger session refresh in your app
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const onProfileSubmit = (values: ProfileFormData) => {
    profileMutation.mutate(values);
  };

  // ------- Password change mutation -------
  const passwordMutation = useMutation({
    mutationFn: async (values: PasswordFormData) => {
      const res = await fetch(`/api/profile/${employeeId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to change password");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to change password");
    },
  });

  const onPasswordSubmit = (values: PasswordFormData) => {
    if (!isOwnProfile) {
      toast.error("You can only change your own password.");
      return;
    }
    passwordMutation.mutate(values);
  };

  // --- Avatar selection handler ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f || null);

    if (f) {
      const url = URL.createObjectURL(f);
      setAvatarPreview(url);
    } else {
      setAvatarPreview(data?.avatarUrl ?? null);
    }
  };

  return (
    <>
    <SiteHeader title="Manage Your Profile" />
        <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
            <div className="space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-semibold">Profile</h1>
                <p className="text-sm text-muted-foreground">
                Manage your personal information and change your password.
                </p>
            </div>

            {isLoading || !data ? (
                <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Loading profile...
                </CardContent>
                </Card>
            ) : (
                <>
                {/* Top: avatar + profile fields */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px,1fr]">
                    {/* Left: avatar & meta */}
                    <Card>
                    <CardContent className="pt-4 flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xl font-semibold">
                        {avatarPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                            src={avatarPreview}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            />
                        ) : (
                            <span>
                            {data.name
                                ?.split(" ")
                                .map((p) => p[0]?.toUpperCase())
                                .join("") || "U"}
                            </span>
                        )}
                        </div>

                        <div className="space-y-1 text-center">
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-xs text-muted-foreground">{data.email}</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 text-xs">
                        <Badge variant="outline">{data.role}</Badge>
                        {data.departmentName && (
                            <Badge variant="outline">
                            Dept: {data.departmentName}
                            </Badge>
                        )}
                        {data.shiftName && (
                            <Badge variant="outline">Shift: {data.shiftName}</Badge>
                        )}
                        {data.isActive === false && (
                            <Badge variant="destructive">Inactive</Badge>
                        )}
                        </div>

                        <div className="w-full space-y-2 pt-2">
                        <Label htmlFor="avatar" className="text-xs">
                            Profile image
                        </Label>
                        <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            JPG/PNG recommended, max a few MB.
                        </p>
                        </div>
                    </CardContent>
                    </Card>

                    {/* Right: profile form */}
                    <Card>
                    <CardContent className="pt-4">
                        <Form {...profileForm}>
                        <form
                            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Full name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                            <div className="space-y-1">
                            <Label>Email</Label>
                            <Input value={data.email ?? ""} disabled />
                            <p className="text-[11px] text-muted-foreground">
                                Email is managed by your company admin.
                            </p>
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                profileForm.reset({ name: data.name ?? "" })
                                }
                                disabled={profileMutation.isPending}
                            >
                                Reset
                            </Button>
                            <Button
                                type="submit"
                                disabled={profileMutation.isPending}
                            >
                                {profileMutation.isPending
                                ? "Saving..."
                                : "Save changes"}
                            </Button>
                            </div>
                        </form>
                        </Form>
                    </CardContent>
                    </Card>
                </div>

                {/* Bottom: Change password */}
                <Card>
                    <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm font-medium">Change password</p>
                        <p className="text-xs text-muted-foreground">
                            Choose a strong password you haven&apos;t used before.
                        </p>
                        </div>
                    </div>

                    {!isOwnProfile && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                        You can only change your own password. To reset another
                        employee&apos;s password, add a separate admin flow later.
                        </p>
                    )}

                    <div className="pt-2">
                        <Form {...passwordForm}>
                        <form
                            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                            className="space-y-3 max-w-md"
                        >
                            <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Current password</FormLabel>
                                <FormControl>
                                    <Input
                                    type="password"
                                    autoComplete="current-password"
                                    disabled={!isOwnProfile || passwordMutation.isPending}
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                            <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>New password</FormLabel>
                                <FormControl>
                                    <Input
                                    type="password"
                                    autoComplete="new-password"
                                    disabled={!isOwnProfile || passwordMutation.isPending}
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                            <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Confirm new password</FormLabel>
                                <FormControl>
                                    <Input
                                    type="password"
                                    autoComplete="new-password"
                                    disabled={!isOwnProfile || passwordMutation.isPending}
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                            <div className="pt-3 flex justify-end">
                            <Button
                                type="submit"
                                disabled={
                                !isOwnProfile || passwordMutation.isPending
                                }
                            >
                                {passwordMutation.isPending
                                ? "Updating..."
                                : "Update password"}
                            </Button>
                            </div>
                        </form>
                        </Form>
                    </div>
                    </CardContent>
                </Card>
                </>
            )}
            </div>
        </section>
    </>
  );
}
