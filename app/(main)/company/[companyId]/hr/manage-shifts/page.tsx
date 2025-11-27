import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SiteHeader } from "@/components/layout/company/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ManageShifts from "../_components/manage-shifts";

export default async function ManageShiftPage() {
    const session = await getServerSession(authOptions);
        if(!session || !session.user || !session.user.companyId) {
            redirect('/login');
        }
        const user = session.user;
    return (
        <>
            <SiteHeader title="Shift Management" />
            <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
                <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-md" />}>
                    <ManageShifts />
                </Suspense>
            </section>
        </>
    )
}