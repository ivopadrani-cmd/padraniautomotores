import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Search } from "lucide-react";

export default function TaskFormDialog({ open, onOpenChange, task, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({});
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: sellers = [] } = useQuery({ queryKey: ['sellers'], queryFn: () => base44.entities.Seller.filter({ is_active: true }) });

  useEffect(() => {
    if (open) {
      setFormData({
        title: task?.title || '',
        task_date: task?.task_date || new Date().toISOString().split('T')[0],
        task_time: task?.task_time || '',
        task_type: task?.task_type || 'Tarea',
        status: task?.status || 'Pendiente',
        priority: task?.priority || 'Media',
        description: task?.description || '',
        responsible: task?.responsible || '',
        related_vehicle_id: task?.related_vehicle_id || '',
        related_vehicle_description: task?.related_vehicle_description || '',
        related_client_id: task?.related_client_id || '',
        related_client_name: task?.related_client_name || '',
        related_lead_id: task?.related_lead_id || '',
        related_lead_description: task?.related_lead_description || '',
        cost: task?.cost || ''
      });
      setVehicleSearch('');
      setClientSearch('');
    }
  }, [open, task]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, id: task?.id, cost: formData.cost ? parseFloat(formData.cost) : null });
  };

  const filteredVehicles = vehicles.filter(v => 
    !vehicleSearch || 
    v.brand?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.model?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.plate?.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const filteredClients = clients.filter(c => 
    !clientSearch || 
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch)
  );

  const inp = "h-8 text-[11px] bg-white";
  const lbl = "text-[10px] font-medium text-gray-500 mb-0.5";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold">{task?.id ? 'Editar' : 'Nueva'} Tarea</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <Label className={lbl}>Título *</Label>
            <Input className={inp} value={formData.title} onChange={(e) => handleChange('title', e.target.value)} required />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className={lbl}>Tipo</Label>
              <Select value={formData.task_type} onValueChange={(v) => handleChange('task_type', v)}>
                <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Tarea', 'Trámite', 'Servicio', 'Gestoría', 'Evento', 'Seguimiento'].map(t => (
                    <SelectItem key={t} value={t} className="text-[11px]">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={lbl}>Fecha *</Label>
              <Input className={inp} type="date" value={formData.task_date} onChange={(e) => handleChange('task_date', e.target.value)} required />
            </div>
            <div>
              <Label className={lbl}>Hora</Label>
              <Input className={inp} type="time" value={formData.task_time} onChange={(e) => handleChange('task_time', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className={lbl}>Estado</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Pendiente', 'En proceso', 'Completada', 'Cancelada'].map(s => (
                    <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={lbl}>Prioridad</Label>
              <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
                <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Baja', 'Media', 'Alta', 'Urgente'].map(p => (
                    <SelectItem key={p} value={p} className="text-[11px]">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={lbl}>Responsable</Label>
              <Select value={formData.responsible} onValueChange={(v) => handleChange('responsible', v)}>
                <SelectTrigger className={inp}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {sellers.map(s => (
                    <SelectItem key={s.id} value={s.full_name} className="text-[11px]">{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vehicle search */}
          <div>
            <Label className={lbl}>Vehículo relacionado</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input 
                className={`${inp} pl-8`} 
                placeholder="Buscar vehículo..." 
                value={vehicleSearch || formData.related_vehicle_description} 
                onChange={(e) => setVehicleSearch(e.target.value)} 
              />
              {vehicleSearch && filteredVehicles.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-32 overflow-auto">
                  {filteredVehicles.slice(0, 6).map(v => (
                    <div 
                      key={v.id} 
                      className="p-2 hover:bg-gray-100 cursor-pointer text-[10px] border-b last:border-b-0"
                      onClick={() => {
                        handleChange('related_vehicle_id', v.id);
                        handleChange('related_vehicle_description', `${v.brand} ${v.model} ${v.year}`);
                        setVehicleSearch('');
                      }}
                    >
                      <p className="font-medium">{v.brand} {v.model} {v.year}</p>
                      <p className="text-gray-500">{v.plate}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client search */}
          <div>
            <Label className={lbl}>Cliente relacionado</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input 
                className={`${inp} pl-8`} 
                placeholder="Buscar cliente..." 
                value={clientSearch || formData.related_client_name} 
                onChange={(e) => setClientSearch(e.target.value)} 
              />
              {clientSearch && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-32 overflow-auto">
                  {filteredClients.slice(0, 6).map(c => (
                    <div 
                      key={c.id} 
                      className="p-2 hover:bg-gray-100 cursor-pointer text-[10px] border-b last:border-b-0"
                      onClick={() => {
                        handleChange('related_client_id', c.id);
                        handleChange('related_client_name', c.full_name);
                        setClientSearch('');
                      }}
                    >
                      <p className="font-medium">{c.full_name}</p>
                      <p className="text-gray-500">{c.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className={lbl}>Costo</Label>
            <Input className={inp} type="number" value={formData.cost} onChange={(e) => handleChange('cost', e.target.value)} placeholder="0" />
          </div>

          <div>
            <Label className={lbl}>Descripción</Label>
            <Textarea className="text-[11px] min-h-[60px] bg-white" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-[11px]">Cancelar</Button>
            <Button type="submit" className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800" disabled={isLoading}>
              <Save className="w-3.5 h-3.5 mr-1.5" />{isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}