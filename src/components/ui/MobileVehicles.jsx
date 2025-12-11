import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Car, Eye, Edit, Wrench, CheckCircle, PauseCircle, Tag, XCircle, Clock, Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileHeader from "./MobileHeader";
import { MobileTable, MobileCard, MobileCardField } from "./MobileTable";
import VehicleView from "../vehicles/VehicleView";
import VehicleFormDialog from "../vehicles/VehicleFormDialog";

const STATUS_CONFIG = {
  'A PERITAR': { bg: 'bg-amber-100 text-amber-700', icon: Wrench },
  'A INGRESAR': { bg: 'bg-cyan-100 text-cyan-700', icon: Clock },
  'EN REPARACION': { bg: 'bg-gray-200 text-gray-600', icon: Wrench },
  'DISPONIBLE': { bg: 'bg-cyan-500 text-white', icon: CheckCircle },
  'PAUSADO': { bg: 'bg-gray-200 text-gray-500', icon: PauseCircle },
  'RESERVADO': { bg: 'bg-gray-900 text-white', icon: Tag },
  'VENDIDO': { bg: 'bg-red-100 text-red-700', icon: Tag },
  'ENTREGADO': { bg: 'bg-red-600 text-white', icon: XCircle }
};

const formatPrice = (value, currency) => {
  if (!value) return '-';
  if (currency === 'USD') return `U$D ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
};

export default function MobileVehicles() {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Reset to list when clicking module in sidebar
  React.useEffect(() => {
    const handleReset = (e) => {
      if (e.detail === 'Vehicles') {
        setSelectedVehicle(null);
        setEditingVehicle(null);
      }
    };
    window.addEventListener('resetModuleView', handleReset);
    return () => window.removeEventListener('resetModuleView', handleReset);
  }, []);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('-created_at'),
  });

  // Filter vehicles based on search and status
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchTerm === '' ||
      vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.year?.toString().includes(searchTerm);

    const matchesStatus = filterStatus === 'ALL' || vehicle.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Set selected vehicle from URL param
  useEffect(() => {
    if (vehicleId && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    }
  }, [vehicleId, vehicles]);

  const handleViewVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    navigate(`/vehicles/${vehicle.id}`);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
  };

  const handleAddVehicle = () => {
    setEditingVehicle({});
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['A INGRESAR'];
    const IconComponent = config.icon;
    return (
      <Badge className={`${config.bg} flex items-center gap-1 text-xs`}>
        <IconComponent className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  // If showing vehicle detail
  if (selectedVehicle) {
    return (
      <div className="min-h-screen bg-gray-100">
        <MobileHeader
          title={`${selectedVehicle.brand} ${selectedVehicle.model}`}
          subtitle={selectedVehicle.license_plate}
          showBack={true}
          onBack={() => {
            setSelectedVehicle(null);
            navigate('/Vehicles');
          }}
          actions={[
            {
              icon: Edit,
              onClick: () => handleEditVehicle(selectedVehicle),
              label: "Editar"
            }
          ]}
        />
        <VehicleView
          vehicle={selectedVehicle}
          onClose={() => {
            setSelectedVehicle(null);
            navigate('/Vehicles');
          }}
        />
      </div>
    );
  }

  if (!isMobile) return null;

  const vehicleColumns = [
    {
      label: "Vehículo",
      key: "brand",
      render: (brand, vehicle) => `${brand} ${vehicle.model} ${vehicle.year}`
    },
    {
      label: "Patente",
      key: "license_plate"
    },
    {
      label: "Estado",
      key: "status",
      render: (status) => getStatusBadge(status)
    },
    {
      label: "Precio",
      key: "public_price",
      render: (price, vehicle) => formatPrice(price, vehicle.public_price_currency)
    }
  ];

  return (
    <div className="p-4 space-y-4">
      <MobileHeader
        title="Vehículos"
        subtitle={`${filteredVehicles.length} vehículos`}
        actions={[
          {
            icon: Filter,
            onClick: () => setShowFilters(!showFilters),
          },
          {
            icon: Plus,
            onClick: handleAddVehicle,
            label: "Agregar"
          }
        ]}
      />

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por marca, modelo, patente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {showFilters && (
            <div className="space-y-3 pt-2 border-t">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Estado</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    {Object.keys(STATUS_CONFIG).map(status => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(status)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicles List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
        </div>
      ) : (
        <MobileTable
          data={filteredVehicles}
          columns={vehicleColumns}
          onRowClick={handleViewVehicle}
          keyField="id"
        />
      )}

      {/* Vehicle Form Dialog */}
      <VehicleFormDialog
        open={!!editingVehicle}
        onOpenChange={(open) => {
          if (!open) setEditingVehicle(null);
        }}
        existingVehicle={editingVehicle?.id ? editingVehicle : null}
        onVehicleCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          setEditingVehicle(null);
        }}
      />
    </div>
  );
}
