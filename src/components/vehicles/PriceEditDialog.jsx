import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "sonner";

const PriceInputRow = ({ label, valueKey, currencyKey, rateKey, color = "gray", formData, onChange }) => {
  const bgClass = color === 'dark' ? 'bg-gray-200' : color === 'green' ? 'bg-green-50' : color === 'cyan' ? 'bg-cyan-50' : 'bg-gray-50';
  const titleClass = color === 'dark' ? 'text-gray-700' : color === 'green' ? 'text-green-700' : color === 'cyan' ? 'text-cyan-700' : 'text-gray-600';

  return (
    <div className={`p-3 rounded ${bgClass}`}>
      <p className={`text-[11px] font-semibold uppercase ${titleClass} mb-2`}>{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-[9px] text-gray-500">Moneda</Label>
          <Select value={formData[currencyKey] || 'ARS'} onValueChange={(v) => onChange(currencyKey, v)}>
            <SelectTrigger className="h-8 text-[12px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS" className="text-[12px]">ARS</SelectItem>
              <SelectItem value="USD" className="text-[12px]">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[9px] text-gray-500">Cotiz. USD</Label>
          <Input
            className="h-8 text-[12px] bg-white"
            type="text"
            inputMode="decimal"
            value={formData[rateKey] ?? ''}
            onChange={(e) => onChange(rateKey, e.target.value)}
            placeholder="1200"
          />
        </div>
        <div>
          <Label className="text-[9px] text-gray-500">Valor</Label>
          <Input
            className="h-8 text-[12px] font-semibold bg-white"
            type="text"
            inputMode="decimal"
            value={formData[valueKey] ?? ''}
            onChange={(e) => onChange(valueKey, e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
};

export default function PriceEditDialog({ open, onOpenChange, vehicle, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open && vehicle) {
      setFormData({
        target_price_value: vehicle.target_price_value || '',
        target_price_currency: vehicle.target_price_currency || 'ARS',
        target_price_exchange_rate: vehicle.target_price_exchange_rate || '',
        public_price_value: vehicle.public_price_value || '',
        public_price_currency: vehicle.public_price_currency || 'ARS',
        public_price_exchange_rate: vehicle.public_price_exchange_rate || '',
        infoauto_value: vehicle.infoauto_value || '',
        infoauto_currency: vehicle.infoauto_currency || 'ARS',
        infoauto_exchange_rate: vehicle.infoauto_exchange_rate || '',
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

    // Procesar campos numéricos
    const numericFields = [
      'target_price_value', 'target_price_exchange_rate',
      'public_price_value', 'public_price_exchange_rate',
      'infoauto_value', 'infoauto_exchange_rate'
    ];

    const processedData = { ...formData };
    numericFields.forEach(field => {
      if (processedData[field] !== '' && processedData[field] !== undefined) {
        processedData[field] = parseFloat(processedData[field]) || 0;
      }
    });

    try {
      await onSubmit(processedData);
      onOpenChange(false);
      toast.success("Precios actualizados correctamente");
    } catch (error) {
      toast.error("Error al actualizar precios: " + error.message);
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
          <DialogTitle className="text-lg font-semibold">Editar Precios</DialogTitle>
          <p className="text-sm text-gray-500">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <PriceInputRow
              label="Precio Objetivo"
              valueKey="target_price_value"
              currencyKey="target_price_currency"
              rateKey="target_price_exchange_rate"
              color="cyan"
              formData={formData}
              onChange={handleChange}
            />

            <PriceInputRow
              label="Precio Público"
              valueKey="public_price_value"
              currencyKey="public_price_currency"
              rateKey="public_price_exchange_rate"
              color="green"
              formData={formData}
              onChange={handleChange}
            />

            <PriceInputRow
              label="Valor InfoAuto"
              valueKey="infoauto_value"
              currencyKey="infoauto_currency"
              rateKey="infoauto_exchange_rate"
              color="dark"
              formData={formData}
              onChange={handleChange}
            />
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