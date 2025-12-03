import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, HelpCircle } from "lucide-react";

export default function PriceManualDialog({ open, onOpenChange }) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl" style={{ zIndex: 1100 }}>
        <DialogHeader className="bg-cyan-600 text-white p-6 rounded-t-lg border-b border-cyan-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-full border border-white/20">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Sistema de Precios</DialogTitle>
                <p className="text-cyan-100 text-sm">Guía completa para entender el funcionamiento</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Sección de Costos */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b-2 border-cyan-200 pb-2">COSTOS DEL VEHÍCULO</h2>

            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-600 text-white p-2 rounded-md text-sm font-bold">C</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-cyan-800 text-base mb-2">VALOR DE TOMA (Costo Principal)</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Qué es:</strong> Lo que realmente pagaste por comprar el vehículo</p>
                    <p><strong>Moneda:</strong> Puede estar en pesos o dólares según cómo pagaste</p>
                    <p><strong>Cotización histórica:</strong> La cotización BLUE exacta del día de la compra</p>
                    <p><strong>Fecha:</strong> Día en que realizaste la transacción</p>
                    <p className="text-red-600 font-medium mt-2"><strong>Importante:</strong> Se mantiene fijo para siempre comparar ganancias reales</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-600 text-white p-2 rounded-md text-sm font-bold">+</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-cyan-800 text-base mb-2">GASTOS ADICIONALES</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Qué son:</strong> Costos extras como gestoría, taller, pintura, verificaciones, etc.</p>
                    <p><strong>Cómo funcionan:</strong> Similar al costo principal, pero siempre se cargan con la cotización actual del día</p>
                    <p><strong>Fecha:</strong> Día en que se realizó cada gasto específico</p>
                    <p className="text-red-600 font-medium mt-2"><strong>Diferencia clave:</strong> Los gastos nuevos usan la cotización de HOY, no la del día de compra</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Precios */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b-2 border-cyan-200 pb-2">PRECIOS DE VENTA</h2>

            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-600 text-white p-2 rounded-md text-sm font-bold">I</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-cyan-800 text-base mb-2">PRECIO INFOAUTO</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Qué es:</strong> Precio de referencia que publica InfoAuto (como una revista)</p>
                    <p><strong>Moneda:</strong> Siempre en pesos argentinos</p>
                    <p><strong>Cotización histórica:</strong> Cotización del día en que InfoAuto actualizó sus precios</p>
                    <p><strong>Fecha:</strong> Día de la última actualización de InfoAuto</p>
                    <p className="text-red-600 font-medium mt-2"><strong>Propósito:</strong> Saber cuánto vale el vehículo según el mercado, tanto en pesos como en dólares históricos</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-600 text-white p-2 rounded-md text-sm font-bold">O</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-cyan-800 text-base mb-2">PRECIO OBJETIVO</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Qué es:</strong> Tu meta mínima de ganancia por vehículo</p>
                    <p><strong>Moneda:</strong> Siempre en dólares (para que no se devalúe)</p>
                    <p><strong>Conversión automática:</strong> Se calcula automáticamente en pesos según cotización actual</p>
                    <p className="text-red-600 font-medium mt-2"><strong>Control:</strong> Te dice cuánto deberías cobrar MÍNIMO en pesos para no perder dinero real</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-600 text-white p-2 rounded-md text-sm font-bold">P</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-cyan-800 text-base mb-2">PRECIO PÚBLICO</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Qué es:</strong> El precio que realmente le cobras al cliente</p>
                    <p><strong>Moneda:</strong> Puede estar en pesos o dólares según acuerdes</p>
                    <p><strong>Ajuste inteligente:</strong> Si pactas en pesos, mantiene estabilidad. Si pactas en dólares, se ajusta automáticamente</p>
                    <p className="text-red-600 font-medium mt-2"><strong>Estrategia:</strong> Permite ceder temporalmente en pesos sin perder el control del valor real en dólares</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de funcionamiento */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 text-base mb-3 flex items-center gap-2">
              <span className="text-cyan-600 text-sm">■</span>
              COMPORTAMIENTO EN DEVALUACIÓN
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="font-medium text-cyan-800 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-600 rounded-full"></span>
                  COSTO DE COMPRA
                </h4>
                <p className="text-gray-700 text-xs">
                  Se mantiene exactamente como lo cargaste. Referencia fija para calcular ganancias.
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="font-medium text-cyan-800 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-600 rounded-full"></span>
                  INFOAUTO
                </h4>
                <p className="text-gray-700 text-xs">
                  Fijo en pesos y dólares históricos. No se actualiza con la devaluación.
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="font-medium text-cyan-800 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-600 rounded-full"></span>
                  PRECIO OBJETIVO
                </h4>
                <p className="text-gray-700 text-xs">
                  Fijo en dólares, conversión automática a pesos según cotización actual.
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="font-medium text-cyan-800 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-600 rounded-full"></span>
                  PRECIO PÚBLICO
                </h4>
                <p className="text-gray-700 text-xs">
                  Pactado en pesos: mantiene estabilidad. Pactado en dólares: ajuste automático.
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-cyan-50 rounded border border-cyan-200">
              <p className="text-red-600 text-xs font-medium">
                <strong>Sistema diseñado para:</strong> Controlar márgenes reales en contexto de devaluación, permitiendo flexibilidad en pesos sin perder referencia del valor en dólares.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 text-base mb-3 flex items-center gap-2">
              <span className="text-cyan-600 text-sm">■</span>
              RECOMENDACIONES DE USO
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span className="text-gray-700 text-xs">Registra siempre la fecha real de las transacciones</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span className="text-gray-700 text-xs">Compara precio objetivo con precio público para controlar márgenes</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span className="text-gray-700 text-xs">Los gastos nuevos usan la cotización actual del día</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span className="text-gray-700 text-xs">El precio objetivo te protege de vender por debajo del costo real</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 pt-6 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="text-xs text-gray-500 mr-auto">
            Sistema diseñado para el contexto económico argentino
          </div>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded font-medium transition-colors"
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
