import { SiteHeader } from "@/components/layout/company/site-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import EmployeeManagementTable from "../_components/employee-managemenet-table";

export default function ManageEmployeePage() {

    return (
        <>
            <SiteHeader title="Manage Employees" />
            <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
                <EmployeeManagementTable />
            </section>
        </>
    )
}