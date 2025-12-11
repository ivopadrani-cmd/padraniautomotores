import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = ""
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={`rounded-t-lg max-h-[90vh] overflow-y-auto ${className}`}
      >
        <SheetHeader className="text-left">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{title}</SheetTitle>
              {description && <SheetDescription>{description}</SheetDescription>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="p-2 h-auto"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>
        <div className="mt-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
