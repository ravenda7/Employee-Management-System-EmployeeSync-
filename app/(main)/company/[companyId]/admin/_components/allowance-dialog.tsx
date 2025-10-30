import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GetEmployees } from "@/types/employee.type";

interface AllowanceManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: GetEmployees;
}

export default function AllowanceManagementDialog({ open, onOpenChange, employee }: AllowanceManagementDialogProps) {

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <h1>allowance management {employee.name}</h1>
            </DialogContent>
        </Dialog>
    )
}