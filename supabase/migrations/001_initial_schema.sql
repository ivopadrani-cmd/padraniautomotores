-- Padrani Automotores - Initial Schema
-- This migration creates all tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'Administrador' CHECK (role IN ('Gerente', 'Administrador', 'Vendedor', 'Gestor', 'Comisionista', 'Mecánico')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table (MUST come before vehicles because vehicles references it)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  dni TEXT,
  cuit_cuil TEXT,
  city TEXT,
  province TEXT,
  address TEXT,
  postal_code TEXT,
  marital_status TEXT,
  client_status TEXT DEFAULT 'Cliente' CHECK (client_status IN ('Prospecto', 'Cliente', 'Ex Cliente')),
  observations TEXT,
  attached_documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sellers table (needed before reservations)
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'Vendedor' CHECK (role IN ('Gerente', 'Administrador', 'Vendedor', 'Gestor', 'Comisionista', 'Mecánico')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table (references clients)
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT DEFAULT 'DISPONIBLE' CHECK (status IN ('A PERITAR', 'A INGRESAR', 'EN REPARACION', 'DISPONIBLE', 'PAUSADO', 'RESERVADO', 'VENDIDO', 'ENTREGADO')),
  entry_date DATE,
  load_date DATE,
  ownership TEXT,
  supplier_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  supplier_client_name TEXT,
  is_supplier_owner BOOLEAN DEFAULT false,
  brand TEXT,
  model TEXT,
  year INTEGER,
  plate TEXT,
  kilometers INTEGER DEFAULT 0,
  color TEXT,
  registration_city TEXT,
  registration_province TEXT,
  engine_brand TEXT,
  engine_number TEXT,
  chassis_brand TEXT,
  chassis_number TEXT,
  cost_value DECIMAL(15,2) DEFAULT 0,
  cost_currency TEXT DEFAULT 'ARS' CHECK (cost_currency IN ('ARS', 'USD')),
  cost_exchange_rate DECIMAL(10,2),
  cost_date DATE,
  target_price_value DECIMAL(15,2) DEFAULT 0,
  target_price_currency TEXT DEFAULT 'ARS' CHECK (target_price_currency IN ('ARS', 'USD')),
  target_price_exchange_rate DECIMAL(10,2),
  public_price_value DECIMAL(15,2) DEFAULT 0,
  public_price_currency TEXT DEFAULT 'ARS' CHECK (public_price_currency IN ('ARS', 'USD')),
  public_price_exchange_rate DECIMAL(10,2),
  infoauto_value DECIMAL(15,2) DEFAULT 0,
  infoauto_currency TEXT DEFAULT 'ARS' CHECK (infoauto_currency IN ('ARS', 'USD')),
  infoauto_exchange_rate DECIMAL(10,2),
  folder_url TEXT,
  file_url TEXT,
  photos_url TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  expenses JSONB DEFAULT '[]'::jsonb,
  documentation_checklist JSONB DEFAULT '{"documents": {}, "accessories": {}}'::jsonb,
  consignment_minimum_price DECIMAL(15,2),
  consignment_start_date DATE,
  consignment_end_date DATE,
  assigned_mechanic_id TEXT,
  assigned_mechanic_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spouses table (references clients)
CREATE TABLE IF NOT EXISTS spouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  full_name TEXT,
  dni TEXT,
  cuit_cuil TEXT,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  occupation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table (references clients only, needed before quotes/sales)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_date DATE NOT NULL,
  consultation_time TIME,
  source TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  interested_vehicles JSONB DEFAULT '[]'::jsonb,
  other_interests TEXT,
  budget DECIMAL(15,2),
  preferred_contact TEXT DEFAULT 'WhatsApp',
  status TEXT DEFAULT 'Nuevo' CHECK (status IN ('Nuevo', 'Contactado', 'En negociación', 'Concretado', 'Perdido')),
  interest_level TEXT DEFAULT 'Medio' CHECK (interest_level IN ('Bajo', 'Medio', 'Alto', 'Muy alto')),
  observations TEXT,
  follow_up_date DATE,
  follow_up_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes table (references clients, vehicles, leads)
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_date DATE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  client_phone TEXT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_description TEXT,
  quoted_price_ars DECIMAL(15,2) DEFAULT 0,
  quoted_price_currency TEXT DEFAULT 'ARS' CHECK (quoted_price_currency IN ('ARS', 'USD')),
  quoted_price_exchange_rate DECIMAL(10,2),
  trade_in JSONB,
  financing_amount DECIMAL(15,2) DEFAULT 0,
  financing_bank TEXT,
  financing_installments INTEGER,
  financing_installment_value DECIMAL(15,2),
  notes TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  is_multi_quote BOOLEAN DEFAULT false,
  multi_quote_group_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservations table (references clients, vehicles, sellers)
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_date DATE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  client_phone TEXT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_description TEXT,
  seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
  seller_name TEXT,
  deposit_amount DECIMAL(15,2) DEFAULT 0,
  deposit_currency TEXT DEFAULT 'ARS' CHECK (deposit_currency IN ('ARS', 'USD')),
  deposit_exchange_rate DECIMAL(10,2),
  deposit_date DATE,
  deposit_description TEXT,
  agreed_price DECIMAL(15,2) DEFAULT 0,
  agreed_price_currency TEXT DEFAULT 'ARS' CHECK (agreed_price_currency IN ('ARS', 'USD')),
  agreed_price_exchange_rate DECIMAL(10,2),
  trade_in JSONB,
  financing_amount DECIMAL(15,2) DEFAULT 0,
  financing_bank TEXT,
  financing_installments INTEGER,
  financing_installment_value DECIMAL(15,2),
  status TEXT DEFAULT 'VIGENTE' CHECK (status IN ('VIGENTE', 'CONVERTIDA', 'CANCELADA')),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table (references clients, vehicles, reservations, leads, quotes)
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date DATE NOT NULL,
  seller TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_description TEXT,
  sale_price DECIMAL(15,2) DEFAULT 0,
  sale_price_currency TEXT DEFAULT 'ARS' CHECK (sale_price_currency IN ('ARS', 'USD')),
  sale_price_exchange_rate DECIMAL(10,2),
  deposit JSONB,
  cash_payment JSONB,
  trade_ins JSONB DEFAULT '[]'::jsonb,
  financing JSONB,
  balance_due_date DATE,
  sale_status TEXT DEFAULT 'PENDIENTE' CHECK (sale_status IN ('PENDIENTE', 'FINALIZADA', 'CANCELADA')),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  observations TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table (references vehicles, clients, sales, leads)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  task_date DATE NOT NULL,
  task_time TIME,
  task_type TEXT DEFAULT 'Tarea' CHECK (task_type IN ('Tarea', 'Trámite', 'Servicio', 'Gestoría', 'Evento', 'Seguimiento')),
  related_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  related_vehicle_description TEXT,
  related_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  related_client_name TEXT,
  related_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  related_sale_description TEXT,
  related_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  related_lead_description TEXT,
  responsible TEXT,
  description TEXT,
  status TEXT DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En proceso', 'Completada', 'Cancelada')),
  priority TEXT DEFAULT 'Media' CHECK (priority IN ('Baja', 'Media', 'Alta', 'Urgente')),
  cost DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar Events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle Inspections table
CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_description TEXT,
  inspection_date DATE NOT NULL,
  inspector_name TEXT,
  inspector_id TEXT,
  kilometers_at_inspection INTEGER,
  general_components JSONB,
  tires JSONB,
  has_accessories BOOLEAN DEFAULT false,
  accessories_detail TEXT,
  timing_belt_change JSONB,
  oil_service JSONB,
  original_accessories JSONB,
  has_extra_accessories BOOLEAN DEFAULT false,
  extra_accessories_detail TEXT,
  oil_leak_consumption JSONB,
  water_leak_consumption JSONB,
  parts_engraving JSONB,
  vtv_valid JSONB,
  paint_detail JSONB,
  recommendation TEXT CHECK (recommendation IN ('TOMAR', 'NO TOMAR', 'CONDICIONAL')),
  total_estimated_cost DECIMAL(15,2) DEFAULT 0,
  general_observations TEXT,
  status TEXT DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Pendiente aprobación', 'Aprobado', 'Rechazado', 'Revisión solicitada')),
  approved_by TEXT,
  approved_date DATE,
  revision_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  phone TEXT,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exchange Rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rate_date DATE NOT NULL,
  rate_type TEXT NOT NULL CHECK (rate_type IN ('Diaria', 'Mensual InfoAuto')),
  usd_rate DECIMAL(10,2) NOT NULL,
  source TEXT DEFAULT 'Manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agency Settings table (single row)
CREATE TABLE IF NOT EXISTS agency_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT,
  legal_name TEXT,
  cuit TEXT,
  representative_name TEXT,
  representative_dni TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract Templates table
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_content TEXT,
  template_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_content TEXT,
  template_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clause Templates table
CREATE TABLE IF NOT EXISTS clause_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  clause_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_date DATE,
  document_type TEXT,
  document_content TEXT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_date DATE,
  contract_type TEXT,
  contract_content TEXT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consignments table
CREATE TABLE IF NOT EXISTS consignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  minimum_price DECIMAL(15,2),
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE,
  transaction_type TEXT,
  amount DECIMAL(15,2),
  currency TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_date DATE,
  service_type TEXT,
  description TEXT,
  cost DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Records table
CREATE TABLE IF NOT EXISTS financial_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_date DATE,
  record_type TEXT,
  amount DECIMAL(15,2),
  currency TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_supplier_client_id ON vehicles(supplier_client_id);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_vehicle_id ON sales(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_id ON reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vehicle_id ON quotes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_related_vehicle_id ON tasks(related_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tasks_related_client_id ON tasks(related_client_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_id ON vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_status ON vehicle_inspections(status);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_rate_date ON exchange_rates(rate_date);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_rate_type ON exchange_rates(rate_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spouses_updated_at BEFORE UPDATE ON spouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_inspections_updated_at BEFORE UPDATE ON vehicle_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON exchange_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agency_settings_updated_at BEFORE UPDATE ON agency_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clause_templates_updated_at BEFORE UPDATE ON clause_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consignments_updated_at BEFORE UPDATE ON consignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_records_updated_at BEFORE UPDATE ON financial_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

