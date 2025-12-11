import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, User, Eye, Edit, Phone, Mail, Calendar, Car, Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import MobileHeader from "./MobileHeader";
import { MobileTable, MobileCard, MobileCardField } from "./MobileTable";
import LeadDetail from "../crm/LeadDetail";
import ClientDetail from "../clients/ClientDetail";

const STATUS_CONFIG = {
  'Nuevo': { bg: 'bg-cyan-100 text-cyan-700', icon: '○' },
  'Contactado': { bg: 'bg-gray-200 text-gray-700', icon: '◐' },
  'En negociación': { bg: 'bg-cyan-500 text-white', icon: '◑' },
  'Concretado': { bg: 'bg-gray-900 text-white', icon: '●' },
  'Perdido': { bg: 'bg-red-100 text-red-700', icon: '✕' }
};

const INTEREST_CONFIG = {
  'Bajo': { bg: 'bg-gray-100 text-gray-600', icon: '▽' },
  'Medio': { bg: 'bg-gray-200 text-gray-700', icon: '◇' },
  'Alto': { bg: 'bg-cyan-100 text-cyan-700', icon: '◆' },
  'Muy alto': { bg: 'bg-cyan-500 text-white', icon: '★' }
};

export default function MobileCRM() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-consultation_date')
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  // Filter leads based on search and status
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' ||
      lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);

    const matchesStatus = filterStatus === 'ALL' || lead.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Filter clients based on search
  const filteredClients = clients.filter(client => {
    return searchTerm === '' ||
      client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm);
  });

  // Set selected lead from URL param
  useEffect(() => {
    if (leadId && leads.length > 0) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setSelectedLead(lead);
      }
    }
  }, [leadId, leads]);

  const handleViewLead = (lead) => {
    setSelectedLead(lead);
    navigate(`/crm/${lead.id}`);
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['Nuevo'];
    return (
      <Badge className={`${config.bg} text-xs`}>
        {status}
      </Badge>
    );
  };

  const getInterestBadge = (interest) => {
    const config = INTEREST_CONFIG[interest] || INTEREST_CONFIG['Medio'];
    return (
      <Badge className={`${config.bg} text-xs`}>
        {interest}
      </Badge>
    );
  };

  // If showing lead detail
  if (selectedLead) {
    return (
      <div className="min-h-screen bg-gray-100">
        <MobileHeader
          title={selectedLead.full_name}
          subtitle="Lead"
          showBack={true}
          onBack={() => {
            setSelectedLead(null);
            navigate('/CRM');
          }}
        />
        <LeadDetail
          lead={selectedLead}
          onClose={() => {
            setSelectedLead(null);
            navigate('/CRM');
          }}
        />
      </div>
    );
  }

  // If showing client detail
  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onEdit={() => {}}
      />
    );
  }

  if (!isMobile) return null;

  const leadColumns = [
    {
      label: "Nombre",
      key: "full_name"
    },
    {
      label: "Estado",
      key: "status",
      render: (status) => getStatusBadge(status)
    },
    {
      label: "Interés",
      key: "interest_level",
      render: (interest) => getInterestBadge(interest)
    },
    {
      label: "Fecha",
      key: "consultation_date",
      render: (date) => date ? format(new Date(date), "d/MM/yy") : "-"
    }
  ];

  const clientColumns = [
    {
      label: "Nombre",
      key: "full_name"
    },
    {
      label: "Teléfono",
      key: "phone"
    },
    {
      label: "Email",
      key: "email"
    }
  ];

  return (
    <div className="p-4 space-y-4">
      <MobileHeader
        title="CRM"
        actions={[
          {
            icon: Filter,
            onClick: () => setShowFilters(!showFilters),
          },
          {
            icon: Plus,
            onClick: () => setActiveTab('leads') || setShowLeadForm(true),
            label: "Agregar"
          }
        ]}
      />

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, email, teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {showFilters && activeTab === 'leads' && (
            <div className="space-y-3 pt-3 border-t mt-3">
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
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Leads ({filteredLeads.length})
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Clientes ({filteredClients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4">
          <MobileTable
            data={filteredLeads}
            columns={leadColumns}
            onRowClick={handleViewLead}
            keyField="id"
          />
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <MobileTable
            data={filteredClients}
            columns={clientColumns}
            onRowClick={handleViewClient}
            keyField="id"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
