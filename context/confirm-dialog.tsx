"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmDialogContextType = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  return context;
};

export const ConfirmDialogProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    description: "",
    confirmText: "Yes",
    cancelText: "Cancel",
  });

  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>(() => () => {});

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions({ ...opts, confirmText: opts.confirmText ?? "Yes", cancelText: opts.cancelText ?? "Cancel" });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    resolvePromise(true);
    setOpen(false);
  };

  const handleCancel = () => {
    resolvePromise(false);
    setOpen(false);
  };

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{options.title}</DialogTitle>
            {options.description && <p className="text-sm text-muted-foreground">{options.description}</p>}
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={handleCancel}>
              {options.cancelText}
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              {options.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
};
