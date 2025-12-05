import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { Save, Car, User, Receipt, CreditCard, Search } from "lucide-react";
import ConfirmDialog from "../ui/ConfirmDialog";
import useDollarHistory from "@/hooks/useDollarHistory";

export default function ReservationForm({ open, onOpenChange, vehicle, quote, lead, onSubmit }) {
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [includeDeposit, setIncludeDeposit] = useState(true);
  const [includeTradeIn, setIncludeTradeIn] = useState(false);
  const [includeFinancing, setIncludeFinancing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClientData, setEditingClientData] = useState({});
  const [editingVehicleData, setEditingVehicleData] = useState({});

  const [formData, setFormData] = useState({
    reservation_date: new Date().toISOString().split('T')[0],
    client_name: '',
    client_phone: '',
    seller_id: '',
    seller_name: '',
    deposit_amount: '',
    deposit_currency: 'ARS',
    deposit_exchange_rate: currentBlueRate,
    deposit_date: new Date().toISOString().split('T')[0],
    deposit_description: '',
    agreed_price: '',
    agreed_price_currency: 'ARS',
    agreed_price_exchange_rate: currentBlueRate,
    agreed_price_date: new Date().toISOString().split('T')[0],
    trade_in: { brand: '', model: '', year: '', plate: '', kilometers: '', value: '', value_currency: 'ARS', value_exchange_rate: currentBlueRate, value_date: new Date().toISOString().split('T')[0] },
    financing_amount: '',
    financing_currency: 'ARS',
    financing_exchange_rate: currentBlueRate,
    financing_date: new Date().toISOString().split('T')[0],
    financing_bank: '',
    financing_installments: '',
    financing_installment_value: '',
    observations: ''
  });

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: sellers = [] } = useQuery({ queryKey: ['sellers'], queryFn: () => base44.entities.Seller.filter({ is_active: true }) });
  const { data: rates = [] } = useQuery({ queryKey: ['exchange-rates'], queryFn: () => base44.entities.ExchangeRate.list('-rate_date') });

  const currentBlueRate = rates.find(r => r.rate_type === 'Diaria')?.usd_rate || 1200;
  const { getHistoricalRate } = useDollarHistory();

  useEffect(() => {
    if (open) {
      const clientId = quote?.client_id || lead?.client_id || '';
      const clientName = quote?.client_name || lead?.client_name || '';
      const clientPhone = quote?.client_phone || lead?.client_phone || '';
      const rate = currentBlueRate || 1200;
      
      // Convert vehicle public price to ARS if needed
      let publicPriceArs = vehicle?.public_price_value || '';
      if (vehicle?.public_price_currency === 'USD' && vehicle?.public_price_value) {
        const vehicleRate = vehicle.public_price_exchange_rate || rate;
        publicPriceArs = Math.round(vehicle.public_price_value * vehicleRate);
      }
      
      setSelectedClientId(clientId);
      setIncludeDeposit(true);
      setIncludeTradeIn(!!quote?.trade_in?.brand);
      setIncludeFinancing(!!quote?.financing_amount);
      setFormData({
        reservation_date: new Date().toISOString().split('T')[0],
        client_name: clientName,
        client_phone: clientPhone,
        seller_id: '',
        seller_name: '',
        deposit_amount: '',
        deposit_currency: 'ARS',
        deposit_exchange_rate: rate,
        deposit_date: new Date().toISOString().split('T')[0],
        deposit_description: '',
        agreed_price: quote?.quoted_price_ars || publicPriceArs,
        agreed_price_currency: 'ARS',
        agreed_price_exchange_rate: rate,
        agreed_price_date: new Date().toISOString().split('T')[0],
        trade_in: quote?.trade_in ? { ...quote.trade_in, value_exchange_rate: rate, value_currency: quote.trade_in.value_currency || 'ARS', value_date: new Date().toISOString().split('T')[0] } : lead?.trade_in ? { ...lead.trade_in, value: lead.trade_in.value_ars || '', value_currency: 'ARS', value_exchange_rate: rate, value_date: new Date().toISOString().split('T')[0], photos: lead.trade_in.photos || [] } : { brand: '', model: '', year: '', plate: '', kilometers: '', value: '', value_currency: 'ARS', value_exchange_rate: rate, value_date: new Date().toISOString().split('T')[0] },
        financing_amount: quote?.financing_amount || '',
        financing_currency: quote?.financing_currency || 'ARS',
        financing_exchange_rate: quote?.financing_exchange_rate || rate,
        financing_date: new Date().toISOString().split('T')[0],
        financing_bank: quote?.financing_bank || '',
        financing_installments: quote?.financing_installments || '',
        financing_installment_value: quote?.financing_installment_value || '',
        observations: ''
      });
      setClientSearch('');
      setIsSubmitting(false);
      setEditingClientData({});
      setEditingVehicleData({});
    }
  }, [open, quote, lead, vehicle, currentBlueRate]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const filteredClients = clients.filter(c =>
    !clientSearch || 
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.dni?.includes(clientSearch) ||
    c.phone?.includes(clientSearch)
  );

  const handleClientSelect = (client) => {
    setSelectedClientId(client.id);
    setFormData(prev => ({ ...prev, client_name: client.full_name, client_phone: client.phone || '' }));
  };

  const handleSellerSelect = (sellerId) => {
    const seller = sellers.find(s => s.id === sellerId);
    if (seller) setFormData(prev => ({ ...prev, seller_id: sellerId, seller_name: seller.full_name }));
  };

  const handleChange = async (field, value) => {
    // Fechas con cotización histórica
    if (field === 'agreed_price_date' && value) {
      const rate = await getHistoricalRate(value).catch(() => null);
      if (rate) {
        setFormData(prev => ({ ...prev, agreed_price_date: value, agreed_price_exchange_rate: rate.toString() }));
        setHasChanges(true);
        return;
      }
    }
    if (field === 'deposit_date' && value) {
      const rate = await getHistoricalRate(value).catch(() => null);
      if (rate) {
        setFormData(prev => ({ ...prev, deposit_date: value, deposit_exchange_rate: rate.toString() }));
        setHasChanges(true);
        return;
      }
    }
    if (field === 'financing_date' && value) {
      const rate = await getHistoricalRate(value).catch(() => null);
      if (rate) {
        setFormData(prev => ({ ...prev, financing_date: value, financing_exchange_rate: rate.toString() }));
        setHasChanges(true);
        return;
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };
  const handleTradeInChange = async (field, value) => {
    if (field === 'value_date' && value) {
      const rate = await getHistoricalRate(value).catch(() => null);
      if (rate) {
        setFormData(prev => ({ ...prev, trade_in: { ...prev.trade_in, [field]: value, value_exchange_rate: rate.toString() } }));
        setHasChanges(true);
        return;
      }
    }
    setFormData(prev => ({ ...prev, trade_in: { ...prev.trade_in, [field]: value } }));
    setHasChanges(true);
  };

  const handleClose = () => { if (hasChanges) setShowConfirm(true); else onOpenChange(false); };

  // Check if receipt data is incomplete
  const isReceiptDataIncomplete = () => {
    const clientIncomplete = selectedClient && (!selectedClient.dni || !selectedClient.address || !selectedClient.city) && 
      (!editingClientData.dni && !selectedClient.dni) || (!editingClientData.address && !selectedClient.address);
    const vehicleIncomplete = vehicle && (!vehicle.kilometers || !vehicle.color || !vehicle.engine_number || !vehicle.chassis_number) &&
      Object.keys(editingVehicleData).length === 0;
    return clientIncomplete || vehicleIncomplete;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Warn if receipt data incomplete
    if (isReceiptDataIncomplete()) {
      if (!window.confirm('Faltan datos del cliente o vehículo para generar el recibo de seña. La reserva se guardará pero no se podrá generar el recibo hasta completar los datos. ¿Continuar?')) {
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      // Update client with missing data
      if (selectedClientId && Object.keys(editingClientData).length > 0) {
        await base44.entities.Client.update(selectedClientId, editingClientData);
      }
      // Update vehicle with missing data
      if (vehicle?.id && Object.keys(editingVehicleData).length > 0) {
        await base44.entities.Vehicle.update(vehicle.id, editingVehicleData);
      }
      await onSubmit({
        ...formData,
        vehicle_id: vehicle?.id,
        vehicle_description: `${vehicle?.brand} ${vehicle?.model} ${vehicle?.year}`,
        client_id: selectedClientId || null,
        deposit_amount: includeDeposit ? (parseFloat(formData.deposit_amount) || 0) : 0,
        deposit_exchange_rate: parseFloat(formData.deposit_exchange_rate) || null,
        deposit_date: formData.deposit_date,
        agreed_price: parseFloat(formData.agreed_price) || 0,
        agreed_price_exchange_rate: parseFloat(formData.agreed_price_exchange_rate) || null,
        agreed_price_date: formData.agreed_price_date,
        trade_in: includeTradeIn ? {
          ...formData.trade_in,
          value_exchange_rate: parseFloat(formData.trade_in.value_exchange_rate) || null,
          value_date: formData.trade_in.value_date,
          is_peritado: formData.trade_in.is_peritado || false
        } : null,
        financing_amount: includeFinancing ? (parseFloat(formData.financing_amount) || 0) : 0,
        financing_currency: formData.financing_currency,
        financing_exchange_rate: parseFloat(formData.financing_exchange_rate) || null,
        financing_date: formData.financing_date,
        financing_bank: includeFinancing ? formData.financing_bank : '',
        financing_installments: includeFinancing ? formData.financing_installments : '',
        financing_installment_value: includeFinancing ? formData.financing_installment_value : '',
        status: 'VIGENTE'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp = "h-8 text-[11px] bg-white";
  const lbl = "text-[10px] font-medium text-gray-500 mb-0.5";

  return (
    <>
    <ConfirmDialog open={showConfirm} onOpenChange={setShowConfirm} onConfirm={() => onOpenChange(false)} />
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold">Nueva Reserva</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Vehicle */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2"><Car className="w-4 h-4 text-gray-600" /><span className="text-[11px] font-medium text-gray-500">VEHÍCULO</span></div>
            <p className="font-bold">{vehicle?.brand} {vehicle?.model} <span className="font-normal text-gray-500">{vehicle?.year} • {vehicle?.plate}</span></p>
          </div>

          {/* Agreed Price with currency */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <Label className="text-[11px] font-semibold text-gray-700 block mb-2">PRECIO ACORDADO</Label>
            <div className="grid grid-cols-4 gap-2">
              <Input className="h-10 text-lg font-bold text-center col-span-1" value={formData.agreed_price} onChange={(e) => handleChange('agreed_price', e.target.value)} placeholder="0" />
              <Select value={formData.agreed_price_currency} onValueChange={(v) => handleChange('agreed_price_currency', v)}>
                <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ARS" className="text-[11px]">ARS</SelectItem><SelectItem value="USD" className="text-[11px]">USD</SelectItem></SelectContent>
              </Select>
              <Input className={inp} value={formData.agreed_price_exchange_rate} onChange={(e) => handleChange('agreed_price_exchange_rate', e.target.value)} placeholder="Cotización USD" />
              <Input className={inp} type="date" value={formData.agreed_price_date} onChange={(e) => handleChange('agreed_price_date', e.target.value)} />
            </div>
          </div>

          {/* Client */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-600" /><span className="text-[11px] font-medium text-gray-500">CLIENTE (datos para el recibo)</span></div>
            </div>
            {selectedClient ? (
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-[11px]">{selectedClient.full_name}</p>
                    <p className="text-[10px] text-gray-500">{selectedClient.phone}</p>
                  </div>
                  <Button type="button" variant="ghost" className="h-5 text-[9px] px-1" onClick={() => { setSelectedClientId(''); setFormData(prev => ({ ...prev, client_name: '', client_phone: '' })); setEditingClientData({}); }}>Cambiar</Button>
                </div>
                {/* Editable fields for missing client data */}
                {(!selectedClient.dni || !selectedClient.address || !selectedClient.city) && (
                  <div className="pt-2 border-t space-y-1.5">
                    <p className="text-[9px] text-amber-600 font-medium">Completar datos faltantes:</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {!selectedClient.dni && (
                        <div><Label className="text-[9px] text-gray-400">DNI *</Label><Input className="h-7 text-[10px]" value={editingClientData.dni || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, dni: e.target.value }))} /></div>
                      )}
                      {!selectedClient.address && (
                        <div className="col-span-2"><Label className="text-[9px] text-gray-400">Dirección *</Label><Input className="h-7 text-[10px]" value={editingClientData.address || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, address: e.target.value }))} /></div>
                      )}
                      {!selectedClient.city && (
                        <div><Label className="text-[9px] text-gray-400">Ciudad *</Label><Input className="h-7 text-[10px]" value={editingClientData.city || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, city: e.target.value }))} /></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input className={`${inp} pl-8`} placeholder="Buscar cliente..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                  {clientSearch && filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-40 overflow-auto">
                      {filteredClients.slice(0, 8).map(c => (
                        <div key={c.id} className={`p-2 hover:bg-gray-100 cursor-pointer text-[10px] border-b last:border-b-0 ${selectedClientId === c.id ? 'bg-gray-100' : ''}`} onClick={() => { handleClientSelect(c); setClientSearch(''); }}>
                          <p className="font-medium">{c.full_name}</p><p className="text-gray-500">{c.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className={lbl}>Nombre *</Label><Input className={inp} value={formData.client_name} onChange={(e) => handleChange('client_name', e.target.value)} required /></div>
                  <div><Label className={lbl}>Teléfono</Label><Input className={inp} value={formData.client_phone} onChange={(e) => handleChange('client_phone', e.target.value)} /></div>
                </div>
              </>
            )}
          </div>

          {/* Vehicle Data Missing Warning */}
          {vehicle && (!vehicle.color || !vehicle.kilometers || !vehicle.engine_number || !vehicle.chassis_number) && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[10px] text-amber-700 font-medium mb-1.5">⚠️ Completar datos del vehículo para el recibo:</p>
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

          {/* Deposit with currency */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Receipt className="w-4 h-4 text-gray-600" /><span className="text-[11px] font-medium text-gray-500">SEÑA</span></div>
              <div className="flex items-center gap-2"><Checkbox id="include-deposit" checked={includeDeposit} onCheckedChange={setIncludeDeposit} className="h-4 w-4" /><label htmlFor="include-deposit" className="text-[10px]">Incluir</label></div>
            </div>
            {includeDeposit && (
              <div className="grid grid-cols-4 gap-2">
                <div><Label className={lbl}>Monto</Label><Input className={inp} value={formData.deposit_amount} onChange={(e) => handleChange('deposit_amount', e.target.value)} /></div>
                <div><Label className={lbl}>Moneda</Label><Select value={formData.deposit_currency} onValueChange={(v) => handleChange('deposit_currency', v)}><SelectTrigger className={inp}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ARS" className="text-[11px]">ARS</SelectItem><SelectItem value="USD" className="text-[11px]">USD</SelectItem></SelectContent></Select></div>
                <div><Label className={lbl}>Cotización</Label><Input className={inp} value={formData.deposit_exchange_rate} onChange={(e) => handleChange('deposit_exchange_rate', e.target.value)} placeholder="USD" /></div>
                <div><Label className={lbl}>Fecha</Label><Input className={inp} type="date" value={formData.deposit_date} onChange={(e) => handleChange('deposit_date', e.target.value)} /></div>
              </div>
            )}
          </div>

          {/* Trade In */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Car className="w-4 h-4 text-gray-600" /><span className="text-[11px] font-medium text-gray-500">PERMUTA</span></div>
              <div className="flex items-center gap-2"><Checkbox id="include-tradein" checked={includeTradeIn} onCheckedChange={setIncludeTradeIn} className="h-4 w-4" /><label htmlFor="include-tradein" className="text-[10px]">Incluir</label></div>
            </div>
            {includeTradeIn && (
              <>
                <div className="grid grid-cols-7 gap-2">
                  <div><Label className={lbl}>Marca</Label><Input className={inp} value={formData.trade_in.brand} onChange={(e) => handleTradeInChange('brand', e.target.value)} /></div>
                  <div><Label className={lbl}>Modelo</Label><Input className={inp} value={formData.trade_in.model} onChange={(e) => handleTradeInChange('model', e.target.value)} /></div>
                  <div><Label className={lbl}>Año</Label><Input className={inp} value={formData.trade_in.year} onChange={(e) => handleTradeInChange('year', e.target.value)} /></div>
                  <div><Label className={lbl}>Dominio</Label><Input className={inp} value={formData.trade_in.plate} onChange={(e) => handleTradeInChange('plate', e.target.value.toUpperCase())} /></div>
                  <div><Label className={lbl}>KM</Label><Input className={inp} value={formData.trade_in.kilometers} onChange={(e) => handleTradeInChange('kilometers', e.target.value)} /></div>
                  <div>
                    <Label className={lbl}>Moneda</Label>
                    <Select value={formData.trade_in.value_currency || 'ARS'} onValueChange={(v) => handleTradeInChange('value_currency', v)}>
                      <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="ARS" className="text-[11px]">ARS</SelectItem><SelectItem value="USD" className="text-[11px]">USD</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label className={lbl}>Valor</Label><Input className={inp} value={formData.trade_in.value} onChange={(e) => handleTradeInChange('value', e.target.value)} /></div>
                  <div><Label className={lbl}>Cotización</Label><Input className={inp} value={formData.trade_in.value_exchange_rate} onChange={(e) => handleTradeInChange('value_exchange_rate', e.target.value)} placeholder="USD" /></div>
                  <div><Label className={lbl}>Fecha</Label><Input className={inp} type="date" value={formData.trade_in.value_date} onChange={(e) => handleTradeInChange('value_date', e.target.value)} /></div>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed">
                  <Checkbox 
                    id="trade-in-peritado" 
                    checked={formData.trade_in.is_peritado || false} 
                    onCheckedChange={(c) => handleTradeInChange('is_peritado', c)} 
                    className="h-4 w-4" 
                  />
                  <label htmlFor="trade-in-peritado" className="text-[10px] text-gray-600">
                    Está peritado <span className="text-gray-400">(si no, se cargará como "A peritar")</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Financing */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-600" /><span className="text-[11px] font-medium text-gray-500">FINANCIACIÓN</span></div>
              <div className="flex items-center gap-2"><Checkbox id="include-financing" checked={includeFinancing} onCheckedChange={setIncludeFinancing} className="h-4 w-4" /><label htmlFor="include-financing" className="text-[10px]">Incluir</label></div>
            </div>
            {includeFinancing && (
              <div className="grid grid-cols-6 gap-2">
                <div><Label className={lbl}>Monto</Label><Input className={inp} value={formData.financing_amount} onChange={(e) => handleChange('financing_amount', e.target.value)} /></div>
                <div>
                  <Label className={lbl}>Moneda</Label>
                  <Select value={formData.financing_currency || 'ARS'} onValueChange={(v) => handleChange('financing_currency', v)}>
                    <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ARS" className="text-[11px]">ARS</SelectItem><SelectItem value="USD" className="text-[11px]">USD</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className={lbl}>Cotización</Label><Input className={inp} value={formData.financing_exchange_rate} onChange={(e) => handleChange('financing_exchange_rate', e.target.value)} placeholder="USD" /></div>
                <div><Label className={lbl}>Fecha</Label><Input className={inp} type="date" value={formData.financing_date} onChange={(e) => handleChange('financing_date', e.target.value)} /></div>
                <div><Label className={lbl}>Banco</Label><Input className={inp} value={formData.financing_bank} onChange={(e) => handleChange('financing_bank', e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className={lbl}>Cuotas</Label><Input className={inp} value={formData.financing_installments} onChange={(e) => handleChange('financing_installments', e.target.value)} /></div>
                  <div><Label className={lbl}>Valor cuota</Label><Input className={inp} value={formData.financing_installment_value} onChange={(e) => handleChange('financing_installment_value', e.target.value)} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Seller & Observations */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={lbl}>Vendedor</Label>
              <Select value={formData.seller_id} onValueChange={handleSellerSelect}>
                <SelectTrigger className={inp}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{sellers.map(s => <SelectItem key={s.id} value={s.id} className="text-[11px]">{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className={lbl}>Observaciones</Label>
              <Input className={inp} value={formData.observations} onChange={(e) => handleChange('observations', e.target.value)} />
            </div>
          </div>

          {/* Price Breakdown Summary */}
          {(() => {
            const agreedPrice = parseFloat(formData.agreed_price) || 0;
            const depositAmount = includeDeposit ? (parseFloat(formData.deposit_amount) || 0) : 0;
            const tradeInValue = includeTradeIn ? (parseFloat(formData.trade_in.value) || 0) : 0;
            const financingAmount = includeFinancing ? (parseFloat(formData.financing_amount) || 0) : 0;
            const balance = agreedPrice - depositAmount - tradeInValue - financingAmount;
            const hasDeductions = depositAmount > 0 || tradeInValue > 0 || financingAmount > 0;
            
            return agreedPrice > 0 ? (
              <div className="p-4 bg-gray-900 text-white rounded-lg">
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-400">Precio acordado:</span><span>${agreedPrice.toLocaleString('es-AR')}</span></div>
                  {depositAmount > 0 && <div className="flex justify-between"><span className="text-gray-400">Seña:</span><span className="text-cyan-400">-${depositAmount.toLocaleString('es-AR')}</span></div>}
                  {tradeInValue > 0 && <div className="flex justify-between"><span className="text-gray-400">Permuta:</span><span className="text-cyan-400">-${tradeInValue.toLocaleString('es-AR')}</span></div>}
                  {financingAmount > 0 && <div className="flex justify-between"><span className="text-gray-400">Financiación:</span><span className="text-cyan-400">-${financingAmount.toLocaleString('es-AR')}</span></div>}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                  <span className="text-[10px] text-gray-400">{hasDeductions ? 'Saldo a abonar' : 'Total'}</span>
                  <span className="text-xl font-bold">${balance.toLocaleString('es-AR')}</span>
                </div>
              </div>
            ) : null;
          })()}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} className="h-8 text-[11px]" disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800" disabled={isSubmitting}><Save className="w-3.5 h-3.5 mr-1.5" />{isSubmitting ? 'Guardando...' : 'Confirmar Reserva'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}