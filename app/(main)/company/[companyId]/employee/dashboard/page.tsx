import { SiteHeader } from "@/components/layout/company/site-header";
import Dashboard from "../_components/dashboard";

export default async function EmployeeDashboard() {

    return (
        <>
            <SiteHeader title="Dashboard" />
            <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
                <Dashboard />
            </section>
        </>
    )
}