import { SiteHeader } from "@/components/layout/company/site-header";
import ManageEmployeeLeaveRequests from "../../_components/manage-employee-leave-requests";

export default function MangeEmployeeLeaveRequests() {

    return (
        <>
            <SiteHeader title="Manage Employee Leave Requests" />
            <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
                <ManageEmployeeLeaveRequests />
            </section>
        </>
    )
}