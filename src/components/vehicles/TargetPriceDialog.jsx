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
  const [currentBlueRate, setCurrentBlueRate] = useState(1200);


  // Calcular conversión automática
  const calculateConversion = (value, currency, exchangeRate) => {
    if (!value || !exchangeRate) return null;
    if (currency === 'ARS') {
      return value / exchangeRate;
    } else {
      return value * exchangeRate;
    }
  };

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
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Autocompletar cotización si está vacía y se cambia la moneda
      if (field === 'target_price_currency' && (!prev.target_price_exchange_rate || prev.target_price_exchange_rate === '')) {
        newData.target_price_exchange_rate = currentBlueRate.toString();
      }

      return newData;
    });
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Editar Precio Objetivo</DialogTitle>
          <p className="text-sm text-gray-500">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-cyan-50 rounded border border-cyan-200">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-cyan-700">PRECIO OBJETIVO</h3>
            </div>

            <div className="space-y-3">
              {/* Fila principal simplificada */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px] text-cyan-700">Moneda</Label>
                  <Select value={formData.target_price_currency} onValueChange={(v) => handleChange('target_price_currency', v)}>
                    <SelectTrigger className="h-9 text-[12px] bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS" className="text-[12px]">ARS - Pesos</SelectItem>
                      <SelectItem value="USD" className="text-[12px]">USD - Dólares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-cyan-700">
                    Precio objetivo ({formData.target_price_currency})
                  </Label>
                  <Input
                    className="h-9 text-[13px] font-semibold bg-white"
                    type="text"
                    inputMode="decimal"
                    value={formData.target_price_value}
                    onChange={(e) => handleChange('target_price_value', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-cyan-700">
                    Conversión actual
                  </Label>
                  <div className="h-9 bg-cyan-100 rounded px-3 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-cyan-700">
                      {formData.target_price_value ?
                        `${formData.target_price_currency === 'ARS' ? 'U$D' : '$'} ${calculateConversion(parseFloat(formData.target_price_value), formData.target_price_currency, currentBlueRate)?.toLocaleString(formData.target_price_currency === 'ARS' ? 'en-US' : 'es-AR', { maximumFractionDigits: 0 })}`
                        : '-'
                      }
                    </span>
                    <span className="text-[9px] text-cyan-600">BLUE actual</span>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="text-[10px] text-cyan-700 bg-cyan-100 p-2 rounded">
                <strong>Precio Objetivo:</strong> {formData.target_price_currency === 'USD' ?
                  'Mínimo de venta fijo en dólares, se convierte automáticamente a pesos.' :
                  'Mínimo de venta fijo en pesos, equivalente en dólares se calcula con cotización actual.'
                } Sirve para organizar ganancias mínimas esperadas.
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
