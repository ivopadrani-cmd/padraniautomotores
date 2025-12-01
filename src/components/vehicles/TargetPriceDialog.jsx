import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function TargetPriceDialog({ open, onOpenChange, vehicle, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    target_price_value: '',
    target_price_currency: 'ARS',
    target_price_exchange_rate: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open && vehicle) {
      setFormData({
        target_price_value: vehicle.target_price_value || '',
        target_price_currency: vehicle.target_price_currency || 'ARS',
        target_price_exchange_rate: vehicle.target_price_exchange_rate || ''
      });
      setHasChanges(false);
    }
  }, [open, vehicle]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const processedData = { ...formData };

    // Procesar campos numéricos
    if (processedData.target_price_value !== '' && processedData.target_price_value !== undefined) {
      processedData.target_price_value = parseFloat(processedData.target_price_value) || 0;
    }
    if (processedData.target_price_exchange_rate !== '' && processedData.target_price_exchange_rate !== undefined) {
      processedData.target_price_exchange_rate = parseFloat(processedData.target_price_exchange_rate) || 1200;
    }

    try {
      await onSubmit(processedData);
      onOpenChange(false);
      toast.success("Precio Objetivo actualizado correctamente");
    } catch (error) {
      toast.error("Error al actualizar precio objetivo: " + error.message);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('¿Descartar cambios?')) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Editar Precio Objetivo</DialogTitle>
          <p className="text-sm text-gray-500">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-cyan-50 rounded border border-cyan-200">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] text-cyan-700">Moneda</Label>
                <Select value={formData.target_price_currency} onValueChange={(v) => handleChange('target_price_currency', v)}>
                  <SelectTrigger className="h-9 text-[12px] bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS" className="text-[12px]">ARS</SelectItem>
                    <SelectItem value="USD" className="text-[12px]">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-cyan-700">Cotización USD</Label>
                <Input
                  className="h-9 text-[12px] bg-white"
                  type="text"
                  inputMode="decimal"
                  value={formData.target_price_exchange_rate}
                  onChange={(e) => handleChange('target_price_exchange_rate', e.target.value)}
                  placeholder="1200"
                />
              </div>
              <div>
                <Label className="text-[11px] text-cyan-700">Valor</Label>
                <Input
                  className="h-9 text-[13px] font-semibold bg-white"
                  type="text"
                  inputMode="decimal"
                  value={formData.target_price_value}
                  onChange={(e) => handleChange('target_price_value', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !hasChanges}
              className="flex-1"
            >
              {isLoading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" />Guardar</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
