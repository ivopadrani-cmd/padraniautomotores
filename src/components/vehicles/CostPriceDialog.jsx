import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ExpenseRow = ({ expense, index, onChange, onDelete }) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
      <Select
        value={expense.type || 'GESTORIA'}
        onValueChange={(value) => onChange(index, 'type', value)}
        className="w-24"
      >
        <SelectTrigger className="h-8 text-[11px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="GESTORIA" className="text-[11px]">GESTORIA</SelectItem>
          <SelectItem value="TALLER" className="text-[11px]">TALLER</SelectItem>
          <SelectItem value="CHAPISTA" className="text-[11px]">CHAPISTA</SelectItem>
          <SelectItem value="LIMPIEZA" className="text-[11px]">LIMPIEZA</SelectItem>
          <SelectItem value="VERIFICACION" className="text-[11px]">VERIFICACION</SelectItem>
          <SelectItem value="MECANICA" className="text-[11px]">MECANICA</SelectItem>
          <SelectItem value="OTRO" className="text-[11px]">OTRO</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="Descripción"
        value={expense.description || ''}
        onChange={(e) => onChange(index, 'description', e.target.value)}
        className="h-8 text-[11px] flex-1"
      />

      <Select
        value={expense.currency || 'ARS'}
        onValueChange={(value) => onChange(index, 'currency', value)}
        className="w-16"
      >
        <SelectTrigger className="h-8 text-[11px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ARS" className="text-[11px]">ARS</SelectItem>
          <SelectItem value="USD" className="text-[11px]">USD</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="number"
        step="0.01"
        placeholder="Valor"
        value={expense.value || ''}
        onChange={(e) => onChange(index, 'value', e.target.value)}
        className="h-8 text-[11px] w-20"
      />

      <Input
        placeholder="Cotización"
        value={expense.exchange_rate || ''}
        onChange={(e) => onChange(index, 'exchange_rate', e.target.value)}
        className="h-8 text-[11px] w-20"
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:bg-red-50"
        onClick={() => onDelete(index)}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default function CostPriceDialog({ open, onOpenChange, vehicle, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    cost_value: '',
    cost_currency: 'ARS',
    cost_exchange_rate: ''
  });
  const [expenses, setExpenses] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open && vehicle) {
      setFormData({
        cost_value: vehicle.cost_value || '',
        cost_currency: vehicle.cost_currency || 'ARS',
        cost_exchange_rate: vehicle.cost_exchange_rate || ''
      });
      setExpenses(vehicle.expenses || []);
      setHasChanges(false);
    }
  }, [open, vehicle]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleExpenseChange = (index, field, value) => {
    const newExpenses = [...expenses];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    setExpenses(newExpenses);
    setHasChanges(true);
  };

  const handleAddExpense = () => {
    const newExpense = {
      type: 'GESTORIA',
      description: '',
      currency: 'ARS',
      value: '',
      exchange_rate: '1200',
      date: new Date().toISOString().split('T')[0]
    };
    setExpenses([...expenses, newExpense]);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Editar Costo Total</DialogTitle>
          <p className="text-sm text-gray-500">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Costo Principal */}
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">VALOR DE TOMA</h3>
            <div className="grid grid-cols-3 gap-3">
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
                <Label className="text-[11px] text-gray-600">Cotización USD</Label>
                <Input
                  className="h-9 text-[12px] bg-white"
                  type="text"
                  inputMode="decimal"
                  value={formData.cost_exchange_rate}
                  onChange={(e) => handleChange('cost_exchange_rate', e.target.value)}
                  placeholder="1200"
                />
              </div>
              <div>
                <Label className="text-[11px] text-gray-600">Valor</Label>
                <Input
                  className="h-9 text-[13px] font-semibold bg-white"
                  type="text"
                  inputMode="decimal"
                  value={formData.cost_value}
                  onChange={(e) => handleChange('cost_value', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">GASTOS ({expenses.length})</h3>
              <Button type="button" variant="outline" size="sm" className="h-8 text-[11px]" onClick={handleAddExpense}>
                <Plus className="w-3 h-3 mr-1" />Agregar Gasto
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {expenses.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No hay gastos registrados
                </div>
              ) : (
                expenses.map((expense, index) => (
                  <ExpenseRow
                    key={index}
                    expense={expense}
                    index={index}
                    onChange={handleExpenseChange}
                    onDelete={handleDeleteExpense}
                  />
                ))
              )}
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
      </DialogContent>
    </Dialog>
  );
}
