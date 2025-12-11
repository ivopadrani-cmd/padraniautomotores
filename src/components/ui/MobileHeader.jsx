import React from "react";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  actions = [],
  className = ""
}) {
  return (
    <header className={`bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm ${className}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 h-auto"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "ghost"}
              size="sm"
              onClick={action.onClick}
              className="p-2 h-auto"
              disabled={action.disabled}
            >
              {action.icon && <action.icon className="w-5 h-5" />}
              {action.label && <span className="ml-2">{action.label}</span>}
            </Button>
          ))}
        </div>
      )}
    </header>
  );
}
