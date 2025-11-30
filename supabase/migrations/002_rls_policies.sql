-- Row Level Security (RLS) Policies
-- Basic policies for role-based access control

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE spouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE clause_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is Gerente or Administrador
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT role IN ('Gerente', 'Administrador') FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (is_admin_or_manager());

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (is_admin_or_manager());

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (is_admin_or_manager());

-- Vehicles table policies (all authenticated users can read/write)
CREATE POLICY "Authenticated users can view vehicles"
  ON vehicles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vehicles"
  ON vehicles FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vehicles"
  ON vehicles FOR DELETE
  USING (auth.role() = 'authenticated');

-- Clients table policies
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  USING (auth.role() = 'authenticated');

-- Spouses table policies
CREATE POLICY "Authenticated users can view spouses"
  ON spouses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert spouses"
  ON spouses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update spouses"
  ON spouses FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete spouses"
  ON spouses FOR DELETE
  USING (auth.role() = 'authenticated');

-- Sales table policies
CREATE POLICY "Authenticated users can view sales"
  ON sales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sales"
  ON sales FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sales"
  ON sales FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete sales"
  ON sales FOR DELETE
  USING (auth.role() = 'authenticated');

-- Reservations table policies
CREATE POLICY "Authenticated users can view reservations"
  ON reservations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update reservations"
  ON reservations FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete reservations"
  ON reservations FOR DELETE
  USING (auth.role() = 'authenticated');

-- Quotes table policies
CREATE POLICY "Authenticated users can view quotes"
  ON quotes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert quotes"
  ON quotes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update quotes"
  ON quotes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete quotes"
  ON quotes FOR DELETE
  USING (auth.role() = 'authenticated');

-- Leads table policies
CREATE POLICY "Authenticated users can view leads"
  ON leads FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert leads"
  ON leads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete leads"
  ON leads FOR DELETE
  USING (auth.role() = 'authenticated');

-- Tasks table policies
CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tasks"
  ON tasks FOR DELETE
  USING (auth.role() = 'authenticated');

-- Calendar Events table policies
CREATE POLICY "Authenticated users can view calendar_events"
  ON calendar_events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert calendar_events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update calendar_events"
  ON calendar_events FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete calendar_events"
  ON calendar_events FOR DELETE
  USING (auth.role() = 'authenticated');

-- Vehicle Inspections table policies
CREATE POLICY "Authenticated users can view vehicle_inspections"
  ON vehicle_inspections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert vehicle_inspections"
  ON vehicle_inspections FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vehicle_inspections"
  ON vehicle_inspections FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vehicle_inspections"
  ON vehicle_inspections FOR DELETE
  USING (auth.role() = 'authenticated');

-- Sellers table policies
CREATE POLICY "Authenticated users can view sellers"
  ON sellers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert sellers"
  ON sellers FOR INSERT
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Admins can update sellers"
  ON sellers FOR UPDATE
  USING (is_admin_or_manager());

CREATE POLICY "Admins can delete sellers"
  ON sellers FOR DELETE
  USING (is_admin_or_manager());

-- Branches table policies
CREATE POLICY "Authenticated users can view branches"
  ON branches FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert branches"
  ON branches FOR INSERT
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Admins can update branches"
  ON branches FOR UPDATE
  USING (is_admin_or_manager());

CREATE POLICY "Admins can delete branches"
  ON branches FOR DELETE
  USING (is_admin_or_manager());

-- Exchange Rates table policies
CREATE POLICY "Authenticated users can view exchange_rates"
  ON exchange_rates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert exchange_rates"
  ON exchange_rates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update exchange_rates"
  ON exchange_rates FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete exchange_rates"
  ON exchange_rates FOR DELETE
  USING (auth.role() = 'authenticated');

-- Agency Settings table policies
CREATE POLICY "Authenticated users can view agency_settings"
  ON agency_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert agency_settings"
  ON agency_settings FOR INSERT
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Admins can update agency_settings"
  ON agency_settings FOR UPDATE
  USING (is_admin_or_manager());

CREATE POLICY "Admins can delete agency_settings"
  ON agency_settings FOR DELETE
  USING (is_admin_or_manager());

-- Contract Templates table policies
CREATE POLICY "Authenticated users can view contract_templates"
  ON contract_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert contract_templates"
  ON contract_templates FOR INSERT
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Admins can update contract_templates"
  ON contract_templates FOR UPDATE
  USING (is_admin_or_manager());

CREATE POLICY "Admins can delete contract_templates"
  ON contract_templates FOR DELETE
  USING (is_admin_or_manager());

-- Document Templates table policies
CREATE POLICY "Authenticated users can view document_templates"
  ON document_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert document_templates"
  ON document_templates FOR INSERT
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Admins can update document_templates"
  ON document_templates FOR UPDATE
  USING (is_admin_or_manager());

CREATE POLICY "Admins can delete document_templates"
  ON document_templates FOR DELETE
  USING (is_admin_or_manager());

-- Clause Templates table policies
CREATE POLICY "Authenticated users can view clause_templates"
  ON clause_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert clause_templates"
  ON clause_templates FOR INSERT
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Admins can update clause_templates"
  ON clause_templates FOR UPDATE
  USING (is_admin_or_manager());

CREATE POLICY "Admins can delete clause_templates"
  ON clause_templates FOR DELETE
  USING (is_admin_or_manager());

-- Documents table policies
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update documents"
  ON documents FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents"
  ON documents FOR DELETE
  USING (auth.role() = 'authenticated');

-- Contracts table policies
CREATE POLICY "Authenticated users can view contracts"
  ON contracts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contracts"
  ON contracts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete contracts"
  ON contracts FOR DELETE
  USING (auth.role() = 'authenticated');

-- Consignments table policies
CREATE POLICY "Authenticated users can view consignments"
  ON consignments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert consignments"
  ON consignments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update consignments"
  ON consignments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete consignments"
  ON consignments FOR DELETE
  USING (auth.role() = 'authenticated');

-- Transactions table policies
CREATE POLICY "Authenticated users can view transactions"
  ON transactions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update transactions"
  ON transactions FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete transactions"
  ON transactions FOR DELETE
  USING (auth.role() = 'authenticated');

-- Services table policies
CREATE POLICY "Authenticated users can view services"
  ON services FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert services"
  ON services FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update services"
  ON services FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete services"
  ON services FOR DELETE
  USING (auth.role() = 'authenticated');

-- Financial Records table policies
CREATE POLICY "Authenticated users can view financial_records"
  ON financial_records FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert financial_records"
  ON financial_records FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update financial_records"
  ON financial_records FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete financial_records"
  ON financial_records FOR DELETE
  USING (auth.role() = 'authenticated');

