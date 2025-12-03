import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, Edit, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import ExpenseEditDialog from "./ExpenseEditDialog";
import { useDollarHistory } from "@/hooks/useDollarHistory";
import PriceManualDialog from "./PriceManualDialog";

// Función para convertir valores entre monedas
const convertValue = (value, currency, exchangeRate, targetCurrency) => {
  if (!value || !exchangeRate) return 0;
  if (currency === targetCurrency) return value;
  if (currency === 'ARS' && targetCurrency === 'USD') return value / exchangeRate;
  if (currency === 'USD' && targetCurrency === 'ARS') return value * exchangeRate;
  return value;
};

export default function CostPriceDialog({ open, onOpenChange, vehicle, onSubmit, isLoading, onEditExpense }) {
  const [formData, setFormData] = useState({
    cost_value: '',
    cost_currency: 'ARS',
    cost_exchange_rate: '',
    cost_date: ''
  });
  const [expenses, setExpenses] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentBlueRate, setCurrentBlueRate] = useState(1200);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState(-1);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [exchangeRateManuallyChanged, setExchangeRateManuallyChanged] = useState(false);
  const [dateNeedsHistoricalUpdate, setDateNeedsHistoricalUpdate] = useState(false);

  const { getHistoricalRate } = useDollarHistory();


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
      console.log('📋 Inicializando CostPriceDialog con datos:', {
        cost_value: vehicle.cost_value,
        cost_currency: vehicle.cost_currency,
        cost_exchange_rate: vehicle.cost_exchange_rate,
        cost_date: vehicle.cost_date
      });
      setFormData({
        cost_value: vehicle.cost_value || '',
        cost_currency: vehicle.cost_currency || 'ARS',
        cost_exchange_rate: vehicle.cost_exchange_rate || currentBlueRate.toString(),
        cost_date: vehicle.cost_date || new Date().toISOString().split('T')[0]
      });
      setExpenses(vehicle.expenses || []);
      setHasChanges(false);
      setExchangeRateManuallyChanged(false); // Reset flag when opening modal

      // Si hay una fecha guardada, cargar cotización histórica automáticamente
      if (vehicle.cost_date && vehicle.cost_date !== '') {
        setDateNeedsHistoricalUpdate(true);
      } else {
        setDateNeedsHistoricalUpdate(false);
      }
    }
  }, [open, vehicle, currentBlueRate]);

  // Efecto para buscar cotización histórica cuando se solicita
  useEffect(() => {
    const updateHistoricalRate = async () => {
      if (formData.cost_date && dateNeedsHistoricalUpdate && !exchangeRateManuallyChanged) {
        console.log('🔍 Buscando cotización histórica para fecha:', formData.cost_date);
        const historicalRate = await getHistoricalRate(formData.cost_date);
        console.log('📊 Cotización histórica encontrada:', historicalRate, 'vs actual:', formData.cost_exchange_rate);
        if (historicalRate && historicalRate !== parseFloat(formData.cost_exchange_rate)) {
          console.log('🔄 Actualizando cotización de', formData.cost_exchange_rate, 'a', historicalRate);
          setFormData(prev => ({ ...prev, cost_exchange_rate: historicalRate.toString() }));
          setHasChanges(true);
        }
        setDateNeedsHistoricalUpdate(false); // Reset flag after update
      }
    };

    if (dateNeedsHistoricalUpdate) {
      const timeoutId = setTimeout(updateHistoricalRate, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.cost_date, getHistoricalRate, dateNeedsHistoricalUpdate, exchangeRateManuallyChanged]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Cuando se cambia la fecha, buscar cotización histórica
      if (field === 'cost_date' && value) {
        setDateNeedsHistoricalUpdate(true);
        setExchangeRateManuallyChanged(false); // Permitir actualización automática
      }

      // Cuando se cambia manualmente la cotización, marcar como cambiada manualmente
      if (field === 'cost_exchange_rate') {
        setExchangeRateManuallyChanged(true);
      }

      // Autocompletar cotización si está vacía y se cambia la moneda
      if (field === 'cost_currency' && (!prev.cost_exchange_rate || prev.cost_exchange_rate === '')) {
        newData.cost_exchange_rate = currentBlueRate.toString();
        // Marcar que ha habido cambios para que se pueda guardar
        setTimeout(() => setHasChanges(true), 0);
      }

      return newData;
    });
    setHasChanges(true);
  };

  const handleAddExpense = () => {
    setEditingExpense({});
    setEditingExpenseIndex(-1);
    setShowExpenseModal(true);
  };

  const handleEditExpense = (index) => {
    const expenseToEdit = expenses[index];
    if (expenseToEdit) {
      setEditingExpense({ ...expenseToEdit });
      setEditingExpenseIndex(index);
      setShowExpenseModal(true);
    }
  };


  const handleSaveExpense = (index, expenseData) => {
    if (index === -1) {
      // Nuevo gasto
      setExpenses([...expenses, expenseData]);
    } else {
      // Editar gasto existente
      const newExpenses = [...expenses];
      newExpenses[index] = expenseData;
      setExpenses(newExpenses);
    }
    setHasChanges(true);
  };

  const handleDeleteExpense = (index) => {
    const newExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(newExpenses);
    setHasChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const processedData = {
      ...formData,
      expenses: expenses.map(exp => ({
        ...exp,
        value: parseFloat(exp.value) || 0,
        exchange_rate: parseFloat(exp.exchange_rate) || 1200
      }))
    };

    // Procesar campos numéricos del costo
    if (processedData.cost_value !== '' && processedData.cost_value !== undefined) {
      processedData.cost_value = parseFloat(processedData.cost_value) || 0;
    }
    if (processedData.cost_exchange_rate !== '' && processedData.cost_exchange_rate !== undefined) {
      processedData.cost_exchange_rate = parseFloat(processedData.cost_exchange_rate) || 1200;
    }
    // Procesar fecha
    if (processedData.cost_date !== '' && processedData.cost_date !== undefined) {
      processedData.cost_date = processedData.cost_date;
    }

    try {
      await onSubmit(processedData);
      onOpenChange(false);
      toast.success("Costo y gastos actualizados correctamente");
    } catch (error) {
      toast.error("Error al actualizar costo: " + error.message);
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
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${showExpenseModal ? 'pointer-events-none' : ''}`} style={{ zIndex: 1000 }}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">Editar Costo Total</DialogTitle>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Costo Principal */}
          <div className="p-4 bg-gray-100 rounded">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700">VALOR DE TOMA</h3>
            </div>

            <div className="space-y-3">
              {/* Fila principal */}
              <div className="grid grid-cols-6 gap-3">
                <div>
                  <Label className="text-[11px] text-gray-600">Moneda</Label>
                  <Select value={formData.cost_currency} onValueChange={(v) => handleChange('cost_currency', v)}>
                    <SelectTrigger className="h-9 text-[12px] bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS" className="text-[12px]">ARS</SelectItem>
                      <SelectItem value="USD" className="text-[12px]">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-gray-600">Fecha</Label>
                  <Input
                    className="h-9 text-[12px] bg-white"
                    type="date"
                    value={formData.cost_date}
                    onChange={(e) => handleChange('cost_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-600">Cotización USD al momento</Label>
                  <div className="flex gap-1">
                    <Input
                      className="h-9 text-[12px] bg-white flex-1"
                      type="text"
                      inputMode="decimal"
                      value={formData.cost_exchange_rate}
                      onChange={(e) => handleChange('cost_exchange_rate', e.target.value)}
                      placeholder={currentBlueRate.toString()}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-gray-600">
                    Valor de toma ({formData.cost_currency})
                  </Label>
                  <Input
                    className="h-9 text-[13px] font-semibold bg-white"
                    type="text"
                    inputMode="decimal"
                    value={formData.cost_value}
                    onChange={(e) => handleChange('cost_value', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-600">
                    Conversión actual
                  </Label>
                  <div className="h-9 bg-blue-50 rounded px-3 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-blue-700">
                      {formData.cost_value ?
                        `${formData.cost_currency === 'ARS' ? 'U$D' : '$'} ${calculateConversion(parseFloat(formData.cost_value), formData.cost_currency, parseFloat(formData.cost_exchange_rate) || currentBlueRate)?.toLocaleString(formData.cost_currency === 'ARS' ? 'en-US' : 'es-AR', { maximumFractionDigits: 0 })}`
                        : '-'
                      }
                    </span>
                    <span className="text-[9px] text-blue-600">
                      {formData.cost_date ? `Cotización ${formData.cost_date}` : 'BLUE actual'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Gastos</h3>
              <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={handleAddExpense}>
                + Agregar
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Mostrar valor de toma primero */}
              {(() => {
                const valorTomaArs = convertValue(parseFloat(formData.cost_value) || 0, formData.cost_currency, currentBlueRate, 'ARS');
                const valorTomaUsd = formData.cost_currency === 'USD' ? parseFloat(formData.cost_value) || 0 : valorTomaArs / currentBlueRate;
                return (
                  <div className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <span className="text-[12px] text-gray-600">Valor de toma</span>
                    <div className="text-right">
                      <span className="font-bold text-[13px] text-gray-900 block">
                        ${valorTomaArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] font-semibold text-cyan-500">
                        U$D {valorTomaUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Lista de gastos */}
              {expenses.map((exp, i) => {
                const expArs = convertValue(exp.value, exp.currency, exp.exchange_rate, 'ARS');
                const expUsd = exp.currency === 'USD' ? exp.value : (exp.exchange_rate ? exp.value / exp.exchange_rate : exp.value / currentBlueRate);
                return (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded group hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 text-[11px]">{exp.type}</span>
                      {exp.description && <span className="text-gray-400 text-[10px]">{exp.description}</span>}
                    </div>
                    <div className="flex items-center">
                      <div className="text-right">
                        <span className="font-semibold text-[12px] block">
                          ${expArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[10px] font-semibold text-cyan-500">
                          U$D {expUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleEditExpense(i); }}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteExpense(i)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total de gastos */}
              {expenses.length > 0 && (() => {
                const totalGastosArs = expenses.reduce((sum, exp) => sum + convertValue(exp.value, exp.currency, exp.exchange_rate, 'ARS'), 0);
                const totalGastosUsd = expenses.reduce((sum, exp) => {
                  const expArs = convertValue(exp.value, exp.currency, exp.exchange_rate, 'ARS');
                  return sum + (expArs / currentBlueRate);
                }, 0);
                return (
                  <div className="flex justify-between items-center font-bold pt-3 mt-2 border-t">
                    <span className="text-gray-800 text-[13px]">Total gastos</span>
                    <div className="text-right">
                      <span className="text-[14px] block">${totalGastosArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                      <span className="text-[10px] font-semibold text-cyan-500">U$D {totalGastosUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
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

        {/* Modal de edición de gastos */}
        <div onClick={(e) => e.stopPropagation()}>
          <ExpenseEditDialog
            open={showExpenseModal}
            onOpenChange={(open) => {
              setShowExpenseModal(open);
              if (!open) {
                setEditingExpense(null);
                setEditingExpenseIndex(-1);
              }
            }}
            expense={editingExpense}
            index={editingExpenseIndex}
            onSave={handleSaveExpense}
            onDelete={handleDeleteExpense}
            currentBlueRate={currentBlueRate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
