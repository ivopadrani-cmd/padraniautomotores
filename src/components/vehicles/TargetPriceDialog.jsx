import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function TargetPriceDialog({ open, onOpenChange, vehicle, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    target_price_value: '',
    target_price_currency: 'ARS',
    target_price_exchange_rate: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [currentBlueRate, setCurrentBlueRate] = useState(1200);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  // Función para obtener cotización BLUE actual
  const fetchCurrentBlueRate = async () => {
    setIsLoadingRate(true);
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares/blue');
      const data = await response.json();
      const rate = data.venta;
      setCurrentBlueRate(rate);
      return rate;
    } catch (error) {
      console.error('Error fetching blue rate:', error);
      toast.error('Error al obtener cotización actual');
      return currentBlueRate;
    } finally {
      setIsLoadingRate(false);
    }
  };

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

      // Obtener cotización actual al abrir el diálogo
      fetchCurrentBlueRate();
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
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-cyan-700">PRECIO OBJETIVO</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-cyan-600 hover:bg-cyan-100"
                onClick={fetchCurrentBlueRate}
                disabled={isLoadingRate}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingRate ? 'animate-spin' : ''}`} />
                Actualizar Cotización
              </Button>
            </div>

            <div className="space-y-3">
              {/* Fila principal */}
              <div className="grid grid-cols-4 gap-3">
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
                  <div className="flex gap-1">
                    <Input
                      className="h-9 text-[12px] bg-white flex-1"
                      type="text"
                      inputMode="decimal"
                      value={formData.target_price_exchange_rate}
                      onChange={(e) => handleChange('target_price_exchange_rate', e.target.value)}
                      placeholder={currentBlueRate.toString()}
                    />
                    <span className="text-[10px] text-gray-500 self-center">BLUE: ${currentBlueRate.toLocaleString('es-AR')}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-cyan-700">
                    Valor ({formData.target_price_currency})
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
                    Equivalente ({formData.target_price_currency === 'ARS' ? 'USD' : 'ARS'})
                  </Label>
                  <div className="h-9 bg-cyan-100 rounded px-3 flex items-center text-[13px] font-semibold text-cyan-800">
                    {formData.target_price_value && formData.target_price_exchange_rate ?
                      `${formData.target_price_currency === 'ARS' ? 'U$D' : '$'} ${calculateConversion(parseFloat(formData.target_price_value), formData.target_price_currency, parseFloat(formData.target_price_exchange_rate))?.toLocaleString(formData.target_price_currency === 'ARS' ? 'en-US' : 'es-AR', { maximumFractionDigits: 0 })}`
                      : '-'
                    }
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
