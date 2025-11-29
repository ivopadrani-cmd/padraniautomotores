import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Settings, Edit, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ALL_COLUMNS = [
  { key: 'full_name', label: 'Nombre', default: true },
  { key: 'phone', label: 'Teléfono', default: true },
  { key: 'email', label: 'Email', default: true },
  { key: 'dni', label: 'DNI', default: true },
  { key: 'cuit_cuil', label: 'CUIT/CUIL', default: false },
  { key: 'city', label: 'Ciudad', default: true },
  { key: 'province', label: 'Provincia', default: false },
  { key: 'address', label: 'Dirección', default: false },
  { key: 'postal_code', label: 'CP', default: false },
  { key: 'marital_status', label: 'Estado Civil', default: false },
  { key: 'client_status', label: 'Estado Cliente', default: true },
  { key: 'created_date', label: 'Fecha Alta', default: true },
  { key: 'actions', label: 'Acciones', default: true }
];

const STORAGE_KEY = 'clientTableColumns';

export default function ClientTable({ clients, onSelectClient, onEditClient, onDeleteClient }) {
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(key => ALL_COLUMNS.some(col => col.key === key))) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved columns:", e);
      }
    }
    return ALL_COLUMNS.filter(col => col.default).map(col => col.key);
  });

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => {
      const newColumns = prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns));
      return newColumns;
    });
  };

  const isColumnVisible = (columnKey) => visibleColumns.includes(columnKey);

  const thClassName = "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0";
  const tdClassName = "p-4 align-middle [&:has([role=checkbox])]:pr-0";

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
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              {visibleColumns.includes('full_name') && <th className={thClassName}>Nombre</th>}
              {visibleColumns.includes('phone') && <th className={thClassName}>Teléfono</th>}
              {visibleColumns.includes('email') && <th className={thClassName}>Email</th>}
              {visibleColumns.includes('dni') && <th className={thClassName}>DNI</th>}
              {visibleColumns.includes('cuit_cuil') && <th className={thClassName}>CUIT/CUIL</th>}
              {visibleColumns.includes('city') && <th className={thClassName}>Ciudad</th>}
              {visibleColumns.includes('province') && <th className={thClassName}>Provincia</th>}
              {visibleColumns.includes('address') && <th className={thClassName}>Dirección</th>}
              {visibleColumns.includes('postal_code') && <th className={thClassName}>CP</th>}
              {visibleColumns.includes('marital_status') && <th className={thClassName}>Estado Civil</th>}
              {visibleColumns.includes('client_status') && <th className={thClassName}>Estado</th>}
              {visibleColumns.includes('created_date') && <th className={thClassName}>Fecha Alta</th>}
              {visibleColumns.includes('actions') && <th className={thClassName}>Acciones</th>}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {clients.map((client) => (
              <tr 
                key={client.id} 
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectClient(client)}
              >
                {visibleColumns.includes('full_name') && <td className="font-medium p-4 align-middle [&:has([role=checkbox])]:pr-0">{client.full_name}</td>}
                {visibleColumns.includes('phone') && <td className={tdClassName}>{client.phone}</td>}
                {visibleColumns.includes('email') && <td className={tdClassName}>{client.email || '-'}</td>}
                {visibleColumns.includes('dni') && <td className={tdClassName}>{client.dni || '-'}</td>}
                {visibleColumns.includes('cuit_cuil') && <td className={tdClassName}>{client.cuit_cuil || '-'}</td>}
                {visibleColumns.includes('city') && <td className={tdClassName}>{client.city || '-'}</td>}
                {visibleColumns.includes('province') && <td className={tdClassName}>{client.province || '-'}</td>}
                {visibleColumns.includes('address') && <td className={tdClassName}>{client.address || '-'}</td>}
                {visibleColumns.includes('postal_code') && <td className={tdClassName}>{client.postal_code || '-'}</td>}
                {visibleColumns.includes('marital_status') && <td className={tdClassName}>{client.marital_status || '-'}</td>}
                {visibleColumns.includes('client_status') && (
                  <td className={tdClassName}>
                    <Badge variant={client.client_status === 'Prospecto' ? 'secondary' : 'default'}>
                      {client.client_status || 'Cliente'}
                    </Badge>
                  </td>
                )}
                {visibleColumns.includes('created_date') && <td className={tdClassName}>{client.created_date ? new Date(client.created_date).toLocaleDateString('es-AR') : '-'}</td>}
                {visibleColumns.includes('actions') && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectClient(client)}
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditClient(client)}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => onDeleteClient(client.id, e)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}