'use client';

import { Loader } from "@/components/custom/loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSessionData } from "@/context/session";
import shortenName from "@/lib/name-shorten";
import { Department, EmployeeFilter, GetEmployeeAPIResponse, GetEmployees } from "@/types/employee.type";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, HandCoins, Search, SquarePen, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import AllowanceManagementDialog from "./allowance-dialog";

export default function EmployeeManagementTable() {
    const { user } = useSessionData();
    const queryClient = useQueryClient();
    const [isPending, startTransition] = useTransition();
    const companyId = user?.companyId;
    const [filters, setFilters] = useState<EmployeeFilter>({
        searchTerm: '',
        department: '',
        requestedRole: '',
        page: 1,
        limit: 10
    });
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<GetEmployees | null>(null);



    // Data fetching
    const { data, isPending:isEmployeePending } = useQuery<GetEmployeeAPIResponse>({
        queryKey: ['employees', filters],
        queryFn: async () => {
            const res = await fetch(`/api/company/${companyId}/employee?search=${filters.searchTerm}&department=${filters.department}&role=${filters.requestedRole}&page=${filters.page}&limit=${filters.limit}`);
            if (!res.ok) throw new Error('Failed to fetch employees');
            return res.json();
        },
    });

    console.log("Employee Data:", data?.data.employees);

    const { data:departments, isLoading: isDepartmentLoading} = useQuery({
        queryKey: ["department"],
        queryFn: async () => {
        const res = await fetch(`/api/company/${companyId}/department`);
        if (!res.ok) throw new Error("Failed to fetch departments");
        return res.json()
        },
    });

    const handleStatusChange = async (employeeId: string, currentStatus: boolean) => {
        startTransition(async () => {
            try {
                const newStatus = !currentStatus;
                const response = await fetch(`/api/employees/${employeeId}/status`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ isActive: newStatus }),
                });

                if (!response.ok) {
                    throw new Error("Failed to update status.");
                }
                toast.success(`Employee ${newStatus ? 'activated' : 'deactivated'} successfully.`);
                queryClient.invalidateQueries({ queryKey: ['employees'] });

            } catch (error) {
                console.error("Status update error:", error);
                toast.error("Error updating status. Please try again.");
            }
        });
    };

    //Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchInput]);

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            searchTerm: debouncedSearch,
            page: 1 // Reset to first page on search change
        }));
    }, [debouncedSearch]);

    const handlePageChange = (page: number) => {
        setFilters((prev) => ({
            ...prev,
            page: page,
        }));
    }

    function getRole(role: string) {
        switch(role) {
            case 'COMPANY_HR':
                return 'HR';
            case 'EMPLOYEE':
                return 'Worker';
            default:
                return 'Unknown';
        }
    }

    const totalPages = data?.data.total ? Math.ceil(data.data.total / data.data.limit) : 0;

    const handleManageAllowances = (employee: GetEmployees) => {
        setSelectedEmployee(employee);
        setIsAllowanceModalOpen(true);
    };

    const handleCloseDialog = () => {
        setIsAllowanceModalOpen(false);
    };

    return (
        <>
            <Card>
                <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <p className="text-lg font-semibold">Employee Management</p>
                        <p className="text-sm text-muted-foreground">Manage employee profiles, attendance, and more.</p>
                    </div>

                    <Link href={`/company/${companyId}/admin/manage-employee/new`}>
                        <Button className="w-full sm:w-auto cursor-pointer" >Create Employee</Button>
                    </Link>
                </div>
                </CardContent>
            </Card>
            <div  className="w-full">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="w-full relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                <Input 
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)} placeholder="Search...." className="pl-10" />
                            </div>
                            {isDepartmentLoading ? (
                                <Loader />
                            ) : <Select
                                value={filters.department || "all"}
                                onValueChange={(value) => {
                                    setFilters((prev) => ({
                                        ...prev,
                                        department: value === "all" ? "" : value,
                                        page: 1
                                    }));
                                }}
                            >
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {departments?.data?.map((department: Department) => (
                                        <SelectItem key={department.id} value={department.id}>
                                            {department.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>}
                        </div>
                    </CardHeader>
                    <CardContent className="border-t-1 border-gray-200 border-b-1 py-2">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="pl-4">Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isEmployeePending ? ( 
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6">
                                    <Loader className="mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data.employees.map((employee) => (
                            <TableRow key={employee.id}>
                                <TableCell className="pl-4">
                                    <div className="flex items-center gap-2">
                                        <Avatar>
                                            <AvatarFallback>{shortenName(employee.name)}</AvatarFallback>
                                            <AvatarImage src={employee.avatarUrl || undefined} alt={employee.name}
                                            className="object-cover" />
                                        </Avatar>
                                        <span>{employee.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {employee.email}
                                </TableCell>
                                <TableCell>
                                    {employee.department?.name ?? 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={employee.isActive}
                                        disabled={isPending} 
                                        onCheckedChange={() => handleStatusChange(employee.id, employee.isActive)}
                                        className={employee.isActive ? "data-[state=checked]:bg-green-600" : ""}
                                    />
                                </TableCell>
                                <TableCell>
                                    {getRole(employee.role)}
                                </TableCell>
                                <TableCell className="flex justify-end">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="icon" className="hover:text-green-600"
                                            onClick={() => handleManageAllowances(employee)}>
                                                <HandCoins />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Manage Allowance</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href={`/admin/employee/edit/${employee.id}`}>
                                                <Button variant="icon" className="hover:text-sky-600 w-fit">
                                                    <SquarePen />
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Edit Employee</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href={`/admin/employee/delete/${employee.id}`}>
                                                <Button variant="icon" className="hover:text-red-600">
                                                    <Trash2 />
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Delete Employee</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                            )))}
                        {data && data.data.employees.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-2">
                                <div className="text-center py-12">
                                    <User className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No employee found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                    {searchInput ? 'Try adjusting your search terms.' : 'Get started by adding your first student.'}
                                    </p>
                                </div>
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </CardContent>
                    <CardFooter>
                        {data && data.data.total > data.data.limit && (
                        <div className="flex items-center justify-center -mt-2 w-full">
                            <div className="flex items-center justify-between gap-2 w-full">
                                <Button
                                variant="outline"
                                onClick={() => handlePageChange((filters.page ?? 1) - 1)}
                                disabled={filters.page === 1}
                                className="text-[12px]"
                                >   
                                    <ArrowLeft className=" h-2 w-2" />
                                    Previous
                                </Button>
                                <div className="flex items-center gap-2">
                                {(() => {
                                    const pages = [];
                                    const maxSide = 3;
                                    const current = filters.page ?? 1;

                                    // Always show first 3
                                    for (let i = 1; i <= Math.min(maxSide, totalPages); i++) {
                                    pages.push(i);
                                    }

                                    // Show ... if needed before middle
                                    if (current > maxSide + 2) {
                                    pages.push("left-ellipsis");
                                    }

                                    // Show middle page(s)
                                    const startMiddle = Math.max(current - 1, maxSide + 1);
                                    const endMiddle = Math.min(current + 1, totalPages - maxSide);

                                    for (let i = startMiddle; i <= endMiddle; i++) {
                                    if (i > maxSide && i < totalPages - maxSide + 1) {
                                    pages.push(i);
                                    }
                                    }

                                    // Show ... if needed after middle
                                    if (current < totalPages - maxSide - 1) {
                                    pages.push("right-ellipsis");
                                    }

                                    // Always show last 3
                                    for (
                                    let i = Math.max(totalPages - maxSide + 1, maxSide + 1);
                                    i <= totalPages;
                                    i++
                                    ) {
                                    if (i > maxSide) pages.push(i);
                                    }

                                    return pages.map((page, idx) =>
                                    typeof page === "number" ? (
                                    <Button
                                    key={page}
                                    variant={filters.page === page ? "secondary" : "ghost"}
                                    onClick={() => handlePageChange(page)}
                                    className="text-[12px]"
                                    >
                                    {page}
                                    </Button>
                                    ) : (
                                    <span key={page + idx} className="px-2 select-none">
                                    ...
                                    </span>
                                    )
                                    );
                                })()}
                                </div>
                                <Button
                                variant="outline"
                                onClick={() => handlePageChange((filters.page ?? 1) + 1)}
                                disabled={filters.page === totalPages}
                                className="text-[12px]"
                                >
                                Next
                                <ArrowRight className="h-2 w-2" />
                                </Button>
                            </div>
                        </div>
                        )}
                    </CardFooter>
                </Card>
                </div>
            {selectedEmployee && (
                <AllowanceManagementDialog
                open={isAllowanceModalOpen}
                onOpenChange={handleCloseDialog}
                employee={selectedEmployee}
                />
            )}
        </>
    );
}