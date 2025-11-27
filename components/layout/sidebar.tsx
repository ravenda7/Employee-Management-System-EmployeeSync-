"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Command } from "lucide-react";
import { SidebarItem } from "./sidebar-item";
import AdminAvatar from "./admin-avatar";
import { Separator } from "../ui/separator";
type Props = {
    className?: string;
    user?: any;
};

export const  Sidebar = ({className, user} : Props) => {
    // const { data: user, isLoading: isUserLoading } = useQuery<UserData>({
    //     queryKey: ['user'],
    //     queryFn: async () => {
    //         const res = await fetch('/api/user');
    //         if (!res.ok) throw new Error('Failed to fetch user');
    //         return res.json();
    //     }
    // });

    return(
        <div className={cn(
        "flex h-full lg:w-[240px] lg:fixed left-0 top-0 border-r-2 flex-col",
        className,
        )}>
            <Link href="/superadmin/dashboard">
             <div className="flex items-center gap-x-3 text-purple-300 py-6 pl-[28px]">
                    <Command className="w-8 h-8" />
                    <span className="font-title font-bold text-lg">Employee Sync</span>
                </div>
            </Link>
            
            <div className="flex flex-col gap-y-2 flex-1 overflow-y-auto standard-scrollbar">
               <SidebarItem 
               label="Dashboard" 
               href="/super-admin/dashboard"
               iconSrc="/icons/dashboard.svg"
               />

                <SidebarItem 
               label="Tenants" 
               href="/super-admin/tenants"
               iconSrc="/icons/user.svg"
               />

            </div> 
            
            <div className="py-6">
                <div className="px-[16px] flex flex-col gap-3">
                    <Separator className="my-2" />
                    <AdminAvatar userName={user?.name || "SuperAdmin"} />
                </div>
            </div>
        </div>
    );
};