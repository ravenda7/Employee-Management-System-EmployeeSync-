"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";

type Props = {
    label: string;
    iconSrc: string;
    href: string;
};

export const SidebarItem = ({
    label,
    iconSrc,
    href,
}: Props) => {
    const pathname = usePathname();
    const active = pathname === href;
    return(
        <Button variant={active ? "active" : "unactive"} 
        className="justify-start h-[52px] text-white pl-[28px]"
        asChild
        >
            <Link href={href}>
                <Image 
                src={iconSrc}
                alt={label}
                className="mr-[2.75px]"
                height={24}
                width={24}
                />
             {label}
            </Link>
           
        </Button>
    )
}