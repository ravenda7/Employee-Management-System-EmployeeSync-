// "use client"

// import {
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "@/components/ui/sidebar"
// import Link from "next/link"

// export function NavMain({
//   items,
// }: {
//   items: {
//     title: string
//     url: string
//     icon?: React.ElementType
//   }[]
// }) {
//   return (
//     <SidebarGroup>
//       <SidebarGroupContent className="flex flex-col gap-2">
//         <SidebarMenu>
//           {items.map((item) => (
//             <Link href={item.url} key={item.title}>
//             <SidebarMenuItem>
//               <SidebarMenuButton tooltip={item.title}>
//                 {item.icon && <item.icon />}
//                 <span>{item.title}</span>
//               </SidebarMenuButton>
//             </SidebarMenuItem>
//             </Link>
//           ))}
//         </SidebarMenu>
//       </SidebarGroupContent>
//     </SidebarGroup>
//   )
// }














"use client"

import { useState } from "react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

// 👇 import the shared type
import type { NavItem } from "./app-sidebar"

export function NavMain({ items }: { items: NavItem[] }) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) =>
            item.items && item.items.length > 0 ? (
              // 🔽 Collapsible parent (e.g. Leave)
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  type="button"
                  onClick={() => toggleExpanded(item.title)}
                  className="cursor-pointer"
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span className="flex-1 text-left">{item.title}</span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      expandedItems[item.title] ? "rotate-90" : ""
                    }`}
                  />
                </SidebarMenuButton>

                {expandedItems[item.title] && (
                  <SidebarMenuSub>
                    {item.items.map((subItem) =>
                      subItem.url ? ( // 👈 narrow so TS knows url is string
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url}>{subItem.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ) : null
                    )}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ) : (
              // 🔹 Normal single-level item
              item.url && (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="flex items-center gap-2">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
