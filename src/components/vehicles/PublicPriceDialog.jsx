import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function PublicPriceDialog({ open, onOpenChange, vehicle, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    public_price_value: '',
    public_price_currency: 'ARS',
    public_price_exchange_rate: ''
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
        public_price_value: vehicle.public_price_value || '',
        public_price_currency: vehicle.public_price_currency || 'ARS',
        public_price_exchange_rate: vehicle.public_price_exchange_rate || ''
      });
      setHasChanges(false);
    }
  }, [open, vehicle]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Autocompletar cotización si está vacía y se cambia la moneda
      if (field === 'public_price_currency' && (!prev.public_price_exchange_rate || prev.public_price_exchange_rate === '')) {
        newData.public_price_exchange_rate = currentBlueRate.toString();
      }

      return newData;
    });
    setHasChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const processedData = { ...formData };

    // Procesar campos numéricos
    if (processedData.public_price_value !== '' && processedData.public_price_value !== undefined) {
      processedData.public_price_value = parseFloat(processedData.public_price_value) || 0;
    }
    if (processedData.public_price_exchange_rate !== '' && processedData.public_price_exchange_rate !== undefined) {
      processedData.public_price_exchange_rate = parseFloat(processedData.public_price_exchange_rate) || 1200;
    }

    try {
      await onSubmit(processedData);
      onOpenChange(false);
      toast.success("Precio Público actualizado correctamente");
    } catch (error) {
      toast.error("Error al actualizar precio público: " + error.message);
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
          <DialogTitle className="text-lg font-semibold">Editar Precio Público</DialogTitle>
          <p className="text-sm text-gray-500">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-green-50 rounded border border-green-200">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-green-700">PRECIO PÚBLICO</h3>
            </div>

            <div className="space-y-3">
              {/* Fila principal simplificada */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px] text-green-700">Moneda</Label>
                  <Select value={formData.public_price_currency} onValueChange={(v) => handleChange('public_price_currency', v)}>
                    <SelectTrigger className="h-9 text-[12px] bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS" className="text-[12px]">ARS - Pesos</SelectItem>
                      <SelectItem value="USD" className="text-[12px]">USD - Dólares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-green-700">
                    Precio público ({formData.public_price_currency})
                  </Label>
                  <Input
                    className="h-9 text-[13px] font-semibold bg-white"
                    type="text"
                    inputMode="decimal"
                    value={formData.public_price_value}
                    onChange={(e) => handleChange('public_price_value', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-green-700">
                    Conversión actual
                  </Label>
                  <div className="h-9 bg-green-100 rounded px-3 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-green-700">
                      {formData.public_price_value ?
                        `${formData.public_price_currency === 'ARS' ? 'U$D' : '$'} ${calculateConversion(parseFloat(formData.public_price_value), formData.public_price_currency, currentBlueRate)?.toLocaleString(formData.public_price_currency === 'ARS' ? 'en-US' : 'es-AR', { maximumFractionDigits: 0 })}`
                        : '-'
                      }
                    </span>
                    <span className="text-[9px] text-green-600">BLUE actual</span>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="text-[10px] text-green-700 bg-green-100 p-2 rounded">
                <strong>Precio Público:</strong> {formData.public_price_currency === 'ARS' ?
                  'Pactado en pesos para mantener estabilidad durante devaluación. Controla márgenes reales comparando con costo y precios objetivo.' :
                  'Precio de venta pactado en dólares. Se convierte automáticamente a pesos según cotización.'
                }
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
