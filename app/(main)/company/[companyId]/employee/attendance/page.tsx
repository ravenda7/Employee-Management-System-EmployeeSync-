import { SiteHeader } from "@/components/layout/company/site-header";
import EmployeeAttendance from "../_components/employee-attendance";

export default function AttendancePage() {
  return (
    <>
     <SiteHeader title="Manage Employee Attendance" />
        <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4 w-full">
          <EmployeeAttendance />
        </section>
    </>
);
}