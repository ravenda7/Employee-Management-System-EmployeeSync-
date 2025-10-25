"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarSubDropdownItem } from "./siderbar-sub-dropdown-items";

type Props = {
    label: string;
    iconSrc: string;
    href: string;
};

export const SidebarDropdownItem = ({
    label,
    iconSrc,
    href,
}: Props) => {
    const pathname = usePathname();
    const active = pathname === href;
    return(
        <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
            <AccordionTrigger 
             className={cn(
                "h-[52px] w-full px-[28px] items-center text-white hover:cursor-pointer",
                    active ? "bg-[#5c454b]" : "bg-transparent"
                )}
            >
                <div className="flex items-center justify-start h-full gap-2">
                <Image
                src={iconSrc}
                alt={label}
                className="mr-[2.75px]"
                height={24}
                width={24}
                />
                {label}
                </div>
            </AccordionTrigger>
            <AccordionContent className="pl-[60px] pr-[16px] flex flex-col">
                {label === "Products" && (
                    <>
                <SidebarSubDropdownItem
                label="Add Products"
                href="/superadmin/final-test/create"
                />
                <SidebarSubDropdownItem
                label="Variations"
                href="/superadmin/products/variations"
                />
                <SidebarSubDropdownItem
                label="Manage"
                href="/superadmin/products/manage"
                />
                <SidebarSubDropdownItem
                label="Category"
                href="/superadmin/products/category"
                />
                <SidebarSubDropdownItem
                label="Brand"
                href="/superadmin/products/brand"
                />
                </>
                )}
                {label === "User" && (
                    <>
                <SidebarSubDropdownItem
                label="Manage"
                href="/superadmin/user/manage"
                />
                <SidebarSubDropdownItem
                label="Add"
                href="/superadmin/user/add"
                />
                </>
                )}

                {label === "Order & Reviews" && (
                    <>
                    <SidebarSubDropdownItem
                    label="Manage Order"
                    href="/superadmin/order/manage"
                    />
                    <SidebarSubDropdownItem
                    label="Manage Review"
                    href="/superadmin/order/review"
                    />
                    </>
                )}
            </AccordionContent>
        </AccordionItem>
        </Accordion>
    )
}