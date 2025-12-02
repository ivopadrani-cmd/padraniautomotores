
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Settings } from "lucide-react"; // Eye is no longer used, but keeping imports as per instruction for constants, assuming it won't break. Removing it would be a minor cleanup.
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ALL_COLUMNS = [
  { key: 'status', label: 'Estado', default: true },
  { key: 'priority', label: 'Prioridad', default: true },
  { key: 'client_name', label: 'Cliente', default: true },
  { key: 'phone', label: 'Teléfono', default: true },
  { key: 'email', label: 'Email', default: false },
  { key: 'interested_vehicles', label: 'Vehículos de Interés', default: true },
  { key: 'other_interests', label: 'Otros Intereses', default: false },
  { key: 'budget', label: 'Presupuesto', default: true },
  { key: 'consultation_date', label: 'Fecha Consulta', default: true },
  { key: 'follow_up_date', label: 'Seguimiento', default: false },
  // The 'actions' column is removed from ALL_COLUMNS because its functionality (onSelectLead) is now handled by the row click.
  // Including it would lead to an empty column header and potentially mismatched column counts.
];

const statusColors = {
  'Nuevo': 'bg-blue-100 text-blue-800',
  'Contactado': 'bg-purple-100 text-purple-800',
  'En negociación': 'bg-yellow-100 text-yellow-800',
  'Concretado': 'bg-green-100 text-green-800',
  'Perdido': 'bg-red-100 text-red-800'
};

const priorityColors = {
  'Baja': 'bg-gray-100 text-gray-700',
  'Media': 'bg-orange-100 text-orange-700',
  'Alta': 'bg-red-100 text-red-700'
};

const STORAGE_KEY = 'leadTableColumns';

export default function LeadTable({ leads, onSelectLead }) {
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window !== 'undefined') { // Check if running in a browser environment
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Ensure all parsed keys are valid columns and filter out 'actions' if it was saved
          const validKeys = ALL_COLUMNS.map(col => col.key);
          return parsed.filter(key => validKeys.includes(key));
        } catch (e) {
          console.error("Failed to parse stored columns, reverting to default.", e);
          return ALL_COLUMNS.filter(col => col.default).map(col => col.key);
        }
      }
    }
    return ALL_COLUMNS.filter(col => col.default).map(col => col.key);
  });

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => {
      let newColumns;
      if (prev.includes(columnKey)) {
        newColumns = prev.filter(k => k !== columnKey);
      } else {
        newColumns = [...prev, columnKey];
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns));
      }
      return newColumns;
    });
  };

  const isColumnVisible = (columnKey) => visibleColumns.includes(columnKey);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Columnas ({visibleColumns.length})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-semibold">Seleccionar Columnas</h4>
              <div className="grid grid-cols-2 gap-3">
                {ALL_COLUMNS.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={isColumnVisible(column.key)}
                      onCheckedChange={() => toggleColumn(column.key)}
                    />
                    <Label htmlFor={column.key} className="text-sm cursor-pointer">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {ALL_COLUMNS.filter(col => isColumnVisible(col.key)).map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow 
                key={lead.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectLead(lead)}
              >
                {isColumnVisible('status') && (
                  <TableCell>
                    <Badge className={statusColors[lead.status]}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                )}
                {isColumnVisible('priority') && (
                  <TableCell>
                    <Badge className={priorityColors[lead.priority]}>
                      {lead.priority}
                    </Badge>
                  </TableCell>
                )}
                {isColumnVisible('client_name') && <TableCell className="font-medium">{lead.client_name}</TableCell>}
                {isColumnVisible('phone') && <TableCell>{lead.client_phone}</TableCell>}
                {isColumnVisible('email') && <TableCell>{lead.client_email || '-'}</TableCell>}
                {isColumnVisible('interested_vehicles') && (
                  <TableCell>
                    {lead.interested_vehicles?.length > 0 ? (
                      <span className="text-sm">
                        {lead.interested_vehicles[0].vehicle_description}
                        {lead.interested_vehicles.length > 1 && ` +${lead.interested_vehicles.length - 1}`}
                      </span>
                    ) : '-'}
                  </TableCell>
                )}
                {isColumnVisible('other_interests') && (
                  <TableCell className="max-w-xs truncate">{lead.other_interests || '-'}</TableCell>
                )}
                {isColumnVisible('budget') && (
                  <TableCell>{lead.budget || '-'}</TableCell>
                )}
                {isColumnVisible('consultation_date') && (
                  <TableCell>{new Date(lead.consultation_date).toLocaleDateString('es-AR')}</TableCell>
                )}
                {isColumnVisible('follow_up_date') && (
                  <TableCell>{lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString('es-AR') : '-'}</TableCell>
                )}
                {/* The 'actions' column with the Eye button is removed as the row itself is now clickable */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
