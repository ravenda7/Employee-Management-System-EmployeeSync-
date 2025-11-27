import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Hero from "./hero"
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getEmployeeById } from "@/action/employee";
import RecentLeaveDecision from "./recent-leave-decision";
import EmployeeAnalytics from "./analytics";

export default async function Dashboard () {
    const session = await getServerSession(authOptions);
    if(!session || !session.user || !session.user.companyId) {
        redirect('/login');
    }
    const user = session.user;
    const employee = await getEmployeeById(user.id);
    if(!employee) {
        redirect('/login');
    }
    return(
        <div className="flex flex-col gap-y-4">
            <Hero employeeData={employee} />
            <EmployeeAnalytics />
            <RecentLeaveDecision />
        </div>
    )
}