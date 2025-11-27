import { SiteHeader } from "@/components/layout/company/site-header";
import EmployeePayroll from "../_components/payroll";

export default function PayrollPage() {

    return (
        <>
            <SiteHeader title="Payroll" />
            <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
                <EmployeePayroll />
            </section>
        </>
    )
}