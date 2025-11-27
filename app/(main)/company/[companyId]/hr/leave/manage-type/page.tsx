"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSessionData } from "@/context/session";
import { useConfirmDialog } from "@/context/confirm-dialog";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PlusCircle, SquarePen, Trash2, Tags } from "lucide-react";
import ManageLeaveTypeDialog from "../../_components/manage-leave-type";
import { SiteHeader } from "@/components/layout/company/site-header";


type LeaveTypeRow = {
  id: string;
  name: string;
  code: string;
  yearlyLimit: number | null;
  isPaid: boolean;
  requiresApproval: boolean;
};

export default function ManageLeaveTypes() {
  const { user } = useSessionData();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<LeaveTypeRow | null>(null);

  const { data, isLoading } = useQuery<LeaveTypeRow[]>({
    queryKey: ["leaveTypes", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(`/api/company/${companyId}/leave-types`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load leave types");
      }
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leave-type/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Delete failed");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Leave type deleted");
      queryClient.invalidateQueries({ queryKey: ["leaveTypes", companyId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete");
    },
  });

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (row: LeaveTypeRow) => {
    setEditData(row);
    setDialogOpen(true);
  };

  const handleDelete = async (row: LeaveTypeRow) => {
    const ok = await confirm({
      title: `Delete "${row.name}"`,
      description:
        "Are you sure you want to delete this leave type? This cannot be undone and is only allowed if no leaves use this type.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!ok) return;
    deleteMutation.mutate(row.id);
  };

  return (
    <>
    <SiteHeader title="Manage Leave Types" />
    <div className="space-y-4 px-4 lg:px-6 py-4">
      {/* Header card */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <Tags width={30} height={30} />
              <div className="flex flex-col">
                <p className="text-[16px] font-semibold text-slate-950">
                  Leave Types
                </p>
                <span className="text-sm text-slate-600">
                  Configure leave categories and yearly limits for this company.
                </span>
              </div>
            </div>
            <Button onClick={handleAdd} className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Add Leave Type
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table card */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">SN</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Yearly Limit</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-sm text-slate-500"
                  >
                    No leave types found. Click &quot;Add Leave Type&quot; to
                    create one.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((lt, index) => (
                  <TableRow key={lt.id}>
                    <TableCell className="pl-6">{index + 1}</TableCell>
                    <TableCell>{lt.name}</TableCell>
                    <TableCell>{lt.code}</TableCell>
                    <TableCell>
                      {lt.yearlyLimit == null ? "Unlimited" : lt.yearlyLimit}
                    </TableCell>
                    <TableCell>{lt.isPaid ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {lt.requiresApproval ? "Required" : "Auto-approve"}
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:text-sky-600"
                        onClick={() => handleEdit(lt)}
                      >
                        <SquarePen className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(lt)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ManageLeaveTypeDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        leaveTypeEditData={editData}
        companyId={companyId}
      />
    </div>
    </>
  );
}
