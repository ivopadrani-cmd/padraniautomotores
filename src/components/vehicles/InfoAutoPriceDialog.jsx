import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, HelpCircle } from "lucide-react";
import PriceManualDialog from "./PriceManualDialog";
import { toast } from "sonner";
import { useDollarHistory } from "@/hooks/useDollarHistory";

export default function InfoAutoPriceDialog({ open, onOpenChange, vehicle, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    infoauto_value: '',
    infoauto_currency: 'ARS',
    infoauto_exchange_rate: '',
    infoauto_date: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [currentBlueRate, setCurrentBlueRate] = useState(1200);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const { getHistoricalRate, isLoading: isLoadingHistorical } = useDollarHistory();

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

  // Calcular conversión automática (InfoAuto siempre se pacta en ARS)
  const calculateConversion = (value, exchangeRate) => {
    if (!value || !exchangeRate) return null;
    return value / exchangeRate; // ARS a USD
  };

  useEffect(() => {
    if (open && vehicle) {
      // Obtener cotización actual al abrir el diálogo
      fetchCurrentBlueRate().then((currentRate) => {
        setFormData({
          infoauto_value: vehicle.infoauto_value || '',
          infoauto_currency: vehicle.infoauto_currency || 'ARS', // Siempre ARS
          infoauto_exchange_rate: vehicle.infoauto_exchange_rate || currentRate?.toString() || '',
          infoauto_date: vehicle.infoauto_date || new Date().toISOString().split('T')[0] // Fecha actual si no tiene guardada
        });
        setHasChanges(false);
      });
    }
  }, [open, vehicle]);

  // Efecto para buscar cotización histórica cuando cambia la fecha
  useEffect(() => {
    const updateHistoricalRate = async () => {
      if (formData.infoauto_date && open) {
        const historicalRate = await getHistoricalRate(formData.infoauto_date);
        if (historicalRate && historicalRate !== parseFloat(formData.infoauto_exchange_rate)) {
          setFormData(prev => ({ ...prev, infoauto_exchange_rate: historicalRate.toString() }));
          // Marcar que hay cambios cuando se actualiza la cotización automáticamente
          setHasChanges(true);
        }
      }
    };

    // Pequeño delay para evitar llamadas excesivas mientras el usuario escribe
    const timeoutId = setTimeout(updateHistoricalRate, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.infoauto_date, getHistoricalRate, open]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // InfoAuto siempre se pacta en ARS
      if (field === 'infoauto_currency' && value !== 'ARS') {
        // Si intentan cambiar la moneda, mantener ARS
        newData.infoauto_currency = 'ARS';
        toast.info('El precio InfoAuto siempre se pacta en pesos (ARS)');
      }

      return newData;
    });
    setHasChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('💾 Intentando guardar InfoAuto:', formData);

    const processedData = { ...formData };

    // Procesar campos numéricos
    if (processedData.infoauto_value !== '' && processedData.infoauto_value !== undefined) {
      processedData.infoauto_value = parseFloat(processedData.infoauto_value) || 0;
    }
    if (processedData.infoauto_exchange_rate !== '' && processedData.infoauto_exchange_rate !== undefined) {
      processedData.infoauto_exchange_rate = parseFloat(processedData.infoauto_exchange_rate) || 1200;
    }
    // Procesar fecha
    if (processedData.infoauto_date !== '' && processedData.infoauto_date !== undefined) {
      processedData.infoauto_date = processedData.infoauto_date;
    }

    console.log('📤 Datos procesados para guardar:', processedData);

    try {
      console.log('🚀 Enviando datos a onSubmit:', processedData);
      const result = await onSubmit(processedData);
      console.log('✅ InfoAuto guardado exitosamente, resultado:', result);
      onOpenChange(false);
      toast.success("Precio InfoAuto actualizado correctamente");
    } catch (error) {
      console.error('❌ Error guardando InfoAuto:', error);
      console.error('❌ Detalles del error:', error);
      toast.error("Error al actualizar precio InfoAuto: " + error.message);
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
              <DialogTitle className="text-lg font-semibold">Editar Precio InfoAuto</DialogTitle>
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
          <div className="p-4 bg-gray-100 rounded">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700">PRECIO INFOAUTO</h3>
            </div>

            <div className="space-y-3">
              {/* Fila principal */}
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <Label className="text-[11px] text-gray-600">Moneda</Label>
                  <div className="h-9 bg-gray-200 rounded px-3 flex items-center text-[12px] font-semibold text-gray-700">
                    ARS
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1">Siempre en pesos</p>
                </div>
                <div>
                  <Label className="text-[11px] text-gray-600">Fecha de referencia</Label>
                  <Input
                    className="h-9 text-[12px] bg-white"
                    type="date"
                    value={formData.infoauto_date}
                    onChange={(e) => handleChange('infoauto_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-600">Cotización al momento</Label>
                  <div className="flex gap-1">
                    <Input
                      className="h-9 text-[12px] bg-white flex-1"
                      type="text"
                      inputMode="decimal"
                      value={formData.infoauto_exchange_rate}
                      onChange={(e) => handleChange('infoauto_exchange_rate', e.target.value)}
                      placeholder={currentBlueRate.toString()}
                    />
                    <span className="text-[10px] text-gray-500 self-center">ACTUAL: ${currentBlueRate.toLocaleString('es-AR')}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-gray-600">Valor (ARS)</Label>
                  <Input
                    className="h-9 text-[13px] font-semibold bg-white"
                    type="text"
                    inputMode="decimal"
                    value={formData.infoauto_value}
                    onChange={(e) => handleChange('infoauto_value', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-600">Equivalente (USD)</Label>
                  <div className="h-9 bg-gray-200 rounded px-3 flex items-center text-[13px] font-semibold text-gray-700">
                    {formData.infoauto_value && formData.infoauto_exchange_rate ?
                      `U$D ${calculateConversion(parseFloat(formData.infoauto_value), parseFloat(formData.infoauto_exchange_rate))?.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                      : '-'
                    }
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="text-[10px] text-gray-600 bg-orange-50 p-2 rounded">
                <strong>Precio InfoAuto:</strong> Siempre pactado en pesos (ARS). La fecha permite asociar la cotización histórica correcta
                y ver cuánto valía realmente en dólares en ese momento. Cuando tengas API histórica, se podrá automatizar.
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
