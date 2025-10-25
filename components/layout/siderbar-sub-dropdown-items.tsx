"use client";

import { Button } from "../ui/button";
import Link from "next/link";

type Props = {
    label: string;
    href: string;
};

export const SidebarSubDropdownItem = ({
    label,
    href,
}: Props) => {
    return(
        <Button 
        className="justify-start h-[45px] text-white px-0 py-0 bg-transparent hover:bg-transparent"
        asChild
        >
            <Link href={href}>
             {label}
            </Link>
        </Button>
    )
}