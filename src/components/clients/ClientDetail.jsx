import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Phone, Mail, MapPin, User, ShoppingCart, Car, IdCard, Home, Trash2, Upload, Download, FileText, X, MessageCircle } from "lucide-react";
import { QuickContactButton } from "../common/WhatsAppButton";
import { format } from "date-fns";
import AddEventDialog from "../events/AddEventDialog";
import SaleDetail from "../sales/SaleDetail";
import { toast } from "sonner";

export default function ClientDetail({ client, onClose, onEdit, onDelete }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', client.id],
    queryFn: () => base44.entities.Sale.filter({ client_id: client.id }, '-sale_date'),
  });

  const { data: suppliedVehicles = [] } = useQuery({
    queryKey: ['supplier-vehicles', client.id],
    queryFn: () => base44.entities.Vehicle.filter({ supplier_client_id: client.id }, '-created_at'),
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', client.id] });
      toast.success("Documento adjuntado");
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño del archivo (máx 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('El archivo es muy grande (máx 20MB)');
      e.target.value = null;
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newDocument = {
        url: file_url,
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        type: file.type
      };

      const updatedDocuments = [...(client.attached_documents || []), newDocument];
      
      await updateClientMutation.mutateAsync({
        id: client.id,
        data: { attached_documents: updatedDocuments }
      });
    } catch (error) {
      toast.error("Error al subir el archivo");
      console.error(error);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleDeleteDocument = async (docIndex) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este documento?')) return;

    const updatedDocuments = client.attached_documents.filter((_, index) => index !== docIndex);
    await updateClientMutation.mutateAsync({
      id: client.id,
      data: { attached_documents: updatedDocuments }
    });
  };

  if (selectedSale) {
    return (
      <SaleDetail
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
        onDelete={() => {}}
      />
    );
  }

  const btnClass = "h-7 text-[10px] px-3";

  return (
    <div className="p-2 md:p-4 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-2">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={onClose} className={btnClass}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />Volver
          </Button>
          <div className="flex gap-2">
            <AddEventDialog
              clientId={client.id}
              clientName={client.full_name}
            />
            <Button onClick={() => onEdit(client)} className={`${btnClass} bg-sky-600 hover:bg-sky-700`}>
              <Edit className="w-3.5 h-3.5 mr-1.5" />Editar
            </Button>
            {onDelete && (
              <Button 
                variant="outline" 
                className={`${btnClass} border-red-200 text-red-600 hover:bg-red-50`}
                onClick={() => onDelete(client.id)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />Eliminar
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-2">
          <div className="lg:col-span-2 space-y-2">
            {/* Información Principal */}
            <Card className="shadow-sm">
              <CardHeader className="border-b p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <h1 className="text-base font-bold">{client.full_name}</h1>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-[9px] px-1.5 py-0 ${client.client_status === 'Cliente' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {client.client_status || 'Cliente'}
                        </Badge>
                      </div>
                    </div>
                    <QuickContactButton phone={client.phone} name={client.full_name} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid md:grid-cols-3 gap-3 text-[11px]">
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-400 text-[9px]">Teléfono</p>
                        <a href={`tel:${client.phone}`} className="font-medium hover:text-sky-600">{client.phone}</a>
                      </div>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-400 text-[9px]">Email</p>
                        <p className="font-medium">{client.email}</p>
                      </div>
                    </div>
                  )}
                  {client.dni && (
                    <div className="flex items-center gap-2">
                      <IdCard className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-400 text-[9px]">DNI</p>
                        <p className="font-medium">{client.dni}</p>
                      </div>
                    </div>
                  )}
                  {client.cuit_cuil && (
                    <div className="flex items-center gap-2">
                      <IdCard className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-400 text-[9px]">CUIT/CUIL</p>
                        <p className="font-medium">{client.cuit_cuil}</p>
                      </div>
                    </div>
                  )}
                  {(client.address || client.city || client.province) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-400 text-[9px]">Domicilio</p>
                        <p className="font-medium">
                          {[client.address, client.city, client.province].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  {client.marital_status && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-400 text-[9px]">Estado Civil</p>
                        <p className="font-medium">{client.marital_status}</p>
                      </div>
                    </div>
                  )}
                </div>
                {client.observations && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-[11px]">
                    <p className="text-gray-400 text-[9px] mb-1">Observaciones</p>
                    <p className="text-gray-700">{client.observations}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documentos Adjuntos */}
            <Card className="shadow-sm">
              <CardHeader className="border-b p-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-[12px] font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documentos Adjuntos ({client.attached_documents?.length || 0})
                  </h3>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" disabled={uploading} className="h-6 text-[9px]" asChild>
                      <span>
                        <Upload className="w-3 h-3 mr-1" />
                        {uploading ? 'Subiendo...' : 'Adjuntar'}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-2">
                {client.attached_documents && client.attached_documents.length > 0 ? (
                  <div className="space-y-1">
                    {client.attached_documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[11px] truncate">{doc.name}</p>
                            <p className="text-[9px] text-gray-500">{doc.date && format(new Date(doc.date), 'dd/MM/yy')}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" download>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Download className="w-3 h-3 text-sky-600" />
                            </Button>
                          </a>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteDocument(index)}
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                    <p className="text-[10px]">No hay documentos adjuntos</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historial de Compras */}
            <Card className="shadow-sm">
              <CardHeader className="border-b p-3">
                <h3 className="text-[12px] font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Historial de Compras ({sales.length})
                </h3>
              </CardHeader>
              <CardContent className="p-2">
                {sales.length > 0 ? (
                  <div className="space-y-1">
                    {sales.map((sale) => (
                      <div 
                        key={sale.id} 
                        className="p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-[11px] text-gray-900">{sale.vehicle_description}</p>
                            <p className="text-[9px] text-gray-500 mt-0.5">
                              {format(new Date(sale.sale_date), 'dd/MM/yy')}
                            </p>
                            <Badge className="mt-1 text-[8px] px-1 py-0" variant="outline">{sale.sale_status}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[11px] text-gray-900">
                              ${sale.sale_price_ars?.toLocaleString('es-AR') || '0'}
                            </p>
                            {sale.sale_price_usd > 0 && (
                              <p className="text-[9px] text-gray-600">
                                USD {sale.sale_price_usd?.toLocaleString('en-US')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                    <p className="text-[10px]">No hay compras registradas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            {/* Vehículos Provistos */}
            <Card className="shadow-sm">
              <CardHeader className="border-b p-3">
                <h3 className="text-[12px] font-semibold flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Vehículos Provistos ({suppliedVehicles.length})
                </h3>
              </CardHeader>
              <CardContent className="p-2">
                {suppliedVehicles.length > 0 ? (
                  <div className="space-y-1">
                    {suppliedVehicles.map((vehicle) => (
                      <div key={vehicle.id} className="p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                        <p className="font-semibold text-[11px]">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-[9px] text-gray-600">{vehicle.year} • {vehicle.plate}</p>
                        <div className="flex gap-1 mt-1">
                          {vehicle.is_supplier_owner && (
                            <Badge className="text-[8px] px-1 py-0 bg-gray-200 text-gray-700">Titular</Badge>
                          )}
                          <Badge className="text-[8px] px-1 py-0 bg-sky-100 text-sky-700">{vehicle.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Car className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                    <p className="text-[10px]">No hay vehículos provistos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}