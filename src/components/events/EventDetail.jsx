
import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, Car as CarIcon, FileText, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import VehicleView from "../vehicles/VehicleView";
import ClientDetail from "../clients/ClientDetail";

export default function EventDetail({ event, onClose }) {
  const queryClient = useQueryClient();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', event.related_vehicle_id],
    queryFn: () => base44.entities.Vehicle.list().then(vehicles => vehicles.find(v => v.id === event.related_vehicle_id)),
    enabled: !!event.related_vehicle_id
  });

  const { data: client } = useQuery({
    queryKey: ['client', event.related_client_id],
    queryFn: () => base44.entities.Client.list().then(clients => clients.find(c => c.id === event.related_client_id)),
    enabled: !!event.related_client_id
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({
      id: event.id,
      data: { status: newStatus }
    });
  };

  const handlePriorityChange = (newPriority) => {
    updateMutation.mutate({
      id: event.id,
      data: { priority: newPriority }
    });
  };

  const priorityColors = {
    'BAJA': 'bg-gray-100 text-gray-700 border-gray-300',
    'MEDIA': 'bg-blue-100 text-blue-700 border-blue-300',
    'ALTA': 'bg-orange-100 text-orange-700 border-orange-300',
    'URGENTE': 'bg-red-100 text-red-700 border-red-300'
  };

  const statusColors = {
    'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'En proceso': 'bg-blue-100 text-blue-800 border-blue-300',
    'Realizada': 'bg-green-100 text-green-800 border-green-300',
    'Cancelada': 'bg-red-100 text-red-800 border-red-300',
    'Perdida': 'bg-gray-100 text-gray-800 border-gray-300'
  };

  if (selectedVehicle) {
    return (
      <VehicleView
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onEdit={() => {}} // No edit functionality desired here, but prop expected
      />
    );
  }

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onEdit={() => {}} // No edit functionality desired here, but prop expected
      />
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{event.title}</CardTitle>
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{format(new Date(event.event_date), 'dd MMMM yyyy', { locale: es })}</span>
                  {event.event_time && (
                    <>
                      <Clock className="w-4 h-4 ml-2" />
                      <span>{event.event_time}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className={`${priorityColors[event.priority]} border text-lg px-4 py-2`}>
                  {event.priority}
                </Badge>
                <Badge className={`${statusColors[event.status]} border text-lg px-4 py-2`}>
                  {event.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Edit className="w-6 h-6 text-purple-600" />
                    <h3 className="font-bold text-lg">Tipo de Evento</h3>
                  </div>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {event.event_type}
                  </Badge>
                </CardContent>
              </Card>

              {event.responsible && (
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <User className="w-6 h-6 text-blue-600" />
                      <h3 className="font-bold text-lg">Responsable</h3>
                    </div>
                    <p className="text-lg">{event.responsible}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {vehicle && (
              <Card 
                className="border-2 border-blue-200 bg-blue-50 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <CarIcon className="w-6 h-6 text-blue-600" />
                    <h3 className="font-bold text-lg">Vehículo Relacionado</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-lg">{vehicle.brand} {vehicle.model}</p>
                    <p className="text-gray-700">Año: {vehicle.year} • Patente: {vehicle.plate}</p>
                    <Badge>{vehicle.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {client && (
              <Card 
                className="border-2 border-purple-200 bg-purple-50 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedClient(client)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-6 h-6 text-purple-600" />
                    <h3 className="font-bold text-lg">Cliente Relacionado</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-lg">{client.full_name}</p>
                    <p className="text-gray-700">{client.phone}</p>
                    {client.email && <p className="text-gray-700">{client.email}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {event.description && (
              <Card>
                <CardHeader className="border-b p-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Descripción
                  </h3>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="border-b p-4">
                  <h3 className="font-bold">Cambiar Estado</h3>
                </CardHeader>
                <CardContent className="p-4">
                  <Select value={event.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="En proceso">En proceso</SelectItem>
                      <SelectItem value="Realizada">Realizada</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                      <SelectItem value="Perdida">Perdida</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b p-4">
                  <h3 className="font-bold">Cambiar Prioridad</h3>
                </CardHeader>
                <CardContent className="p-4">
                  <Select value={event.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAJA">BAJA</SelectItem>
                      <SelectItem value="MEDIA">MEDIA</SelectItem>
                      <SelectItem value="ALTA">ALTA</SelectItem>
                      <SelectItem value="URGENTE">URGENTE</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
