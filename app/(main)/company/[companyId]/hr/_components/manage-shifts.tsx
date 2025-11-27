'use client'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ReplaceAll, SquarePen, Trash2 } from "lucide-react"
import { useConfirmDialog } from "@/context/confirm-dialog"
import { useSessionData } from "@/context/session"
import { Card, CardContent } from "@/components/ui/card"
import ManageShiftDialog from "./manage-shift-dialog"
import { formatDateToTimeString } from "@/lib/time"


type Shift = {
    id: string
    name: string
    startTime: string
    endTime: string
}

export default function ManageShifts () {
    const { user } = useSessionData();
    const confirm = useConfirmDialog();
    const queryClient = useQueryClient();
    const companyId = user?.companyId;

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [shiftEditId, setShiftEditId] = useState<Shift | null>(null);


    const { data, isLoading } = useQuery({
        queryKey: ["shifts", companyId],
        queryFn: async () => {
        const res = await fetch(`/api/company/${companyId}/shifts`)
        return res.json()
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
        const res = await fetch(`/api/shift/${id}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Delete failed")
        return res.json()
        },
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["shifts"] })
        toast.success("Shifts deleted successfully")
        },
    })

    const handleDelete = async (id:string, name:string) => {
        const ok = await confirm({
        title: `Delete "${name}"`,
        description: "Are you sure you want to delete this shift? This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        });
        if (ok) {
        deleteMutation.mutate(id)
        }
    }

    const handleAddShift = () => {
        setIsDialogOpen(true);
    }

    const handleEditShift = (id: string, name: string, startTime: string, endTime: string) => {
        setShiftEditId({ id, name, startTime, endTime });
        setIsDialogOpen(true);
    }
    return (
        <div className="space-y-4">
            <Card>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-x-2">
                                <ReplaceAll  width={30} height={30} />
                                <div className="flex flex-col">
                                    <p className="text-[16px] font-semibold text-slate-950">Add Shifts</p>
                                    <span className="text-sm font-normal text-slate-600">Manage your all shifts</span>
                                </div>
                            </div>
                                <Button onClick={handleAddShift}>
                                    Create
                                </Button>
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
                            <TableHead>Start Tine</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
                        ) : (
                            data?.map((shift: Shift, index:number) => (
                            <TableRow key={shift.id}>
                                <TableCell className="pl-6">{index+1}</TableCell>
                                <TableCell>{shift.name}</TableCell>
                                <TableCell>{formatDateToTimeString(shift.startTime)}</TableCell>
                                <TableCell>{formatDateToTimeString(shift.endTime)}</TableCell>
                                <TableCell className="text-right space-x-2 pr-6">
                                    <Button variant="icon"
                                    className="hover:text-sky-600"
                                    onClick={() =>handleEditShift(
                                        shift.id,
                                        shift.name,
                                        shift.startTime,
                                        shift.endTime
                                    )}>
                                        <SquarePen />
                                    </Button>
                                <Button
                                    variant="icon"
                                    onClick={() => handleDelete(shift.id, shift.name)}
                                >
                                    <Trash2 />
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                        {!data?.length && !isLoading && (
                            <TableRow>
                            <TableCell colSpan={5} className="text-center h-[120px] font-semibold text-gray-600">
                                No Shifts found
                            </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>


            <ManageShiftDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                shiftEditData={shiftEditId}
                companyId={companyId}
            />
        </div>
    )
}