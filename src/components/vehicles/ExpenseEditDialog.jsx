import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Trash2 } from "lucide-react";
import { useDollarHistory } from "@/hooks/useDollarHistory";

export default function ExpenseEditDialog({ open, onOpenChange, expense, index, onSave, onDelete, currentBlueRate }) {
  const [formData, setFormData] = useState({
    type: 'GESTORIA',
    value: '',
    currency: 'ARS',
    exchange_rate: '1200',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const { getHistoricalRate } = useDollarHistory();

  useEffect(() => {
    if (expense) {
      setFormData({
        type: expense.type || 'GESTORIA',
        value: expense.value?.toString() || '',
        currency: expense.currency || 'ARS',
        exchange_rate: expense.exchange_rate?.toString() || (currentBlueRate?.toString() || '1200'),
        date: expense.date || new Date().toISOString().split('T')[0],
        description: expense.description || ''
      });
    }
  }, [expense, currentBlueRate]);

  // Efecto para buscar cotización histórica cuando cambia la fecha
  useEffect(() => {
    const updateHistoricalRate = async () => {
      if (formData.date) {
        const historicalRate = await getHistoricalRate(formData.date);
        if (historicalRate && historicalRate !== parseFloat(formData.exchange_rate)) {
          setFormData(prev => ({ ...prev, exchange_rate: historicalRate.toString() }));
        }
      }
    };

    // Pequeño delay para evitar llamadas excesivas mientras el usuario escribe
    const timeoutId = setTimeout(updateHistoricalRate, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.date, getHistoricalRate]); // Quité la dependencia de 'open' para evitar ejecución automática al abrir

  const handleSave = () => {
    onSave(index, {
      ...formData,
      value: parseFloat(formData.value) || 0,
      exchange_rate: parseFloat(formData.exchange_rate) || 1200
    });
    onOpenChange(false);
  };

  const inp = "h-8 text-[11px] bg-white";
  const lbl = "text-[10px] font-medium text-gray-500 mb-0.5";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0" style={{ zIndex: 1300 }}>
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold">{expense ? 'Editar' : 'Nuevo'} Gasto</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={lbl}>Tipo de gasto</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['GESTORIA', 'TALLER', 'CHAPISTA', 'LIMPIEZA', 'VERIFICACION', 'MECANICA', 'OTRO'].map(t => (
                    <SelectItem key={t} value={t} className="text-[11px]">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={lbl}>Fecha</Label>
              <Input className={inp} type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className={lbl}>Moneda</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({...formData, currency: v})}>
                <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS" className="text-[11px]">ARS</SelectItem>
                  <SelectItem value="USD" className="text-[11px]">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={lbl}>Valor</Label>
              <Input className={inp} type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} />
            </div>
            <div>
              <Label className={lbl}>Cotización USD</Label>
              <Input className={inp} type="number" value={formData.exchange_rate} onChange={(e) => setFormData({...formData, exchange_rate: e.target.value})} />
            </div>
          </div>

          <div>
            <Label className={lbl}>Descripción</Label>
            <Input className={inp} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Opcional..." />
          </div>

          <div className="flex justify-between pt-3 border-t">
            {expense && (
              <Button type="button" variant="outline" onClick={() => { onDelete(index); onOpenChange(false); }} className="h-8 text-[11px] text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />Eliminar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-[11px]">Cancelar</Button>
              <Button type="button" onClick={handleSave} className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">
                <Save className="w-3.5 h-3.5 mr-1.5" />Guardar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}