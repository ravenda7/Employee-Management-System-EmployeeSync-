"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Boxes, Search, SquarePen, Trash2 } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination"
import { useConfirmDialog } from "@/context/confirm-dialog"
import DepartmentDialog from "./add-department-dialog"
import { useSessionData } from "@/context/session"
import { Card, CardContent } from "@/components/ui/card"
import { DataPagination } from "@/components/custom/pagination"


type Department = {
  id: string
  name: string
}

export default function DepartmentTable() {
    const queryClient = useQueryClient();
    const { user } = useSessionData();
    const companyId = user?.companyId;
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
    const [openDialog, setOpenDialog] = useState(false)
    const confirm = useConfirmDialog();

    const { data, isLoading } = useQuery({
        queryKey: ["department", search, page],
        queryFn: async () => {
        const res = await fetch(`/api/company/${companyId}/department?search=${search}&page=${page}&limit=3`)
        return res.json()
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
        const res = await fetch(`/api/department/${id}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Delete failed")
        return res.json()
        },
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["department"] })
        toast.success("Department deleted successfully")
        },
    })

    const handleDelete = async (id:string, name:string) => {
        const ok = await confirm({
        title: `Delete "${name}"`,
        description: "Are you sure you want to delete this department? This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        });
        if (ok) {
        deleteMutation.mutate(id)
        }
    }

  return (
    <div className="space-y-4">
        <Card>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-2">
                            <Boxes width={30} height={30} />
                            <div className="flex flex-col">
                                <p className="text-[16px] font-semibold text-slate-950">Add Departments</p>
                                <span className="text-sm font-normal text-slate-600">Manage your all departments</span>
                            </div>
                        </div>
                        <DepartmentDialog open={openDialog} onOpenChange={setOpenDialog} defaultValues={selectedDepartment ?? undefined} companyId={companyId}>
                            <Button onClick={() => { setSelectedDepartment(null); setOpenDialog(true) }}>
                                Add Department
                            </Button>
                        </DepartmentDialog>
                    </div>
                    <div className="w-full relative">
                        <Search className="absolute top-2 left-2" />
                        <Input
                        placeholder="Search departments..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-9"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent className="p-0 -mt-3">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="pl-6">SN</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>
                    ) : (
                        data?.data?.map((department: Department, index:number) => (
                        <TableRow key={department.id}>
                            <TableCell className="pl-6">{index+1}</TableCell>
                            <TableCell>{department.name}</TableCell>
                            <TableCell className="text-right space-x-2 pr-6">
                            <DepartmentDialog
                                open={openDialog && selectedDepartment?.id === department.id}
                                onOpenChange={(open: boolean) => {
                                setOpenDialog(open)
                                if (!open) setSelectedDepartment(null)
                                }}
                                defaultValues={department}
                            >
                                <Button variant="icon"
                                className="hover:text-sky-600"
                                onClick={() => { setSelectedDepartment(department); setOpenDialog(true) }}>
                                <SquarePen />
                                </Button>
                            </DepartmentDialog>
                            <Button
                                variant="icon"
                                onClick={() => handleDelete(department.id, department.name)}
                            >
                                <Trash2 />
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                    {!data?.data?.length && !isLoading && (
                        <TableRow>
                        <TableCell colSpan={3} className="text-center h-[120px] font-semibold text-gray-600">
                            No Departments found
                        </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <DataPagination 
            data={data}       
            page={page}       
            setPage={setPage} 
        />
    </div>
  )
}
