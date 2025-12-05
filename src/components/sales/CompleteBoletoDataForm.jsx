import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CompleteBoletoDataForm({ open, onOpenChange, sale, vehicle, client, onBoletoComplete }) {
  const queryClient = useQueryClient();

  // Estado para datos del vehículo
  const [vehicleData, setVehicleData] = useState({
    engine_number: '',
    chassis_number: '',
    chassis_brand: '',
    engine_brand: '',
    registration_city: '',
    registration_province: ''
  });

  // Estado para datos del cliente
  const [clientData, setClientData] = useState({
    dni: '',
    cuit_cuil: '',
    address: '',
    city: '',
    province: ''
  });

  // Detectar campos faltantes
  const getMissingFields = () => {
    const missing = {
      vehicle: [],
      client: []
    };

    // Verificar vehículo
    if (!vehicle?.engine_number) missing.vehicle.push({ field: 'engine_number', label: 'N° Motor' });
    if (!vehicle?.chassis_number) missing.vehicle.push({ field: 'chassis_number', label: 'N° Chasis' });
    if (!vehicle?.chassis_brand) missing.vehicle.push({ field: 'chassis_brand', label: 'Marca Chasis' });
    if (!vehicle?.engine_brand) missing.vehicle.push({ field: 'engine_brand', label: 'Marca Motor' });
    if (!vehicle?.registration_city) missing.vehicle.push({ field: 'registration_city', label: 'Ciudad Radicación' });
    if (!vehicle?.registration_province) missing.vehicle.push({ field: 'registration_province', label: 'Provincia Radicación' });

    // Verificar cliente
    if (!client?.dni) missing.client.push({ field: 'dni', label: 'DNI' });
    if (!client?.cuit_cuil) missing.client.push({ field: 'cuit_cuil', label: 'CUIT/CUIL' });
    if (!client?.address) missing.client.push({ field: 'address', label: 'Dirección' });
    if (!client?.city) missing.client.push({ field: 'city', label: 'Ciudad' });
    if (!client?.province) missing.client.push({ field: 'province', label: 'Provincia' });

    return missing;
  };

  // Inicializar datos cuando se abre el modal
  useEffect(() => {
    if (open && vehicle) {
      setVehicleData({
        engine_number: vehicle.engine_number || '',
        chassis_number: vehicle.chassis_number || '',
        chassis_brand: vehicle.chassis_brand || '',
        engine_brand: vehicle.engine_brand || '',
        registration_city: vehicle.registration_city || '',
        registration_province: vehicle.registration_province || ''
      });
    }
    if (open && client) {
      setClientData({
        dni: client.dni || '',
        cuit_cuil: client.cuit_cuil || '',
        address: client.address || '',
        city: client.city || '',
        province: client.province || ''
      });
    }
  }, [open, vehicle, client]);

  const missingFields = getMissingFields();
  const hasMissingFields = missingFields.vehicle.length > 0 || missingFields.client.length > 0;

  // Mutation para actualizar vehículo
  const updateVehicleMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Vehicle.update(vehicle.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle?.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    }
  });

  // Mutation para actualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Client.update(client.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', client?.id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });

  const handleVehicleChange = (field, value) => {
    setVehicleData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientChange = (field, value) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que todos los campos requeridos estén completos
    const vehicleUpdates = {};
    const clientUpdates = {};

    let hasErrors = false;

    // Validar vehículo
    missingFields.vehicle.forEach(({ field, label }) => {
      const value = vehicleData[field]?.trim();
      if (!value) {
        toast.error(`El campo "${label}" es requerido`);
        hasErrors = true;
      } else {
        vehicleUpdates[field] = value;
      }
    });

    // Validar cliente
    missingFields.client.forEach(({ field, label }) => {
      const value = clientData[field]?.trim();
      if (!value) {
        toast.error(`El campo "${label}" es requerido`);
        hasErrors = true;
      } else {
        clientUpdates[field] = value;
      }
    });

    if (hasErrors) {
      return;
    }

    try {
      // Actualizar vehículo si hay cambios
      if (Object.keys(vehicleUpdates).length > 0 && vehicle?.id) {
        await updateVehicleMutation.mutateAsync(vehicleUpdates);
        toast.success('Datos del vehículo actualizados');
      }

      // Actualizar cliente si hay cambios
      if (Object.keys(clientUpdates).length > 0 && client?.id) {
        await updateClientMutation.mutateAsync(clientUpdates);
        toast.success('Datos del cliente actualizados');
      }

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['sale', sale?.id] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });

      toast.success('¡Datos completados! Ahora puedes crear el boleto.');
      onOpenChange(false);
      if (onBoletoComplete) {
        onBoletoComplete();
      }
    } catch (error) {
      console.error('Error actualizando datos:', error);
      toast.error('Error al actualizar los datos. Por favor, intenta nuevamente.');
    }
  };

  if (!hasMissingFields) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Datos Completos
            </DialogTitle>
            <DialogDescription>
              Todos los datos necesarios para el boleto están completos. Puedes crear el boleto ahora.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            {onBoletoComplete && (
              <Button onClick={onBoletoComplete} className="bg-cyan-600 hover:bg-cyan-700">
                Crear Boleto
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Completar Datos para Boleto
          </DialogTitle>
          <DialogDescription>
            Para crear el boleto de compraventa, necesitas completar los siguientes campos faltantes:
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Completa todos los campos marcados como requeridos para poder generar el boleto.
            </AlertDescription>
          </Alert>

          {/* Datos del Vehículo */}
          {missingFields.vehicle.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-700">DATOS DEL VEHÍCULO</h3>
                <Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {missingFields.vehicle.map(({ field, label }) => (
                  <div key={field}>
                    <Label className="text-[11px] text-gray-600">{label} *</Label>
                    <Input
                      className="h-9 text-[12px]"
                      value={vehicleData[field]}
                      onChange={(e) => handleVehicleChange(field, e.target.value)}
                      placeholder={`Ingrese ${label.toLowerCase()}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datos del Cliente */}
          {missingFields.client.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-700">DATOS DEL COMPRADOR</h3>
                <Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {missingFields.client.map(({ field, label }) => (
                  <div key={field}>
                    <Label className="text-[11px] text-gray-600">{label} *</Label>
                    <Input
                      className="h-9 text-[12px]"
                      value={clientData[field]}
                      onChange={(e) => handleClientChange(field, e.target.value)}
                      placeholder={`Ingrese ${label.toLowerCase()}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
              Guardar y Crear Boleto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

