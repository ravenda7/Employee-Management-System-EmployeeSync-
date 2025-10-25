import { MobileHeader } from "@/components/layout/mobile-header";
import { Sidebar } from "@/components/layout/sidebar";
import { ConfirmDialogProvider } from "@/context/confirm-dialog";

export default function CompanyLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <MobileHeader />
            <Sidebar className="hidden lg:flex bg-[#392B2F]" />
            <ConfirmDialogProvider>
                <main className="lg:pl-[240px] bg-[#F4F4F4] pt-[50px] lg:pt-0 min-h-screen">
                    <div className="flex-grow py-[24px] px-[12px] lg:pl-[24px] lg:pr-[26px]">
                     {children}   
                    </div>
                </main>
            </ConfirmDialogProvider>
        </>
    )
}