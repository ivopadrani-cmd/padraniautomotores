import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, User, Receipt, DollarSign, ShoppingCart, X, CreditCard, Printer } from "lucide-react";
import { format } from "date-fns";
import DepositReceiptView from "./DepositReceiptView";

export default function ReservationDetail({ open, onOpenChange, reservation, vehicle, onCancel, onConvertToSale }) {
  const [showReceipt, setShowReceipt] = useState(false);

  const { data: client } = useQuery({
    queryKey: ['client', reservation?.client_id],
    queryFn: () => base44.entities.Client.list().then(cs => cs.find(c => c.id === reservation?.client_id)),
    enabled: !!reservation?.client_id && open
  });

  if (!reservation) return null;

  const formatPrice = (amount, currency, exchangeRate) => {
    if (!amount) return '-';
    const formatted = currency === 'USD' ? `U$D ${amount.toLocaleString('en-US')}` : `$${amount.toLocaleString('es-AR')}`;
    return formatted;
  };

  return (
    <>
    <DepositReceiptView open={showReceipt} onOpenChange={setShowReceipt} reservation={reservation} vehicle={vehicle} client={client} />
    <Dialog open={open && !showReceipt} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg flex flex-row items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-sm font-semibold">Reserva</DialogTitle>
            <Badge className="bg-white text-gray-900 text-[10px]">{reservation.status}</Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-gray-800" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
        </DialogHeader>
        
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Vehicle */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1"><Car className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">VEHÍCULO</span></div>
            <p className="font-bold">{vehicle?.brand} {vehicle?.model} <span className="font-normal text-gray-500">{vehicle?.year} • {vehicle?.plate}</span></p>
          </div>

          {/* Client */}
          <div>
            <div className="flex items-center gap-2 mb-1"><User className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">CLIENTE</span></div>
            <p className="font-semibold">{reservation.client_name}</p>
            {reservation.client_phone && <p className="text-[11px] text-gray-500">{reservation.client_phone}</p>}
          </div>

          {/* Agreed Price */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">PRECIO ACORDADO</span></div>
            <p className="text-2xl font-bold">{formatPrice(reservation.agreed_price, reservation.agreed_price_currency, reservation.agreed_price_exchange_rate)}</p>
            {reservation.agreed_price_exchange_rate && <p className="text-[10px] text-gray-500">Cotización: ${reservation.agreed_price_exchange_rate}</p>}
          </div>

          {/* Deposit */}
          {reservation.deposit_amount > 0 && (
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1"><Receipt className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">SEÑA</span></div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{formatPrice(reservation.deposit_amount, reservation.deposit_currency, reservation.deposit_exchange_rate)}</p>
                  {reservation.deposit_description && <p className="text-[11px] text-gray-500">{reservation.deposit_description}</p>}
                </div>
                <p className="text-[11px] text-gray-500">{reservation.deposit_date && format(new Date(reservation.deposit_date), 'dd/MM/yy')}</p>
              </div>
            </div>
          )}

          {/* Trade In */}
          {reservation.trade_in?.brand && (
            <div className="p-3 border border-dashed rounded-lg">
              <div className="flex items-center gap-2 mb-1"><Car className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">PERMUTA</span></div>
              <p className="font-semibold">{reservation.trade_in.brand} {reservation.trade_in.model} {reservation.trade_in.year}</p>
              <p className="text-[11px] text-gray-500">{reservation.trade_in.plate} • {reservation.trade_in.kilometers} km</p>
              {reservation.trade_in.value && <p className="font-bold text-cyan-600 mt-1">${parseFloat(reservation.trade_in.value).toLocaleString('es-AR')}</p>}
            </div>
          )}

          {/* Financing */}
          {reservation.financing_amount > 0 && (
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">FINANCIACIÓN</span></div>
              <p className="font-bold text-lg">${parseFloat(reservation.financing_amount).toLocaleString('es-AR')}</p>
              <p className="text-[11px] text-gray-500">{reservation.financing_bank} • {reservation.financing_installments} cuotas de ${reservation.financing_installment_value}</p>
            </div>
          )}

          {/* Seller */}
          {reservation.seller_name && (
            <div className="text-[11px]"><span className="text-gray-500">Vendedor:</span> <span className="font-medium">{reservation.seller_name}</span></div>
          )}

          {/* Observations */}
          {reservation.observations && (
            <div className="text-[11px]"><span className="text-gray-500">Observaciones:</span> <span>{reservation.observations}</span></div>
          )}

          {/* Date */}
          <div className="text-[10px] text-gray-400">Reserva creada el {format(new Date(reservation.reservation_date), 'dd/MM/yyyy')}</div>

          {/* Price Breakdown */}
          {(() => {
            const agreedPrice = reservation.agreed_price || 0;
            const depositAmount = reservation.deposit_amount || 0;
            const tradeInValue = reservation.trade_in?.value ? parseFloat(reservation.trade_in.value) : 0;
            const financingAmount = reservation.financing_amount || 0;
            const balance = agreedPrice - depositAmount - tradeInValue - financingAmount;
            const hasDeductions = depositAmount > 0 || tradeInValue > 0 || financingAmount > 0;
            
            return hasDeductions ? (
              <div className="p-3 bg-gray-900 text-white rounded-lg">
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-400">Precio acordado:</span><span>${agreedPrice.toLocaleString('es-AR')}</span></div>
                  {depositAmount > 0 && <div className="flex justify-between"><span className="text-gray-400">Seña:</span><span className="text-cyan-400">-${depositAmount.toLocaleString('es-AR')}</span></div>}
                  {tradeInValue > 0 && <div className="flex justify-between"><span className="text-gray-400">Permuta:</span><span className="text-cyan-400">-${tradeInValue.toLocaleString('es-AR')}</span></div>}
                  {financingAmount > 0 && <div className="flex justify-between"><span className="text-gray-400">Financiación:</span><span className="text-cyan-400">-${financingAmount.toLocaleString('es-AR')}</span></div>}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700">
                  <span className="text-[10px] text-gray-400">Saldo a abonar</span>
                  <span className="text-lg font-bold">${balance.toLocaleString('es-AR')}</span>
                </div>
              </div>
            ) : null;
          })()}
        </div>

        {/* Fixed Footer with Action Buttons */}
        {reservation.status === 'VIGENTE' && (
          <div className="p-3 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
            <Button variant="outline" className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50" onClick={() => { if (window.confirm('¿Cancelar esta reserva? El vehículo volverá a estado DISPONIBLE.')) onCancel(); }}>
              Cancelar Reserva
            </Button>
            <div className="flex gap-2">
              {reservation.deposit_amount > 0 && (
                <Button onClick={() => setShowReceipt(true)} variant="outline" className="h-8 text-[11px]">
                  <Printer className="w-3.5 h-3.5 mr-1" />Recibo de Seña
                </Button>
              )}
              {onConvertToSale && (
                <Button className="h-8 text-[11px] bg-cyan-600 hover:bg-cyan-700" onClick={onConvertToSale}>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1" />Pasar a Venta
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}