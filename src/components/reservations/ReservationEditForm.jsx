import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Car, User, Receipt, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function ReservationEditForm({ open, onOpenChange, reservation, vehicle }) {
  const queryClient = useQueryClient();
  const [includeDeposit, setIncludeDeposit] = useState(true);
  const [includeTradeIn, setIncludeTradeIn] = useState(false);
  const [includeFinancing, setIncludeFinancing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({});

  const { data: sellers = [] } = useQuery({ queryKey: ['sellers'], queryFn: () => base44.entities.Seller.filter({ is_active: true }) });
  const { data: rates = [] } = useQuery({ queryKey: ['exchange-rates'], queryFn: () => base44.entities.ExchangeRate.list('-rate_date') });

  const currentBlueRate = rates.find(r => r.rate_type === 'Diaria')?.usd_rate || 1200;

  useEffect(() => {
    if (open && reservation) {
      setIncludeDeposit(reservation.deposit_amount > 0);
      setIncludeTradeIn(!!reservation.trade_in?.brand);
      setIncludeFinancing(!!reservation.financing_amount);
      setFormData({
        reservation_date: reservation.reservation_date || new Date().toISOString().split('T')[0],
        client_name: reservation.client_name || '',
        client_phone: reservation.client_phone || '',
        seller_id: reservation.seller_id || '',
        seller_name: reservation.seller_name || '',
        deposit_amount: reservation.deposit_amount || '',
        deposit_currency: reservation.deposit_currency || 'ARS',
        deposit_exchange_rate: reservation.deposit_exchange_rate || currentBlueRate,
        deposit_date: reservation.deposit_date || new Date().toISOString().split('T')[0],
        deposit_description: reservation.deposit_description || '',
        agreed_price: reservation.agreed_price || '',
        agreed_price_currency: reservation.agreed_price_currency || 'ARS',
        agreed_price_exchange_rate: reservation.agreed_price_exchange_rate || currentBlueRate,
        trade_in: reservation.trade_in || { brand: '', model: '', year: '', plate: '', kilometers: '', value: '', value_currency: 'ARS', value_exchange_rate: currentBlueRate },
        financing_amount: reservation.financing_amount || '',
        financing_bank: reservation.financing_bank || '',
        financing_installments: reservation.financing_installments || '',
        financing_installment_value: reservation.financing_installment_value || '',
        observations: reservation.observations || ''
      });
    }
  }, [open, reservation, currentBlueRate]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Reservation.update(reservation.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success("Reserva actualizada");
      onOpenChange(false);
    },
  });

  const handleSellerSelect = (sellerId) => {
    const seller = sellers.find(s => s.id === sellerId);
    if (seller) setFormData(prev => ({ ...prev, seller_id: sellerId, seller_name: seller.full_name }));
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleTradeInChange = (field, value) => setFormData(prev => ({ ...prev, trade_in: { ...prev.trade_in, [field]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        ...formData,
        deposit_amount: includeDeposit ? (parseFloat(formData.deposit_amount) || 0) : 0,
        deposit_exchange_rate: parseFloat(formData.deposit_exchange_rate) || null,
        agreed_price: parseFloat(formData.agreed_price) || 0,
        agreed_price_exchange_rate: parseFloat(formData.agreed_price_exchange_rate) || null,
        trade_in: includeTradeIn ? {
          ...formData.trade_in,
          value_exchange_rate: parseFloat(formData.trade_in.value_exchange_rate) || null
        } : null,
        financing_amount: includeFinancing ? (parseFloat(formData.financing_amount) || 0) : 0,
        financing_bank: includeFinancing ? formData.financing_bank : '',
        financing_installments: includeFinancing ? formData.financing_installments : '',
        financing_installment_value: includeFinancing ? formData.financing_installment_value : '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp = "h-8 text-[11px] bg-white";
  const lbl = "text-[10px] font-medium text-gray-500 mb-0.5";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold">Editar Reserva</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Vehicle */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2"><Car className="w-4 h-4 text-gray-600" /><span className="text-[11px] font-medium text-gray-500">VEHÍCULO</span></div>
            <p className="font-bold">{vehicle?.brand} {vehicle?.model} <span className="font-normal text-gray-500">{vehicle?.year} • {vehicle?.plate}</span></p>
          </div>

          {/* Agreed Price */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <Label className="text-[11px] font-semibold text-gray-700 block mb-2">PRECIO ACORDADO</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input className="h-10 text-lg font-bold text-center col-span-1" value={formData.agreed_price} onChange={(e) => handleChange('agreed_price', e.target.value)} placeholder="0" />
              <Select value={formData.agreed_price_currency} onValueChange={(v) => handleChange('agreed_price_currency', v)}>
                <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ARS" className="text-[11px]">ARS</SelectItem><SelectItem value="USD" className="text-[11px]">USD</SelectItem></SelectContent>
              </Select>
              <Input className={inp} value={formData.agreed_price_exchange_rate} onChange={(e) => handleChange('agreed_price_exchange_rate', e.target.value)} placeholder="Cotización USD" />
            </div>
          </div>

          {/* Client */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-gray-600" /><span className="text-[11px] font-medium text-gray-500">CLIENTE</span></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className={lbl}>Nombre</Label><Input className={inp} value={formData.client_name} onChange={(e) => handleChange('client_name', e.target.value)} /></div>
              <div><Label className={lbl}>Teléfono</Label><Input className={inp} value={formData.client_phone} onChange={(e) => handleChange('client_phone', e.target.value)} /></div>
            </div>
          </div>

          {/* Deposit */}
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
              <div className="grid grid-cols-6 gap-2">
                <div><Label className={lbl}>Marca</Label><Input className={inp} value={formData.trade_in?.brand} onChange={(e) => handleTradeInChange('brand', e.target.value)} /></div>
                <div><Label className={lbl}>Modelo</Label><Input className={inp} value={formData.trade_in?.model} onChange={(e) => handleTradeInChange('model', e.target.value)} /></div>
                <div><Label className={lbl}>Año</Label><Input className={inp} value={formData.trade_in?.year} onChange={(e) => handleTradeInChange('year', e.target.value)} /></div>
                <div><Label className={lbl}>Dominio</Label><Input className={inp} value={formData.trade_in?.plate} onChange={(e) => handleTradeInChange('plate', e.target.value?.toUpperCase())} /></div>
                <div><Label className={lbl}>KM</Label><Input className={inp} value={formData.trade_in?.kilometers} onChange={(e) => handleTradeInChange('kilometers', e.target.value)} /></div>
                <div><Label className={lbl}>Valor $</Label><Input className={inp} value={formData.trade_in?.value} onChange={(e) => handleTradeInChange('value', e.target.value)} /></div>
              </div>
            )}
          </div>

          {/* Financing */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-600" /><span className="text-[11px] font-medium text-gray-500">FINANCIACIÓN</span></div>
              <div className="flex items-center gap-2"><Checkbox id="include-financing" checked={includeFinancing} onCheckedChange={setIncludeFinancing} className="h-4 w-4" /><label htmlFor="include-financing" className="text-[10px]">Incluir</label></div>
            </div>
            {includeFinancing && (
              <div className="grid grid-cols-4 gap-2">
                <div><Label className={lbl}>Monto</Label><Input className={inp} value={formData.financing_amount} onChange={(e) => handleChange('financing_amount', e.target.value)} /></div>
                <div><Label className={lbl}>Banco</Label><Input className={inp} value={formData.financing_bank} onChange={(e) => handleChange('financing_bank', e.target.value)} /></div>
                <div><Label className={lbl}>Cuotas</Label><Input className={inp} value={formData.financing_installments} onChange={(e) => handleChange('financing_installments', e.target.value)} /></div>
                <div><Label className={lbl}>Valor cuota</Label><Input className={inp} value={formData.financing_installment_value} onChange={(e) => handleChange('financing_installment_value', e.target.value)} /></div>
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-[11px]" disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800" disabled={isSubmitting}><Save className="w-3.5 h-3.5 mr-1.5" />{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}