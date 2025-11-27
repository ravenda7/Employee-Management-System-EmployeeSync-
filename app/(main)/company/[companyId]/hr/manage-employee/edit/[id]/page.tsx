import { getEmployeeById } from "@/action/employee";
import { SiteHeader } from "@/components/layout/company/site-header";
import EditEmployeeForm from "../../../_components/edit-employee-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BackButton from "@/components/shared/back-button";
import EditEmployeePassword from "../../../_components/employee-password-editor";

interface EmployeeContext {
    params: Promise<{
        id: string;
    }>
}

export default  async function EditEmployee( { params}: EmployeeContext) {
    const context = await params;
    const employeeId = context.id;

    const employee = await getEmployeeById(employeeId);

    if (!employee) {
        return (
            <>
                <SiteHeader title="Edit Employee Profile" />
                <div className="flex flex-col justify-center items-center gap-y-6 py-4 md:py-2 px-4 lg:px-6 w-full">
                    <p>Employee not found</p>
                </div>
            </>
        );
    }
    return (
        <>
            <SiteHeader title="Edit Employee Profile" />
            <div className="flex flex-row gap-1 gap-y-6 py-4 md:py-2 px-2 lg:px-4 w-full">
                <BackButton />
                <Tabs defaultValue="account" className="w-full">
                <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                    <EditEmployeeForm initialData={employee} />
                </TabsContent>
                <TabsContent value="password">
                    <EditEmployeePassword employeeId={employeeId} />
                </TabsContent>
                </Tabs>
            </div>
        </>
    )
}