'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionData } from "@/context/session";
import { EmployeeFilter, GetEmployeeAPIResponse } from "@/types/employee.type";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

export default function EmployeeManagementTable() {
    const { user } = useSessionData();
    const companyId = user?.companyId;
    const [filters, setFilters] = useState<EmployeeFilter>({
        searchTerm: '',
        department: '',
        requestedRole: '',
        page: 1,
        limit: 10
    });

    // Data fetching
    const { data: employees, isPending } = useQuery<GetEmployeeAPIResponse>({
        queryKey: ['employees', filters],
        queryFn: async () => {
            const res = await fetch(`/api/company/${companyId}/employee?search=${filters.searchTerm}&department=${filters.department}&role=${filters.requestedRole}&page=${filters.page}&limit=${filters.limit}`);
            if (!res.ok) throw new Error('Failed to fetch employees');
            return res.json();
        },
    });

    const { data:departments, isLoading } = useQuery({
        queryKey: ["department"],
        queryFn: async () => {
        const res = await fetch(`/api/company/${companyId}/department`);
        if (!res.ok) throw new Error("Failed to fetch departments");
        return res.json()
        },
    })

    console.log(departments);
    console.log(employees);

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