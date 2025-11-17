"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type NoteDialogOptions = {
  title: string;
  description?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  /** If true, user must type something to enable submit */
  requireNote?: boolean;
};

type NoteDialogResult = {
  confirmed: boolean;
  note: string;
};

type NoteDialogContextValue = (
  options: NoteDialogOptions
) => Promise<NoteDialogResult>;

const NoteDialogContext = createContext<NoteDialogContextValue | null>(null);

export function NoteDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<NoteDialogOptions | null>(null);
  const [note, setNote] = useState("");
  const [resolver, setResolver] = useState<
    ((value: NoteDialogResult) => void) | null
  >(null);

  const openDialog: NoteDialogContextValue = useCallback((opts) => {
    return new Promise<NoteDialogResult>((resolve) => {
      setOptions(opts);
      setNote("");
      setResolver(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (resolver) {
      resolver({ confirmed: false, note: "" });
      setResolver(null);
    }
  };

  const handleConfirm = () => {
    if (!resolver) return;
    resolver({ confirmed: true, note });
    setResolver(null);
    setIsOpen(false);
  };

  const disabledSubmit =
    !!options?.requireNote && note.trim().length === 0;

  return (
    <NoteDialogContext.Provider value={openDialog}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{options?.title || "Add Note"}</DialogTitle>
          </DialogHeader>
          {options?.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {options.description}
            </p>
          )}
          <Textarea
            className="min-h-[120px]"
            placeholder={options?.placeholder || "Write a note (optional)..."}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={handleClose}>
              {options?.cancelText || "Cancel"}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={disabledSubmit}
            >
              {options?.confirmText || "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </NoteDialogContext.Provider>
  );
}

export function useNoteDialog() {
  const ctx = useContext(NoteDialogContext);
  if (!ctx) {
    throw new Error(
      "useNoteDialog must be used within a NoteDialogProvider"
    );
  }
  return ctx;
}
