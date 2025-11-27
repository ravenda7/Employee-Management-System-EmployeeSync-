import { SiteHeader } from "@/components/layout/company/site-header";
import ManagePayrolls from "../_components/payroll/manage-payrolls";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayrollPage() {

    return (
        <>
            <SiteHeader title="Payroll Management" />
            <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
                <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-md" />}>
                    <ManagePayrolls />
                </Suspense>
            </section>
        </>
    )
}