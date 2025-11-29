import React, { useRef, useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, X, Edit2, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const defaultClauses = `PRIMERA – Objeto: El CONSIGNANTE entrega en consignación el vehículo descripto precedentemente para su oferta en venta a terceros.

SEGUNDA – Valor estimado: El CONSIGNANTE acuerda con EL CONSIGNATARIO un valor de retorno estimado, no menor al indicado. El CONSIGNATARIO tendrá facultades para establecer el precio de venta al público, siempre que no afecte dicho valor de retorno sin consentimiento expreso del CONSIGNANTE.

TERCERA – Exclusividad y duración: El contrato tiene la vigencia indicada. Durante ese plazo, EL CONSIGNANTE se compromete a no comercializar ni ofrecer el vehículo por ningún otro medio.

CUARTA – Gastos operativos: El CONSIGNANTE se compromete a entregar el vehículo en condiciones de limpieza y presentación. En caso de no cumplirlo, EL CONSIGNATARIO podrá realizar dichos trabajos y, si el CONSIGNANTE cancelara la consignación sin haberse vendido el auto, deberá abonar los gastos de limpieza y publicación asumidos.

QUINTA – Vicios ocultos: El CONSIGNANTE se hace responsable por cualquier vicio oculto mecánico o legal no informado. En caso de reclamos posteriores por parte del comprador, PADRANI AUTOMOTORES se reserva el derecho de accionar civilmente contra el CONSIGNANTE por los daños ocasionados.

SEXTA – Facultad de venta: El CONSIGNANTE autoriza expresamente a EL CONSIGNATARIO a suscribir el boleto de compraventa con el eventual comprador en su carácter de intermediario, sin necesidad de que el CONSIGNANTE firme como vendedor. El presente contrato constituye conformidad de venta suficiente.

SÉPTIMA – Jurisdicción: Las partes se someten a la jurisdicción de los tribunales de Comodoro Rivadavia.`;

const formatCurrency = (amount, currency = 'ARS') => !amount ? '-' : currency === 'USD' ? `U$D ${amount.toLocaleString('en-US')}` : `$ ${amount.toLocaleString('es-AR')}`;

export default function ConsignmentContractView({ open, onOpenChange, vehicle, client, consignment }) {
  const printRef = useRef();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedClauses, setEditedClauses] = useState('');
  const [editedMinPrice, setEditedMinPrice] = useState('');
  const [editedDuration, setEditedDuration] = useState('60');
  const [contractDate, setContractDate] = useState(new Date().toISOString().split('T')[0]);
  const [showMissingDataWarning, setShowMissingDataWarning] = useState(false);
  const [editingClientData, setEditingClientData] = useState({});
  const [editingVehicleData, setEditingVehicleData] = useState({});
  const [editingAgencyData, setEditingAgencyData] = useState({});

  // Fetch agency settings
  const { data: agencySettings } = useQuery({
    queryKey: ['agency-settings'],
    queryFn: async () => {
      const settings = await base44.entities.AgencySettings.list();
      return settings[0] || null;
    },
  });

  // Fetch existing consignment contract if exists
  const { data: existingContract } = useQuery({
    queryKey: ['consignment-contract', vehicle?.id],
    queryFn: async () => {
      if (!vehicle?.id) return null;
      const contracts = await base44.entities.Document.filter({ 
        vehicle_id: vehicle.id, 
        document_type: 'Contrato Consignación' 
      });
      return contracts.length > 0 ? contracts[0] : null;
    },
    enabled: !!vehicle?.id && open,
  });

  useEffect(() => {
    if (open) {
      if (existingContract) {
        // Load existing contract data
        try {
          const savedData = JSON.parse(existingContract.document_content || '{}');
          setEditedClauses(savedData.clauses || defaultClauses);
          setEditedMinPrice(savedData.minPrice || vehicle?.consignment_minimum_price || '');
          setEditedDuration(savedData.duration || '60');
          setContractDate(savedData.contractDate || existingContract.document_date || new Date().toISOString().split('T')[0]);
        } catch {
          setEditedClauses(defaultClauses);
          setEditedMinPrice(vehicle?.consignment_minimum_price || '');
          setEditedDuration('60');
        }
      } else {
        setEditedClauses(defaultClauses);
        setEditedMinPrice(vehicle?.consignment_minimum_price || '');
        setEditedDuration('60');
        setContractDate(vehicle?.consignment_start_date || new Date().toISOString().split('T')[0]);
      }
      setIsEditing(!existingContract);
    }
  }, [open, existingContract, vehicle]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Save edited client data if any
      if (client?.id && Object.keys(editingClientData).length > 0) {
        await base44.entities.Client.update(client.id, editingClientData);
      }
      
      // Save edited vehicle data if any
      if (vehicle?.id && Object.keys(editingVehicleData).length > 0) {
        await base44.entities.Vehicle.update(vehicle.id, editingVehicleData);
      }
      
      // Save edited agency data if any
      if (Object.keys(editingAgencyData).length > 0) {
        const existingSettings = await base44.entities.AgencySettings.list();
        if (existingSettings.length > 0) {
          await base44.entities.AgencySettings.update(existingSettings[0].id, editingAgencyData);
        } else {
          await base44.entities.AgencySettings.create({ business_name: 'PADRANI AUTOMOTORES', ...editingAgencyData });
        }
      }
      
      const contractData = {
        document_type: 'Contrato Consignación',
        document_name: `Contrato Consignación - ${vehicle.brand} ${vehicle.model} ${vehicle.plate || editingVehicleData.plate || ''}`,
        document_content: JSON.stringify({
          clauses: editedClauses,
          minPrice: editedMinPrice,
          duration: editedDuration,
          contractDate: contractDate
        }),
        document_date: contractDate,
        vehicle_id: vehicle.id,
        client_id: client?.id,
        status: 'Generado'
      };
      
      if (existingContract) {
        return base44.entities.Document.update(existingContract.id, contractData);
      } else {
        return base44.entities.Document.create(contractData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment-contract', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['agency-settings'] });
      toast.success("Contrato guardado");
      setIsEditing(false);
      setEditingClientData({});
      setEditingVehicleData({});
      setEditingAgencyData({});
    }
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Contrato de Consignación</title>
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

  if (!vehicle) return null;

  const displayDate = contractDate ? new Date(contractDate) : new Date();
  const displayClauses = editedClauses || defaultClauses;
  const displayMinPrice = editedMinPrice || vehicle?.consignment_minimum_price || 0;
  const displayDuration = editedDuration || '60';

  // Check for missing required data
  const missingClientData = [];
  if (!client?.dni) missingClientData.push('DNI');
  if (!client?.cuit_cuil) missingClientData.push('CUIT/CUIL');
  if (!client?.address) missingClientData.push('Domicilio');
  if (!client?.phone) missingClientData.push('Teléfono');
  if (!client?.email) missingClientData.push('Email');

  const missingVehicleData = [];
  if (!vehicle?.plate) missingVehicleData.push('Dominio');
  if (!vehicle?.engine_number) missingVehicleData.push('N° Motor');
  if (!vehicle?.chassis_number) missingVehicleData.push('N° Chasis');

  // Check if all required data is filled (including edits)
  const clientDataComplete = missingClientData.every(field => {
    if (field === 'DNI') return client?.dni || editingClientData.dni;
    if (field === 'CUIT/CUIL') return client?.cuit_cuil || editingClientData.cuit_cuil;
    if (field === 'Domicilio') return client?.address || editingClientData.address;
    if (field === 'Teléfono') return client?.phone || editingClientData.phone;
    if (field === 'Email') return client?.email || editingClientData.email;
    return true;
    });

  const vehicleDataComplete = missingVehicleData.every(field => {
    if (field === 'Dominio') return vehicle?.plate || editingVehicleData.plate;
    if (field === 'N° Motor') return vehicle?.engine_number || editingVehicleData.engine_number;
    if (field === 'N° Chasis') return vehicle?.chassis_number || editingVehicleData.chassis_number;
    return true;
  });

  const hasMissingData = missingClientData.length > 0 || missingVehicleData.length > 0;
  const canSave = clientDataComplete && vehicleDataComplete && editedMinPrice && editedDuration;

  // Agency data (fallback to defaults)
  const agency = {
    business_name: agencySettings?.business_name || 'PADRANI AUTOMOTORES',
    cuit: agencySettings?.cuit || '20-12320784-0',
    representative_name: agencySettings?.representative_name || 'Juan Carlos Padrani',
    representative_dni: agencySettings?.representative_dni || '12320784',
    address: agencySettings?.address || 'Namuncurá 283',
    city: agencySettings?.city || 'Comodoro Rivadavia',
    province: agencySettings?.province || 'Chubut',
    phone: agencySettings?.phone || '2976258171',
    email: agencySettings?.email || ''
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[210mm] max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-3 border-b flex flex-row items-center justify-between sticky top-0 bg-white z-10">
          <DialogTitle className="text-[13px] font-semibold">Contrato de Consignación</DialogTitle>
          <div className="flex gap-2 items-center">
            {isEditing ? (
              <Button 
                onClick={handleSave} 
                className="h-7 text-[10px] bg-cyan-600 hover:bg-cyan-700" 
                disabled={saveMutation.isPending || !canSave}
              >
                <Save className="w-3 h-3 mr-1" />{saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="h-7 text-[10px]">
                <Edit2 className="w-3 h-3 mr-1" />Editar
              </Button>
            )}
            <Button onClick={handlePrint} className="h-7 text-[10px] bg-gray-900 hover:bg-gray-800"><Printer className="w-3 h-3 mr-1" />Imprimir</Button>
            {existingContract && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] border-red-300 text-red-600 hover:bg-red-50"
                onClick={async () => {
                  if (window.confirm('¿Eliminar este contrato de consignación?')) {
                    await base44.entities.Document.delete(existingContract.id);
                    queryClient.invalidateQueries({ queryKey: ['consignment-contract', vehicle.id] });
                    toast.success("Contrato eliminado");
                    onOpenChange(false);
                  }
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />Eliminar
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
          </div>
        </DialogHeader>

        {/* Missing Data Warning - with EDITABLE input fields */}
        {hasMissingData && !existingContract && (
          <div className="p-4 bg-amber-50 border-b border-amber-200">
            <p className="text-[11px] font-semibold text-amber-800 mb-3">⚠️ Completá los siguientes datos faltantes para crear el contrato:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CONSIGNANTE (Cliente/Proveedor) */}
              {missingClientData.length > 0 && (
                <div className="p-3 bg-white rounded border border-amber-200">
                  <p className="text-[10px] font-semibold text-amber-700 mb-2 border-b border-amber-100 pb-1">CONSIGNANTE</p>
                  <p className="text-[9px] text-gray-500 mb-2">{client?.full_name || vehicle.supplier_client_name}</p>
                  <div className="space-y-2">
                    {missingClientData.includes('DNI') && (
                      <div><Label className="text-[9px] text-gray-500">DNI *</Label><Input className="h-7 text-[11px]" placeholder="Ej: 12345678" value={editingClientData.dni || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, dni: e.target.value }))} /></div>
                    )}
                    {missingClientData.includes('CUIT/CUIL') && (
                      <div><Label className="text-[9px] text-gray-500">CUIT/CUIL *</Label><Input className="h-7 text-[11px]" placeholder="Ej: 20-12345678-9" value={editingClientData.cuit_cuil || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, cuit_cuil: e.target.value }))} /></div>
                    )}
                    {missingClientData.includes('Domicilio') && (
                      <div><Label className="text-[9px] text-gray-500">Domicilio *</Label><Input className="h-7 text-[11px]" placeholder="Dirección completa" value={editingClientData.address || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, address: e.target.value }))} /></div>
                    )}
                    {missingClientData.includes('Teléfono') && (
                      <div><Label className="text-[9px] text-gray-500">Teléfono *</Label><Input className="h-7 text-[11px]" placeholder="Ej: 2976123456" value={editingClientData.phone || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, phone: e.target.value }))} /></div>
                    )}
                    {missingClientData.includes('Email') && (
                      <div><Label className="text-[9px] text-gray-500">Email *</Label><Input className="h-7 text-[11px]" placeholder="email@ejemplo.com" value={editingClientData.email || ''} onChange={(e) => setEditingClientData(prev => ({ ...prev, email: e.target.value }))} /></div>
                    )}
                    </div>
                    </div>
                    )}

              {/* CONSIGNATARIO (Agencia) - siempre mostrar si faltan datos */}
              {(!agencySettings?.cuit || !agencySettings?.representative_name || !agencySettings?.address) && (
                <div className="p-3 bg-white rounded border border-cyan-200">
                  <p className="text-[10px] font-semibold text-cyan-700 mb-2 border-b border-cyan-100 pb-1">CONSIGNATARIO (Agencia)</p>
                  <p className="text-[9px] text-gray-500 mb-2">{agencySettings?.business_name || 'PADRANI AUTOMOTORES'}</p>
                  <div className="space-y-2">
                    {!agencySettings?.cuit && (
                      <div><Label className="text-[9px] text-gray-500">CUIT Agencia *</Label><Input className="h-7 text-[11px]" placeholder="Ej: 20-12345678-9" value={editingAgencyData.cuit || ''} onChange={(e) => setEditingAgencyData(prev => ({ ...prev, cuit: e.target.value }))} /></div>
                    )}
                    {!agencySettings?.representative_name && (
                      <div><Label className="text-[9px] text-gray-500">Representante *</Label><Input className="h-7 text-[11px]" placeholder="Nombre del representante" value={editingAgencyData.representative_name || ''} onChange={(e) => setEditingAgencyData(prev => ({ ...prev, representative_name: e.target.value }))} /></div>
                    )}
                    {!agencySettings?.address && (
                      <div><Label className="text-[9px] text-gray-500">Dirección Agencia *</Label><Input className="h-7 text-[11px]" placeholder="Dirección de la agencia" value={editingAgencyData.address || ''} onChange={(e) => setEditingAgencyData(prev => ({ ...prev, address: e.target.value }))} /></div>
                    )}
                  </div>
                </div>
              )}

              {/* VEHÍCULO */}
              {missingVehicleData.length > 0 && (
                <div className="p-3 bg-white rounded border border-gray-200">
                  <p className="text-[10px] font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1">VEHÍCULO</p>
                  <p className="text-[9px] text-gray-500 mb-2">{vehicle.brand} {vehicle.model} {vehicle.year}</p>
                  <div className="space-y-2">
                    {missingVehicleData.includes('Dominio') && (
                      <div><Label className="text-[9px] text-gray-500">Dominio *</Label><Input className="h-7 text-[11px]" placeholder="Ej: ABC123" value={editingVehicleData.plate || ''} onChange={(e) => setEditingVehicleData(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))} /></div>
                    )}
                    {missingVehicleData.includes('N° Motor') && (
                      <div><Label className="text-[9px] text-gray-500">N° Motor *</Label><Input className="h-7 text-[11px]" placeholder="Número de motor" value={editingVehicleData.engine_number || ''} onChange={(e) => setEditingVehicleData(prev => ({ ...prev, engine_number: e.target.value }))} /></div>
                    )}
                    {missingVehicleData.includes('N° Chasis') && (
                      <div><Label className="text-[9px] text-gray-500">N° Chasis *</Label><Input className="h-7 text-[11px]" placeholder="Número de chasis" value={editingVehicleData.chassis_number || ''} onChange={(e) => setEditingVehicleData(prev => ({ ...prev, chassis_number: e.target.value }))} /></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contract Terms Warning */}
        {!existingContract && !hasMissingData && (!editedMinPrice || !editedDuration) && (
          <div className="p-3 bg-amber-50 border-b border-amber-200">
            <p className="text-[10px] text-amber-700">⚠️ Debes ingresar el valor mínimo de retorno y la duración del contrato antes de guardar.</p>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="p-4 bg-gray-50 border-b space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[10px]">Fecha del contrato</Label>
                <Input 
                  type="date" 
                  className="h-7 text-[11px]" 
                  value={contractDate} 
                  onChange={(e) => setContractDate(e.target.value)} 
                />
              </div>
              <div>
                <Label className="text-[10px]">Valor mínimo de retorno ($)</Label>
                <Input 
                  type="number" 
                  className="h-7 text-[11px]" 
                  value={editedMinPrice} 
                  onChange={(e) => setEditedMinPrice(e.target.value)} 
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-[10px]">Duración (días)</Label>
                <Input 
                  type="number" 
                  className="h-7 text-[11px]" 
                  value={editedDuration} 
                  onChange={(e) => setEditedDuration(e.target.value)} 
                  placeholder="60"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px]">Cláusulas</Label>
              <Textarea 
                className="w-full min-h-[120px] text-[10px] font-sans mt-1" 
                value={editedClauses} 
                onChange={(e) => setEditedClauses(e.target.value)} 
              />
            </div>
          </div>
        )}

        <div ref={printRef} className="p-5" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '9pt', lineHeight: 1.35, maxWidth: '210mm', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #0891b2' }}>
            <h1 style={{ fontSize: '14pt', fontWeight: 600, letterSpacing: '3px', marginBottom: '2px' }}>CONTRATO DE CONSIGNACIÓN</h1>
            <p style={{ fontSize: '8pt', color: '#0891b2', fontWeight: 500 }}>Automotor Usado</p>
          </div>

          {/* Intro */}
          <div style={{ marginBottom: '12px', fontSize: '8.5pt', textAlign: 'justify', lineHeight: 1.45 }}>
            <p>En la ciudad de Comodoro Rivadavia, a los {format(displayDate, "d", { locale: es })} días del mes de {format(displayDate, "MMMM", { locale: es }).toUpperCase()} del año {format(displayDate, "yyyy")}, entre:</p>
          </div>

          {/* Parties */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            {/* Consignante */}
            <div style={{ border: '1px solid #0891b2', padding: '10px', background: '#f8fafc' }}>
              <p style={{ fontSize: '7pt', color: '#0891b2', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px', letterSpacing: '1px' }}>EL CONSIGNANTE</p>
              <p style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '4px' }}>{client?.full_name || vehicle.supplier_client_name || '-'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '8pt' }}>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>DNI</p><p style={{ fontWeight: 500 }}>{editingClientData.dni || client?.dni || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>CUIT/CUIL</p><p style={{ fontWeight: 500 }}>{editingClientData.cuit_cuil || client?.cuit_cuil || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>TELÉFONO</p><p style={{ fontWeight: 500 }}>{editingClientData.phone || client?.phone || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>EMAIL</p><p style={{ fontWeight: 500 }}>{editingClientData.email || client?.email || '-'}</p></div>
                <div style={{ gridColumn: 'span 2' }}><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>DOMICILIO</p><p style={{ fontWeight: 500 }}>{editingClientData.address || client?.address || '-'}{client?.city ? `, ${client.city}` : ''}{client?.province ? `, ${client.province}` : ''}</p></div>
              </div>
            </div>
            {/* Consignatario */}
            <div style={{ border: '1px solid #0891b2', padding: '10px', background: '#f8fafc' }}>
              <p style={{ fontSize: '7pt', color: '#0891b2', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px', letterSpacing: '1px' }}>EL CONSIGNATARIO</p>
              <p style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '4px' }}>{agency.business_name}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '8pt' }}>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>CUIT</p><p style={{ fontWeight: 500 }}>{editingAgencyData.cuit || agency.cuit}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>REPRESENTANTE</p><p style={{ fontWeight: 500 }}>{editingAgencyData.representative_name || agency.representative_name}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>TELÉFONO</p><p style={{ fontWeight: 500 }}>{agency.phone}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>EMAIL</p><p style={{ fontWeight: 500 }}>{agency.email || '-'}</p></div>
                <div style={{ gridColumn: 'span 2' }}><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>DOMICILIO</p><p style={{ fontWeight: 500 }}>{editingAgencyData.address || agency.address}, {agency.city}, {agency.province}</p></div>
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '8.5pt', marginBottom: '6px' }}>Se celebra el presente contrato de consignación del siguiente vehículo:</p>
            <div style={{ border: '1px solid #0891b2', padding: '10px', background: '#f8fafc' }}>
              <p style={{ fontSize: '11pt', fontWeight: 600, marginBottom: '6px', color: '#0891b2' }}>{vehicle.brand} {vehicle.model} {vehicle.year}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>DOMINIO</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{editingVehicleData.plate || vehicle.plate || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>RADICACIÓN</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{vehicle.registration_city || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>MARCA MOTOR</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{vehicle.engine_brand || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>N° MOTOR</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{editingVehicleData.engine_number || vehicle.engine_number || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>MARCA CHASIS</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{vehicle.chassis_brand || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>N° CHASIS</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{editingVehicleData.chassis_number || vehicle.chassis_number || '-'}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>VALOR MÍNIMO</p><p style={{ fontSize: '9pt', fontWeight: 600, color: '#0891b2' }}>{formatCurrency(parseFloat(displayMinPrice) || 0)}</p></div>
                <div><p style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase' }}>VIGENCIA</p><p style={{ fontSize: '9pt', fontWeight: 500 }}>{displayDuration} días</p></div>
              </div>
            </div>
          </div>

          {/* Clauses */}
          <div style={{ marginBottom: '6px', flex: 1 }}>
            <p style={{ fontSize: '8pt', fontWeight: 600, marginBottom: '6px' }}>CLÁUSULAS:</p>
            <div style={{ fontSize: '8.5pt', textAlign: 'justify', lineHeight: 1.45 }}>
              {displayClauses.split('\n\n').map((clause, i) => <p key={i} style={{ marginBottom: '8px' }}>{clause}</p>)}
            </div>
          </div>

          {/* Ratification - more space from signatures */}
          <div style={{ marginTop: '20px', marginBottom: '100px' }}>
            <div style={{ textAlign: 'center', fontSize: '9pt', fontWeight: 700, fontStyle: 'italic' }}>
              <p>Leído y ratificado, se firman dos ejemplares del mismo tenor y a un solo efecto.</p>
            </div>
          </div>

          {/* Signatures - fixed at bottom of page */}
          <div style={{ marginTop: 'auto', paddingTop: '40px', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', gap: '80px' }}>
              <div style={{ flex: 1, textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #111' }}>
                <p style={{ fontSize: '10pt', fontWeight: 600 }}>{client?.full_name || vehicle.supplier_client_name || '-'}</p>
                <p style={{ fontSize: '8pt', color: '#666' }}>EL CONSIGNANTE</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #111' }}>
                <p style={{ fontSize: '10pt', fontWeight: 600 }}>{agency.business_name}</p>
                <p style={{ fontSize: '8pt', color: '#666' }}>EL CONSIGNATARIO</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}