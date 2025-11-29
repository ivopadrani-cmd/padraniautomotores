import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title = "¿Cancelar edición?", 
  description = "Los datos ingresados se perderán.",
  confirmText = "Sí, cancelar",
  cancelText = "Continuar editando"
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
              <DialogDescription className="text-[11px] text-gray-500 mt-0.5">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="p-4 pt-2 flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-8 text-[11px]">{cancelText}</Button>
          <Button onClick={() => { onConfirm(); onOpenChange(false); }} className="flex-1 h-8 text-[11px] bg-gray-900 hover:bg-gray-800">{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}