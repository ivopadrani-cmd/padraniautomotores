import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";

export default function MultiQuotePrintView({ open, onOpenChange, quotes, client, tradeIn }) {
  if (!quotes || quotes.length === 0) return null;

  const tradeInValue = tradeIn?.value_ars ? parseFloat(tradeIn.value_ars) : 0;
  const today = format(new Date(), 'dd/MM/yyyy');
  const hasAnyDiscount = tradeInValue > 0 || quotes.some(q => q.financing_amount > 0);
  const balanceLabel = hasAnyDiscount ? 'Saldo a abonar' : 'Total de contado';

  const handlePrint = () => {
    const vehicleRows = quotes.map(q => {
      const price = q.quoted_price_ars || 0;
      const financing = q.financing_amount || 0;
      const diff = price - tradeInValue - financing;
      return `
        <div class="vehicle-row">
          <div class="vehicle-name">${q.vehicle_description || 'Vehículo'}</div>
          <div class="vehicle-breakdown">
            <div class="breakdown-line"><span>Precio:</span><span class="value">$${price.toLocaleString('es-AR')}</span></div>
            ${tradeInValue > 0 ? `<div class="breakdown-line"><span>Permuta:</span><span class="value discount">- $${tradeInValue.toLocaleString('es-AR')}</span></div>` : ''}
            ${financing > 0 ? `<div class="breakdown-line"><span>Financiación:</span><span class="value discount">- $${financing.toLocaleString('es-AR')}</span></div>` : ''}
          </div>
          <div class="vehicle-total">
            <span class="total-label">${hasAnyDiscount ? 'Saldo' : 'Total'}:</span>
            <span class="total-value">$${diff.toLocaleString('es-AR')}</span>
          </div>
        </div>
      `;
    }).join('');

    const tradeInSection = tradeInValue > 0 ? `
      <div class="trade-in">
        <div class="trade-in-header">VEHÍCULO EN PARTE DE PAGO</div>
        <div class="trade-in-content">
          <div class="trade-in-vehicle">${tradeIn.brand || ''} ${tradeIn.model || ''} ${tradeIn.year || ''}</div>
          <div class="trade-in-details">
            ${tradeIn.plate ? `<span>Dom: ${tradeIn.plate}</span>` : ''}
            ${tradeIn.kilometers ? `<span>${tradeIn.kilometers} km</span>` : ''}
          </div>
          <div class="trade-in-value">Valor: $${tradeInValue.toLocaleString('es-AR')}</div>
        </div>
      </div>
    ` : '';

    const html = `<!DOCTYPE html><html><head><title>Presupuesto Comparativo</title>
    <style>
      @page { size: A4; margin: 18mm 15mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 10px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 16px; }
      .logo { font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #1e3a5f; }
      .logo-sub { font-size: 9px; color: #666; font-weight: normal; letter-spacing: 1px; }
      .header-right { text-align: right; }
      .doc-type { font-size: 10px; color: #1e3a5f; font-weight: bold; letter-spacing: 1px; }
      .doc-date { font-size: 11px; font-weight: bold; margin-top: 3px; }
      .section { margin-bottom: 14px; }
      .section-title { font-size: 8px; text-transform: uppercase; color: #1e3a5f; font-weight: bold; letter-spacing: 1px; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
      .client-info { background: #f5f7fa; padding: 10px 12px; border-left: 3px solid #1e3a5f; }
      .client-name { font-weight: bold; font-size: 13px; }
      .client-phone { color: #666; font-size: 10px; margin-top: 2px; }
      .trade-in { background: #fffbeb; border: 1px solid #d4a853; padding: 12px; margin-bottom: 14px; }
      .trade-in-header { font-size: 8px; text-transform: uppercase; color: #92400e; font-weight: bold; letter-spacing: 1px; margin-bottom: 6px; }
      .trade-in-content { display: flex; justify-content: space-between; align-items: center; }
      .trade-in-vehicle { font-weight: bold; font-size: 12px; color: #92400e; }
      .trade-in-details { font-size: 9px; color: #666; display: flex; gap: 12px; }
      .trade-in-value { font-weight: bold; font-size: 12px; color: #1e3a5f; }
      .vehicles-grid { display: grid; grid-template-columns: repeat(${quotes.length <= 2 ? quotes.length : 2}, 1fr); gap: 10px; }
      .vehicle-row { background: #fff; border: 1px solid #1e3a5f; padding: 12px; }
      .vehicle-name { font-weight: bold; font-size: 12px; color: #1e3a5f; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px; }
      .vehicle-breakdown { padding: 4px 0; }
      .breakdown-line { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10px; color: #555; }
      .breakdown-line .value { font-weight: 600; color: #222; }
      .breakdown-line .discount { color: #1e3a5f; }
      .vehicle-total { background: #1e3a5f; color: white; padding: 10px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center; }
      .total-label { font-size: 9px; opacity: 0.8; }
      .total-value { font-size: 16px; font-weight: bold; }
      .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #ddd; text-align: center; font-size: 9px; color: #888; }
    </style></head>
    <body>
      <div class="header">
        <div><div class="logo">PADRANI</div><div class="logo-sub">AUTOMOTORES</div></div>
        <div class="header-right">
          <div class="doc-type">PRESUPUESTO COMPARATIVO</div>
          <div class="doc-date">${today}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Cliente</div>
        <div class="client-info">
          <div class="client-name">${client?.full_name || quotes[0]?.client_name || '-'}</div>
          <div class="client-phone">${client?.phone || quotes[0]?.client_phone || ''}</div>
        </div>
      </div>
      ${tradeInSection}
      <div class="section">
        <div class="section-title">Opciones Disponibles</div>
        <div class="vehicles-grid">${vehicleRows}</div>
      </div>
      <div class="footer">Presupuesto válido por 48hs • Precios sujetos a cambios sin previo aviso<br/>Padrani Automotores • Comodoro Rivadavia</div>
    </body></html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold">Presupuesto Comparativo</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          {/* Client */}
          <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-cyan-500">
            <p className="text-[9px] text-gray-500 uppercase mb-1">Cliente</p>
            <p className="font-bold text-[13px]">{client?.full_name || quotes[0]?.client_name}</p>
            <p className="text-[10px] text-gray-500">{client?.phone || quotes[0]?.client_phone}</p>
          </div>

          {/* Trade In */}
          {tradeInValue > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-[9px] text-gray-500 uppercase mb-1">Permuta</p>
              <div className="flex justify-between items-center">
                <p className="text-[11px]">{tradeIn.brand} {tradeIn.model} {tradeIn.year}</p>
                <p className="font-bold text-cyan-600">${tradeInValue.toLocaleString('es-AR')}</p>
              </div>
            </div>
          )}

          {/* Vehicles breakdown */}
          <div className="space-y-2">
            <p className="text-[9px] text-gray-500 uppercase">Opciones Disponibles</p>
            {quotes.map((q, i) => {
              const price = q.quoted_price_ars || 0;
              const financing = q.financing_amount || 0;
              const diff = price - tradeInValue - financing;
              const hasDiscount = tradeInValue > 0 || financing > 0;
              return (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-bold text-[12px] mb-2 pb-2 border-b">{q.vehicle_description}</p>
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex gap-3"><span className="text-gray-500">Precio:</span><span>${price.toLocaleString('es-AR')}</span></div>
                      {tradeInValue > 0 && <div className="flex gap-3"><span className="text-gray-500">Permuta:</span><span className="text-blue-500">-${tradeInValue.toLocaleString('es-AR')}</span></div>}
                      {financing > 0 && <div className="flex gap-3"><span className="text-gray-500">Financiación:</span><span className="text-blue-500">-${financing.toLocaleString('es-AR')}</span></div>}
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400">{hasDiscount ? 'Saldo a abonar' : 'Total de contado'}</p>
                      <p className="text-lg font-bold">${diff.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button onClick={handlePrint} className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Imprimir Comparativo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}