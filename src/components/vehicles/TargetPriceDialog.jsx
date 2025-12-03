import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "sonner";
import PriceManualDialog from "./PriceManualDialog";

export default function TargetPriceDialog({ open, onOpenChange, vehicle, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    target_price_value: '',
    target_price_currency: 'USD', // Siempre USD
    target_price_exchange_rate: '',
    target_price_date: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [currentBlueRate, setCurrentBlueRate] = useState(1200);
  const [showManual, setShowManual] = useState(false);


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
        target_price_currency: 'USD', // Siempre USD
        target_price_exchange_rate: vehicle.target_price_exchange_rate || '',
        target_price_date: vehicle.target_price_date || ''
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">Editar Precio Objetivo</DialogTitle>
              <p className="text-sm text-gray-500">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowManual(true)}
              className="h-8 w-8 p-0"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-cyan-50 rounded border border-cyan-200">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-cyan-700">PRECIO OBJETIVO</h3>
            </div>

            <div className="space-y-3">
              {/* Fila principal simplificada */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-cyan-700">Fecha</Label>
                  <Input
                    className="h-9 text-[12px] bg-white"
                    type="date"
                    value={formData.target_price_date}
                    onChange={(e) => handleChange('target_price_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-cyan-700">Moneda</Label>
                  <div className="h-9 bg-cyan-100 rounded px-3 flex items-center text-[12px] font-semibold text-cyan-700">
                    USD - Dólares
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px] text-cyan-700">
                    Precio objetivo (USD)
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
                    Cotización USD
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      className="h-9 text-[12px] bg-white flex-1"
                      type="text"
                      inputMode="decimal"
                      value={formData.target_price_exchange_rate}
                      onChange={(e) => handleChange('target_price_exchange_rate', e.target.value)}
                      placeholder={currentBlueRate.toString()}
                    />
                    <span className="text-[9px] text-gray-500 self-center">ACTUAL: ${currentBlueRate.toLocaleString('es-AR')}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-cyan-700">
                    Equivalente en pesos
                  </Label>
                  <div className="h-9 bg-cyan-100 rounded px-3 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-cyan-700">
                      {formData.target_price_value && formData.target_price_exchange_rate ?
                        `$${calculateConversion(parseFloat(formData.target_price_value), 'USD', parseFloat(formData.target_price_exchange_rate))?.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                        : '-'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="text-[10px] text-cyan-700 bg-cyan-100 p-2 rounded">
                <strong>Precio Objetivo:</strong> Mínimo de venta fijo en dólares. Se convierte automáticamente a pesos según cotización actual.
                Te permite saber cuánto deberías cobrar en pesos para mantener el margen deseado.
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

        {/* Modal del manual */}
        <PriceManualDialog
          open={showManual}
          onOpenChange={setShowManual}
        />
      </DialogContent>
    </Dialog>
  );
}
