import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, X, Search, User, Car, Calendar } from "lucide-react";

export default function LeadForm({ lead, onSubmit, onCancel, isLoading }) {
  const [searchClient, setSearchClient] = useState('');
  const [isNewClient, setIsNewClient] = useState(!lead?.client_id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list() });

  const [vehicleSearch, setVehicleSearch] = useState('');

  const [formData, setFormData] = useState({
    consultation_date: lead?.consultation_date || new Date().toISOString().split('T')[0],
    client_id: lead?.client_id || '',
    client_name: lead?.client_name || '',
    client_phone: lead?.client_phone || '',
    client_email: lead?.client_email || '',
    interested_vehicles: lead?.interested_vehicles || [],
    other_interests: lead?.other_interests || '',
    budget: lead?.budget || '',
    preferred_contact: lead?.preferred_contact || 'WhatsApp',
    status: lead?.status || 'Nuevo',
    interest_level: lead?.interest_level || 'Media',
    observations: lead?.observations || '',
    follow_up_date: lead?.follow_up_date || ''
  });

  const [vehicleSelections, setVehicleSelections] = useState(['']);

  useEffect(() => {
    if (lead?.interested_vehicles?.length > 0) {
      setVehicleSelections([...lead.interested_vehicles.map(v => v.vehicle_id), '']);
    }
  }, [lead]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const filteredClients = clients.filter(c =>
    c.full_name?.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.dni?.includes(searchClient) ||
    c.phone?.includes(searchClient)
  );

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setIsNewClient(false);
      setFormData(prev => ({
        ...prev,
        client_id: clientId,
        client_name: client.full_name,
        client_phone: client.phone,
        client_email: client.email || ''
      }));
      setSearchClient('');
    }
  };

  const handleVehicleChange = (index, vehicleId) => {
    const newSelections = [...vehicleSelections];
    newSelections[index] = vehicleId;
    if (vehicleId && index === vehicleSelections.length - 1) newSelections.push('');
    setVehicleSelections(newSelections);
  };

  const handleRemoveVehicle = (index) => {
    const newSelections = vehicleSelections.filter((_, i) => i !== index);
    if (newSelections.length === 0) newSelections.push('');
    setVehicleSelections(newSelections);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const selectedVehicles = vehicleSelections
      .filter(id => id)
      .map(id => {
        const vehicle = vehicles.find(v => v.id === id);
        return { vehicle_id: id, vehicle_description: vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : '' };
      });
    try {
      await onSubmit({ ...formData, interested_vehicles: selectedVehicles });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp = "h-7 text-[11px]";
  const lbl = "text-[10px] font-medium text-gray-500 mb-0.5";

  return (
    <div className="p-2 md:p-4 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={onCancel} className="mb-2 h-6 text-[10px] px-2">
          <ArrowLeft className="w-3 h-3 mr-1" /> Volver
        </Button>

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Client */}
          <Card className="shadow-sm">
            <CardHeader className="py-1.5 px-3 border-b">
              <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" /> Cliente / Prospecto
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    className={`${inp} pl-7`}
                    placeholder="Buscar cliente por nombre, DNI o teléfono..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                  />
                </div>
                <Button 
                  type="button" 
                  variant={isNewClient ? "default" : "outline"} 
                  size="sm" 
                  className="h-7 text-[10px]"
                  onClick={() => { setIsNewClient(true); handleChange('client_id', ''); }}
                >
                  Nuevo
                </Button>
              </div>

              {searchClient && filteredClients.length > 0 && !formData.client_id && (
                <div className="mb-2 border rounded max-h-24 overflow-auto">
                  {filteredClients.slice(0, 5).map(c => (
                    <div
                      key={c.id}
                      className="p-1.5 hover:bg-gray-50 cursor-pointer text-[10px] border-b last:border-b-0"
                      onClick={() => handleClientSelect(c.id)}
                    >
                      <p className="font-medium">{c.full_name}</p>
                      <p className="text-gray-500">{c.phone} {c.dni && `• DNI ${c.dni}`}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className={lbl}>Nombre *</Label>
                  <Input className={inp} value={formData.client_name} onChange={(e) => handleChange('client_name', e.target.value)} required />
                </div>
                <div>
                  <Label className={lbl}>Teléfono *</Label>
                  <Input className={inp} value={formData.client_phone} onChange={(e) => handleChange('client_phone', e.target.value)} required />
                </div>
                <div>
                  <Label className={lbl}>Email</Label>
                  <Input className={inp} type="email" value={formData.client_email} onChange={(e) => handleChange('client_email', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicles */}
          <Card className="shadow-sm">
            <CardHeader className="py-1.5 px-3 border-b">
              <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-sky-600" /> Vehículos de Interés
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {/* Selected vehicles */}
              {vehicleSelections.filter(id => id).map((selectedId, index) => {
                const vehicle = vehicles.find(v => v.id === selectedId);
                return (
                  <div key={selectedId} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <div className="text-[11px]">
                      <span className="font-medium">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</span>
                      <span className="text-gray-500 ml-2">{vehicle?.plate}</span>
                      {vehicle?.public_price_value && <span className="text-cyan-600 ml-2">${vehicle.public_price_value.toLocaleString('es-AR')}</span>}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveVehicle(vehicleSelections.indexOf(selectedId))}>
                      <X className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                );
              })}
              
              {/* Vehicle search and add */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    className={`${inp} pl-7`}
                    placeholder="Buscar vehículo por marca, modelo, dominio o año..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                  />
                </div>
                {vehicleSearch && (
                  <div className="border rounded max-h-32 overflow-auto bg-white">
                    {vehicles
                      .filter(v => {
                        const search = vehicleSearch.toLowerCase();
                        const alreadySelected = vehicleSelections.includes(v.id);
                        const matchesSearch = 
                          v.brand?.toLowerCase().includes(search) ||
                          v.model?.toLowerCase().includes(search) ||
                          v.plate?.toLowerCase().includes(search) ||
                          v.year?.toString().includes(search);
                        return matchesSearch && !alreadySelected;
                      })
                      .slice(0, 8)
                      .map(v => (
                        <div
                          key={v.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer text-[10px] border-b last:border-b-0 flex justify-between items-center"
                          onClick={() => { handleVehicleChange(vehicleSelections.length - 1, v.id); setVehicleSearch(''); }}
                        >
                          <div>
                            <span className="font-medium">{v.brand} {v.model} {v.year}</span>
                            <span className="text-gray-500 ml-2">{v.plate}</span>
                          </div>
                          <span className="text-cyan-600 font-medium">${v.public_price_value?.toLocaleString('es-AR') || '-'}</span>
                        </div>
                      ))}
                    {vehicles.filter(v => {
                      const search = vehicleSearch.toLowerCase();
                      return (v.brand?.toLowerCase().includes(search) || v.model?.toLowerCase().includes(search) || v.plate?.toLowerCase().includes(search) || v.year?.toString().includes(search)) && !vehicleSelections.includes(v.id);
                    }).length === 0 && (
                      <div className="p-2 text-[10px] text-gray-400 text-center">Sin resultados</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label className={lbl}>Otros intereses (texto libre)</Label>
                <Textarea
                  className="text-[11px] min-h-[50px]"
                  value={formData.other_interests}
                  onChange={(e) => handleChange('other_interests', e.target.value)}
                  placeholder="Ej: Busca Fiat Cronos 2020-2022, sedán automático..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Status & Follow-up */}
          <Card className="shadow-sm">
            <CardHeader className="py-1.5 px-3 border-b">
              <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-green-600" /> Estado y Seguimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <Label className={lbl}>Fecha Consulta</Label>
                  <Input className={inp} type="date" value={formData.consultation_date} onChange={(e) => handleChange('consultation_date', e.target.value)} />
                </div>
                <div>
                  <Label className={lbl}>Estado</Label>
                  <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                    <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Nuevo', 'Contactado', 'En negociación', 'Concretado', 'Perdido'].map(s => <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={lbl}>Nivel Interés</Label>
                  <Select value={formData.interest_level} onValueChange={(v) => handleChange('interest_level', v)}>
                    <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Baja', 'Media', 'Alta'].map(s => <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={lbl}>Presupuesto</Label>
                  <Input className={inp} type="text" value={formData.budget} onChange={(e) => handleChange('budget', e.target.value)} placeholder="Ej: 15.000.000 - 18.000.000" />
                </div>
                <div>
                  <Label className={lbl}>Seguimiento</Label>
                  <Input className={inp} type="date" value={formData.follow_up_date} onChange={(e) => handleChange('follow_up_date', e.target.value)} />
                </div>
              </div>
              <div className="mt-2">
                <Label className={lbl}>Observaciones</Label>
                <Textarea className="text-[11px] min-h-[50px]" value={formData.observations} onChange={(e) => handleChange('observations', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="h-7 text-[10px]" disabled={isSubmitting || isLoading}>Cancelar</Button>
            <Button type="submit" className="h-7 text-[10px] bg-sky-600 hover:bg-sky-700" disabled={isSubmitting || isLoading}>
              <Save className="w-3 h-3 mr-1" /> {isSubmitting || isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}