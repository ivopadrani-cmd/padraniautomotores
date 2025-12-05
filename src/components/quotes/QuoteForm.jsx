import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { Save, Car, User, CreditCard, Search, Plus, Trash2, X } from "lucide-react";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useDollarHistory } from "@/hooks/useDollarHistory";

export default function QuoteForm({ open, onOpenChange, vehicle, lead, onSubmit, editingQuote, multiVehicleMode = false }) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [includeTradeIn, setIncludeTradeIn] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-vehicle support
  const [vehicleItems, setVehicleItems] = useState([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehicleSearch, setShowVehicleSearch] = useState(false);

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_dni: '',
    client_address: '',
    client_city: '',
    client_province: '',
    trade_in: { brand: '', model: '', year: '', plate: '', kilometers: '', value_ars: '' },
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: allVehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list() });
  const { data: rates = [] } = useQuery({ queryKey: ['exchange-rates'], queryFn: () => base44.entities.ExchangeRate.list('-rate_date') });

  const currentBlueRate = rates.find(r => r.rate_type === 'Diaria')?.usd_rate || 1200;
  const { getHistoricalRate } = useDollarHistory();

  // Get interest vehicles from lead
  const interestVehicleIds = lead?.interested_vehicles?.map(iv => iv.vehicle_id) || [];
  const interestVehicles = allVehicles.filter(v => interestVehicleIds.includes(v.id));

  useEffect(() => {
    if (open) {
      setSelectedClientId(editingQuote?.client_id || lead?.client_id || '');
      setIncludeTradeIn(!!editingQuote?.trade_in?.brand || !!lead?.trade_in?.brand);

      // Initialize vehicle items
      if (editingQuote) {
        setVehicleItems([{
          vehicle_id: editingQuote.vehicle_id,
          vehicle: allVehicles.find(v => v.id === editingQuote.vehicle_id),
          quoted_price: editingQuote.quoted_price_ars || '',
          includeFinancing: !!(editingQuote.financing_amount),
          financing_amount: editingQuote.financing_amount || '',
          financing_bank: editingQuote.financing_bank || '',
          financing_installments: editingQuote.financing_installments || '',
          financing_installment_value: editingQuote.financing_installment_value || ''
        }]);
      } else if (vehicle) {
        // Convert public price to ARS if needed
        let publicPriceArs = vehicle.public_price_value || '';
        if (vehicle.public_price_currency === 'USD' && vehicle.public_price_value) {
          const rate = vehicle.public_price_exchange_rate || currentBlueRate;
          publicPriceArs = Math.round(vehicle.public_price_value * rate);
        }
        setVehicleItems([{
          vehicle_id: vehicle.id,
          vehicle: vehicle,
          quoted_price: publicPriceArs,
          quoted_price_currency: 'ARS',
          quoted_price_exchange_rate: currentBlueRate,
          quoted_price_date: new Date().toISOString().split('T')[0],
          includeFinancing: false,
          financing_amount: '',
          financing_bank: '',
          financing_installments: '',
          financing_installment_value: '',
          financing_currency: 'ARS',
          financing_exchange_rate: currentBlueRate,
          financing_date: new Date().toISOString().split('T')[0],
          trade_in_date: new Date().toISOString().split('T')[0],
          trade_in_currency: 'ARS',
          trade_in_exchange_rate: currentBlueRate
        }]);
      } else if (multiVehicleMode && interestVehicles.length > 0) {
        // Pre-load interest vehicles with proper price conversion
        setVehicleItems(interestVehicles.map(v => {
          let publicPriceArs = v.public_price_value || '';
          if (v.public_price_currency === 'USD' && v.public_price_value) {
            const rate = v.public_price_exchange_rate || currentBlueRate;
            publicPriceArs = Math.round(v.public_price_value * rate);
          }
          return {
            vehicle_id: v.id,
            vehicle: v,
            quoted_price: publicPriceArs,
            quoted_price_currency: 'ARS',
            quoted_price_exchange_rate: currentBlueRate,
            includeFinancing: false,
            financing_amount: '',
            financing_bank: '',
            financing_installments: '',
            financing_installment_value: ''
          };
        }));
      } else {
        setVehicleItems([]);
      }

      setFormData({
        client_name: editingQuote?.client_name || lead?.client_name || '',
        client_phone: editingQuote?.client_phone || lead?.client_phone || '',
      trade_in: editingQuote?.trade_in || lead?.trade_in || { brand: '', model: '', year: '', plate: '', kilometers: '', value_ars: '', currency: 'ARS', exchange_rate: currentBlueRate, date: new Date().toISOString().split('T')[0] },
        notes: editingQuote?.notes || '',
        date: editingQuote?.quote_date || new Date().toISOString().split('T')[0]
      });
      setClientSearch('');
      setVehicleSearch('');
      setShowVehicleSearch(false);
      setIsSubmitting(false);
    }
  }, [open, editingQuote, lead, vehicle, multiVehicleMode]);

  const filteredClients = clients.filter(c =>
    !clientSearch || 
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.dni?.includes(clientSearch) ||
    c.phone?.includes(clientSearch)
  );

  const filteredVehicles = allVehicles.filter(v => {
    if (!vehicleSearch) return false;
    if (vehicleItems.some(vi => vi.vehicle_id === v.id)) return false;
    const s = vehicleSearch.toLowerCase();
    return v.brand?.toLowerCase().includes(s) || 
           v.model?.toLowerCase().includes(s) || 
           v.plate?.toLowerCase().includes(s);
  });

  const handleClientSelect = (client) => {
    setIsNewClient(false);
    setSelectedClientId(client.id);
    setFormData(prev => ({ ...prev, client_name: client.full_name, client_phone: client.phone || '' }));
  };

  const handleChange = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })); setHasChanges(true); };
  const handleTradeInChange = async (field, value) => {
    if (field === 'date' && value) {
      try {
        const rate = await getHistoricalRate(value);
        if (rate) {
          setFormData(prev => ({ ...prev, trade_in: { ...prev.trade_in, [field]: value, exchange_rate: rate.toString() } }));
          setHasChanges(true);
          return;
        }
      } catch (err) {
        console.error('Error obteniendo cotización histórica para permuta en presupuesto:', err);
      }
    }
    setFormData(prev => ({ ...prev, trade_in: { ...prev.trade_in, [field]: value } }));
    setHasChanges(true);
  };

  const handleVehicleItemChange = async (index, field, value) => {
    // Si cambia la fecha, buscar cotización histórica
    if (field === 'quoted_price_date' && value) {
      try {
        const rate = await getHistoricalRate(value);
        if (rate) {
          setVehicleItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value, quoted_price_exchange_rate: rate.toString() } : item));
          setHasChanges(true);
          return;
        }
      } catch (err) {
        console.error('Error obteniendo cotización histórica en presupuesto:', err);
      }
    }
    if (field === 'financing_date' && value) {
      try {
        const rate = await getHistoricalRate(value);
        if (rate) {
          setVehicleItems(prev => prev.map((item, i) => i === index ? { ...item, financing_date: value, financing_exchange_rate: rate.toString() } : item));
          setHasChanges(true);
          return;
        }
      } catch (err) {
        console.error('Error obteniendo cotización histórica financiación presupuesto:', err);
      }
    }
    setVehicleItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    setHasChanges(true);
  };

  const addVehicle = (v) => {
    let publicPriceArs = v.public_price_value || '';
    if (v.public_price_currency === 'USD' && v.public_price_value) {
      const rate = v.public_price_exchange_rate || currentBlueRate;
      publicPriceArs = Math.round(v.public_price_value * rate);
    }
    setVehicleItems(prev => [...prev, {
      vehicle_id: v.id,
      vehicle: v,
      quoted_price: publicPriceArs,
      quoted_price_currency: 'ARS',
      quoted_price_exchange_rate: currentBlueRate,
      includeFinancing: false,
      financing_amount: '',
      financing_bank: '',
      financing_installments: '',
      financing_installment_value: ''
    }]);
    setVehicleSearch('');
    setShowVehicleSearch(false);
    setHasChanges(true);
  };

  const removeVehicle = (index) => {
    setVehicleItems(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleClose = () => { if (hasChanges) setShowConfirm(true); else onOpenChange(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const tradeInData = includeTradeIn ? formData.trade_in : null;
    
    const isMultiQuote = vehicleItems.length > 1;
    const multiQuoteGroupId = isMultiQuote ? `multi_${Date.now()}` : null;

    // Submit each vehicle as a separate quote
    const quotes = vehicleItems.map(item => ({
      ...formData,
      id: editingQuote?.id,
      vehicle_id: item.vehicle_id,
      vehicle_description: `${item.vehicle?.brand} ${item.vehicle?.model} ${item.vehicle?.year}`,
      client_id: selectedClientId || null,
      quoted_price_ars: parseFloat(item.quoted_price) || 0,
          quoted_price_currency: item.quoted_price_currency || 'ARS',
          quoted_price_exchange_rate: item.quoted_price_exchange_rate || currentBlueRate,
          quoted_price_date: item.quoted_price_date || formData.date,
          trade_in: tradeInData ? { ...tradeInData, currency: tradeInData.currency || 'ARS', exchange_rate: tradeInData.exchange_rate || currentBlueRate, date: tradeInData.date || formData.date } : null,
          financing_amount: item.includeFinancing ? (parseFloat(item.financing_amount) || 0) : 0,
          financing_currency: item.financing_currency || 'ARS',
          financing_exchange_rate: item.financing_exchange_rate || currentBlueRate,
          financing_date: item.financing_date || formData.date,
          financing_bank: item.includeFinancing ? item.financing_bank : '',
          financing_installments: item.includeFinancing ? item.financing_installments : '',
          financing_installment_value: item.includeFinancing ? item.financing_installment_value : '',
      is_multi_quote: isMultiQuote,
      multi_quote_group_id: multiQuoteGroupId
    }));

    try {
      await onSubmit(quotes.length === 1 ? quotes[0] : quotes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp = "h-8 text-[11px] bg-white";
  const lbl = "text-[10px] font-medium text-gray-500 mb-0.5";

  const tradeInValue = includeTradeIn ? (parseFloat(formData.trade_in.value_ars) || 0) : 0;

  return (
    <>
    <ConfirmDialog open={showConfirm} onOpenChange={setShowConfirm} onConfirm={() => onOpenChange(false)} />
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold">{editingQuote ? 'Editar' : 'Nuevo'} Presupuesto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Vehicles Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-gray-600" />
                <span className="text-[11px] font-medium text-gray-500">VEHÍCULO/S</span>
              </div>
              <Button type="button" variant="outline" size="sm" className="h-6 text-[9px]" onClick={() => setShowVehicleSearch(true)}>
                <Plus className="w-3 h-3 mr-1" /> Agregar
              </Button>
            </div>

            {showVehicleSearch && (
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input 
                  className={`${inp} pl-8`} 
                  placeholder="Buscar vehículo por marca, modelo o dominio..." 
                  value={vehicleSearch} 
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  autoFocus
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => { setShowVehicleSearch(false); setVehicleSearch(''); }}>
                  <X className="w-3 h-3" />
                </Button>
                {vehicleSearch && filteredVehicles.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-40 overflow-auto">
                    {filteredVehicles.slice(0, 8).map(v => (
                      <div key={v.id} className="p-2 hover:bg-gray-100 cursor-pointer text-[10px] border-b last:border-b-0" onClick={() => addVehicle(v)}>
                        <p className="font-medium">{v.brand} {v.model} {v.year}</p>
                        <p className="text-gray-500">{v.plate} • ${v.public_price_value?.toLocaleString('es-AR')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {vehicleItems.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-[11px] text-gray-500">
                No hay vehículos agregados. Haz click en "Agregar" para buscar.
              </div>
            ) : (
              <div className="space-y-3">
                {vehicleItems.map((item, index) => (
                  <div key={item.vehicle_id} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-[12px]">{item.vehicle?.brand} {item.vehicle?.model}</p>
                        <p className="text-[10px] text-gray-500">{item.vehicle?.year} • {item.vehicle?.plate}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeVehicle(index)}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                    
                  <div className="grid grid-cols-6 gap-2 mb-2">
                      <div className="col-span-2">
                        <Label className={lbl}>Precio cotizado</Label>
                        <Input className={inp} value={item.quoted_price} onChange={(e) => handleVehicleItemChange(index, 'quoted_price', e.target.value)} placeholder="0" />
                      </div>
                      <div>
                        <Label className={lbl}>Moneda</Label>
                        <Select value={item.quoted_price_currency || 'ARS'} onValueChange={(v) => handleVehicleItemChange(index, 'quoted_price_currency', v)}>
                          <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ARS" className="text-[11px]">ARS</SelectItem>
                            <SelectItem value="USD" className="text-[11px]">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className={lbl}>Cotización</Label>
                        <Input className={inp} value={item.quoted_price_exchange_rate || ''} onChange={(e) => handleVehicleItemChange(index, 'quoted_price_exchange_rate', e.target.value)} placeholder={currentBlueRate.toString()} />
                    </div>
                    <div>
                      <Label className={lbl}>Fecha</Label>
                      <Input className={inp + " cursor-pointer"} type="date" value={item.quoted_price_date || ''} onChange={(e) => handleVehicleItemChange(index, 'quoted_price_date', e.target.value)} />
                    </div>
                      <div className="flex items-end">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id={`financing-${index}`} 
                            checked={item.includeFinancing} 
                            onCheckedChange={(v) => handleVehicleItemChange(index, 'includeFinancing', v)} 
                            className="h-4 w-4" 
                          />
                          <label htmlFor={`financing-${index}`} className="text-[10px]">Financiación</label>
                        </div>
                      </div>
                    </div>

                    {item.includeFinancing && (
                      <div className="grid grid-cols-6 gap-2 pt-2 border-t">
                        <div><Label className={lbl}>Monto</Label><Input className={inp} value={item.financing_amount} onChange={(e) => handleVehicleItemChange(index, 'financing_amount', e.target.value)} /></div>
                        <div>
                          <Label className={lbl}>Moneda</Label>
                          <Select value={item.financing_currency || 'ARS'} onValueChange={(v) => handleVehicleItemChange(index, 'financing_currency', v)}>
                            <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="ARS" className="text-[11px]">ARS</SelectItem><SelectItem value="USD" className="text-[11px]">USD</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className={lbl}>Cotización</Label>
                          <Input className={inp} value={item.financing_exchange_rate || ''} onChange={(e) => handleVehicleItemChange(index, 'financing_exchange_rate', e.target.value)} placeholder={currentBlueRate.toString()} />
                        </div>
                        <div>
                          <Label className={lbl}>Fecha</Label>
                          <Input className={inp + " cursor-pointer"} type="date" value={item.financing_date || ''} onChange={(e) => handleVehicleItemChange(index, 'financing_date', e.target.value)} />
                        </div>
                        <div><Label className={lbl}>Banco</Label><Input className={inp} value={item.financing_bank} onChange={(e) => handleVehicleItemChange(index, 'financing_bank', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className={lbl}>Cuotas</Label><Input className={inp} value={item.financing_installments} onChange={(e) => handleVehicleItemChange(index, 'financing_installments', e.target.value)} /></div>
                          <div><Label className={lbl}>Valor cuota</Label><Input className={inp} value={item.financing_installment_value} onChange={(e) => handleVehicleItemChange(index, 'financing_installment_value', e.target.value)} /></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-[11px] font-medium text-gray-500">CLIENTE</span>
            </div>

            <div className="flex rounded overflow-hidden mb-3">
              <button
                type="button"
                className={`flex-1 h-8 text-[10px] font-medium transition-colors ${isNewClient ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                onClick={() => { setIsNewClient(true); setSelectedClientId(''); setClientSearch(''); setFormData(prev => ({ ...prev, client_name: '', client_phone: '' })); }}
              >
                Nuevo cliente
              </button>
              <button
                type="button"
                className={`flex-1 h-8 text-[10px] font-medium transition-colors ${!isNewClient ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                onClick={() => { setIsNewClient(false); }}
              >
                Cliente existente
              </button>
            </div>

            {!isNewClient && (
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
            )}

            <div className="grid grid-cols-2 gap-2">
              <div><Label className={lbl}>Nombre *</Label><Input className={inp} value={formData.client_name} onChange={(e) => handleChange('client_name', e.target.value)} required /></div>
              <div><Label className={lbl}>Teléfono</Label><Input className={inp} value={formData.client_phone} onChange={(e) => handleChange('client_phone', e.target.value)} /></div>
              <div><Label className={lbl}>DNI</Label><Input className={inp} value={formData.client_dni} onChange={(e) => handleChange('client_dni', e.target.value)} /></div>
              <div><Label className={lbl}>Dirección</Label><Input className={inp} value={formData.client_address} onChange={(e) => handleChange('client_address', e.target.value)} /></div>
              <div><Label className={lbl}>Ciudad</Label><Input className={inp} value={formData.client_city} onChange={(e) => handleChange('client_city', e.target.value)} /></div>
              <div><Label className={lbl}>Provincia</Label><Input className={inp} value={formData.client_province} onChange={(e) => handleChange('client_province', e.target.value)} /></div>
            </div>
          </div>

          {/* Trade In */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Car className="w-4 h-4 text-gray-600" /><span className="text-[11px] font-medium text-gray-500">PERMUTA</span></div>
              <div className="flex items-center gap-2"><Checkbox id="include-tradein" checked={includeTradeIn} onCheckedChange={setIncludeTradeIn} className="h-4 w-4" /><label htmlFor="include-tradein" className="text-[10px]">Incluir</label></div>
            </div>
            {includeTradeIn && (
              <div className="grid grid-cols-7 gap-2">
                <div><Label className={lbl}>Marca</Label><Input className={inp} value={formData.trade_in.brand} onChange={(e) => handleTradeInChange('brand', e.target.value)} /></div>
                <div><Label className={lbl}>Modelo</Label><Input className={inp} value={formData.trade_in.model} onChange={(e) => handleTradeInChange('model', e.target.value)} /></div>
                <div><Label className={lbl}>Año</Label><Input className={inp} value={formData.trade_in.year} onChange={(e) => handleTradeInChange('year', e.target.value)} /></div>
                <div><Label className={lbl}>Dominio</Label><Input className={inp} value={formData.trade_in.plate} onChange={(e) => handleTradeInChange('plate', e.target.value.toUpperCase())} /></div>
                <div><Label className={lbl}>KM</Label><Input className={inp} value={formData.trade_in.kilometers} onChange={(e) => handleTradeInChange('kilometers', e.target.value)} /></div>
                <div>
                  <Label className={lbl}>Moneda</Label>
                  <Select value={formData.trade_in.currency || 'ARS'} onValueChange={(v) => handleTradeInChange('currency', v)}>
                    <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ARS" className="text-[11px]">ARS</SelectItem><SelectItem value="USD" className="text-[11px]">USD</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2 col-span-3">
                  <div className="col-span-1"><Label className={lbl}>Valor</Label><Input className={inp} value={formData.trade_in.value_ars} onChange={(e) => handleTradeInChange('value_ars', e.target.value)} /></div>
                  <div className="col-span-1"><Label className={lbl}>Cotización</Label><Input className={inp} value={formData.trade_in.exchange_rate || ''} onChange={(e) => handleTradeInChange('exchange_rate', e.target.value)} placeholder={currentBlueRate.toString()} /></div>
                  <div className="col-span-1"><Label className={lbl}>Fecha</Label><Input className={inp + " cursor-pointer"} type="date" value={formData.trade_in.date || ''} onChange={(e) => handleTradeInChange('date', e.target.value)} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label className={lbl}>Observaciones</Label>
            <Textarea className="text-[11px] min-h-[50px] bg-white" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
          </div>

          {/* Summary - Per vehicle */}
          {vehicleItems.length > 0 && (
            <div className="p-4 bg-gray-900 text-white rounded-lg space-y-3">
              {vehicleItems.map((item, index) => {
                const price = parseFloat(item.quoted_price) || 0;
                const financing = item.includeFinancing ? (parseFloat(item.financing_amount) || 0) : 0;
                const diff = price - tradeInValue - financing;
                const hasDiscount = tradeInValue > 0 || financing > 0;
                return (
                  <div key={item.vehicle_id} className={`${index > 0 ? 'pt-3 border-t border-gray-700' : ''}`}>
                    <p className="text-[10px] text-gray-400 mb-1">{item.vehicle?.brand} {item.vehicle?.model} {item.vehicle?.year}</p>
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex gap-4"><span className="text-gray-400">Precio:</span><span>${price.toLocaleString('es-AR')}</span></div>
                        {tradeInValue > 0 && <div className="flex gap-4"><span className="text-gray-400">Permuta:</span><span className="text-blue-400">-${tradeInValue.toLocaleString('es-AR')}</span></div>}
                        {financing > 0 && <div className="flex gap-4"><span className="text-gray-400">Financiación:</span><span className="text-blue-400">-${financing.toLocaleString('es-AR')}</span></div>}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400">{hasDiscount ? 'Saldo a abonar' : 'Total de contado'}</p>
                        <p className="text-xl font-bold">${diff.toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} className="h-8 text-[11px]" disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800" disabled={vehicleItems.length === 0 || isSubmitting}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {isSubmitting ? 'Guardando...' : editingQuote ? 'Guardar' : vehicleItems.length > 1 ? `Generar ${vehicleItems.length} Presupuestos` : 'Generar Presupuesto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}