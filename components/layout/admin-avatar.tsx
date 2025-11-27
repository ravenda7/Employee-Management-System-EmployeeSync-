"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

type Props = {
  userName?: string;
}

export default function AdminAvatar({ userName }: Props) {
  return (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <p className="text-white">{userName}</p>
        </div>
        <button className="text-white hover:cursor-pointer" onClick={() => 
        signOut(
            {
                redirect: true,
                callbackUrl: `${window.location.origin}/login`,
          })}>
          <LogOut width={20} height={20} />
        </button>
    </div>
  );
}