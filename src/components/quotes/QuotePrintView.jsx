import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, ShoppingCart, Receipt, Car, MessageCircle, Mail, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { getWhatsAppUrl, generateQuoteMessage, getGmailUrl, generateQuoteEmail } from "../common/WhatsAppButton";

export default function QuotePrintView({ open, onOpenChange, quote, vehicle, client, onReserve, onStartSale, onViewVehicle, onEdit }) {
  const printRef = useRef();

  const { data: rates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => base44.entities.ExchangeRate.list('-rate_date'),
    enabled: open
  });
  const currentBlueRate = rates.find(r => r.rate_type === 'Diaria')?.usd_rate || 1200;

  const vehiclePrice = quote?.quoted_price_ars || 0;
  const tradeInValue = parseFloat(quote?.trade_in?.value_ars) || 0;
  const financingAmount = parseFloat(quote?.financing_amount) || 0;
  const difference = vehiclePrice - tradeInValue - financingAmount;
  const hasAnyDiscount = tradeInValue > 0 || financingAmount > 0;
  const balanceLabel = hasAnyDiscount ? 'Saldo a abonar' : 'Total de contado';
  const quoteRate = quote?.quoted_price_exchange_rate || currentBlueRate;
  const usdAtQuote = quoteRate > 0 ? vehiclePrice / quoteRate : 0;
  const usdToday = currentBlueRate > 0 ? vehiclePrice / currentBlueRate : 0;

  const handlePrint = () => {
    const tradeIn = quote?.trade_in;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Presupuesto - Padrani Automotores</title>
        <style>
          @page { size: A4; margin: 20mm 18mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #222; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #1e3a5f; }
          .logo-sub { font-size: 10px; color: #666; font-weight: normal; letter-spacing: 1px; }
          .header-right { text-align: right; }
          .doc-type { font-size: 11px; color: #1e3a5f; font-weight: bold; letter-spacing: 1px; }
          .doc-date { font-size: 12px; font-weight: bold; margin-top: 4px; }
          .section { margin-bottom: 18px; }
          .section-title { font-size: 9px; text-transform: uppercase; color: #1e3a5f; font-weight: bold; letter-spacing: 1px; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          .client-name { font-size: 15px; font-weight: bold; }
          .client-phone { color: #555; font-size: 11px; margin-top: 2px; }
          .vehicle-box { background: #f5f7fa; border: 1px solid #1e3a5f; padding: 16px; margin-bottom: 18px; }
          .vehicle-title { font-size: 16px; font-weight: bold; text-transform: uppercase; color: #1e3a5f; }
          .vehicle-details { color: #555; font-size: 11px; margin-top: 4px; }
          .price-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; padding-top: 10px; border-top: 1px dashed #ccc; }
          .price-main { font-size: 22px; font-weight: bold; }
          .tradein-box { background: #f0f9ff; border: 1px solid #0891b2; padding: 14px; margin-bottom: 16px; }
          .tradein-title { font-size: 9px; text-transform: uppercase; color: #0e7490; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; }
          .tradein-vehicle { font-size: 13px; font-weight: bold; color: #0e7490; }
          .tradein-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
          .tradein-item { }
          .tradein-label { font-size: 8px; color: #666; text-transform: uppercase; }
          .tradein-value { font-size: 10px; font-weight: 500; }
          .tradein-price { text-align: right; }
          .tradein-price-value { font-size: 16px; font-weight: bold; color: #0891b2; }
          .breakdown { margin-bottom: 16px; }
          .breakdown-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; border-bottom: 1px dotted #ddd; }
          .breakdown-row:last-child { border-bottom: none; }
          .breakdown-value { font-weight: 600; }
          .breakdown-discount { color: #0891b2; }
          .total-box { background: #0891b2; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
          .total-label { font-size: 10px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
          .total-value { font-size: 24px; font-weight: bold; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 15px 18mm; border-top: 1px solid #ddd; background: white; }
          .validity { font-size: 10px; color: #666; }
          .contact { font-size: 9px; color: #999; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><div class="logo">PADRANI</div><div class="logo-sub">AUTOMOTORES</div></div>
          <div class="header-right">
            <div class="doc-type">PRESUPUESTO</div>
            <div class="doc-date">${quote?.quote_date ? format(new Date(quote.quote_date), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")}</div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Cliente</div>
          <div class="client-name">${quote?.client_name || client?.full_name || ''}</div>
          <div class="client-phone">${quote?.client_phone || client?.phone || ''}</div>
        </div>
        <div class="vehicle-box">
          <div class="vehicle-title">${vehicle?.brand || ''} ${vehicle?.model || ''} ${vehicle?.year || ''}</div>
          <div class="vehicle-details">${vehicle?.plate || ''} • ${vehicle?.kilometers?.toLocaleString('es-AR') || '-'} km${vehicle?.color ? ' • ' + vehicle.color : ''}</div>
          <div class="price-section">
            <div>
              <div class="price-main">$${vehiclePrice.toLocaleString('es-AR')}</div>
            </div>
          </div>
        </div>
        ${tradeInValue > 0 && tradeIn ? `
        <div class="tradein-box">
          <div class="tradein-title">Vehículo en Parte de Pago</div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <div class="tradein-vehicle">${tradeIn.brand || ''} ${tradeIn.model || ''} ${tradeIn.year || ''}</div>
              <div class="tradein-grid">
                <div class="tradein-item"><div class="tradein-label">Dominio</div><div class="tradein-value">${tradeIn.plate || '-'}</div></div>
                <div class="tradein-item"><div class="tradein-label">Kilometraje</div><div class="tradein-value">${tradeIn.kilometers || '-'} km</div></div>
                <div class="tradein-item"><div class="tradein-label">Color</div><div class="tradein-value">${tradeIn.color || '-'}</div></div>
              </div>
            </div>
            <div class="tradein-price">
              <div class="tradein-label">Valor de toma</div>
              <div class="tradein-price-value">$${tradeInValue.toLocaleString('es-AR')}</div>
            </div>
          </div>
        </div>
        ` : ''}
        ${financingAmount > 0 ? `
        <div style="border: 1px solid #0891b2; padding: 12px; background: #f0f9ff; margin-bottom: 16px;">
          <p style="font-size: 7pt; color: #0e7490; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; letter-spacing: 1px;">DATOS DE LA FINANCIACIÓN:</p>
          <table style="width: 100%; font-size: 9pt; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0;"><span style="color: #666;">Banco/Entidad:</span></td>
              <td style="padding: 4px 0; font-weight: 500;">${quote?.financing_bank || '-'}</td>
              <td style="padding: 4px 0;"><span style="color: #666;">Monto financiado:</span></td>
              <td style="padding: 4px 0; font-weight: 600; color: #0891b2;">$${financingAmount.toLocaleString('es-AR')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><span style="color: #666;">Cantidad de cuotas:</span></td>
              <td style="padding: 4px 0; font-weight: 500;">${quote?.financing_installments || '-'}</td>
              <td style="padding: 4px 0;"><span style="color: #666;">Valor de cuota:</span></td>
              <td style="padding: 4px 0; font-weight: 500;">${quote?.financing_installment_value ? '$' + quote.financing_installment_value : '-'}</td>
            </tr>
          </table>
        </div>
        ` : ''}
        ${(tradeInValue > 0 || financingAmount > 0) ? `
        <div class="breakdown">
          <div class="breakdown-row"><span>Precio del vehículo</span><span class="breakdown-value">$${vehiclePrice.toLocaleString('es-AR')}</span></div>
          ${tradeInValue > 0 ? `<div class="breakdown-row"><span>Permuta</span><span class="breakdown-value breakdown-discount">- $${tradeInValue.toLocaleString('es-AR')}</span></div>` : ''}
          ${financingAmount > 0 ? `<div class="breakdown-row"><span>Financiación</span><span class="breakdown-value breakdown-discount">- $${financingAmount.toLocaleString('es-AR')}</span></div>` : ''}
        </div>
        ` : ''}
        <div class="total-box">
          <div class="total-label">${balanceLabel}</div>
          <div class="total-value">$${difference.toLocaleString('es-AR')}</div>
        </div>
        <div class="footer">
          <div class="validity">Presupuesto válido por 48 horas • Precios sujetos a cambios sin previo aviso</div>
          <div class="contact">Padrani Automotores • Comodoro Rivadavia</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-3 border-b flex flex-row items-center justify-between gap-2">
          <DialogTitle className="text-sm font-semibold whitespace-nowrap">Presupuesto</DialogTitle>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <a href={getWhatsAppUrl(quote?.client_phone || client?.phone, generateQuoteMessage(quote, vehicle))} target="_blank" rel="noopener noreferrer">
              <Button className="h-7 px-2 text-[10px] bg-green-500 hover:bg-green-600"><MessageCircle className="w-3 h-3 mr-1" />WhatsApp</Button>
            </a>
            {(quote?.client_email || client?.email) && (
              <a href={getGmailUrl(quote?.client_email || client?.email, generateQuoteEmail(quote, vehicle, quote?.client_name || client?.full_name).subject, generateQuoteEmail(quote, vehicle, quote?.client_name || client?.full_name).body)} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="h-7 px-2 text-[10px]"><Mail className="w-3 h-3 mr-1" />Email</Button>
              </a>
            )}
            <Button onClick={handlePrint} className="h-7 px-2 text-[10px] bg-gray-900 hover:bg-gray-800"><Printer className="w-3 h-3 mr-1" />Imprimir</Button>
            {onEdit && <Button variant="outline" onClick={() => onEdit(quote)} className="h-7 px-2 text-[10px]"><Edit className="w-3 h-3 mr-1" />Editar</Button>}
            {onReserve && ['DISPONIBLE', 'A INGRESAR', 'EN REPARACION', 'PAUSADO'].includes(vehicle?.status) && (
              <Button onClick={onReserve} variant="outline" className="h-7 px-2 text-[10px]"><Receipt className="w-3 h-3 mr-1" />Reservar</Button>
            )}
            {onStartSale && ['DISPONIBLE', 'A INGRESAR', 'EN REPARACION', 'PAUSADO'].includes(vehicle?.status) && (
              <Button onClick={onStartSale} className="h-7 px-2 text-[10px] bg-cyan-600 hover:bg-cyan-700"><ShoppingCart className="w-3 h-3 mr-1" />Vender</Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}><X className="w-3.5 h-3.5" /></Button>
          </div>
        </DialogHeader>
        
        <div ref={printRef} className="p-5">
          <div className="flex justify-between items-start border-b pb-4 mb-4">
            <div>
              <h1 className="text-xl font-bold">PRESUPUESTO</h1>
              <p className="text-[11px] text-gray-400 mt-1">N° {quote?.id?.slice(-6).toUpperCase() || '------'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Fecha</p>
              <p className="font-medium text-[12px]">{format(new Date(quote?.quote_date || quote?.date || new Date()), "d 'de' MMMM, yyyy", { locale: es })}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Cliente</p>
            <p className="text-base font-semibold">{client?.full_name || quote?.client_name || '-'}</p>
            <p className="text-[12px] text-gray-500">{client?.phone || quote?.client_phone || '-'}</p>
          </div>

          <div 
            className={`p-4 bg-gray-50 rounded-lg mb-4 ${onViewVehicle ? 'cursor-pointer hover:bg-gray-100' : ''}`}
            onClick={() => onViewVehicle && onViewVehicle(vehicle)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-2">
                {onViewVehicle && <Car className="w-5 h-5 text-gray-400 mt-0.5" />}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Vehículo</p>
                  <p className="text-lg font-bold">{vehicle?.brand} {vehicle?.model}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Año {vehicle?.year} • {vehicle?.plate} • {vehicle?.kilometers?.toLocaleString('es-AR')} km</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400">Precio</p>
                <p className="text-xl font-bold">${vehiclePrice.toLocaleString('es-AR')}</p>
                <p className="text-[11px] text-gray-500 mt-1">ERAN: U$D {usdAtQuote.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                <p className="text-[11px] font-semibold text-cyan-500">HOY SON: U$D {usdToday.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {quote?.trade_in?.brand && (
            <div className="p-4 border border-dashed border-gray-300 rounded-lg mb-4 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Permuta</p>
                <p className="font-semibold text-sm">{quote.trade_in.brand} {quote.trade_in.model} {quote.trade_in.year}</p>
                <p className="text-[11px] text-gray-500">{quote.trade_in.plate} • {quote.trade_in.kilometers} km</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400">Valor toma</p>
                <p className="text-lg font-bold text-cyan-600">-${tradeInValue.toLocaleString('es-AR')}</p>
              </div>
            </div>
          )}

          {financingAmount > 0 && (
            <div className="p-4 border border-cyan-200 bg-cyan-50 rounded-lg mb-4">
              <p className="text-[10px] font-semibold text-cyan-700 uppercase mb-2">Financiación</p>
              <div className="grid grid-cols-4 gap-2 text-[11px]">
                <div><p className="text-gray-500 text-[9px]">Banco/Entidad</p><p className="font-medium">{quote?.financing_bank || '-'}</p></div>
                <div><p className="text-gray-500 text-[9px]">Monto</p><p className="font-bold text-cyan-600">${financingAmount.toLocaleString('es-AR')}</p></div>
                <div><p className="text-gray-500 text-[9px]">Cuotas</p><p className="font-medium">{quote?.financing_installments || '-'}</p></div>
                <div><p className="text-gray-500 text-[9px]">Valor cuota</p><p className="font-medium">{quote?.financing_installment_value ? `$${quote.financing_installment_value}` : '-'}</p></div>
              </div>
            </div>
          )}

          {/* Breakdown - similar to sale form */}
          {hasAnyDiscount && (
            <div className="space-y-1 text-[11px] mb-3">
              <div className="flex justify-between py-1.5 border-b border-dotted border-gray-200"><span className="text-gray-500">Precio del vehículo</span><span className="font-semibold">${vehiclePrice.toLocaleString('es-AR')}</span></div>
              {tradeInValue > 0 && <div className="flex justify-between py-1.5 border-b border-dotted border-gray-200"><span className="text-gray-500">Permuta</span><span className="font-semibold text-cyan-600">- ${tradeInValue.toLocaleString('es-AR')}</span></div>}
              {financingAmount > 0 && <div className="flex justify-between py-1.5 border-b border-dotted border-gray-200"><span className="text-gray-500">Financiación</span><span className="font-semibold text-cyan-600">- ${financingAmount.toLocaleString('es-AR')}</span></div>}
            </div>
          )}

          <div className="p-4 bg-cyan-600 text-white rounded-lg flex justify-between items-center">
            <span className="text-[10px] opacity-80 uppercase tracking-wider">{balanceLabel}</span>
            <span className="text-2xl font-bold">${difference.toLocaleString('es-AR')}</span>
          </div>

          {quote?.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Observaciones</p>
              <p className="text-[12px] text-gray-600">{quote.notes}</p>
            </div>
          )}

          <div className="mt-5 pt-4 border-t text-center text-[11px] text-gray-400">
            <p>Este presupuesto tiene validez de 48hs desde su emisión.</p>
            <p className="mt-1">Los precios pueden variar sin previo aviso.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}