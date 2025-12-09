import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Car, User, Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import SalesContractView from "./SalesContractView";

export default function ConsignmentSaleForm({ open, onOpenChange, vehicle, onSaleCreated }) {
  const queryClient = useQueryClient();

  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [includeDeposit, setIncludeDeposit] = useState(false);
  const [includeCashPayment, setIncludeCashPayment] = useState(false);
  const [includeTradeIn, setIncludeTradeIn] = useState(false);
  const [includeFinancing, setIncludeFinancing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    full_name: '', phone: '', dni: '', cuit_cuil: '', email: '', birth_date: '',
    address: '', city: '', province: '', postal_code: '', marital_status: '', observations: ''
  });

  // Client editing state for missing data
  const [editingClientData, setEditingClientData] = useState({});

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: rates = [] } = useQuery({ queryKey: ['exchange-rates'], queryFn: () => base44.entities.ExchangeRate.list('-rate_date') });

  const currentBlueRate = rates.find(r => r.rate_type === 'Diaria')?.usd_rate || 1200;

  const getInitialFormData = () => {
    return {
      sale_date: new Date().toISOString().split('T')[0],
      client_name: 'CONCESIONARIO', // Empresa como comprador fijo
      seller: '',
      sale_price: vehicle?.public_price_value || '',
      sale_price_currency: vehicle?.public_price_currency || 'ARS',
      sale_price_exchange_rate: currentBlueRate,
      deposit: { amount: '', currency: 'ARS', exchange_rate: currentBlueRate, date: new Date().toISOString().split('T')[0], payment_method: 'Efectivo', description: '' },
      cash_payment: { amount: '', currency: 'ARS', exchange_rate: currentBlueRate, date: new Date().toISOString().split('T')[0], payment_method: 'Efectivo' },
      trade_ins: [],
      financing: { amount: '', currency: 'ARS', exchange_rate: currentBlueRate, date: new Date().toISOString().split('T')[0], bank: '', installments: '', installment_value: '' },
      balance_due_date: '',
      observations: 'Venta por consignación'
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (!open) return;

    // Reset form data
    setFormData(getInitialFormData());
    setSelectedClientId(vehicle?.supplier_client_id || '');
    setShowNewClientForm(false);
    setIncludeDeposit(false);
    setIncludeCashPayment(false);
    setIncludeTradeIn(false);
    setIncludeFinancing(false);
    setEditingClientData({});
    setNewClientData({ full_name: '', phone: '', dni: '', cuit_cuil: '', email: '', birth_date: '', address: '', city: '', province: '', postal_code: '', marital_status: '', observations: '' });
    setHasChanges(false);
  }, [open, vehicle, currentBlueRate]);

  const createSaleMutation = useMutation({
    mutationFn: async (data) => {
      let supplierClientId = data.supplier_client_id || selectedClientId;

      // Si viene de un cliente existente pero está vacío, actualizar ese cliente con datos faltantes
      if (supplierClientId && !showNewClientForm) {
        console.log('✅ Actualizando proveedor existente:', supplierClientId);
        await base44.entities.Client.update(supplierClientId, {
          client_status: 'Cliente',
          ...editingClientData
        });
        data.supplier_client_id = supplierClientId;
      }
      // Crear nuevo cliente solo si el formulario de nuevo cliente está visible
      else if (showNewClientForm && newClientData.full_name && newClientData.phone && !supplierClientId) {
        console.log('✅ Creando nuevo proveedor:', newClientData.full_name);
        const newClient = await base44.entities.Client.create({
          ...newClientData,
          client_status: 'Cliente'
        });
        supplierClientId = newClient.id;
        data.supplier_client_id = supplierClientId;
        data.seller = newClientData.full_name;
      }
      // Actualizar cliente existente con datos faltantes
      else if (selectedClientId && Object.keys(editingClientData).length > 0) {
        console.log('✅ Actualizando proveedor existente con datos faltantes:', selectedClientId);
        await base44.entities.Client.update(selectedClientId, {
          client_status: 'Cliente',
          ...editingClientData
        });
        supplierClientId = selectedClientId;
        data.supplier_client_id = supplierClientId;
      }

      // Update vehicle with supplier data
      if (vehicle?.id && supplierClientId) {
        const supplier = clients.find(c => c.id === supplierClientId);
        await base44.entities.Vehicle.update(vehicle.id, {
          supplier_client_id: supplierClientId,
          supplier_client_name: supplier?.full_name || data.seller
        });
      }

      // Crear la venta (en consignación, el comprador es la empresa)
      const saleData = {
        ...data,
        vehicle_id: vehicle?.id,
        vehicle_description: `${vehicle?.brand} ${vehicle?.model} ${vehicle?.year}`,
        client_id: null, // La empresa es el "comprador" pero no es un cliente registrado
        client_name: 'CONCESIONARIO',
        sale_price: parseFloat(data.sale_price) || 0,
        sale_price_currency: data.sale_price_currency,
        sale_price_exchange_rate: parseFloat(data.sale_price_exchange_rate) || 1200,
        deposit: includeDeposit ? { ...data.deposit, amount: parseFloat(data.deposit.amount) || 0, exchange_rate: parseFloat(data.deposit.exchange_rate) || 1200 } : null,
        cash_payment: includeCashPayment ? { ...data.cash_payment, amount: parseFloat(data.cash_payment.amount) || 0, exchange_rate: parseFloat(data.cash_payment.exchange_rate) || 1200 } : null,
        trade_ins: includeTradeIn ? data.trade_ins.map(ti => ({ ...ti, value: parseFloat(ti.value) || 0, exchange_rate: parseFloat(ti.exchange_rate) || 1200, is_peritado: ti.is_peritado || false })) : [],
        financing: includeFinancing ? { ...data.financing, amount: parseFloat(data.financing.amount) || 0, exchange_rate: parseFloat(data.financing.exchange_rate) || 1200, installments: parseInt(data.financing.installments) || 0, installment_value: parseFloat(data.financing.installment_value) || 0 } : null,
        balance_due_date: data.balance_due_date || null,
        sale_status: 'FINALIZADA', // Las ventas de consignación se marcan como finalizadas automáticamente
        observations: data.observations,
        is_consignment_sale: true
      };

      const sale = await base44.entities.Sale.create(saleData);

      // Actualizar el vehículo como vendido
      await base44.entities.Vehicle.update(vehicle.id, { status: 'VENDIDO' });

      return sale;
    },
    onSuccess: async (sale) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-sales'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle?.id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      const saleWithId = { ...sale, id: sale.id };

      // Validar si hay datos suficientes para el boleto
      const supplierHasData = selectedClient && selectedClient.dni && selectedClient.cuit_cuil && selectedClient.address && selectedClient.city && selectedClient.province;
      const vehicleHasData = vehicle && vehicle.brand && vehicle.model && vehicle.year && vehicle.plate && vehicle.engine_number && vehicle.chassis_number && vehicle.chassis_brand && vehicle.engine_brand && vehicle.registration_city && vehicle.registration_province;

      if (!supplierHasData || !vehicleHasData) {
        // Faltan datos: mostrar advertencia específica y NO abrir boleto
        const missingFields = [];
        if (!supplierHasData) {
          const supplierMissing = [];
          if (!selectedClient?.dni) supplierMissing.push('DNI');
          if (!selectedClient?.cuit_cuil) supplierMissing.push('CUIT/CUIL');
          if (!selectedClient?.address) supplierMissing.push('dirección');
          if (!selectedClient?.city) supplierMissing.push('ciudad');
          if (!selectedClient?.province) supplierMissing.push('provincia');
          if (supplierMissing.length > 0) missingFields.push(`proveedor (${supplierMissing.join(', ')})`);
        }
        if (!vehicleHasData) {
          const vehicleMissing = [];
          if (!vehicle?.engine_number) vehicleMissing.push('motor');
          if (!vehicle?.chassis_number) vehicleMissing.push('chasis');
          if (!vehicle?.chassis_brand) vehicleMissing.push('marca chasis');
          if (!vehicle?.engine_brand) vehicleMissing.push('marca motor');
          if (!vehicle?.registration_city) vehicleMissing.push('ciudad radicación');
          if (!vehicle?.registration_province) vehicleMissing.push('provincia radicación');
          if (vehicleMissing.length > 0) missingFields.push(`vehículo (${vehicleMissing.join(', ')})`);
        }

        toast.warning(`No se puede crear el boleto. Faltan completar datos de: ${missingFields.join(' y ')}. Se guardó la venta de consignación.`);
        // Cerrar el formulario sin mostrar el boleto
        onOpenChange(false);
        // Si hay un callback onSaleCreated, llamarlo
        if (onSaleCreated) onSaleCreated(saleWithId);
      } else {
        // Todos los datos están completos: mostrar boleto
        setShowContract(true);
        toast.success("Venta de consignación creada y boleto generado");
        if (onSaleCreated) onSaleCreated(saleWithId);
      }

      setShowNewClientForm(false);
      setNewClientData({ full_name: '', phone: '', dni: '', cuit_cuil: '', email: '', birth_date: '', address: '', city: '', province: '', postal_code: '', marital_status: '', observations: '' });
    },
  });

  const handleClientSelect = (client) => {
    setSelectedClientId(client.id);
    setFormData(prev => ({ ...prev, seller: client.full_name }));
    setClientSearch('');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const filteredClients = clients.filter(c => !clientSearch || c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) || c.dni?.includes(clientSearch) || c.phone?.includes(clientSearch));
  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <>
      <SalesContractView open={showContract} onOpenChange={(o) => { setShowContract(o); if (!o) onOpenChange(false); }} sale={{ ...formData, id: null }} vehicle={vehicle} client={selectedClient} />

      <Dialog open={open && !showContract} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-0">
            {/* Vehicle Header - Full Width */}
            <div className="bg-orange-900 text-white p-4 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Car className="w-6 h-6 text-gray-400" />
                <div className="flex-1">
                  <p className="text-lg font-bold">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
                  <p className="text-sm text-gray-400">{vehicle?.plate} • En consignación</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase">Venta de Consignación</p>
                  <p className="text-xs text-gray-300">Nueva</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();

            // Validar que el proveedor esté seleccionado o se esté creando uno nuevo
            if (!selectedClientId && !showNewClientForm) {
              toast.error("Debes seleccionar un proveedor existente o crear uno nuevo");
              return;
            }

            if (showNewClientForm && (!newClientData.full_name || !newClientData.phone)) {
              toast.error("Los campos Nombre completo y Teléfono son obligatorios para el nuevo proveedor");
              return;
            }

            createSaleMutation.mutate({
              sale_date: formData.sale_date,
              seller: formData.seller,
              supplier_client_id: selectedClientId,
              sale_price: formData.sale_price,
              sale_price_currency: formData.sale_price_currency,
              sale_price_exchange_rate: formData.sale_price_exchange_rate,
              deposit: includeDeposit ? formData.deposit : null,
              cash_payment: includeCashPayment ? formData.cash_payment : null,
              trade_ins: includeTradeIn ? formData.trade_ins : [],
              financing: includeFinancing ? formData.financing : null,
              balance_due_date: formData.balance_due_date,
              observations: formData.observations
            });
          }} className="p-3 space-y-3">

            {/* Price */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-[9px] text-gray-400 uppercase">Precio de venta</Label>
                  <Input className="h-9 text-[15px] font-bold" value={formData.sale_price} onChange={(e) => handleChange('sale_price', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-400 uppercase">Moneda</Label>
                  <Select value={formData.sale_price_currency} onValueChange={(v) => handleChange('sale_price_currency', v)}>
                    <SelectTrigger className="h-9 w-18 text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ARS" className="text-[10px]">ARS</SelectItem><SelectItem value="USD" className="text-[10px]">USD</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[9px] text-gray-400 uppercase">Cotiz. USD</Label>
                  <Input className="h-9 w-20 text-[11px]" value={formData.sale_price_exchange_rate} onChange={(e) => handleChange('sale_price_exchange_rate', e.target.value)} />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-400 uppercase">Fecha</Label>
                  <Input
                    className="h-9 w-28 text-[11px]"
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) => handleChange('sale_date', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Supplier */}
            <div className="p-2.5 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-medium text-gray-500 uppercase">Proveedor (Consignante)</span>
                </div>
              </div>

              {/* Toggle Nuevo Proveedor / Proveedor Existente */}
              <div className="flex rounded overflow-hidden mb-3">
                <button
                  type="button"
                  className={`flex-1 h-8 text-[10px] font-medium transition-colors ${
                    isNewClient
                      ? 'bg-orange-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    setIsNewClient(true);
                    setSelectedClientId('');
                    setFormData(prev => ({ ...prev, seller: '' }));
                    setEditingClientData({});
                    setShowNewClientForm(true);
                  }}
                >
                  Nuevo Proveedor
                </button>
                <button
                  type="button"
                  className={`flex-1 h-8 text-[10px] font-medium transition-colors ${
                    !isNewClient
                      ? 'bg-orange-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    setIsNewClient(false);
                    setShowNewClientForm(false);
                    setNewClientData({ full_name: '', phone: '', dni: '', cuit_cuil: '', email: '', birth_date: '', address: '', city: '', province: '', postal_code: '', marital_status: '', observations: '' });
                  }}
                >
                  Proveedor Existente
                </button>
              </div>

              {isNewClient ? (
                <div className="space-y-2 p-2 bg-orange-50 rounded border border-orange-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-medium text-orange-700">Nuevo Proveedor</span>
                    <Button type="button" variant="ghost" className="h-5 text-[9px] px-1" onClick={() => setShowNewClientForm(false)}>Cancelar</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div><Label className="text-[9px] text-gray-400">Nombre completo *</Label><Input className="h-7 text-[10px]" defaultValue={newClientData.full_name} onBlur={(e) => setNewClientData(prev => ({ ...prev, full_name: e.target.value }))} key={`nc-name-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">Teléfono *</Label><Input className="h-7 text-[10px]" defaultValue={newClientData.phone} onBlur={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))} key={`nc-phone-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">DNI *</Label><Input className="h-7 text-[10px]" defaultValue={newClientData.dni} onBlur={(e) => setNewClientData(prev => ({ ...prev, dni: e.target.value }))} key={`nc-dni-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">CUIT/CUIL *</Label><Input className="h-7 text-[10px]" defaultValue={newClientData.cuit_cuil} onBlur={(e) => setNewClientData(prev => ({ ...prev, cuit_cuil: e.target.value }))} key={`nc-cuit-${open}`} required /></div>
                    <div className="col-span-2"><Label className="text-[9px] text-gray-400">Dirección *</Label><Input className="h-7 text-[10px]" defaultValue={newClientData.address} onBlur={(e) => setNewClientData(prev => ({ ...prev, address: e.target.value }))} key={`nc-addr-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">Ciudad *</Label><Input className="h-7 text-[10px]" defaultValue={newClientData.city} onBlur={(e) => setNewClientData(prev => ({ ...prev, city: e.target.value }))} key={`nc-city-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">Provincia *</Label><Input className="h-7 text-[10px]" defaultValue={newClientData.province} onBlur={(e) => setNewClientData(prev => ({ ...prev, province: e.target.value }))} key={`nc-prov-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">Email</Label><Input className="h-7 text-[10px]" defaultValue={newClientData.email} onBlur={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))} key={`nc-email-${open}`} /></div>
                    <div><Label className="text-[9px] text-gray-400">Fecha Nac.</Label><Input className="h-7 text-[10px]" type="date" defaultValue={newClientData.birth_date} onBlur={(e) => setNewClientData(prev => ({ ...prev, birth_date: e.target.value }))} key={`nc-birth-${open}`} /></div>
                  </div>
                </div>
              ) : selectedClient ? (
                <div className="p-2 bg-orange-50 rounded border border-orange-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-[11px]">{selectedClient.full_name}</p>
                      <p className="text-[10px] text-gray-500">{selectedClient.phone}</p>
                    </div>
                    <Button type="button" variant="ghost" className="h-5 text-[9px] px-1" onClick={() => { setSelectedClientId(''); setFormData(prev => ({ ...prev, seller: '' })); setEditingClientData({}); }}>Cambiar</Button>
                  </div>
                  {/* Editable fields for missing supplier data */}
                  {(!selectedClient.dni || !selectedClient.cuit_cuil || !selectedClient.address || !selectedClient.city || !selectedClient.province) && (
                    <div className="pt-2 border-t border-orange-200 space-y-1.5">
                      <p className="text-[9px] text-amber-600 font-medium">Completar datos faltantes:</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {!selectedClient.dni && (
                          <div><Label className="text-[9px] text-gray-400">DNI *</Label><Input className="h-7 text-[10px]" value={editingClientData.dni || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, dni: e.target.value }))} /></div>
                        )}
                        {!selectedClient.cuit_cuil && (
                          <div><Label className="text-[9px] text-gray-400">CUIT/CUIL *</Label><Input className="h-7 text-[10px]" value={editingClientData.cuit_cuil || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, cuit_cuil: e.target.value }))} /></div>
                        )}
                        {!selectedClient.address && (
                          <div className="col-span-2"><Label className="text-[9px] text-gray-400">Dirección *</Label><Input className="h-7 text-[10px]" value={editingClientData.address || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, address: e.target.value }))} /></div>
                        )}
                        {!selectedClient.city && (
                          <div><Label className="text-[9px] text-gray-400">Ciudad *</Label><Input className="h-7 text-[10px]" value={editingClientData.city || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, city: e.target.value }))} /></div>
                        )}
                        {!selectedClient.province && (
                          <div><Label className="text-[9px] text-gray-400">Provincia *</Label><Input className="h-7 text-[10px]" value={editingClientData.province || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, province: e.target.value }))} /></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Input className="h-7 text-[11px] pl-7" placeholder="Buscar proveedor existente..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  {clientSearch && filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-32 overflow-auto">
                      {filteredClients.slice(0, 6).map(c => (
                        <div key={c.id} className="p-1.5 hover:bg-gray-50 cursor-pointer text-[10px] border-b last:border-0" onClick={() => handleClientSelect(c)}>
                          <p className="font-medium">{c.full_name}</p><p className="text-gray-400">{c.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Observations */}
            <div>
              <Label className="text-[9px] text-gray-400 uppercase">Observaciones</Label>
              <Textarea
                className="text-[10px] min-h-[40px] resize-none"
                placeholder="Observaciones de la venta de consignación..."
                value={formData.observations}
                onChange={(e) => handleChange('observations', e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-7 text-[10px] px-3">Cancelar</Button>
              <Button type="submit" className="h-7 text-[10px] px-4 bg-orange-900 hover:bg-orange-800" disabled={createSaleMutation.isPending}>
                <Save className="w-3 h-3 mr-1" />
                {createSaleMutation.isPending ? 'Creando...' : 'Crear Boleto de Consignación'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
