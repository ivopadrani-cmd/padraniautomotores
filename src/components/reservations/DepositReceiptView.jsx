import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const numberToWords = (num) => {
  if (!num || num === 0) return 'cero';
  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  if (num === 100) return 'cien';
  let result = '';
  if (num >= 1000000) { const m = Math.floor(num / 1000000); result += m === 1 ? 'un millón ' : numberToWords(m) + ' millones '; num %= 1000000; }
  if (num >= 1000) { const t = Math.floor(num / 1000); result += t === 1 ? 'mil ' : numberToWords(t) + ' mil '; num %= 1000; }
  if (num >= 100) { result += hundreds[Math.floor(num / 100)] + ' '; num %= 100; }
  if (num >= 20) { const t = Math.floor(num / 10); const u = num % 10; result += u === 0 ? tens[t] : tens[t] + ' y ' + units[u]; }
  else if (num >= 10) result += teens[num - 10];
  else if (num > 0) result += units[num];
  return result.trim();
};

const formatCurrency = (amount, currency = 'ARS') => {
  if (!amount) return '-';
  return currency === 'USD' ? `U$D ${amount.toLocaleString('en-US')}` : `$${amount.toLocaleString('es-AR')}`;
};

export default function DepositReceiptView({ open, onOpenChange, reservation, vehicle, client }) {
  const printRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Recibo de Seña</title>
      <style>
        @page { size: A4 portrait; margin: 15mm 18mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 9pt; line-height: 1.4; color: #111; }
      </style>
    </head><body>${printRef.current.innerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  if (!reservation || !vehicle) return null;

  const depositAmount = reservation.deposit_amount || 0;
  const depositCurrency = reservation.deposit_currency || 'ARS';
  const depositDate = reservation.deposit_date ? new Date(reservation.deposit_date) : new Date();
  const agreedPrice = reservation.agreed_price || 0;
  const tradeIn = reservation.trade_in;
  const tradeInValue = tradeIn?.value ? parseFloat(tradeIn.value) : 0;
  const financingAmount = reservation.financing_amount || 0;
  const balance = agreedPrice - depositAmount - tradeInValue - financingAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-3 border-b flex flex-row items-center justify-between sticky top-0 bg-white z-10">
          <DialogTitle className="text-[13px] font-semibold">Recibo de Seña</DialogTitle>
          <div className="flex gap-2 items-center">
            <Button onClick={handlePrint} className="h-7 text-[10px] bg-gray-900 hover:bg-gray-800"><Printer className="w-3 h-3 mr-1" />Imprimir</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
          </div>
        </DialogHeader>

        <div ref={printRef} className="p-5" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '9pt', lineHeight: 1.4, maxWidth: '210mm', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '15px', paddingBottom: '8px', borderBottom: '2px solid #0891b2' }}>
            <h1 style={{ fontSize: '14pt', fontWeight: 600, letterSpacing: '3px', marginBottom: '2px' }}>RECIBO DE SEÑA</h1>
            <p style={{ fontSize: '8pt', color: '#0891b2', fontWeight: 500 }}>Reserva de Vehículo</p>
          </div>

          {/* Date */}
          <div style={{ textAlign: 'right', marginBottom: '15px' }}>
            <p style={{ fontSize: '9pt' }}>Comodoro Rivadavia, {format(depositDate, "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
          </div>

          {/* Main text */}
          <div style={{ marginBottom: '15px', fontSize: '9pt', textAlign: 'justify', lineHeight: 1.5 }}>
            <p><strong>PADRANI AUTOMOTORES</strong>, CUIT 20-12320784-0, con domicilio en calle Namuncurá 283, declara haber recibido de parte del Sr/Sra <strong>{client?.full_name || reservation.client_name}</strong>{client?.dni ? `, DNI Nº ${client.dni}` : ''}, la suma de <strong>{formatCurrency(depositAmount, depositCurrency)}</strong> (<span style={{ textTransform: 'uppercase' }}>{depositCurrency === 'USD' ? `dólares estadounidenses ${numberToWords(Math.floor(depositAmount))}` : `pesos ${numberToWords(Math.floor(depositAmount))}`}</span>) en concepto de seña para la reserva del siguiente vehículo:</p>
          </div>

          {/* Vehicle Box */}
          <div style={{ border: '1px solid #0891b2', padding: '10px', background: '#f8fafc', marginBottom: '12px' }}>
            <p style={{ fontSize: '7pt', color: '#0891b2', textTransform: 'uppercase', fontWeight: 600, marginBottom: '5px', letterSpacing: '1px' }}>VEHÍCULO RESERVADO</p>
            <p style={{ fontSize: '11pt', fontWeight: 600, marginBottom: '6px', color: '#0891b2' }}>{vehicle.brand} {vehicle.model} {vehicle.year}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '8pt' }}>
              <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>DOMINIO</p><p style={{ fontWeight: 500 }}>{vehicle.plate || '-'}</p></div>
              <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>COLOR</p><p style={{ fontWeight: 500 }}>{vehicle.color || '-'}</p></div>
              <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>KM</p><p style={{ fontWeight: 500 }}>{vehicle.kilometers?.toLocaleString('es-AR') || '-'}</p></div>
              <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>PRECIO ACORDADO</p><p style={{ fontWeight: 600, color: '#0891b2' }}>${agreedPrice.toLocaleString('es-AR')}</p></div>
              <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>MARCA MOTOR</p><p style={{ fontWeight: 500 }}>{vehicle.engine_brand || vehicle.brand || '-'}</p></div>
              <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>N° MOTOR</p><p style={{ fontWeight: 500 }}>{vehicle.engine_number || '-'}</p></div>
              <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>MARCA CHASIS</p><p style={{ fontWeight: 500 }}>{vehicle.chassis_brand || vehicle.brand || '-'}</p></div>
              <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>N° CHASIS</p><p style={{ fontWeight: 500 }}>{vehicle.chassis_number || '-'}</p></div>
            </div>
          </div>

          {/* Trade-in if exists */}
          {tradeInValue > 0 && tradeIn && (
            <div style={{ border: '1px solid #0891b2', padding: '10px', background: '#f0f9ff', marginBottom: '12px' }}>
              <p style={{ fontSize: '7pt', color: '#0e7490', textTransform: 'uppercase', fontWeight: 600, marginBottom: '5px', letterSpacing: '1px' }}>VEHÍCULO EN PARTE DE PAGO</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '10pt', fontWeight: 600, color: '#0e7490' }}>{tradeIn.brand} {tradeIn.model} {tradeIn.year}</p>
                  <p style={{ fontSize: '8pt', color: '#666' }}>{tradeIn.plate} • {tradeIn.kilometers} km</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '6pt', color: '#666' }}>VALOR DE TOMA</p>
                  <p style={{ fontSize: '11pt', fontWeight: 600, color: '#0891b2' }}>${tradeInValue.toLocaleString('es-AR')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Financing if exists */}
          {financingAmount > 0 && (
            <div style={{ border: '1px solid #0891b2', padding: '10px', background: '#f0f9ff', marginBottom: '12px' }}>
              <p style={{ fontSize: '7pt', color: '#0e7490', textTransform: 'uppercase', fontWeight: 600, marginBottom: '5px', letterSpacing: '1px' }}>FINANCIACIÓN ACORDADA</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '8pt' }}>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>BANCO/ENTIDAD</p><p style={{ fontWeight: 500 }}>{reservation.financing_bank || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>MONTO</p><p style={{ fontWeight: 600, color: '#0891b2' }}>${financingAmount.toLocaleString('es-AR')}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>CUOTAS</p><p style={{ fontWeight: 500 }}>{reservation.financing_installments || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>VALOR CUOTA</p><p style={{ fontWeight: 500 }}>{reservation.financing_installment_value ? `$${reservation.financing_installment_value}` : '-'}</p></div>
              </div>
            </div>
          )}

          {/* Balance summary */}
          <div style={{ padding: '10px', background: '#0891b2', color: 'white', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '8pt', opacity: 0.8 }}>SALDO PENDIENTE A ABONAR</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14pt', fontWeight: 600 }}>${balance.toLocaleString('es-AR')}</p>
            </div>
          </div>

          {/* Conditions */}
          <div style={{ marginBottom: '15px', fontSize: '8pt', lineHeight: 1.5 }}>
            <p style={{ fontWeight: 600, marginBottom: '5px' }}>CONDICIONES:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '15px' }}>
              <li style={{ marginBottom: '4px' }}>Esta seña tiene por objeto asegurar la prioridad de compra del vehículo mencionado por un plazo acordado.</li>
              <li style={{ marginBottom: '4px' }}>El plazo para concretar el pago completo será de <strong>7 días corridos</strong>, con un margen adicional de 48 hs hábiles.</li>
              <li style={{ marginBottom: '4px' }}>Vencido ese plazo sin concretarse la operación, el VENDEDOR podrá retener el 50% del monto entregado.</li>
              <li style={{ marginBottom: '4px' }}>El vehículo será entregado exclusivamente una vez finalizada la transferencia del dominio.</li>
            </ul>
          </div>

          {/* Ratification - more space from signatures */}
          <div style={{ marginTop: '20px', marginBottom: '100px' }}>
            <div style={{ textAlign: 'center', fontSize: '9pt', fontWeight: 700, fontStyle: 'italic' }}>
              <p>Firmo el presente en prueba de conformidad.</p>
            </div>
          </div>

          {/* Signatures - fixed at bottom, never break to next page */}
          <div style={{ marginTop: 'auto', paddingTop: '40px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div style={{ display: 'flex', gap: '60px' }}>
              <div style={{ flex: 1, textAlign: 'center', paddingTop: '6px', borderTop: '1px solid #111' }}>
                <p style={{ fontSize: '9pt', fontWeight: 600 }}>PADRANI AUTOMOTORES</p>
                <p style={{ fontSize: '7pt', color: '#666' }}>EL VENDEDOR</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center', paddingTop: '6px', borderTop: '1px solid #111' }}>
                <p style={{ fontSize: '9pt', fontWeight: 600 }}>{client?.full_name || reservation.client_name}</p>
                <p style={{ fontSize: '7pt', color: '#666' }}>EL COMPRADOR</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}