"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Command, Loader } from "lucide-react";
import { SidebarItem } from "./sidebar-item";
import { SidebarDropdownItem } from "./siderbar-dropdown-item";
import AdminAvatar from "./admin-avatar";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useQuery } from "@tanstack/react-query";
type Props = {
    className?: string;
};

export const  Sidebar = ({className} : Props) => {
    const { data: user, isLoading: isUserLoading } = useQuery<UserData>({
        queryKey: ['user'],
        queryFn: async () => {
            const res = await fetch('/api/user');
            if (!res.ok) throw new Error('Failed to fetch user');
            return res.json();
        }
    });

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

               <SidebarDropdownItem
               label="User"
               href="/super-admin/user"
               iconSrc="/icons/user.svg"
               />

            </div> 
            
            <div className="py-6 flex flex-col  gap-y-2">
                <Link href="/superadmin/setting">
                <Button variant="unactive" className="w-full flex flex-row justify-between items-center h-[40px] px-[28px]">
                    <div className="flex items-center gap-2">
                        <Image src="/icons/setting.svg" height={20} width={20} alt="Chat Icon" />
                        <p>Setting</p>
                    </div>
                </Button>
                </Link>
                <div className="px-[16px] flex flex-col gap-3">
                    <Separator className="my-2" />
                    { isUserLoading ? (
                    <Loader className="h-5 w-5 rext-muted-foreground animate-spin" />
                    ): (
                    <AdminAvatar userName={user?.name} />
                    )}
                </div>
            </div>
        </div>
    );
};