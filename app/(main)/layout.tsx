import { AppSidebar } from "@/components/layout/company/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ConfirmDialogProvider } from "@/context/confirm-dialog";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getCompanyDetails, SidebarData } from "@/lib/queries";
import { DataSessionProvider } from "@/context/session";

export default async function CompanyLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOptions)
    if(!session || !session.user || !session.user.companyId) {
        redirect('/login');
    }
    const user = session.user;
    const companyName = await getCompanyDetails(user?.companyId ?? "");

    const sidebarData: SidebarData = {
        name: user.name || 'User', // Use fallback for name if optional
        companyId: user.companyId || '',
        email: user.email || '',
        role:user.role || '',
        companyName: companyName?.companyName || '',
    };
    return (
        <>
        <DataSessionProvider initialSession={session}>
            <ConfirmDialogProvider>
                <SidebarProvider
                    style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                    }
                >
                    <AppSidebar variant="inset" sidebarData={sidebarData} />
                    <SidebarInset>
                    <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        {children}
                    </div>
                    </div>
                    </SidebarInset>
                </SidebarProvider>
            </ConfirmDialogProvider>
            </DataSessionProvider>
        </>
    )
}