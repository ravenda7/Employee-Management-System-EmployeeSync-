import { SiteHeader } from "@/components/layout/company/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import DepartmentTable from "../_components/department-table";

export default function ManageDepartmentsPage() {

    return (
        <>
            <SiteHeader title="Manage Departments" />
            <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
                <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-md" />}>
                    <DepartmentTable />
                </Suspense>
            </section>
        </>
    )
}