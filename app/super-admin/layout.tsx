import { MobileHeader } from "@/components/layout/mobile-header";
import { Sidebar } from "@/components/layout/sidebar";
import { ConfirmDialogProvider } from "@/context/confirm-dialog";
import { DataSessionProvider } from "@/context/session";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function CompanyLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOptions)
    if(!session || !session.user) {
        redirect('/login');
    }
    const user = session.user;
    return (
        <>
        <DataSessionProvider initialSession={session}>
            <MobileHeader />
            <Sidebar user={user} className="hidden lg:flex bg-[#392B2F]" />
            <ConfirmDialogProvider>
                <main className="lg:pl-[240px] bg-[#F4F4F4] pt-[50px] lg:pt-0 min-h-screen">
                    <div className="flex-grow py-[24px] px-[12px] lg:pl-[24px] lg:pr-[26px]">
                     {children}   
                    </div>
                </main>
            </ConfirmDialogProvider>
        </DataSessionProvider>
        </>
    )
}