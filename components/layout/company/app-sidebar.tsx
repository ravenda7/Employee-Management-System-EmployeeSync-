// "use client"

// import * as React from "react"
// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "@/components/ui/sidebar"
// import { LayoutDashboard, IdCardLanyard, Users, Building2, Bell, Podcast, CalendarSync } from 'lucide-react';
// import { NavMain } from "./nav-main";
// import Link from "next/link";
// import { Badge } from "@/components/ui/badge";
// import { SidebarData } from "@/lib/queries";
// import { NavUser } from "./nav-user";

// // --- Configuration Maps ---

// // 1. Utility function to map role to its *relative* prefix (no companyId needed here)
// function getRolePrefix(role: string): string {
//     switch (role) {
//         case "COMPANY_ADMIN":
//             return "/admin";
//         case "COMPANY_HR":
//             return "/hr";
//         case "EMPLOYEE":
//             return "/employee";
//         default:
//             return ""; // Fallback for the root path
//     }
// }

// // 2. Utility function to map role to panel title (No change)
// function getPanelTitle(role: string): string {
//     switch (role) {
//         case "COMPANY_ADMIN":
//             return "Admin Panel";
//         case "COMPANY_HR":
//             return "HR Panel";
//         case "EMPLOYEE":
//             return "Employee Portal";
//         default:
//             return "Dashboard";
//     }
// }


// // 3. Define ALL possible menu items with role restrictions (No change)
// // URLs are still relative to the role's prefix (e.g., '/dashboard', '/profile')
// interface NavItem {
//     title: string;
//     url: string; 
//     icon: React.ElementType;
//     requiredRoles?: string[];
// }

// const allMenuItems: NavItem[] = [
//     { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, requiredRoles: ["COMPANY_ADMIN", "COMPANY_HR", "EMPLOYEE"] },
//     { title: "Manage Employee", url: "/manage-employee", icon: IdCardLanyard, requiredRoles: ["COMPANY_ADMIN"] },
//     { title: "Manage Shifts", url: "/manage-shifts", icon: CalendarSync, requiredRoles: ["COMPANY_ADMIN"]},
//     { title: "Whitelist IP", url: "/ip-whitelist", icon: Podcast, requiredRoles: ["COMPANY_ADMIN"] },
//     { title: "All Employees", url: "/employees", icon: Users, requiredRoles: ["COMPANY_ADMIN", "COMPANY_HR"] },
//     { title: "My Profile", url: "/profile", icon: Users, requiredRoles: ["EMPLOYEE"] }, 
//     { title: "Departments", url: "/department", icon: Building2, requiredRoles: ["COMPANY_ADMIN", "COMPANY_HR"] },
//     { title: "Notifications", url: "/notifications", icon: Bell, requiredRoles: ["COMPANY_ADMIN", "COMPANY_HR", "EMPLOYEE"] },
// ];

// interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
//     sidebarData: SidebarData & { role: string; email: string; companyId: string };
//     variant: 'inset';
// }

// export function AppSidebar({ variant, sidebarData, ...props }: AppSidebarProps) {
//     const { name, email, companyName, role, companyId } = sidebarData;

//     // The fixed base of the application is the company ID
//     const companyBase = `/company/${companyId}`; 
    
//     // 4. Determine the dynamic role prefix and panel title
//     const rolePrefix = getRolePrefix(role);
//     const panelTitle = getPanelTitle(role);
    
//     // 5. Construct the FINAL absolute base path
//     // e.g., /company/abc1234/admin
//     const finalBasePath = `${companyBase}${rolePrefix}`;
    
//     // 6. Filter and map items to construct final, absolute URLs
//     const finalNavItems = allMenuItems
//         .filter(item => item.requiredRoles?.includes(role))
//         .map(item => ({
//             ...item,
//             // Construct the final URL: /company/[companyid]/[role]/[item.url]
//             url: `${finalBasePath}${item.url}`,
//         }));

//     return (
//         <Sidebar collapsible="offcanvas" {...props}>
//             <SidebarHeader>
//                 <SidebarMenu>
//                     <SidebarMenuItem>
//                         <SidebarMenuButton
//                             asChild
//                             className="data-[slot=sidebar-menu-button]:!p-1.5 h-12"
//                         >
//                             <Link
//                                 // Link the header to the role's dashboard: /company/[companyid]/[role]/dashboard
//                                 href={finalBasePath + "/dashboard"} 
//                                 className="flex items-center gap-4"
//                             >
//                                 {/* ... (Logo/Header content) */}
//                                 <div className="flex flex-col gap-1">
//                                     { (name && companyName) && (
//                                         <h2 className="text-gray-950 font-semibold text-lg">{companyName}</h2>
//                                     )}
//                                     <Badge variant="secondary" className="text-[10px]">{panelTitle}</Badge>
//                                 </div>
//                             </Link>
//                         </SidebarMenuButton>
//                     </SidebarMenuItem>
//                 </SidebarMenu>
//             </SidebarHeader>

//             <SidebarContent>
//                 {/* Pass the final, absolute URL items */}
//                 <NavMain items={finalNavItems} /> 
//             </SidebarContent>

//             <SidebarFooter>
//                 <NavUser
//                     user={{
//                         name: name ?? "",
//                         email: email ?? "",
//                         avatar: "",
//                     }}
//                 />
//             </SidebarFooter>
//         </Sidebar>
//     );
// }


















"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  IdCardLanyard,
  Users,
  Building2,
  Bell,
  Podcast,
  CalendarSync,
  CalendarRange, // 👈 new icon for Leave
} from "lucide-react"
import { NavMain } from "./nav-main"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { SidebarData } from "@/lib/queries"
import { NavUser } from "./nav-user"

// --- Configuration Maps ---

function getRolePrefix(role: string): string {
  switch (role) {
    case "COMPANY_ADMIN":
      return "/admin"
    case "COMPANY_HR":
      return "/hr"
    case "EMPLOYEE":
      return "/employee"
    default:
      return ""
  }
}

function getPanelTitle(role: string): string {
  switch (role) {
    case "COMPANY_ADMIN":
      return "Admin Panel"
    case "COMPANY_HR":
      return "HR Panel"
    case "EMPLOYEE":
      return "Employee Portal"
    default:
      return "Dashboard"
  }
}

// Allow nested items now
export type NavItem = {
  title: string
  url?: string            // 👈 optional, so parent like "Leave" can omit
  icon?: React.ElementType
  requiredRoles?: string[]
  items?: NavItem[]       // 👈 recursive children
}

const allMenuItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    requiredRoles: ["COMPANY_ADMIN", "COMPANY_HR", "EMPLOYEE"],
  },
  {
    title: "Manage Employee",
    url: "/manage-employee",
    icon: IdCardLanyard,
    requiredRoles: ["COMPANY_ADMIN"],
  },
  {
    title: "Manage Shifts",
    url: "/manage-shifts",
    icon: CalendarSync,
    requiredRoles: ["COMPANY_ADMIN"],
  },
  {
    title: "Whitelist IP",
    url: "/ip-whitelist",
    icon: Podcast,
    requiredRoles: ["COMPANY_ADMIN"],
  },
  {
    title: "My Profile",
    url: "/profile",
    icon: Users,
    requiredRoles: ["EMPLOYEE"],
  },
  {
    title: "Departments",
    url: "/department",
    icon: Building2,
    requiredRoles: ["COMPANY_ADMIN", "COMPANY_HR"],
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    requiredRoles: ["COMPANY_ADMIN", "COMPANY_HR", "EMPLOYEE"],
  },

  // ⭐ NEW: Leave group with collapsible children
  {
    title: "Leave",
    icon: CalendarRange,
    requiredRoles: ["COMPANY_ADMIN", "COMPANY_HR"],
    // relative URLs, they will be prefixed with /company/[id]/[role]
    items: [
      {
        title: "Manage Leave Type",
        url: "/leave/manage-type",
      },
      {
        title: "Leave Request",
        url: "/leave/requests",
      },
    ],
  },

  { 
    title: "Leave",
    url: "/leave",
    icon: CalendarRange,
    requiredRoles: ["EMPLOYEE"],
    }
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  sidebarData: SidebarData & { role: string; email: string; companyId: string }
  variant: "inset"
}

export function AppSidebar({ variant, sidebarData, ...props }: AppSidebarProps) {
  const { name, email, companyName, role, companyId } = sidebarData

  const companyBase = `/company/${companyId}`
  const rolePrefix = getRolePrefix(role)
  const panelTitle = getPanelTitle(role)
  const finalBasePath = `${companyBase}${rolePrefix}`

  const finalNavItems: NavItem[] = allMenuItems
    .filter((item) => item.requiredRoles?.includes(role))
    .map((item) => ({
      ...item,
      url: item.url ? `${finalBasePath}${item.url}` : undefined,
      items: item.items
        ? item.items.map((sub) => ({
            ...sub,
            url: `${finalBasePath}${sub.url}`, // map children too
          }))
        : undefined,
    }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 h-12"
            >
              <Link
                href={finalBasePath + "/dashboard"}
                className="flex items-center gap-4"
              >
                <div className="flex flex-col gap-1">
                  {name && companyName && (
                    <h2 className="text-gray-950 font-semibold text-lg">
                      {companyName}
                    </h2>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {panelTitle}
                  </Badge>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={finalNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: name ?? "",
            email: email ?? "",
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
