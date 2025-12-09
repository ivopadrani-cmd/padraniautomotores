
import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, ExternalLink, FileText, Wrench, Package, Plus, DollarSign, Trash2, Upload, Image as ImageIcon, X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import AddEventDialog from "../events/AddEventDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_COLORS = {
  'A INGRESAR': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'EN REPARACION': 'bg-violet-100 text-violet-800 border-violet-300',
  'DISPONIBLE': 'bg-green-100 text-green-800 border-green-300',
  'PAUSADO': 'bg-gray-200 text-gray-800 border-gray-400',
  'RESERVADO': 'bg-orange-100 text-orange-800 border-orange-300',
  'VENDIDO': 'bg-red-100 text-red-800 border-red-300'
};

export default function VehicleDetail({ vehicle, onClose, onEdit, onDelete }) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(() => ({
    ...vehicle,
    photos: vehicle.photos || [],
    documents: vehicle.documents || [],
    documentation_checklist: vehicle.documentation_checklist || {
      maintenance: {
        oil_service_date: '',
        oil_service_km: 0,
        distribution_service_date: '',
        distribution_service_km: 0,
        gearbox_service_date: '',
        gearbox_service_km: 0,
        maintenance_notes: ''
      },
      documents: {
        original_card: false,
        authorized_cards: false,
        cat: false,
        form_08: false,
        police_verification: false,
        domain_report: false,
        fines_report: false,
        patent_payment: false,
        sale_report: false,
        lien: false,
        lien_cancellation: false,
        documents_notes: ''
      },
      accessories: {
        manuals: false,
        spare_key: false,
        spare_tire: false,
        jack: false,
        security_nut: false,
        accessories_notes: ''
      }
    }
  }));
  const [expenses, setExpenses] = useState(vehicle.expenses || []);
  const [uploading, setUploading] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [newExpense, setNewExpense] = useState({
    type: 'GESTORIA',
    amount_ars: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      console.log('💾 Guardando vehículo...', { id, data });
      return base44.entities.Vehicle.update(id, data);
    },
    onSuccess: (result) => {
      console.log('✅ Guardado exitoso:', result);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', formData.id] });
      toast.success("Vehículo actualizado");
    },
    onError: (error) => {
      console.error('❌ Error al guardar:', error);
      toast.error("Error al guardar el vehículo");
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validar tamaño de archivos
    const maxSize = type === 'photos' ? 10 * 1024 * 1024 : 20 * 1024 * 1024; // 10MB fotos, 20MB docs
    const invalidFiles = files.filter(f => f.size > maxSize);
    if (invalidFiles.length > 0) {
      const maxSizeMB = type === 'photos' ? '10MB' : '20MB';
      toast.error(`Algunos archivos son muy grandes (máx ${maxSizeMB}): ${invalidFiles.map(f => f.name).join(', ')}`);
      e.target.value = null;
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          url: file_url,
          name: file.name,
          date: new Date().toISOString().split('T')[0]
        };
        } catch (error) {
          console.error('Error subiendo archivo:', file.name, error);
          return null;
        }
      });

      const uploadedFiles = (await Promise.all(uploadPromises)).filter(f => f);

      if (uploadedFiles.length > 0) {
      if (type === 'photos') {
        handleChange('photos', [...(formData.photos || []), ...uploadedFiles]);
      } else if (type === 'documents') {
        handleChange('documents', [...(formData.documents || []), ...uploadedFiles]);
      }

      toast.success(`${uploadedFiles.length} archivo(s) cargado(s)`);
      }
      
      if (uploadedFiles.length < files.length) {
        toast.error(`${files.length - uploadedFiles.length} archivo(s) no se pudieron subir`);
      }
    } catch (error) {
      toast.error("Error al subir los archivos");
      console.error(error);
    } finally {
      setUploading(false);
      e.target.value = null; // Clear input
    }
  };

  const handleRemoveFile = (type, index) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      if (type === 'photos') {
        handleChange('photos', formData.photos.filter((_, i) => i !== index));
        if (currentPhotoIndex >= formData.photos.length - 1 && formData.photos.length > 1) {
          setCurrentPhotoIndex(formData.photos.length - 2);
        } else if (formData.photos.length === 1) { // If only one photo left, and it's being deleted
          setShowPhotoGallery(false);
          setCurrentPhotoIndex(0);
        }
      } else if (type === 'documents') {
        handleChange('documents', formData.documents.filter((_, i) => i !== index));
      }
      toast.success("Archivo eliminado");
    }
  };

  const handleSave = async () => {
    const totalArs = (formData.cost_ars || 0) + expenses.reduce((sum, exp) => sum + exp.amount_ars, 0);
    const totalUsd = (formData.cost_usd || 0) + expenses.reduce((sum, exp) => sum + exp.amount_usd, 0);

    try {
      await updateMutation.mutateAsync({
      id: formData.id,
      data: {
        ...formData,
        expenses,
        total_cost_ars: totalArs,
        total_cost_usd: totalUsd
      }
    });
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const handleChecklistChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      documentation_checklist: {
        ...prev.documentation_checklist,
        [section]: {
          ...prev.documentation_checklist[section],
          [field]: value
        }
      }
    }));
  };

  const getUSDRate = async (dateString) => {
    try {
      const date = dateString.split('T')[0];
      const response = await fetch(`https://api.exchangerate.host/${date}?base=USD&symbols=ARS`);
      const data = await response.json();
      return data.rates?.ARS || 1000; // Default to 1000 if API fails
    } catch (error) {
      console.error("Error fetching USD rate:", error);
      return 1000; // Default to 1000 if API fails
    }
  };

  const handleAddExpense = async () => {
    if (newExpense.amount_ars <= 0) {
      toast.error("El monto del gasto debe ser mayor a 0.");
      return;
    }

    const rate = await getUSDRate(newExpense.date);
    const expenseWithUsd = {
      ...newExpense,
      amount_usd: parseFloat((newExpense.amount_ars / rate).toFixed(2))
    };

    setExpenses([...expenses, expenseWithUsd]);
    setNewExpense({
      type: 'GESTORIA',
      amount_ars: 0,
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setShowExpenseForm(false);
    toast.success("Gasto agregado correctamente");
  };

  const handleRemoveExpense = (index) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      setExpenses(expenses.filter((_, i) => i !== index));
      toast.success("Gasto eliminado");
    }
  };

  const totalCostArs = (formData.cost_ars || 0) + expenses.reduce((sum, exp) => sum + exp.amount_ars, 0);
  const totalCostUsd = (formData.cost_usd || 0) + expenses.reduce((sum, exp) => sum + exp.amount_usd, 0);

  const photos = formData.photos || [];
  const documents = formData.documents || [];

  return (
    <div className="p-4 md:p-8 min-h-screen relative">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex gap-3">
            <AddEventDialog
              vehicleId={formData.id}
              vehicleDescription={`${formData.brand} ${formData.model} ${formData.year}`}
            />
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        {/* Photo Gallery Dialog */}
        <Dialog open={showPhotoGallery} onOpenChange={setShowPhotoGallery}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Galería de Fotos</DialogTitle>
            </DialogHeader>
            {photos.length > 0 && (
              <div className="flex-grow flex flex-col justify-center items-center relative overflow-hidden">
                <img
                  src={photos[currentPhotoIndex]?.url}
                  alt={photos[currentPhotoIndex]?.name}
                  className="max-w-full max-h-full object-contain bg-gray-100 rounded-lg"
                />
                {photos.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      onClick={() => setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
            {photos.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t mt-4">
                <p className="text-sm text-gray-600">Foto {currentPhotoIndex + 1} de {photos.length} ({photos[currentPhotoIndex]?.name})</p>
                <div className="flex gap-2">
                  <a href={photos[currentPhotoIndex]?.url} target="_blank" rel="noopener noreferrer" download>
                    <Button variant="secondary" size="sm">
                      <Download className="w-4 h-4 mr-2" /> Descargar
                    </Button>
                  </a>
                  <Button variant="destructive" size="sm" onClick={() => handleRemoveFile('photos', currentPhotoIndex)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Main Vehicle Card */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">{formData.brand} {formData.model}</h1>
                <p className="text-gray-500">{formData.year} • {formData.plate}</p>
              </div>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue>
                    <Badge className={`${STATUS_COLORS[formData.status]} border text-lg px-4 py-2`}>
                      {formData.status}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A INGRESAR">A INGRESAR</SelectItem>
                  <SelectItem value="EN REPARACION">EN REPARACION</SelectItem>
                  <SelectItem value="DISPONIBLE">DISPONIBLE</SelectItem>
                  <SelectItem value="PAUSADO">PAUSADO</SelectItem>
                  <SelectItem value="RESERVADO">RESERVADO</SelectItem>
                  <SelectItem value="VENDIDO">VENDIDO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Fecha de Ingreso</Label>
                <Input
                  type="date"
                  value={formData.entry_date || ''}
                  onChange={(e) => handleChange('entry_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Propiedad</Label>
                <Input
                  value={formData.ownership || ''}
                  onChange={(e) => handleChange('ownership', e.target.value)}
                  placeholder="Ej: Consignación, Titular, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Año</Label>
                <Input
                  type="number"
                  value={formData.year || ''}
                  onChange={(e) => handleChange('year', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Dominio</Label>
                <Input
                  value={formData.plate || ''}
                  onChange={(e) => handleChange('plate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kilometraje</Label>
                <Input
                  type="number"
                  value={formData.kilometers || ''}
                  onChange={(e) => handleChange('kilometers', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={formData.color || ''}
                  onChange={(e) => handleChange('color', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Radicación Ciudad</Label>
                <Input
                  value={formData.registration_city || ''}
                  onChange={(e) => handleChange('registration_city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Radicación Provincia</Label>
                <Input
                  value={formData.registration_province || ''}
                  onChange={(e) => handleChange('registration_province', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Marca Motor</Label>
                <Input
                  value={formData.engine_brand || ''}
                  onChange={(e) => handleChange('engine_brand', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>N° Motor</Label>
                <Input
                  value={formData.engine_number || ''}
                  onChange={(e) => handleChange('engine_number', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Marca Chasis</Label>
                <Input
                  value={formData.chassis_brand || ''}
                  onChange={(e) => handleChange('chassis_brand', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>N° Chasis</Label>
                <Input
                  value={formData.chassis_number || ''}
                  onChange={(e) => handleChange('chassis_number', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cliente Proveedor</Label>
                <Select
                  value={formData.supplier_client_id || ''}
                  onValueChange={(value) => {
                    const client = clients.find(c => c.id === value);
                    handleChange('supplier_client_id', value);
                    handleChange('supplier_client_name', client?.full_name || '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Sin proveedor</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Infoauto USD</Label>
                <Input
                  type="number"
                  value={formData.infoauto_usd || ''}
                  onChange={(e) => handleChange('infoauto_usd', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Infoauto ARS</Label>
                <Input
                  type="number"
                  value={formData.infoauto_ars || ''}
                  onChange={(e) => handleChange('infoauto_ars', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Costo ARS</Label>
                <Input
                  type="number"
                  value={formData.cost_ars || ''}
                  onChange={(e) => handleChange('cost_ars', parseFloat(e.target.value) || 0)}
                  className="font-bold text-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Costo USD</Label>
                <Input
                  type="number"
                  value={formData.cost_usd || ''}
                  onChange={(e) => handleChange('cost_usd', parseFloat(e.target.value) || 0)}
                  className="font-bold text-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Venta ARS</Label>
                <Input
                  type="number"
                  value={formData.price_ars || ''}
                  onChange={(e) => handleChange('price_ars', parseFloat(e.target.value) || 0)}
                  className="font-bold text-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Venta USD</Label>
                <Input
                  type="number"
                  value={formData.price_usd || ''}
                  onChange={(e) => handleChange('price_usd', parseFloat(e.target.value) || 0)}
                  className="font-bold text-xl"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label>Carpeta Drive URL</Label>
                <Input
                  value={formData.folder_url || ''}
                  onChange={(e) => handleChange('folder_url', e.target.value)}
                  placeholder="URL de Google Drive"
                />
                {formData.folder_url && (
                  <a href={formData.folder_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm">
                    <ExternalLink className="w-3 h-3" /> Abrir
                  </a>
                )}
              </div>
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label>Ficha URL</Label>
                <Input
                  value={formData.file_url || ''}
                  onChange={(e) => handleChange('file_url', e.target.value)}
                  placeholder="URL de la ficha"
                />
                {formData.file_url && (
                  <a href={formData.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm">
                    <ExternalLink className="w-3 h-3" /> Abrir
                  </a>
                )}
              </div>
            </div>

            {/* Fotos Section - EDITABLE */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Fotos del Vehículo ({photos.length})
                </h3>
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Button type="button" size="sm" disabled={uploading} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Subiendo...' : 'Agregar Fotos'}
                    </span>
                  </Button>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'photos')}
                />
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-all"
                        onClick={() => {
                          setCurrentPhotoIndex(index);
                          setShowPhotoGallery(true);
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile('photos', index); }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No hay fotos. Haz clic en "Agregar Fotos"</p>
                </div>
              )}
            </div>

            {/* Documentos Section - EDITABLE */}
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos ({documents.length})
                </h3>
                <label htmlFor="document-upload" className="cursor-pointer">
                  <Button type="button" size="sm" disabled={uploading} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Subiendo...' : 'Agregar Documentos'}
                    </span>
                  </Button>
                </label>
                <input
                  id="document-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'documents')}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
              </div>

              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm truncate">{doc.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" download>
                          <Button variant="ghost" size="icon">
                            <Download className="w-4 h-4 text-blue-600" />
                          </Button>
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile('documents', index)}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No hay documentos. Haz clic en "Agregar Documentos"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección de Costos */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Costos del Vehículo
              </CardTitle>
              <Button onClick={() => setShowExpenseForm(!showExpenseForm)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Gasto
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Costo Base ARS</p>
                <p className="font-bold text-lg">${formData.cost_ars?.toLocaleString('es-AR') || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Costo Base USD</p>
                <p className="font-bold text-lg">USD {formData.cost_usd?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
              </div>
            </div>

            {showExpenseForm && (
              <Card className="border border-gray-200">
                <CardContent className="p-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Gasto</Label>
                      <Select value={newExpense.type} onValueChange={(value) => setNewExpense({...newExpense, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GESTORIA">Gestoría</SelectItem>
                          <SelectItem value="TALLER">Taller</SelectItem>
                          <SelectItem value="CHAPISTA">Chapista</SelectItem>
                          <SelectItem value="LIMPIEZA">Limpieza</SelectItem>
                          <SelectItem value="VERIFICACION">Verificación</SelectItem>
                          <SelectItem value="OTRO">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha del Gasto</Label>
                      <Input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Monto ARS</Label>
                    <Input
                      type="number"
                      value={newExpense.amount_ars}
                      onChange={(e) => setNewExpense({...newExpense, amount_ars: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowExpenseForm(false)} size="sm">
                      Cancelar
                    </Button>
                    <Button onClick={handleAddExpense} size="sm">
                      Guardar Gasto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {expenses.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Lista de Gastos</h4>
                {expenses.map((expense, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{expense.type}</p>
                      <p className="text-xs text-gray-600">{expense.description}</p>
                      <p className="text-xs text-gray-500">{expense.date}</p>
                    </div>
                    <div className="text-right mr-3">
                      <p className="font-semibold">${expense.amount_ars?.toLocaleString('es-AR')}</p>
                      <p className="text-sm text-gray-600">USD {expense.amount_usd?.toFixed(2)}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveExpense(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border-2 border-green-300">
              <div>
                <p className="text-sm font-semibold text-gray-700">COSTO TOTAL ARS</p>
                <p className="font-bold text-2xl text-green-700">${totalCostArs.toLocaleString('es-AR')}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">COSTO TOTAL USD</p>
                <p className="font-bold text-2xl text-green-700">USD {totalCostUsd.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist de Mantenimiento */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-100 p-6">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Service Aceite - Fecha</Label>
                <Input
                  type="date"
                  value={formData.documentation_checklist.maintenance.oil_service_date}
                  onChange={(e) => handleChecklistChange('maintenance', 'oil_service_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kilometraje</Label>
                <Input
                  type="number"
                  value={formData.documentation_checklist.maintenance.oil_service_km}
                  onChange={(e) => handleChecklistChange('maintenance', 'oil_service_km', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Service Distribución - Fecha</Label>
                <Input
                  type="date"
                  value={formData.documentation_checklist.maintenance.distribution_service_date}
                  onChange={(e) => handleChecklistChange('maintenance', 'distribution_service_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kilometraje</Label>
                <Input
                  type="number"
                  value={formData.documentation_checklist.maintenance.distribution_service_km}
                  onChange={(e) => handleChecklistChange('maintenance', 'distribution_service_km', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Service Caja - Fecha</Label>
                <Input
                  type="date"
                  value={formData.documentation_checklist.maintenance.gearbox_service_date}
                  onChange={(e) => handleChecklistChange('maintenance', 'gearbox_service_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kilometraje</Label>
                <Input
                  type="number"
                  value={formData.documentation_checklist.maintenance.gearbox_service_km}
                  onChange={(e) => handleChecklistChange('maintenance', 'gearbox_service_km', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.documentation_checklist.maintenance.maintenance_notes}
                onChange={(e) => handleChecklistChange('maintenance', 'maintenance_notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Checklist de Documentos */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-100 p-6">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'original_card', label: 'Cédula original' },
                { key: 'authorized_cards', label: 'Cédulas de autorizado' },
                { key: 'cat', label: 'C.A.T.' },
                { key: 'form_08', label: '08 Firmado' },
                { key: 'police_verification', label: 'Verificación policial' },
                { key: 'domain_report', label: 'Informe de dominio' },
                { key: 'fines_report', label: 'Informe de multas' },
                { key: 'patent_payment', label: 'Comprobante pago patentes' },
                { key: 'sale_report', label: 'Denuncia de venta' },
                { key: 'lien', label: 'Prenda' },
                { key: 'lien_cancellation', label: 'Cancelación de prenda' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`doc-${key}`}
                    checked={formData.documentation_checklist.documents[key]}
                    onCheckedChange={(checked) => handleChecklistChange('documents', key, checked)}
                  />
                  <label htmlFor={`doc-${key}`} className="text-sm font-medium cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.documentation_checklist.documents.documents_notes}
                onChange={(e) => handleChecklistChange('documents', 'documents_notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Checklist de Accesorios */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-100 p-6">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Accesorios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'manuals', label: 'Manuales' },
                { key: 'spare_key', label: 'Duplicado de llave' },
                { key: 'spare_tire', label: 'Auxilio' },
                { key: 'jack', label: 'Criquet' },
                { key: 'security_nut', label: 'Tuerca de seguridad antirrobo' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`acc-${key}`}
                    checked={formData.documentation_checklist.accessories[key]}
                    onCheckedChange={(checked) => handleChecklistChange('accessories', key, checked)}
                  />
                  <label htmlFor={`acc-${key}`} className="text-sm font-medium cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.documentation_checklist.accessories.accessories_notes}
                onChange={(e) => handleChecklistChange('accessories', 'accessories_notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
