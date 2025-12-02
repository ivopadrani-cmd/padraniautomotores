import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, HelpCircle } from "lucide-react";

export default function PriceManualDialog({ open, onOpenChange }) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <DialogTitle className="text-lg font-semibold">Sistema de Precios - Guía Rápida</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-800 mb-2">💰 VALOR DE TOMA (Costo)</h3>
            <p className="text-blue-700">
              <strong>Qué es:</strong> Lo que realmente pagaste por el vehículo.<br />
              <strong>Moneda:</strong> Puede ser en pesos o dólares.<br />
              <strong>Cotización:</strong> La cotización BLUE del momento exacto de la compra.<br />
              <strong>Fecha:</strong> Día en que realizaste la transacción.<br />
              <strong>Por qué importa:</strong> Mantiene el costo real histórico para calcular ganancias.
            </p>
          </div>

          <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
            <h3 className="font-semibold text-orange-800 mb-2">📊 PRECIO INFOAUTO</h3>
            <p className="text-orange-700">
              <strong>Qué es:</strong> Precio de referencia del mercado.<br />
              <strong>Moneda:</strong> Siempre en pesos (ARS).<br />
              <strong>Cotización histórica:</strong> Cotización del día que actualizaste el precio.<br />
              <strong>Fecha:</strong> Día de la última actualización.<br />
              <strong>Por qué importa:</strong> Muestra cuánto valía realmente en dólares en ese momento.
            </p>
          </div>

          <div className="bg-cyan-50 p-3 rounded border-l-4 border-cyan-400">
            <h3 className="font-semibold text-cyan-800 mb-2">🎯 PRECIO OBJETIVO</h3>
            <p className="text-cyan-700">
              <strong>Qué es:</strong> Tu meta de ganancia mínima.<br />
              <strong>Moneda:</strong> Siempre en dólares (USD).<br />
              <strong>Conversión automática:</strong> Se calcula en pesos según cotización actual.<br />
              <strong>Por qué importa:</strong> Te dice cuánto deberías cobrar en pesos para mantener el margen deseado.
            </p>
          </div>

          <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
            <h3 className="font-semibold text-green-800 mb-2">🏷️ PRECIO PÚBLICO</h3>
            <p className="text-green-700">
              <strong>Qué es:</strong> Precio de venta al cliente.<br />
              <strong>Moneda:</strong> Puede ser en pesos o dólares.<br />
              <strong>Conversión automática:</strong> Siempre se actualiza según cotización actual.<br />
              <strong>Por qué importa:</strong> Controla márgenes reales durante la devaluación.
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
            <h3 className="font-semibold text-gray-800 mb-2">🔄 GASTOS ADICIONALES</h3>
            <p className="text-gray-700">
              <strong>Qué son:</strong> Costos extras (gestoría, taller, etc.).<br />
              <strong>Cotización automática:</strong> Siempre usa la cotización actual del día.<br />
              <strong>Fecha:</strong> Día en que se realizó cada gasto.<br />
              <strong>Por qué importa:</strong> Se suman al costo total para cálculos precisos.
            </p>
          </div>

          <div className="bg-purple-50 p-3 rounded border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-2">📈 CÓMO FUNCIONA EN DEVALUACIÓN</h3>
            <ul className="text-purple-700 text-xs space-y-1">
              <li>• <strong>Costo de compra:</strong> Queda fijo en pesos, pero baja en dólares</li>
              <li>• <strong>Precio objetivo:</strong> Fijo en dólares, sube en pesos</li>
              <li>• <strong>Precio público:</strong> Se ajusta en pesos para mantener márgenes</li>
              <li>• <strong>InfoAuto:</strong> Fijo en pesos, pero su valor en dólares cambia con la historia</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 TIPS PARA USAR EL SISTEMA</h3>
            <ul className="text-yellow-700 text-xs space-y-1">
              <li>• Siempre registra la fecha real de las transacciones</li>
              <li>• Compara precio objetivo con precio público para controlar márgenes</li>
              <li>• Los gastos nuevos usan automáticamente la cotización actual</li>
              <li>• El sistema está preparado para futuras APIs de cotizaciones históricas</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
