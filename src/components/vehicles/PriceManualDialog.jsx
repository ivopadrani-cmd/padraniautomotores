import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, HelpCircle } from "lucide-react";

export default function PriceManualDialog({ open, onOpenChange }) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Sistema de Precios</DialogTitle>
                <p className="text-blue-100 text-sm">Guía completa para entender el funcionamiento</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Sección de Costos */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-2">💰 COSTOS DEL VEHÍCULO</h2>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 text-white p-2 rounded-lg text-lg">💰</div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-800 text-base mb-2">VALOR DE TOMA (Costo Principal)</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Qué es:</strong> Lo que realmente pagaste por comprar el vehículo</p>
                    <p><strong>Moneda:</strong> Puede estar en pesos o dólares según cómo pagaste</p>
                    <p><strong>Cotización histórica:</strong> La cotización BLUE exacta del día de la compra</p>
                    <p><strong>Fecha:</strong> Día en que realizaste la transacción</p>
                    <p className="text-blue-600 font-medium mt-2">📊 <strong>Importante:</strong> Se mantiene fijo para siempre comparar ganancias reales</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-slate-500 text-white p-2 rounded-lg text-lg">🔧</div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-base mb-2">GASTOS ADICIONALES</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Qué son:</strong> Costos extras como gestoría, taller, pintura, verificaciones, etc.</p>
                    <p><strong>Cómo funcionan:</strong> Similar al costo principal, pero siempre se cargan con la cotización actual del día</p>
                    <p><strong>Fecha:</strong> Día en que se realizó cada gasto específico</p>
                    <p className="text-slate-600 font-medium mt-2">📈 <strong>Diferencia clave:</strong> Los gastos nuevos usan la cotización de HOY, no la del día de compra</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Precios */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-2">🏷️ PRECIOS DE VENTA</h2>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 text-white p-2 rounded-lg text-lg">📊</div>
                <div className="flex-1">
                  <h3 className="font-bold text-orange-800 text-base mb-2">PRECIO INFOAUTO</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Qué es:</strong> Precio de referencia que publica InfoAuto (como una revista)</p>
                    <p><strong>Moneda:</strong> Siempre en pesos argentinos</p>
                    <p><strong>Cotización histórica:</strong> Cotización del día en que InfoAuto actualizó sus precios</p>
                    <p><strong>Fecha:</strong> Día de la última actualización de InfoAuto</p>
                    <p className="text-orange-600 font-medium mt-2">🎯 <strong>Propósito:</strong> Saber cuánto vale el vehículo según el mercado, tanto en pesos como en dólares históricos</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-500 text-white p-2 rounded-lg text-lg">🎯</div>
                <div className="flex-1">
                  <h3 className="font-bold text-cyan-800 text-base mb-2">PRECIO OBJETIVO</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Qué es:</strong> Tu meta mínima de ganancia por vehículo</p>
                    <p><strong>Moneda:</strong> Siempre en dólares (para que no se devalúe)</p>
                    <p><strong>Conversión automática:</strong> Se calcula automáticamente en pesos según cotización actual</p>
                    <p className="text-cyan-600 font-medium mt-2">💡 <strong>Control:</strong> Te dice cuánto deberías cobrar MÍNIMO en pesos para no perder dinero real</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-green-500 text-white p-2 rounded-lg text-lg">🏷️</div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-800 text-base mb-2">PRECIO PÚBLICO</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Qué es:</strong> El precio que realmente le cobras al cliente</p>
                    <p><strong>Moneda:</strong> Puede estar en pesos o dólares según acuerdes</p>
                    <p><strong>Ajuste inteligente:</strong> Si pactas en pesos, mantiene estabilidad. Si pactas en dólares, se ajusta automáticamente</p>
                    <p className="text-green-600 font-medium mt-2">⚖️ <strong>Estrategia:</strong> Permite ceder temporalmente en pesos sin perder el control del valor real en dólares</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de funcionamiento */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200 shadow-sm">
            <h3 className="font-bold text-purple-800 text-base mb-3 flex items-center gap-2">
              <span className="text-lg">📈</span>
              CÓMO FUNCIONA EN DEVALUACIÓN
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-white/60 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">💰 COSTO DE COMPRA</h4>
                <p className="text-gray-700 text-xs">
                  Se mantiene exactamente como lo cargaste. No cambia nunca. Es tu referencia fija para calcular ganancias.
                </p>
              </div>
              <div className="bg-white/60 p-3 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">📊 INFOAUTO</h4>
                <p className="text-gray-700 text-xs">
                  Fijo en pesos y en dólares históricos. No se actualiza automáticamente con la devaluación.
                </p>
              </div>
              <div className="bg-white/60 p-3 rounded-lg">
                <h4 className="font-semibold text-cyan-800 mb-2">🎯 PRECIO OBJETIVO</h4>
                <p className="text-gray-700 text-xs">
                  Fijo en dólares, se convierte automáticamente a pesos según cotización actual.
                </p>
              </div>
              <div className="bg-white/60 p-3 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">🏷️ PRECIO PÚBLICO</h4>
                <p className="text-gray-700 text-xs">
                  Si pactas en pesos: mantiene estabilidad. Si pactas en dólares: se ajusta automáticamente.
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-purple-100 rounded-lg">
              <p className="text-purple-800 text-xs font-medium">
                🎯 <strong>El sistema te permite:</strong> Ajustar precios en pesos sin perder el control del valor real en dólares, adaptándote al mercado sin desfasarte.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200 shadow-sm">
            <h3 className="font-bold text-yellow-800 text-base mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span>
              RECOMENDACIONES PARA USAR EL SISTEMA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">📅</span>
                  <span className="text-gray-700 text-xs">Registra siempre la fecha real de las transacciones</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">⚖️</span>
                  <span className="text-gray-700 text-xs">Compara precio objetivo con precio público para controlar márgenes</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">🔄</span>
                  <span className="text-gray-700 text-xs">Los gastos nuevos usan la cotización actual del día</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">🎯</span>
                  <span className="text-gray-700 text-xs">El precio objetivo te protege de vender por debajo del costo real</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 pt-6 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="text-xs text-gray-500 mr-auto">
            💡 Sistema diseñado para el contexto económico argentino
          </div>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            Entendido ✨
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
