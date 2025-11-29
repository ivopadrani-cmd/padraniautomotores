import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Edit, Trash2, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

const STATUS_COLORS = {
  'A INGRESAR': 'bg-cyan-100 text-cyan-700',
  'EN REPARACION': 'bg-violet-100 text-violet-700',
  'DISPONIBLE': 'bg-green-100 text-green-700',
  'PAUSADO': 'bg-gray-200 text-gray-700',
  'RESERVADO': 'bg-orange-100 text-orange-700',
  'VENDIDO': 'bg-red-100 text-red-700'
};

const ALL_COLUMNS = [
  { key: 'status', label: 'Estado', default: true },
  { key: 'ownership', label: 'Prop', default: true },
  { key: 'brand', label: 'Marca', default: true },
  { key: 'model', label: 'Modelo', default: true },
  { key: 'year', label: 'Año', default: true },
  { key: 'plate', label: 'Dominio', default: true },
  { key: 'kilometers', label: 'KM', default: true },
  { key: 'color', label: 'Color', default: false },
  { key: 'supplier', label: 'Proveedor', default: true },
  { key: 'price_ars', label: 'Precio', default: true },
  { key: 'actions', label: '', default: true }
];

export default function VehicleTable({ vehicles, clients, onSelectVehicle, onEditVehicle, onDeleteVehicle, onStatusChange, onClientClick }) {
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('vehicleTableColumns');
    return saved ? JSON.parse(saved) : ALL_COLUMNS.filter(c => c.default).map(c => c.key);
  });

  const toggleColumn = (key) => {
    const newCols = visibleColumns.includes(key) ? visibleColumns.filter(k => k !== key) : [...visibleColumns, key];
    localStorage.setItem('vehicleTableColumns', JSON.stringify(newCols));
    setVisibleColumns(newCols);
  };

  const isVisible = (key) => visibleColumns.includes(key);

  return (
    <div>
      <div className="flex justify-end p-2 border-b">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs"><Settings className="w-3 h-3 mr-1" /> Columnas</Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-2">
              {ALL_COLUMNS.filter(c => c.key !== 'actions').map(c => (
                <div key={c.key} className="flex items-center gap-2">
                  <Checkbox id={c.key} checked={isVisible(c.key)} onCheckedChange={() => toggleColumn(c.key)} />
                  <label htmlFor={c.key} className="text-xs cursor-pointer">{c.label}</label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b">
            <tr>
              {isVisible('status') && <th className="text-left px-2 py-2 font-medium text-gray-600">Estado</th>}
              {isVisible('ownership') && <th className="text-left px-2 py-2 font-medium text-gray-600">Prop</th>}
              {isVisible('brand') && <th className="text-left px-2 py-2 font-medium text-gray-600">Marca</th>}
              {isVisible('model') && <th className="text-left px-2 py-2 font-medium text-gray-600">Modelo</th>}
              {isVisible('year') && <th className="text-left px-2 py-2 font-medium text-gray-600">Año</th>}
              {isVisible('plate') && <th className="text-left px-2 py-2 font-medium text-gray-600">Dom</th>}
              {isVisible('kilometers') && <th className="text-left px-2 py-2 font-medium text-gray-600">KM</th>}
              {isVisible('color') && <th className="text-left px-2 py-2 font-medium text-gray-600">Color</th>}
              {isVisible('supplier') && <th className="text-left px-2 py-2 font-medium text-gray-600">Proveedor</th>}
              {isVisible('price_ars') && <th className="text-left px-2 py-2 font-medium text-gray-600">Precio</th>}
              {isVisible('actions') && <th className="px-2 py-2 w-20"></th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => {
              const supplier = clients.find(c => c.id === v.supplier_client_id);
              const isCons = v.ownership === 'CONSIGNACIÓN';
              return (
                <tr key={v.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onSelectVehicle(v)}>
                  {isVisible('status') && (
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <Select value={v.status} onValueChange={(s) => onStatusChange(v.id, s)}>
                        <SelectTrigger className="h-6 text-[10px] w-24 border-0 bg-transparent p-0">
                          <Badge className={`${STATUS_COLORS[v.status]} text-[10px] px-1.5 py-0`}>{v.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  {isVisible('ownership') && (
                    <td className="px-2 py-1.5">
                      {isCons ? <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1 py-0">CONS</Badge> : <span className="text-gray-500">{v.ownership || '-'}</span>}
                    </td>
                  )}
                  {isVisible('brand') && <td className="px-2 py-1.5 font-medium">{v.brand}</td>}
                  {isVisible('model') && <td className="px-2 py-1.5">{v.model}</td>}
                  {isVisible('year') && <td className="px-2 py-1.5">{v.year}</td>}
                  {isVisible('plate') && <td className="px-2 py-1.5 font-mono">{v.plate || '-'}</td>}
                  {isVisible('kilometers') && <td className="px-2 py-1.5">{v.kilometers?.toLocaleString('es-AR')}</td>}
                  {isVisible('color') && <td className="px-2 py-1.5">{v.color || '-'}</td>}
                  {isVisible('supplier') && (
                    <td className="px-2 py-1.5">
                      {supplier ? (
                        <span className="text-sky-600 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onClientClick(supplier); }}>
                          {supplier.full_name}
                        </span>
                      ) : '-'}
                    </td>
                  )}
                  {isVisible('price_ars') && <td className="px-2 py-1.5 font-semibold">${v.price_ars?.toLocaleString('es-AR') || '0'}</td>}
                  {isVisible('actions') && (
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSelectVehicle(v)}><Eye className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditVehicle(v)}><Edit className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => onDeleteVehicle(v.id, e)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}