import { SiteHeader } from "@/components/layout/company/site-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ManageEmployeePage() {

    return (
        <>
            <SiteHeader title="Manage Employees" />
            <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
                <div className="px-4 lg:px-6 flex items-center justify-between">
                    <div>
                        <p className="text-lg font-semibold">Employee Management</p>
                        <p className="text-sm text-muted-foreground">Manage employee profiles, attendance, and more.</p>
                    </div>

                    <Link href="/admin/employee/new">
                        <Button className="cursor-pointer" >Create Employee</Button>
                    </Link>
                </div>

            </section>
        </>
    )
}