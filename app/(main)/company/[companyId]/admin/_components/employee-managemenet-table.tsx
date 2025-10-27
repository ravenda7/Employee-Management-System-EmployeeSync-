'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionData } from "@/context/session";
import Link from "next/link";

export default function EmployeeManagementTable() {
    const { user } = useSessionData();
    const companyId = user?.companyId;
    return (
        <>
            <Card>
                <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-lg font-semibold">Employee Management</p>
                        <p className="text-sm text-muted-foreground">Manage employee profiles, attendance, and more.</p>
                    </div>

                    <Link href={`/company/${companyId}/admin/manage-employee/new`}>
                        <Button className="cursor-pointer" >Create Employee</Button>
                    </Link>
                </div>
                </CardContent>
            </Card>
        
        </>
    );
}