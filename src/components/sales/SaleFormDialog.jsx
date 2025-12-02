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
import { Save, Car, User, Search, ChevronDown, ChevronUp } from "lucide-react";
import ConfirmDialog from "../ui/ConfirmDialog";
import SalesContractView from "./SalesContractView";
import { toast } from "sonner";

export default function SaleFormDialog({ open, onOpenChange, vehicle, reservation, prefillData, existingSale, onSaleCreated }) {
  const queryClient = useQueryClient();
  
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [includeDeposit, setIncludeDeposit] = useState(false);
  const [includeCashPayment, setIncludeCashPayment] = useState(false);
  const [includeTradeIn, setIncludeTradeIn] = useState(false);
  const [includeFinancing, setIncludeFinancing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [createdSale, setCreatedSale] = useState(null);
  const [showContract, setShowContract] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    full_name: '', phone: '', dni: '', cuit_cuil: '', email: '', birth_date: '',
    address: '', city: '', province: '', postal_code: '', marital_status: '', observations: ''
  });

  const getInitialFormData = (blueRate) => {
    const rate = blueRate || 1200;
    // Convert vehicle public price to ARS if needed
    let publicPriceArs = vehicle?.public_price_value || '';
    if (vehicle?.public_price_currency === 'USD' && vehicle?.public_price_value) {
      const vehicleRate = vehicle.public_price_exchange_rate || rate;
      publicPriceArs = Math.round(vehicle.public_price_value * vehicleRate);
    }
    return {
      sale_date: new Date().toISOString().split('T')[0],
      client_name: '',
      seller: '',
      sale_price: publicPriceArs,
      sale_price_currency: 'ARS',
      sale_price_exchange_rate: rate,
      deposit: { amount: '', currency: 'ARS', exchange_rate: rate, date: new Date().toISOString().split('T')[0], payment_method: 'Efectivo', description: '' },
      cash_payment: { amount: '', currency: 'ARS', exchange_rate: rate, payment_method: 'Efectivo' },
      trade_ins: [],
      financing: { amount: '', currency: 'ARS', exchange_rate: rate, bank: '', installments: '', installment_value: '' },
      balance_due_date: '',
      observations: ''
    };
  };

  const [formData, setFormData] = useState(getInitialFormData(1200));
  
  // Client editing state for missing data
  const [editingClientData, setEditingClientData] = useState({});
  const [editingVehicleData, setEditingVehicleData] = useState({});

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: sellers = [] } = useQuery({ queryKey: ['sellers'], queryFn: () => base44.entities.Seller.filter({ is_active: true }) });
  const { data: rates = [] } = useQuery({ queryKey: ['exchange-rates'], queryFn: () => base44.entities.ExchangeRate.list('-rate_date') });

  const currentBlueRate = rates.find(r => r.rate_type === 'Diaria')?.usd_rate || 1200;

  const { data: spouseData } = useQuery({
    queryKey: ['spouse', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      const spouses = await base44.entities.Spouse.filter({ client_id: selectedClientId });
      return spouses[0] || null;
    },
    enabled: !!selectedClientId
  });

  useEffect(() => {
    if (!open) return;
    
    const rate = currentBlueRate || 1200;
    
    if (existingSale) {
      setSelectedClientId(existingSale.client_id || '');
      setIncludeDeposit(!!existingSale.deposit?.amount);
      setIncludeCashPayment(!!existingSale.cash_payment?.amount);
      setIncludeTradeIn(existingSale.trade_ins?.length > 0);
      setIncludeFinancing(!!existingSale.financing?.amount);
      setFormData({
        sale_date: existingSale.sale_date || new Date().toISOString().split('T')[0],
        client_name: existingSale.client_name || '',
        seller: existingSale.seller || '',
        sale_price: existingSale.sale_price || '',
        sale_price_currency: existingSale.sale_price_currency || 'ARS',
        sale_price_exchange_rate: existingSale.sale_price_exchange_rate || rate,
        deposit: existingSale.deposit || getInitialFormData(rate).deposit,
        cash_payment: existingSale.cash_payment || getInitialFormData(rate).cash_payment,
        trade_ins: existingSale.trade_ins || [],
        financing: existingSale.financing || getInitialFormData(rate).financing,
        balance_due_date: existingSale.balance_due_date || '',
        observations: existingSale.observations || ''
      });
    } else if (reservation) {
      setSelectedClientId(reservation.client_id || '');
      setIncludeDeposit(!!reservation.deposit_amount);
      setIncludeTradeIn(!!reservation.trade_in?.brand);
      setIncludeFinancing(!!reservation.financing_amount);
      setFormData({
        ...getInitialFormData(rate),
        client_name: reservation.client_name || '',
        seller: reservation.seller_name || '',
        sale_price: reservation.agreed_price || getInitialFormData(rate).sale_price,
        deposit: { amount: reservation.deposit_amount || '', currency: reservation.deposit_currency || 'ARS', exchange_rate: reservation.deposit_exchange_rate || rate, date: reservation.deposit_date || new Date().toISOString().split('T')[0], payment_method: 'Efectivo', description: reservation.deposit_description || '' },
        trade_ins: reservation.trade_in?.brand ? [{ ...reservation.trade_in, value: reservation.trade_in.value || reservation.trade_in.value_ars, currency: 'ARS', exchange_rate: rate }] : [],
        financing: { amount: reservation.financing_amount || '', currency: 'ARS', exchange_rate: rate, bank: reservation.financing_bank || '', installments: reservation.financing_installments || '', installment_value: reservation.financing_installment_value || '' }
      });
    } else if (prefillData) {
      const clientIdFromPrefill = prefillData.client_id || '';
      setSelectedClientId(clientIdFromPrefill);
      setShowNewClientForm(false); // NO mostrar form de nuevo cliente si viene con client_id
      // Revisar trade_in tanto en prefillData como en el lead
      const tradeInData = prefillData.trade_in || prefillData.lead?.trade_in;
      setIncludeTradeIn(!!tradeInData?.brand);
      setIncludeFinancing(!!prefillData.financing_amount_ars);
      setFormData({
        ...getInitialFormData(rate),
        client_id: clientIdFromPrefill,
        client_name: prefillData.client_name || '',
        client_phone: prefillData.client_phone || '',
        sale_price: prefillData.sale_price_ars || getInitialFormData(rate).sale_price,
        trade_ins: tradeInData?.brand ? [{ ...tradeInData, value: tradeInData.value_ars || '', currency: 'ARS', exchange_rate: rate, photos: tradeInData.photos || [] }] : [],
        financing: { amount: prefillData.financing_amount_ars || '', currency: 'ARS', exchange_rate: rate, bank: prefillData.financing_bank || '', installments: prefillData.financing_installments || '', installment_value: prefillData.financing_installment_value || '' }
      });
      console.log('📋 SaleForm prefillData - client_id:', clientIdFromPrefill, 'client_name:', prefillData.client_name);
    } else {
      setFormData(getInitialFormData(rate));
      setSelectedClientId('');
      setShowNewClientForm(false);
      setIncludeDeposit(false);
      setIncludeCashPayment(false);
      setIncludeTradeIn(false);
      setIncludeFinancing(false);
    }
    setEditingClientData({});
    setEditingVehicleData({});
    setNewClientData({ full_name: '', phone: '', dni: '', cuit_cuil: '', email: '', birth_date: '', address: '', city: '', province: '', postal_code: '', marital_status: '', observations: '' });
    setHasChanges(false);
  }, [reservation, prefillData, vehicle, open, existingSale, currentBlueRate]);

  const createSaleMutation = useMutation({
    mutationFn: async (data) => {
      let clientId = data.client_id || selectedClientId;
      
      // Si viene de un lead con client_id (prospecto), actualizar ese prospecto a "Cliente"
      if (clientId && !showNewClientForm) {
        console.log('✅ Actualizando cliente/prospecto existente:', clientId);
        await base44.entities.Client.update(clientId, { 
          client_status: 'Cliente',
          ...editingClientData 
        });
        data.client_id = clientId;
      }
      // Crear nuevo cliente solo si el formulario de nuevo cliente está visible Y no hay client_id previo
      else if (showNewClientForm && newClientData.full_name && newClientData.phone && !clientId) {
        console.log('✅ Creando nuevo cliente:', newClientData.full_name);
        const newClient = await base44.entities.Client.create({
          ...newClientData,
          client_status: 'Cliente'
        });
        clientId = newClient.id;
        data.client_id = clientId;
        data.client_name = newClientData.full_name;
      }
      // Actualizar cliente existente con datos faltantes
      else if (selectedClientId && Object.keys(editingClientData).length > 0) {
        console.log('✅ Actualizando cliente existente con datos faltantes:', selectedClientId);
        await base44.entities.Client.update(selectedClientId, {
          client_status: 'Cliente',
          ...editingClientData
        });
        clientId = selectedClientId;
        data.client_id = clientId;
      }
      
      // Update vehicle with missing data
      if (vehicle?.id && Object.keys(editingVehicleData).length > 0) {
        await base44.entities.Vehicle.update(vehicle.id, editingVehicleData);
      }
      
      let sale;
      if (existingSale?.id) {
        sale = await base44.entities.Sale.update(existingSale.id, data);
      } else {
        sale = await base44.entities.Sale.create(data);
        await base44.entities.Vehicle.update(vehicle.id, { status: 'VENDIDO' });
        if (reservation?.id) await base44.entities.Reservation.update(reservation.id, { status: 'CONVERTIDA' });
        if (prefillData?.lead?.id) await base44.entities.Lead.update(prefillData.lead.id, { status: 'Concretado' });
      }
      return sale;
    },
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-sales'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle?.id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      // Crear vehículo de permuta si existe
      if (includeTradeIn && formData.trade_ins.length > 0) {
        for (const ti of formData.trade_ins) {
          if (ti.brand && ti.model) {
            await base44.entities.Vehicle.create({
              brand: ti.brand,
              model: ti.model,
              year: parseInt(ti.year) || new Date().getFullYear(),
              plate: ti.plate || '',
              kilometers: parseFloat(ti.kilometers) || 0,
              color: ti.color || '',
              status: ti.is_peritado ? 'A INGRESAR' : 'A PERITAR',
              supplier_client_id: selectedClientId || clientId,
              supplier_client_name: formData.client_name,
              photos: ti.photos || []
            });
            toast.success(`Vehículo ${ti.brand} ${ti.model} agregado como ${ti.is_peritado ? 'A INGRESAR' : 'A PERITAR'}`);
          }
        }
      }

      const saleWithId = { ...sale, id: sale.id || existingSale?.id };
      setCreatedSale(saleWithId);
      
      // Validar si hay datos suficientes para el boleto
      const clientHasData = selectedClient && selectedClient.dni && selectedClient.address && selectedClient.city;
      const vehicleHasData = vehicle && vehicle.brand && vehicle.model && vehicle.year && vehicle.plate && vehicle.engine && vehicle.chassis;
      
      if (!clientHasData || !vehicleHasData) {
        // Faltan datos: mostrar advertencia y NO abrir boleto
        const missingData = [];
        if (!clientHasData) missingData.push('datos del cliente (DNI, dirección, ciudad)');
        if (!vehicleHasData) missingData.push('datos del vehículo (motor, chasis)');
        
        toast.warning(`Venta creada, pero faltan ${missingData.join(' y ')} para generar el boleto de compraventa.`);
        // Cerrar el formulario sin mostrar el boleto
        onOpenChange(false);
        // Si hay un callback onSaleCreated, llamarlo con el sale para que abra el SaleDetail
        if (onSaleCreated) onSaleCreated(saleWithId);
      } else {
        // Todos los datos están completos: mostrar boleto
        setShowContract(true);
        toast.success(existingSale ? "Venta actualizada" : "Venta creada");
        if (onSaleCreated) onSaleCreated(saleWithId);
      }
      
      setShowNewClientForm(false);
      setNewClientData({ full_name: '', phone: '', dni: '', cuit_cuil: '', email: '', birth_date: '', address: '', city: '', province: '', postal_code: '', marital_status: '', observations: '' });
    },
  });

  const handleClientSelect = (client) => {
    setSelectedClientId(client.id);
    setFormData(prev => ({ ...prev, client_name: client.full_name }));
    setClientSearch('');
  };

  const handleChange = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })); setHasChanges(true); };
  const handleNestedChange = (parent, field, value) => { setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } })); setHasChanges(true); };
  const handleClose = () => { if (hasChanges) setShowConfirm(true); else onOpenChange(false); };

  const handleTradeInChange = (index, field, value) => {
    const updated = [...formData.trade_ins];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, trade_ins: updated }));
    setHasChanges(true);
  };

  // Check if contract data is incomplete
  const isContractDataIncomplete = () => {
    const clientComplete = selectedClient && selectedClient.dni && selectedClient.cuit_cuil && selectedClient.address && selectedClient.city && selectedClient.province;
    const newClientComplete = showNewClientForm && newClientData.full_name && newClientData.phone && newClientData.dni && newClientData.cuit_cuil && newClientData.address && newClientData.city && newClientData.province;
    const vehicleComplete = vehicle && vehicle.engine_number && vehicle.chassis_number && vehicle.color && vehicle.kilometers;
    
    const hasClientData = clientComplete || newClientComplete || (Object.keys(editingClientData).length > 0);
    const hasVehicleData = vehicleComplete || (Object.keys(editingVehicleData).length > 0);
    
    return (!selectedClientId && !showNewClientForm) || !hasClientData || !hasVehicleData;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Warn if contract data incomplete
    if (isContractDataIncomplete()) {
      if (!window.confirm('Faltan datos del cliente o vehículo para generar el boleto de compraventa. La venta se guardará pero no se podrá generar el boleto hasta completar los datos. ¿Continuar?')) {
        return;
      }
    }
    
    createSaleMutation.mutate({
      sale_date: formData.sale_date,
      seller: formData.seller,
      vehicle_id: vehicle?.id,
      vehicle_description: `${vehicle?.brand} ${vehicle?.model} ${vehicle?.year}`,
      client_id: selectedClientId || null,
      client_name: formData.client_name,
      sale_price: parseFloat(formData.sale_price) || 0,
      sale_price_currency: formData.sale_price_currency,
      sale_price_exchange_rate: parseFloat(formData.sale_price_exchange_rate) || 1200,
      deposit: includeDeposit ? { ...formData.deposit, amount: parseFloat(formData.deposit.amount) || 0, exchange_rate: parseFloat(formData.deposit.exchange_rate) || 1200 } : null,
      cash_payment: includeCashPayment ? { ...formData.cash_payment, amount: parseFloat(formData.cash_payment.amount) || 0, exchange_rate: parseFloat(formData.cash_payment.exchange_rate) || 1200 } : null,
      trade_ins: includeTradeIn ? formData.trade_ins.map(ti => ({ ...ti, value: parseFloat(ti.value) || 0, exchange_rate: parseFloat(ti.exchange_rate) || 1200, is_peritado: ti.is_peritado || false })) : [],
      financing: includeFinancing ? { ...formData.financing, amount: parseFloat(formData.financing.amount) || 0, exchange_rate: parseFloat(formData.financing.exchange_rate) || 1200, installments: parseInt(formData.financing.installments) || 0, installment_value: parseFloat(formData.financing.installment_value) || 0 } : null,
      balance_due_date: formData.balance_due_date || null,
      sale_status: 'PENDIENTE',
      reservation_id: reservation?.id,
      lead_id: prefillData?.lead?.id,
      quote_id: prefillData?.quote?.id,
      observations: formData.observations
    });
  };

  const filteredClients = clients.filter(c => !clientSearch || c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) || c.dni?.includes(clientSearch) || c.phone?.includes(clientSearch));
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const PaymentSection = ({ id, label, checked, onCheckedChange, children }) => (
    <div className={`border rounded-lg overflow-hidden transition-all ${checked ? 'border-gray-300' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer" onClick={() => onCheckedChange(!checked)}>
        <span className="text-[10px] font-medium text-gray-600 uppercase">{label}</span>
        <div className="flex items-center gap-2">
          <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="h-3.5 w-3.5" />
          {checked ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
        </div>
      </div>
      {checked && <div className="p-3 space-y-2">{children}</div>}
    </div>
  );

  return (
    <>
    <SalesContractView open={showContract} onOpenChange={(o) => { setShowContract(o); if (!o) { setCreatedSale(null); onOpenChange(false); } }} sale={createdSale} vehicle={vehicle} client={selectedClient} spouse={spouseData} />
    <ConfirmDialog open={showConfirm} onOpenChange={setShowConfirm} onConfirm={() => onOpenChange(false)} />
    <Dialog open={open && !showContract} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-0">
          {/* Vehicle Header - Full Width */}
          <div className="bg-gray-900 text-white p-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <Car className="w-6 h-6 text-gray-400" />
              <div className="flex-1">
                <p className="text-lg font-bold">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
                <p className="text-sm text-gray-400">{vehicle?.plate} • {vehicle?.color}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase">Venta</p>
                <p className="text-xs text-gray-300">{existingSale ? 'Editar' : 'Nueva'}</p>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          {/* Price */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-[9px] text-gray-400 uppercase">Precio de venta</Label>
                <Input className="h-9 text-[15px] font-bold" defaultValue={formData.sale_price} onBlur={(e) => handleChange('sale_price', e.target.value)} placeholder="0" key={`price-${open}`} />
              </div>
              <div>
                <Label className="text-[9px] text-gray-400 uppercase">Moneda</Label>
                <Select value={formData.sale_price_currency || 'ARS'} onValueChange={(v) => handleChange('sale_price_currency', v)}>
                  <SelectTrigger className="h-9 w-18 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ARS" className="text-[10px]">ARS</SelectItem><SelectItem value="USD" className="text-[10px]">USD</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[9px] text-gray-400 uppercase">Cotiz. USD</Label>
                <Input className="h-9 w-20 text-[11px]" defaultValue={formData.sale_price_exchange_rate} onBlur={(e) => handleChange('sale_price_exchange_rate', e.target.value)} key={`rate-${open}`} />
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="p-2.5 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-medium text-gray-500 uppercase">Cliente (datos obligatorios para el boleto)</span>
              </div>
              {!selectedClientId && !showNewClientForm && (
                <Button type="button" variant="link" className="h-5 text-[9px] px-1 text-cyan-600" onClick={() => setShowNewClientForm(true)}>
                  + Cargar nuevo cliente
                </Button>
              )}
            </div>
            {showNewClientForm ? (
              <div className="space-y-2 p-2 bg-cyan-50 rounded border border-cyan-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-medium text-cyan-700">Nuevo Cliente</span>
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
              <div className="p-2 bg-cyan-50 rounded border border-cyan-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-[11px]">{selectedClient.full_name}</p>
                    <p className="text-[10px] text-gray-500">{selectedClient.phone}</p>
                  </div>
                  <Button type="button" variant="ghost" className="h-5 text-[9px] px-1" onClick={() => { setSelectedClientId(''); setFormData(prev => ({ ...prev, client_name: '' })); setEditingClientData({}); }}>Cambiar</Button>
                </div>
                {/* Editable fields for missing client data */}
                {(!selectedClient.dni || !selectedClient.cuit_cuil || !selectedClient.address || !selectedClient.city || !selectedClient.province) && (
                  <div className="pt-2 border-t border-cyan-200 space-y-1.5">
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
                <Input className="h-7 text-[11px] pl-7" placeholder="Buscar cliente existente..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
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

          {/* Vehicle Data Missing Warning */}
          {vehicle && (!vehicle.engine_number || !vehicle.chassis_number || !vehicle.color || !vehicle.kilometers) && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[10px] text-amber-700 font-medium mb-1.5">⚠️ Completar datos del vehículo para el boleto:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {!vehicle.kilometers && (
                  <div><Label className="text-[9px] text-gray-400">Kilometraje *</Label><Input className="h-7 text-[10px]" placeholder="KM" value={editingVehicleData.kilometers || ''} onChange={(e) => setEditingVehicleData(prev => ({ ...prev, kilometers: parseFloat(e.target.value) || 0 }))} /></div>
                )}
                {!vehicle.color && (
                  <div><Label className="text-[9px] text-gray-400">Color *</Label><Input className="h-7 text-[10px]" placeholder="Color" value={editingVehicleData.color || ''} onChange={(e) => setEditingVehicleData(prev => ({ ...prev, color: e.target.value }))} /></div>
                )}
                {!vehicle.engine_number && (
                  <div><Label className="text-[9px] text-gray-400">N° Motor *</Label><Input className="h-7 text-[10px]" placeholder="Número de motor" value={editingVehicleData.engine_number || ''} onChange={(e) => setEditingVehicleData(prev => ({ ...prev, engine_number: e.target.value }))} /></div>
                )}
                {!vehicle.chassis_number && (
                  <div><Label className="text-[9px] text-gray-400">N° Chasis *</Label><Input className="h-7 text-[10px]" placeholder="Número de chasis" value={editingVehicleData.chassis_number || ''} onChange={(e) => setEditingVehicleData(prev => ({ ...prev, chassis_number: e.target.value }))} /></div>
                )}
              </div>
            </div>
          )}



          {/* Payment Sections */}
          <div className="space-y-2">
            <PaymentSection id="deposit" label="Seña" checked={includeDeposit} onCheckedChange={setIncludeDeposit}>
              <div className="space-y-2">
                <div className="flex gap-1.5 items-end">
                  <div className="flex-1">
                    <Label className="text-[9px] text-gray-400 uppercase">Monto</Label>
                    <Input className="h-7 text-[11px]" defaultValue={formData.deposit.amount} onBlur={(e) => handleNestedChange('deposit', 'amount', e.target.value)} key={`dep-amt-${open}`} />
                  </div>
                  <div>
                    <Label className="text-[9px] text-gray-400 uppercase">Moneda</Label>
                    <Select value={formData.deposit.currency || 'ARS'} onValueChange={(v) => handleNestedChange('deposit', 'currency', v)}>
                      <SelectTrigger className="h-7 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="ARS" className="text-[10px]">ARS</SelectItem><SelectItem value="USD" className="text-[10px]">USD</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[9px] text-gray-400 uppercase">Cotiz. USD</Label>
                    <Input className="h-7 w-16 text-[10px]" defaultValue={formData.deposit.exchange_rate} onBlur={(e) => handleNestedChange('deposit', 'exchange_rate', e.target.value)} key={`dep-rate-${open}`} />
                  </div>
                </div>
                <div className="flex gap-1.5 items-end">
                  <div className="flex-1"><Label className="text-[9px] text-gray-400 uppercase">Fecha</Label><Input className="h-7 text-[10px]" type="date" defaultValue={formData.deposit.date} onBlur={(e) => handleNestedChange('deposit', 'date', e.target.value)} key={`dep-date-${open}`} /></div>
                  <div className="w-28"><Label className="text-[9px] text-gray-400 uppercase">Método</Label>
                    <Select value={formData.deposit.payment_method} onValueChange={(v) => handleNestedChange('deposit', 'payment_method', v)}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Efectivo" className="text-[10px]">Efectivo</SelectItem><SelectItem value="Transferencia" className="text-[10px]">Transferencia</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PaymentSection>

            <PaymentSection id="cash" label="Pago de Contado" checked={includeCashPayment} onCheckedChange={setIncludeCashPayment}>
              <div className="flex gap-1.5 items-end">
                <div className="flex-1">
                  <Label className="text-[9px] text-gray-400 uppercase">Monto</Label>
                  <Input className="h-7 text-[11px]" defaultValue={formData.cash_payment.amount} onBlur={(e) => handleNestedChange('cash_payment', 'amount', e.target.value)} key={`cash-amt-${open}`} />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-400 uppercase">Moneda</Label>
                  <Select value={formData.cash_payment.currency || 'ARS'} onValueChange={(v) => handleNestedChange('cash_payment', 'currency', v)}>
                    <SelectTrigger className="h-7 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ARS" className="text-[10px]">ARS</SelectItem><SelectItem value="USD" className="text-[10px]">USD</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[9px] text-gray-400 uppercase">Cotiz. USD</Label>
                  <Input className="h-7 w-16 text-[10px]" defaultValue={formData.cash_payment.exchange_rate} onBlur={(e) => handleNestedChange('cash_payment', 'exchange_rate', e.target.value)} key={`cash-rate-${open}`} />
                </div>
                <div className="w-28"><Label className="text-[9px] text-gray-400 uppercase">Método</Label>
                  <Select value={formData.cash_payment.payment_method} onValueChange={(v) => handleNestedChange('cash_payment', 'payment_method', v)}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Efectivo" className="text-[10px]">Efectivo</SelectItem><SelectItem value="Transferencia" className="text-[10px]">Transferencia</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </PaymentSection>

            <PaymentSection id="tradein" label="Permuta" checked={includeTradeIn} onCheckedChange={(c) => { setIncludeTradeIn(c); if (c && formData.trade_ins.length === 0) setFormData(prev => ({ ...prev, trade_ins: [{ brand: '', model: '', year: '', plate: '', kilometers: '', color: '', engine_brand: '', engine_number: '', chassis_brand: '', chassis_number: '', registration_city: '', value: '', currency: 'ARS', exchange_rate: 1200 }] })); }}>
              {formData.trade_ins.map((ti, i) => (
                <div key={i} className="space-y-2 p-2 bg-cyan-50 rounded border border-cyan-200">
                  <p className="text-[9px] font-medium text-cyan-700 uppercase">Datos del vehículo en permuta (obligatorios para el boleto)</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div><Label className="text-[9px] text-gray-400">Marca *</Label><Input className="h-7 text-[10px]" defaultValue={ti.brand} onBlur={(e) => handleTradeInChange(i, 'brand', e.target.value)} key={`ti-brand-${i}-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">Modelo *</Label><Input className="h-7 text-[10px]" defaultValue={ti.model} onBlur={(e) => handleTradeInChange(i, 'model', e.target.value)} key={`ti-model-${i}-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">Año *</Label><Input className="h-7 text-[10px]" defaultValue={ti.year} onBlur={(e) => handleTradeInChange(i, 'year', e.target.value)} key={`ti-year-${i}-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">Dominio *</Label><Input className="h-7 text-[10px]" defaultValue={ti.plate} onBlur={(e) => handleTradeInChange(i, 'plate', e.target.value.toUpperCase())} key={`ti-plate-${i}-${open}`} required /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div><Label className="text-[9px] text-gray-400">KM *</Label><Input className="h-7 text-[10px]" defaultValue={ti.kilometers} onBlur={(e) => handleTradeInChange(i, 'kilometers', e.target.value)} key={`ti-km-${i}-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">Color *</Label><Input className="h-7 text-[10px]" defaultValue={ti.color} onBlur={(e) => handleTradeInChange(i, 'color', e.target.value)} key={`ti-color-${i}-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">Radicación</Label><Input className="h-7 text-[10px]" defaultValue={ti.registration_city} onBlur={(e) => handleTradeInChange(i, 'registration_city', e.target.value)} key={`ti-reg-${i}-${open}`} /></div>
                    <div><Label className="text-[9px] text-gray-400">Marca Motor</Label><Input className="h-7 text-[10px]" defaultValue={ti.engine_brand} onBlur={(e) => handleTradeInChange(i, 'engine_brand', e.target.value)} key={`ti-engbrand-${i}-${open}`} /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div><Label className="text-[9px] text-gray-400">N° Motor *</Label><Input className="h-7 text-[10px]" defaultValue={ti.engine_number} onBlur={(e) => handleTradeInChange(i, 'engine_number', e.target.value)} key={`ti-engine-${i}-${open}`} required /></div>
                    <div><Label className="text-[9px] text-gray-400">Marca Chasis</Label><Input className="h-7 text-[10px]" defaultValue={ti.chassis_brand} onBlur={(e) => handleTradeInChange(i, 'chassis_brand', e.target.value)} key={`ti-chasbrand-${i}-${open}`} /></div>
                    <div><Label className="text-[9px] text-gray-400">N° Chasis *</Label><Input className="h-7 text-[10px]" defaultValue={ti.chassis_number} onBlur={(e) => handleTradeInChange(i, 'chassis_number', e.target.value)} key={`ti-chassis-${i}-${open}`} required /></div>
                    <div></div>
                  </div>
                  <div className="flex gap-1.5 items-end pt-1 border-t border-cyan-200">
                    <div className="flex-1">
                      <Label className="text-[9px] text-gray-400 uppercase">Valor de toma *</Label>
                      <Input className="h-7 text-[11px]" defaultValue={ti.value} onBlur={(e) => handleTradeInChange(i, 'value', e.target.value)} key={`ti-val-${i}-${open}`} required />
                    </div>
                    <div>
                      <Label className="text-[9px] text-gray-400 uppercase">Moneda</Label>
                      <Select value={ti.currency || 'ARS'} onValueChange={(v) => handleTradeInChange(i, 'currency', v)}>
                        <SelectTrigger className="h-7 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="ARS" className="text-[10px]">ARS</SelectItem><SelectItem value="USD" className="text-[10px]">USD</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[9px] text-gray-400 uppercase">Cotiz. USD</Label>
                      <Input className="h-7 w-16 text-[10px]" defaultValue={ti.exchange_rate} onBlur={(e) => handleTradeInChange(i, 'exchange_rate', e.target.value)} key={`ti-rate-${i}-${open}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 mt-2 border-t border-cyan-200 border-dashed">
                    <Checkbox 
                      id={`ti-peritado-${i}`} 
                      checked={ti.is_peritado || false} 
                      onCheckedChange={(c) => handleTradeInChange(i, 'is_peritado', c)} 
                      className="h-4 w-4" 
                    />
                    <label htmlFor={`ti-peritado-${i}`} className="text-[10px] text-gray-600">
                      Está peritado <span className="text-gray-400">(si no, se cargará como "A peritar")</span>
                    </label>
                  </div>
                </div>
              ))}
            </PaymentSection>

            <PaymentSection id="financing" label="Financiación" checked={includeFinancing} onCheckedChange={setIncludeFinancing}>
              <div className="space-y-2">
                <div className="flex gap-1.5 items-end">
                  <div className="flex-1">
                    <Label className="text-[9px] text-gray-400 uppercase">Monto</Label>
                    <Input className="h-7 text-[11px]" defaultValue={formData.financing.amount} onBlur={(e) => handleNestedChange('financing', 'amount', e.target.value)} key={`fin-amt-${open}`} />
                  </div>
                  <div>
                    <Label className="text-[9px] text-gray-400 uppercase">Moneda</Label>
                    <Select value={formData.financing.currency || 'ARS'} onValueChange={(v) => handleNestedChange('financing', 'currency', v)}>
                      <SelectTrigger className="h-7 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="ARS" className="text-[10px]">ARS</SelectItem><SelectItem value="USD" className="text-[10px]">USD</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[9px] text-gray-400 uppercase">Cotiz. USD</Label>
                    <Input className="h-7 w-16 text-[10px]" defaultValue={formData.financing.exchange_rate} onBlur={(e) => handleNestedChange('financing', 'exchange_rate', e.target.value)} key={`fin-rate-${open}`} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div><Label className="text-[9px] text-gray-400 uppercase">Banco/Entidad</Label><Input className="h-7 text-[10px]" defaultValue={formData.financing.bank} onBlur={(e) => handleNestedChange('financing', 'bank', e.target.value)} key={`fin-bank-${open}`} /></div>
                  <div><Label className="text-[9px] text-gray-400 uppercase">Cuotas</Label><Input className="h-7 text-[10px]" defaultValue={formData.financing.installments} onBlur={(e) => handleNestedChange('financing', 'installments', e.target.value)} key={`fin-inst-${open}`} /></div>
                  <div><Label className="text-[9px] text-gray-400 uppercase">Valor cuota</Label><Input className="h-7 text-[10px]" defaultValue={formData.financing.installment_value} onBlur={(e) => handleNestedChange('financing', 'installment_value', e.target.value)} key={`fin-instval-${open}`} /></div>
                </div>
              </div>
            </PaymentSection>
          </div>

          {/* Observations */}
          <div>
            <Label className="text-[9px] text-gray-400 uppercase">Observaciones</Label>
            <Textarea 
              className="text-[10px] min-h-[40px] resize-none" 
              placeholder="Observaciones de la venta..." 
              value={formData.observations} 
              onChange={(e) => handleChange('observations', e.target.value)}
            />
          </div>

          {/* Price Breakdown Summary */}
          {(() => {
            const salePrice = parseFloat(formData.sale_price) || 0;
            const depositAmount = includeDeposit ? (parseFloat(formData.deposit.amount) || 0) : 0;
            const cashAmount = includeCashPayment ? (parseFloat(formData.cash_payment.amount) || 0) : 0;
            const tradeInValue = includeTradeIn ? formData.trade_ins.reduce((sum, ti) => sum + (parseFloat(ti.value) || 0), 0) : 0;
            const financingAmount = includeFinancing ? (parseFloat(formData.financing.amount) || 0) : 0;
            const balance = salePrice - depositAmount - cashAmount - tradeInValue - financingAmount;
            const hasDeductions = depositAmount > 0 || cashAmount > 0 || tradeInValue > 0 || financingAmount > 0;
            
            return salePrice > 0 && hasDeductions ? (
              <div className="space-y-2">
                {/* Breakdown rows */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between py-1.5 border-b border-dotted border-gray-200"><span className="text-gray-500">Precio del vehículo</span><span className="font-semibold">${salePrice.toLocaleString('es-AR')}</span></div>
                  {depositAmount > 0 && <div className="flex justify-between py-1.5 border-b border-dotted border-gray-200"><span className="text-gray-500">Seña</span><span className="font-semibold text-cyan-600">- ${depositAmount.toLocaleString('es-AR')}</span></div>}
                  {cashAmount > 0 && <div className="flex justify-between py-1.5 border-b border-dotted border-gray-200"><span className="text-gray-500">Contado</span><span className="font-semibold text-cyan-600">- ${cashAmount.toLocaleString('es-AR')}</span></div>}
                  {tradeInValue > 0 && <div className="flex justify-between py-1.5 border-b border-dotted border-gray-200"><span className="text-gray-500">Permuta</span><span className="font-semibold text-cyan-600">- ${tradeInValue.toLocaleString('es-AR')}</span></div>}
                  {financingAmount > 0 && <div className="flex justify-between py-1.5 border-b border-dotted border-gray-200"><span className="text-gray-500">Financiación</span><span className="font-semibold text-cyan-600">- ${financingAmount.toLocaleString('es-AR')}</span></div>}
                </div>
                
                {/* Total box */}
                <div className="p-4 bg-cyan-600 text-white rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-[10px] opacity-80 uppercase tracking-wider">Saldo a abonar</span>
                  </div>
                  <span className="text-2xl font-bold">${balance.toLocaleString('es-AR')}</span>
                </div>

                {/* Balance due date */}
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label className="text-[9px] text-gray-400 uppercase">Fecha límite de pago del saldo</Label>
                    <Input 
                      type="date" 
                      className="h-7 text-[11px]" 
                      value={formData.balance_due_date || ''} 
                      onChange={(e) => handleChange('balance_due_date', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[9px] text-gray-400 uppercase">Vendedor</Label>
                    <Select value={formData.seller} onValueChange={(v) => handleChange('seller', v)}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{sellers.map(s => <SelectItem key={s.id} value={s.full_name} className="text-[10px]">{s.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : salePrice > 0 ? (
              <div className="space-y-2">
                <div className="p-4 bg-cyan-600 text-white rounded-lg flex justify-between items-center">
                  <span className="text-[10px] opacity-80 uppercase tracking-wider">Total de contado</span>
                  <span className="text-2xl font-bold">${salePrice.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label className="text-[9px] text-gray-400 uppercase">Vendedor</Label>
                    <Select value={formData.seller} onValueChange={(v) => handleChange('seller', v)}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{sellers.map(s => <SelectItem key={s.id} value={s.full_name} className="text-[10px]">{s.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} className="h-7 text-[10px] px-3">Cancelar</Button>
            <Button type="submit" className="h-7 text-[10px] px-4 bg-gray-900 hover:bg-gray-800" disabled={createSaleMutation.isPending}>
              <Save className="w-3 h-3 mr-1" />{createSaleMutation.isPending ? 'Guardando...' : existingSale ? 'Guardar' : 'Crear Venta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}