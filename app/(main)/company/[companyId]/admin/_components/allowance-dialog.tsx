import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateRandomId } from "@/lib/id-generator";

export interface Allowance {
    id: string;
    type: string;
    amount: number;
}

export type EmployeeAllowances = { [key: string]: number } | null;

interface AllowanceManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: any;
}

const jsonToArray = (json: any): Allowance[] => {
  if (!json) return [];
  try {
    // Ensure it's an array
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        id: item.id || generateRandomId(),
        type: item.type || "",
        amount: Number(item.amount) || 0,
      }));
    }
    return [];
  } catch (e) {
    console.error("Error parsing allowances JSON:", e);
    return [];
  }
};

const arrayToJson = (arr: Allowance[]): any => {
  if (arr.length === 0) return [];
  return arr.map((a) => ({
    id: a.id,
    type: a.type.trim(),
    amount: parseFloat(a.amount.toFixed(2)),
  }));
};

const useUpdateAllowancesMutation = (
    employeeId: string,
    onMutationSuccess: () => void
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newAllowancesJson: EmployeeAllowances) => {
            const response = await fetch(`/api/employees/${employeeId}/allowances`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ allowances: newAllowancesJson }),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.error || "Failed to update allowances on the server.");
            }
            return response.json();
        },
        onSuccess: (data) => {
            toast.success(`Allowances updated for ${data.name}.`);
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            onMutationSuccess();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
};

// --- Main Component ---
export default function AllowanceManagementDialog({
    open,
    onOpenChange,
    employee,
}: AllowanceManagementDialogProps) {
    console.log("Employee:", employee);
    const [localAllowances, setLocalAllowances] = useState<Allowance[]>(() =>
        jsonToArray(employee.allowances)
    );

    console.log("Local Allowances:", localAllowances);


    const [newType, setNewType] = useState("");
    const [newAmount, setNewAmount] = useState("");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editType, setEditType] = useState("");
    const [editAmount, setEditAmount] = useState("");

    useEffect(() => {
        setLocalAllowances(jsonToArray(employee.allowances));
        console.log("test",employee.allowances)
    }, [employee, open]);

    const { mutate, isPending } = useUpdateAllowancesMutation(employee.id, () => {
        onOpenChange(false);
    });

    // --- Handlers ---
    const handleAddAllowance = () => {
        if (!newType.trim() || !newAmount.trim() || isNaN(parseFloat(newAmount))) {
            toast.error("Please enter a valid allowance type and amount.");
            return;
        }

        const type = newType.trim();
        const amount = parseFloat(newAmount);

        const isDuplicate = localAllowances.some(
            (a) => a.type.trim().toLowerCase() === type.toLowerCase()
        );

        if (isDuplicate) {
            toast.error(`Allowance type "${type}" already exists.`);
            return;
        }

        const newAllowance: Allowance = {
            id: generateRandomId(),
            type,
            amount,
        };

        setLocalAllowances([...localAllowances, newAllowance]);
        setNewType("");
        setNewAmount("");
    };

    const handleDelete = (id: string) => {
        if (isPending) return;
        setLocalAllowances(localAllowances.filter((a) => a.id !== id));
    };

    const handleEditClick = (allowance: Allowance) => {
        setEditingId(allowance.id);
        setEditType(allowance.type);
        setEditAmount(String(allowance.amount));
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditType("");
        setEditAmount("");
    };

    const handleSaveEdit = (id: string) => {
        const type = editType.trim();
        const amount = parseFloat(editAmount);

        if (!type || isNaN(amount) || amount < 0) {
            toast.error("Please enter valid type and amount for editing.");
            return;
        }

        const isDuplicate = localAllowances.some(
            (a) => a.id !== id && a.type.trim().toLowerCase() === type.toLowerCase()
        );

        if (isDuplicate) {
            toast.error(`Allowance type "${type}" already exists for another entry.`);
            return;
        }

        setLocalAllowances(
            localAllowances.map((a) =>
                a.id === id ? { ...a, type, amount: parseFloat(amount.toFixed(2)) } : a
            )
        );
        handleCancelEdit();
    };

    const handleSaveChanges = () => {
        if (isPending) return;
        const finalAllowancesJson = arrayToJson(localAllowances);
        mutate(finalAllowancesJson);
    };

    const displayAllowances = useMemo(() => {
        return [...localAllowances].sort((a, b) => a.type.localeCompare(b.type));
    }, [localAllowances]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-2xl">Manage Allowances</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Managing allowances for{" "}
                        <span className="font-medium text-foreground">
                            {employee.name}
                        </span>{" "}
                        ({employee.email})
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 sm:space-y-6 py-1 sm:py-4">
                    {/* Current Allowances */}
                    <div className="space-y-3">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Current Allowances
                        </h3>
                        <div className="border rounded-lg shadow-sm">
                            <div className="relative w-full overflow-x-auto">
                                <Table className="min-w-full"> {/* min-w-full helps with responsiveness on smaller screens */}
                                <TableHeader className="bg-gray-100 dark:bg-gray-800">
                                    <TableRow>
                                    <TableHead className="text-xs sm:text-sm pl-2 font-semibold text-gray-900 dark:text-gray-100">
                                        Allowance Type
                                    </TableHead>
                                    <TableHead className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        Amount
                                    </TableHead>
                                    <TableHead className="text-right text-xs sm:text-sm pr-2 font-semibold text-gray-900 dark:text-gray-100">
                                        Actions
                                    </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {displayAllowances.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="px-4 py-8 text-center text-gray-500 text-xs sm:text-sm">
                                        No allowances added yet. Add your first allowance below.
                                        </TableCell>
                                    </TableRow>
                                    ) : (
                                    displayAllowances.map((allowance) => (
                                        <TableRow
                                        key={allowance.id}
                                        className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors"
                                        >
                                        {editingId === allowance.id ? (
                                            <>
                                            <TableCell className="py-2 p-2">
                                                <Input
                                                value={editType}
                                                onChange={(e) => setEditType(e.target.value)}
                                                placeholder="Allowance Type"
                                                className="h-9"
                                                disabled={isPending}
                                                />
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editAmount}
                                                onChange={(e) => setEditAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="h-9"
                                                disabled={isPending}
                                                />
                                            </TableCell>
                                            <TableCell className="py-2 pr-2 text-right">
                                                <div className="flex gap-2 justify-end">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleSaveEdit(allowance.id)}
                                                    className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white"
                                                    disabled={isPending}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleCancelEdit}
                                                    className="h-8 w-8 p-0"
                                                    disabled={isPending}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                </div>
                                            </TableCell>
                                            </>
                                        ) : (
                                            <>
                                            <TableCell className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize pl-2">
                                                {allowance.type}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                                                ${allowance.amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right pr-2">
                                                <div className="flex gap-2 justify-end">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEditClick(allowance)}
                                                    className="h-8 w-8 p-0"
                                                    disabled={isPending}
                                                >
                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(allowance.id)}
                                                    className="h-8 w-8 p-0 hover:text-red-500"
                                                    disabled={isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                                </div>
                                            </TableCell>
                                            </>
                                        )}
                                        </TableRow>
                                    ))
                                    )}
                                </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    {/* Add New Allowance */}
                    <div className="space-y-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 shadow-inner">
                        <div className="grid gap-4 sm:grid-cols-[2fr,1fr,auto] items-end">
                            <div className="space-y-2">
                                <Label htmlFor="new-type">Allowance Type</Label>
                                <Input
                                    id="new-type"
                                    placeholder="e.g., Medical, Travel"
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                    onKeyPress={(e) =>
                                        e.key === "Enter" && handleAddAllowance()
                                    }
                                    className="h-10 bg-white"
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-amount">Amount ($)</Label>
                                <Input
                                    id="new-amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g., 500.00"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                    onKeyPress={(e) =>
                                        e.key === "Enter" && handleAddAllowance()
                                    }
                                    className="h-10 bg-white"
                                    disabled={isPending}
                                />
                            </div>
                            <Button
                                onClick={handleAddAllowance}
                                className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={!newType.trim() || !newAmount.trim() || isPending}
                            >
                                <Plus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Add</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Dialog Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveChanges}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
