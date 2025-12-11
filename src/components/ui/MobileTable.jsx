import React from "react";
import { ChevronRight } from "lucide-react";

export function MobileCard({ children, onClick, className = "" }) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
      {onClick && (
        <div className="flex justify-end mt-2">
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      )}
    </div>
  );
}

export function MobileCardField({ label, value, className = "" }) {
  return (
    <div className={`flex justify-between items-center py-1 ${className}`}>
      <span className="text-sm font-medium text-gray-500">{label}:</span>
      <span className="text-sm text-gray-900 text-right ml-2">{value}</span>
    </div>
  );
}

export function MobileTable({ data, columns, onRowClick, keyField = "id", className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((item) => (
        <MobileCard
          key={item[keyField]}
          onClick={onRowClick ? () => onRowClick(item) : undefined}
        >
          {columns.map((column) => (
            <MobileCardField
              key={column.key}
              label={column.label}
              value={column.render ? column.render(item[column.key], item) : item[column.key]}
            />
          ))}
        </MobileCard>
      ))}
    </div>
  );
}

export function MobileList({ data, renderItem, keyField = "id", className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {data.map((item) => (
        <div key={item[keyField]}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
