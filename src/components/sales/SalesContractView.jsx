import React, { useRef, useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, X, Edit2, Save, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

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

const formatCurrency = (amount, currency = 'ARS') => !amount ? '-' : currency === 'USD' ? `U$D ${amount.toLocaleString('en-US')}` : `$ ${amount.toLocaleString('es-AR')}`;
const toARS = (amount, currency, rate) => !amount ? 0 : currency === 'USD' ? amount * (rate || 1200) : amount;
const amountInWords = (amount, currency = 'ARS') => !amount ? '' : currency === 'USD' ? `dólares estadounidenses ${numberToWords(Math.floor(amount))}` : `pesos ${numberToWords(Math.floor(amount))}`;

const defaultClauses = `TERCERO – CONDICIONES DE ENTREGA: El vehículo se entrega en el estado que se encuentra, y que el COMPRADOR declara conocer y aceptar, conforme inspección previa. La entrega del mismo se efectuará exclusivamente una vez finalizada y asentada la transferencia registral correspondiente.

CUARTO – GARANTÍA Y VICIOS OCULTOS: El VENDEDOR no otorga garantía sobre el bien, salvo vicios ocultos graves no registrados ni informados al momento de la venta. No se admiten reclamos por detalles estéticos o de mantenimiento que no comprometan la seguridad o funcionamiento básico del vehículo. Para las permutas tomadas, el VENDEDOR se reserva el derecho de eventual reclamo al permutante en caso de vicios ocultos no registrados ni informados al momento de la toma.

QUINTO – GASTOS: El valor de la operación incluye comisiones. Los gastos de transferencia, gestoría, formularios y aranceles no están incluidos, salvo pacto escrito en contrario.

SEXTO – JURISDICCIÓN: Para cualquier diferencia que surja del presente contrato, las partes se someten a la jurisdicción de los tribunales ordinarios de la ciudad de Comodoro Rivadavia.`;

export default function SalesContractView({ open, onOpenChange, sale, vehicle, client, spouse }) {
  const printRef = useRef();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedClauses, setEditedClauses] = useState('');
  const [editedObservations, setEditedObservations] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['clause-templates'],
    queryFn: () => base44.entities.ClauseTemplate.list()
  });

  const { data: currentSale } = useQuery({
    queryKey: ['sale', sale?.id],
    queryFn: async () => {
      if (!sale?.id) return sale;
      const sales = await base44.entities.Sale.list();
      return sales.find(s => s.id === sale.id) || sale;
    },
    enabled: !!sale?.id && open,
    initialData: sale
  });

  useEffect(() => {
    if (currentSale && open) {
      setEditedClauses(currentSale.contract_clauses || defaultClauses);
      setEditedObservations(currentSale.observations || '');
    }
  }, [currentSale, open]);

  const updateSaleMutation = useMutation({
    mutationFn: (data) => base44.entities.Sale.update(currentSale.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', currentSale.id] });
      toast.success("Boleto guardado");
      setIsEditing(false);
    }
  });

  const handleSave = () => {
    updateSaleMutation.mutate({ contract_clauses: editedClauses, observations: editedObservations });
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEditedClauses(template.content);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Boleto de Compraventa</title>
      <style>
        @page { size: A4 portrait; margin: 10mm 12mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 8pt; line-height: 1.3; color: #111; height: 100vh; }
        .contract-wrapper { min-height: calc(100vh - 20mm); display: flex; flex-direction: column; }
      </style>
    </head><body><div class="contract-wrapper">${printRef.current.innerHTML}</div></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  if (!currentSale || !vehicle) return null;

  const salePrice = currentSale.sale_price || 0;
  const saleCurrency = currentSale.sale_price_currency || 'ARS';
  const depositARS = currentSale.deposit ? toARS(currentSale.deposit.amount, currentSale.deposit.currency, currentSale.deposit.exchange_rate) : 0;
  const cashARS = currentSale.cash_payment ? toARS(currentSale.cash_payment.amount, currentSale.cash_payment.currency, currentSale.cash_payment.exchange_rate) : 0;
  const tradeInARS = (currentSale.trade_ins || []).reduce((sum, ti) => sum + toARS(ti.value, ti.currency, ti.exchange_rate), 0);
  const financingARS = currentSale.financing ? toARS(currentSale.financing.amount, currentSale.financing.currency, currentSale.financing.exchange_rate) : 0;
  const salePriceARS = toARS(salePrice, saleCurrency, currentSale.sale_price_exchange_rate);
  const balanceARS = salePriceARS - depositARS - cashARS - tradeInARS - financingARS;
  const saleDate = currentSale.sale_date ? new Date(currentSale.sale_date) : new Date();
  const displayObservations = isEditing ? editedObservations : (currentSale.observations || '');
  const displayClauses = isEditing ? editedClauses : (currentSale.contract_clauses || defaultClauses);

  // Payment boxes count for dynamic layout
  const paymentBoxes = [];
  if (currentSale.deposit?.amount > 0) paymentBoxes.push('deposit');
  if (currentSale.cash_payment?.amount > 0) paymentBoxes.push('cash');
  if (currentSale.financing?.amount > 0) paymentBoxes.push('financing');
  const paymentGridCols = paymentBoxes.length === 1 ? '1fr' : paymentBoxes.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[210mm] max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-3 border-b flex flex-row items-center justify-between sticky top-0 bg-white z-10">
          <DialogTitle className="text-[13px] font-semibold">Boleto de Compraventa</DialogTitle>
          <div className="flex gap-2 items-center">
            {isEditing ? (
              <Button onClick={handleSave} className="h-7 text-[10px] bg-cyan-600 hover:bg-cyan-700" disabled={updateSaleMutation.isPending}>
                <Save className="w-3 h-3 mr-1" />{updateSaleMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="h-7 text-[10px]">
                <Edit2 className="w-3 h-3 mr-1" />Editar
              </Button>
            )}
            <Button onClick={handlePrint} className="h-7 text-[10px] bg-gray-900 hover:bg-gray-800"><Printer className="w-3 h-3 mr-1" />Imprimir</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
          </div>
        </DialogHeader>

        <div ref={printRef} className="p-5" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '9pt', lineHeight: 1.35, maxWidth: '210mm', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #0891b2' }}>
            <h1 style={{ fontSize: '14pt', fontWeight: 600, letterSpacing: '3px', marginBottom: '2px' }}>BOLETO DE COMPRAVENTA</h1>
            <p style={{ fontSize: '8pt', color: '#0891b2', fontWeight: 500 }}>Automotor Usado</p>
          </div>

          {/* Parties - Vendedor y Comprador */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            {/* Vendedor */}
            <div style={{ border: '1px solid #0891b2', padding: '10px', background: '#f8fafc' }}>
              <p style={{ fontSize: '7pt', color: '#0891b2', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px', letterSpacing: '1px' }}>EL VENDEDOR</p>
              <p style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '4px' }}>PADRANI AUTOMOTORES</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '8pt' }}>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>CUIT</p><p style={{ fontWeight: 500 }}>20-12320784-0</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>TELÉFONO</p><p style={{ fontWeight: 500 }}>2976258171</p></div>
                <div style={{ gridColumn: 'span 2' }}><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>DOMICILIO</p><p style={{ fontWeight: 500 }}>Namuncurá 283, Comodoro Rivadavia</p></div>
              </div>
            </div>
            {/* Comprador */}
            <div style={{ border: '1px solid #0891b2', padding: '10px', background: '#f8fafc' }}>
              <p style={{ fontSize: '7pt', color: '#0891b2', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px', letterSpacing: '1px' }}>EL COMPRADOR</p>
              <p style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '4px' }}>{client?.full_name || currentSale.client_name}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '8pt' }}>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>DNI</p><p style={{ fontWeight: 500 }}>{client?.dni || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>CUIT/CUIL</p><p style={{ fontWeight: 500 }}>{client?.cuit_cuil || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>TELÉFONO</p><p style={{ fontWeight: 500 }}>{client?.phone || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>CIUDAD</p><p style={{ fontWeight: 500 }}>{client?.city || '-'}{client?.province ? `, ${client.province}` : ''}</p></div>
                <div style={{ gridColumn: 'span 2' }}><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>DOMICILIO</p><p style={{ fontWeight: 500 }}>{client?.address || '-'}</p></div>
              </div>
            </div>
          </div>

          {/* Intro paragraph */}
          <div style={{ marginBottom: '10px', fontSize: '8pt', textAlign: 'justify', lineHeight: 1.4 }}>
            <p>En la ciudad de Comodoro Rivadavia, a los {format(saleDate, "d", { locale: es })} días del mes de {format(saleDate, "MMMM", { locale: es }).toUpperCase()} del año {format(saleDate, "yyyy")}, las partes identificadas precedentemente acuerdan lo siguiente:</p>
          </div>

          {/* Vehicle - PRIMERO */}
          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '8pt', fontWeight: 600, marginBottom: '5px' }}>PRIMERO – OBJETO: El COMPRADOR adquiere el siguiente vehículo:</p>
            <div style={{ border: '1px solid #0891b2', padding: '10px', background: '#f8fafc' }}>
              <p style={{ fontSize: '11pt', fontWeight: 600, marginBottom: '6px', color: '#0891b2' }}>{vehicle.brand} {vehicle.model} {vehicle.year}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>DOMINIO</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{vehicle.plate || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>TIPO</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{vehicle.vehicle_type || 'AUTOMÓVIL'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>RADICACIÓN</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{vehicle.registration_city || '-'}{vehicle.registration_province && `, ${vehicle.registration_province}`}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>COLOR</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{vehicle.color || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>MARCA MOTOR</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{vehicle.engine_brand || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>N° MOTOR</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{vehicle.engine_number || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>MARCA CHASIS</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{vehicle.chassis_brand || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>N° CHASIS</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{vehicle.chassis_number || '-'}</p></div>
              </div>
            </div>
          </div>

          {/* Price - SEGUNDO */}
          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '8.5pt', fontWeight: 600, marginBottom: '5px' }}>SEGUNDO – PRECIO Y FORMA DE PAGO: El precio total de la operación es de <strong>{formatCurrency(salePrice, saleCurrency)}</strong> en letras (<span style={{ textTransform: 'uppercase' }}>{amountInWords(salePriceARS)}</span>) que el COMPRADOR abona de la siguiente forma:</p>
            
            {/* Payment description */}
            <div style={{ fontSize: '8pt', marginBottom: '6px', paddingLeft: '8px', lineHeight: 1.5 }}>
              {(depositARS > 0 || cashARS > 0 || tradeInARS > 0 || financingARS > 0) ? (
                <>
                  {(depositARS > 0 || cashARS > 0) && (
                    <p>• Al contado{currentSale.deposit?.amount > 0 ? ' como seña' : ''} y en este acto, la suma de {formatCurrency(depositARS + cashARS)} ({amountInWords(depositARS + cashARS)}){tradeInARS > 0 ? ',' : ', sirviendo el presente documento como suficiente recibo.'}</p>
                  )}
                  {tradeInARS > 0 && (
                    <p>• {depositARS > 0 || cashARS > 0 ? 'más un' : 'Un'} vehículo tomado en parte de pago valuado en {formatCurrency(tradeInARS)} ({amountInWords(tradeInARS)}), sirviendo el presente documento como suficiente recibo.</p>
                  )}
                  {financingARS > 0 && (
                    <p>• Financiación según detalle a continuación.</p>
                  )}
                  {balanceARS > 0 && currentSale.balance_due_date && (
                    <p>• El saldo restante de {formatCurrency(balanceARS)} ({amountInWords(balanceARS)}) será abonado en su totalidad antes del día {format(new Date(currentSale.balance_due_date), "d 'de' MMMM 'de' yyyy", { locale: es })}.</p>
                  )}
                </>
              ) : (
                <p>Al contado y en este acto, sirviendo el presente documento como suficiente recibo.</p>
              )}
            </div>

            {/* Trade-ins detail - more compact */}
            {currentSale.trade_ins?.length > 0 && currentSale.trade_ins.map((ti, i) => (
              <div key={i} style={{ border: '1px solid #0891b2', padding: '8px', marginBottom: '8px', background: '#f0f9ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <p style={{ fontSize: '7pt', color: '#0e7490', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '1px' }}>VEHÍCULO EN PARTE DE PAGO VALUADO EN <span style={{ fontSize: '9pt', color: '#0891b2' }}>{formatCurrency(ti.value, ti.currency)}</span>:</p>
                </div>
                <p style={{ fontSize: '10pt', fontWeight: 600, color: '#0e7490', marginBottom: '4px' }}>{ti.brand} {ti.model} {ti.year}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '8pt' }}>
                  <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>DOMINIO</p><p style={{ fontWeight: 500 }}>{ti.plate || '-'}</p></div>
                  <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>COLOR</p><p style={{ fontWeight: 500 }}>{ti.color || '-'}</p></div>
                  <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>RADICACIÓN</p><p style={{ fontWeight: 500 }}>{ti.registration_city || '-'}</p></div>
                  <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>KM</p><p style={{ fontWeight: 500 }}>{ti.kilometers || '-'}</p></div>
                  <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>N° MOTOR</p><p style={{ fontWeight: 500 }}>{ti.engine_number || '-'}</p></div>
                  <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>N° CHASIS</p><p style={{ fontWeight: 500 }}>{ti.chassis_number || '-'}</p></div>
                </div>
              </div>
            ))}

            {/* Financing Box */}
            {currentSale.financing?.amount > 0 && (
              <div style={{ border: '1px solid #0891b2', padding: '10px', marginBottom: '8px', background: '#f0f9ff' }}>
                <p style={{ fontSize: '7pt', color: '#0e7490', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px', letterSpacing: '1px' }}>DATOS DE LA FINANCIACIÓN:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                  <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>BANCO/ENTIDAD</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{currentSale.financing.bank || '-'}</p></div>
                  <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>MONTO FINANCIADO</p><p style={{ fontSize: '9pt', fontWeight: 600, color: '#0891b2' }}>{formatCurrency(currentSale.financing.amount, currentSale.financing.currency)}</p></div>
                  <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>CANTIDAD DE CUOTAS</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{currentSale.financing.installments || '-'}</p></div>
                  <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>VALOR DE CUOTA</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{currentSale.financing.installment_value ? `$${currentSale.financing.installment_value.toLocaleString('es-AR')}` : '-'}</p></div>
                </div>
              </div>
            )}

            {/* Balance */}
            {balanceARS > 0 && (
              <div style={{ padding: '8px 12px', border: '1px solid #0891b2', background: '#f0f9ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '8pt', color: '#444', fontWeight: 500 }}>Saldo pendiente a abonar:</p>
                  {currentSale.balance_due_date && <p style={{ fontSize: '7pt', color: '#0891b2' }}>Fecha límite: {format(new Date(currentSale.balance_due_date), "dd/MM/yyyy")}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12pt', fontWeight: 600, color: '#0891b2' }}>{formatCurrency(balanceARS)}</p>
                  <p style={{ fontSize: '7pt', color: '#666', fontStyle: 'italic' }}>({amountInWords(balanceARS)})</p>
                </div>
              </div>
            )}
          </div>

          {/* Clauses */}
          <div style={{ marginBottom: '6px', flex: 1 }}>
            {isEditing && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <p style={{ fontSize: '7pt', fontWeight: 600, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '1px' }}>Cláusulas</p>
                {templates.length > 0 && (
                  <Select onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="h-6 w-40 text-[9px] print:hidden">
                      <FileText className="w-3 h-3 mr-1" />
                      <SelectValue placeholder="Usar plantilla..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => <SelectItem key={t.id} value={t.id} className="text-[10px]">{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            {isEditing ? (
              <Textarea className="w-full min-h-[100px] text-[9px] font-sans" value={editedClauses} onChange={(e) => setEditedClauses(e.target.value)} />
            ) : (
              <div style={{ fontSize: '8.5pt', textAlign: 'justify', lineHeight: 1.45 }}>
                {displayClauses.split('\n\n').map((clause, i) => <p key={i} style={{ marginBottom: '8px' }}>{clause}</p>)}
              </div>
            )}
          </div>

          {/* Observations - only if present */}
          {isEditing ? (
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '9pt', fontWeight: 600, marginBottom: '3px' }}>OBSERVACIONES:</p>
              <Textarea className="w-full min-h-[40px] text-[9px] font-sans" value={editedObservations} onChange={(e) => setEditedObservations(e.target.value)} placeholder="Agregar observaciones..." />
            </div>
          ) : displayObservations ? (
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '9pt', fontWeight: 600, marginBottom: '3px' }}>OBSERVACIONES:</p>
              <div style={{ fontSize: '8.5pt', padding: '6px', background: '#f9f9f9', border: '1px solid #e5e5e5', whiteSpace: 'pre-wrap' }}>{displayObservations}</div>
            </div>
          ) : null}

          {/* Ratification - more space from signatures */}
          <div style={{ marginTop: '20px', marginBottom: '120px' }}>
            <div style={{ textAlign: 'center', fontSize: '9pt', fontWeight: 700, fontStyle: 'italic' }}>
              <p>Leído y ratificado, se firman dos ejemplares del mismo tenor y a un solo efecto.</p>
            </div>
          </div>

          {/* Signatures - always at absolute bottom of page, never break */}
          <div style={{ marginTop: 'auto', paddingTop: '40px', pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakBefore: 'auto' }}>
            <div style={{ display: 'flex', gap: '80px' }}>
              <div style={{ flex: 1, textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #111' }}>
                <p style={{ fontSize: '10pt', fontWeight: 600 }}>PADRANI AUTOMOTORES</p>
                <p style={{ fontSize: '8pt', color: '#666' }}>EL VENDEDOR</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #111' }}>
                <p style={{ fontSize: '10pt', fontWeight: 600 }}>{client?.full_name || currentSale.client_name}</p>
                <p style={{ fontSize: '8pt', color: '#666' }}>EL COMPRADOR</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}