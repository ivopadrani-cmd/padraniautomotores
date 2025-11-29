import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

export default function AddEventDialog({ 
  vehicleId, 
  vehicleDescription, 
  clientId, 
  clientName,
  saleId,
  transactionId,
  trigger 
}) {
  const [open, setOpen] = useState(false);
  const [createLinkedTransaction, setCreateLinkedTransaction] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
    enabled: !vehicleId
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: !clientId
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
    enabled: !saleId
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list(),
    enabled: !transactionId
  });

  const [formData, setFormData] = useState({
    title: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '09:00',
    event_type: 'Reunión',
    related_vehicle_id: vehicleId || '',
    related_client_id: clientId || '',
    related_sale_id: saleId || '',
    related_transaction_id: transactionId || '',
    responsible: '',
    description: '',
    status: 'Pendiente',
    priority: 'MEDIA'
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const event = await base44.entities.CalendarEvent.create(data);
      
      // Crear trámite vinculado si el checkbox está marcado
      if (createLinkedTransaction && !data.related_transaction_id) {
        await base44.entities.Transaction.create({
          transaction_name: data.title,
          vehicle_id: data.related_vehicle_id || '',
          vehicle_description: vehicleDescription || '',
          client_id: data.related_client_id || '',
          client_name: clientName || '',
          sale_id: data.related_sale_id || '',
          transaction_type: 'Otro',
          status: data.status || 'Pendiente',
          responsible: data.responsible || '',
          transaction_date: data.event_date,
          observations: data.description || ''
        });
      }
      
      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setOpen(false);
      setFormData({
        title: '',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '09:00',
        event_type: 'Reunión',
        related_vehicle_id: vehicleId || '',
        related_client_id: clientId || '',
        related_sale_id: saleId || '',
        related_transaction_id: transactionId || '',
        responsible: '',
        description: '',
        status: 'Pendiente',
        priority: 'MEDIA'
      });
      setCreateLinkedTransaction(false);
    },
  });

  const handleSaleChange = (selectedSaleId) => {
    const sale = sales.find(s => s.id === selectedSaleId);
    setFormData(prev => ({
      ...prev,
      related_sale_id: selectedSaleId,
      related_vehicle_id: sale?.vehicle_id || prev.related_vehicle_id,
      related_client_id: sale?.client_id || prev.related_client_id
    }));
  };

  const handleTransactionChange = (selectedTransactionId) => {
    const transaction = transactions.find(t => t.id === selectedTransactionId);
    setFormData(prev => ({
      ...prev,
      related_transaction_id: selectedTransactionId,
      related_vehicle_id: transaction?.vehicle_id || prev.related_vehicle_id,
      related_client_id: transaction?.client_id || prev.related_client_id,
      related_sale_id: transaction?.sale_id || prev.related_sale_id
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Agregar Evento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Evento en Calendario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ej: Turno transferencia"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Evento *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({...formData, event_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trámite">Trámite</SelectItem>
                  <SelectItem value="Turno transferencia">Turno transferencia</SelectItem>
                  <SelectItem value="Firma escribanía">Firma escribanía</SelectItem>
                  <SelectItem value="Turno verificación">Turno verificación</SelectItem>
                  <SelectItem value="Chapista">Chapista</SelectItem>
                  <SelectItem value="Taller">Taller</SelectItem>
                  <SelectItem value="Vencimiento">Vencimiento</SelectItem>
                  <SelectItem value="Reunión">Reunión</SelectItem>
                  <SelectItem value="Recordatorio">Recordatorio</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({...formData, event_time: e.target.value})}
              />
            </div>
          </div>

          {!saleId && (
            <div className="space-y-2">
              <Label>Venta (opcional)</Label>
              <Select
                value={formData.related_sale_id}
                onValueChange={handleSaleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vincular venta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sin vincular</SelectItem>
                  {sales.map(sale => (
                    <SelectItem key={sale.id} value={sale.id}>
                      {sale.vehicle_description} - {sale.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!transactionId && (
            <div className="space-y-2">
              <Label>Trámite (opcional)</Label>
              <Select
                value={formData.related_transaction_id}
                onValueChange={handleTransactionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vincular trámite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sin vincular</SelectItem>
                  {transactions.map(transaction => (
                    <SelectItem key={transaction.id} value={transaction.id}>
                      {transaction.transaction_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!formData.related_transaction_id && !transactionId && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Checkbox
                id="createTransaction"
                checked={createLinkedTransaction}
                onCheckedChange={setCreateLinkedTransaction}
              />
              <label htmlFor="createTransaction" className="text-sm font-medium cursor-pointer">
                Crear trámite vinculado automáticamente
              </label>
            </div>
          )}

          {!vehicleId && (
            <div className="space-y-2">
              <Label>Vehículo (opcional)</Label>
              <Select
                value={formData.related_vehicle_id}
                onValueChange={(value) => setFormData({...formData, related_vehicle_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sin vincular</SelectItem>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!clientId && (
            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <Select
                value={formData.related_client_id}
                onValueChange={(value) => setFormData({...formData, related_client_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sin vincular</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {vehicleDescription && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">Vehículo vinculado:</p>
              <p className="text-sm text-blue-700">{vehicleDescription}</p>
            </div>
          )}

          {clientName && (
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm font-semibold text-purple-900">Cliente vinculado:</p>
              <p className="text-sm text-purple-700">{clientName}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Responsable</Label>
            <Select
              value={formData.responsible}
              onValueChange={(value) => setFormData({...formData, responsible: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar responsable" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.full_name || user.email}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              placeholder="Detalles adicionales del evento..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Guardando...' : 'Crear Evento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}