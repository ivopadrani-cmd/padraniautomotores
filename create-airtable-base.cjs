// Script para crear la estructura completa de Airtable para Padrani Automotores
// Genera un archivo JSON que se puede importar directamente a Airtable

const fs = require('fs');
const path = require('path');

console.log('🚗 CREANDO ESTRUCTURA DE AIRTABLE PARA PADRANI AUTOMOTORES\n');

// Estructura completa de la base de datos
const airtableStructure = {
  tables: [
    {
      name: "ExchangeRates",
      description: "Cotizaciones del dólar",
      fields: [
        { name: "Name", type: "formula", formula: "DATETIME_FORMAT({Rate Date}, 'DD/MM/YYYY') & ' - ' & {Rate Type}" },
        { name: "ID", type: "formula", formula: "'ER-' & RECORD_ID()" },
        { name: "Rate Date", type: "date", description: "Fecha de la cotización" },
        { name: "Rate Type", type: "singleSelect", options: ["Diaria", "Oficial"] },
        { name: "USD Rate", type: "number", description: "Cotización en pesos" },
        { name: "Source", type: "singleLineText", description: "Origen de la cotización" }
      ]
    },
    {
      name: "Users",
      description: "Usuarios del sistema",
      fields: [
        { name: "Name", type: "formula", formula: "{Full Name}" },
        { name: "ID", type: "formula", formula: "'U-' & RECORD_ID()" },
        { name: "Email", type: "email" },
        { name: "Full Name", type: "singleLineText" },
        { name: "Role", type: "singleSelect", options: ["Gerente", "Administrador", "Vendedor", "Gestor", "Comisionista", "Mecánico"] },
        { name: "Phone", type: "phoneNumber" },
        { name: "Active", type: "checkbox", default: true }
      ]
    },
    {
      name: "Clients",
      description: "Base de datos de clientes",
      fields: [
        { name: "Name", type: "formula", formula: "{Full Name}" },
        { name: "ID", type: "formula", formula: "'C-' & RECORD_ID()" },
        { name: "Full Name", type: "singleLineText" },
        { name: "Birth Date", type: "date" },
        { name: "Phone", type: "phoneNumber" },
        { name: "Email", type: "email" },
        { name: "DNI", type: "singleLineText" },
        { name: "CUIT/CUIL", type: "singleLineText" },
        { name: "Marital Status", type: "singleSelect", options: ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a"] },
        { name: "Address", type: "singleLineText" },
        { name: "City", type: "singleLineText" },
        { name: "Province", type: "singleSelect", options: ["Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Chaco", "Corrientes", "Misiones", "San Juan", "Jujuy", "Río Negro", "Formosa", "Neuquén", "Chubut", "San Luis", "Catamarca", "La Rioja", "La Pampa", "Santa Cruz", "Santiago del Estero", "Tierra del Fuego"] },
        { name: "Postal Code", type: "singleLineText" },
        { name: "Client Status", type: "singleSelect", options: ["Cliente", "Prospecto", "Inactivo"], default: "Cliente" },
        { name: "Observations", type: "singleLineText" },
        { name: "Age", type: "formula", formula: "DATETIME_DIFF(TODAY(), {Birth Date}, 'years')" },
        { name: "Created Date", type: "date", default: "now" },
        { name: "Last Contact", type: "date" }
      ]
    },
    {
      name: "Vehicles",
      description: "Inventario completo de vehículos",
      fields: [
        { name: "Name", type: "formula", formula: "{Brand} & ' ' & {Model} & ' ' & {Year} & ' - ' & {Plate}" },
        { name: "ID", type: "formula", formula: "'V-' & RECORD_ID()" },
        // Identificación
        { name: "Brand", type: "singleSelect", options: ["FORD", "TOYOTA", "VOLKSWAGEN", "RENAULT", "PEUGEOT", "CHEVROLET", "HONDA", "NISSAN", "FIAT", "CITROEN", "BMW", "MERCEDES", "AUDI", "JEEP", "MITSUBISHI", "KIA", "HYUNDAI", "SUZUKI"] },
        { name: "Model", type: "singleLineText" },
        { name: "Year", type: "number" },
        { name: "Vehicle Type", type: "singleSelect", options: ["SEDÁN", "HATCHBACK", "SUV", "PICKUP", "FURGÓN", "COUPE", "CONVERTIBLE"] },
        { name: "Plate", type: "singleLineText", description: "Dominio/Patente" },
        { name: "Color", type: "singleSelect", options: ["BLANCO", "NEGRO", "GRIS", "AZUL", "ROJO", "VERDE", "BEIGE", "BORDEAUX", "MARRÓN", "NARANJA", "AMARILLO", "VIOLETA"] },
        { name: "Kilometers", type: "number" },

        // Técnicos
        { name: "Engine Brand", type: "singleLineText" },
        { name: "Engine Number", type: "singleLineText" },
        { name: "Chassis Brand", type: "singleLineText" },
        { name: "Chassis Number", type: "singleLineText" },
        { name: "Registration City", type: "singleLineText" },
        { name: "Registration Province", type: "singleSelect", options: ["Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Chaco", "Corrientes", "Misiones", "San Juan", "Jujuy", "Río Negro", "Formosa", "Neuquén", "Chubut", "San Luis", "Catamarca", "La Rioja", "La Pampa", "Santa Cruz", "Santiago del Estero", "Tierra del Fuego"] },

        // Propiedad
        { name: "Ownership", type: "singleSelect", options: ["CONSIGNACIÓN", "100I", "100L", "100", "50I", "50L"] },
        { name: "Is Consignment", type: "checkbox" },
        { name: "Supplier Client", type: "link", link: "Clients" },
        { name: "Entry Date", type: "date" },

        // Precios - Costo
        { name: "Cost Value", type: "currency", currency: "ARS" },
        { name: "Cost Currency", type: "singleSelect", options: ["ARS", "USD"] },
        { name: "Cost Exchange Rate", type: "number" },

        // Precios - Target
        { name: "Target Price Value", type: "currency", currency: "ARS" },
        { name: "Target Price Currency", type: "singleSelect", options: ["ARS", "USD"], default: "ARS" },

        // Precios - Public
        { name: "Public Price Value", type: "currency", currency: "ARS" },
        { name: "Public Price Currency", type: "singleSelect", options: ["ARS", "USD"], default: "ARS" },

        // Precios - InfoAuto
        { name: "InfoAuto Value", type: "currency", currency: "ARS" },
        { name: "InfoAuto Exchange Rate", type: "number" },
        { name: "InfoAuto Date", type: "date" },

        // Estados
        { name: "Status", type: "singleSelect", options: ["A PERITAR", "A INGRESAR", "EN REPARACIÓN", "DISPONIBLE", "PAUSADO", "RESERVADO", "VENDIDO", "ENTREGADO"], default: "DISPONIBLE" },
        { name: "Inspection Requested Date", type: "date" },
        { name: "Inspection Requested By", type: "singleLineText" },
        { name: "Assigned Mechanic", type: "link", link: "Users" },

        // Gastos
        { name: "Expenses", type: "multipleSelect", options: ["GESTORIA", "FLETE", "REPARACION", "SEGURO", "OTROS"] },

        // Fotos y documentos
        { name: "Photos", type: "attachment" },
        { name: "Documents", type: "attachment" },

        // Checklist
        { name: "Manuals", type: "checkbox", default: true },
        { name: "Spare Key", type: "checkbox", default: true },
        { name: "Spare Tire", type: "checkbox", default: true },
        { name: "Jack", type: "checkbox", default: true },
        { name: "Security Nut", type: "checkbox", default: true },
        { name: "Fire Extinguisher", type: "checkbox", default: true },

        // Cálculos
        { name: "Total Cost ARS", type: "formula", formula: "IF({Cost Currency}='USD', {Cost Value}*{Cost Exchange Rate}, {Cost Value})" },
        { name: "Public Price ARS", type: "formula", formula: "IF({Public Price Currency}='USD', {Public Price Value}*1200, {Public Price Value})" },
        { name: "Margin", type: "formula", formula: "{Public Price ARS} - {Total Cost ARS}" },
        { name: "Margin %", type: "formula", formula: "IF({Total Cost ARS}>0, ROUND(({Margin}/{Total Cost ARS})*100, 1) & '%', 'N/A')" }
      ]
    },
    {
      name: "Leads",
      description: "Consultas y CRM",
      fields: [
        { name: "Name", type: "formula", formula: "{Client Name} & ' - ' & DATETIME_FORMAT({Consultation Date}, 'DD/MM/YYYY')" },
        { name: "ID", type: "formula", formula: "'L-' & RECORD_ID()" },
        { name: "Consultation Date", type: "date" },
        { name: "Consultation Time", type: "dateTime" },
        { name: "Source", type: "singleSelect", options: ["Salón", "Llamada", "Redes sociales", "Recomendado", "Email", "Sitio web"] },
        { name: "Client", type: "link", link: "Clients" },
        { name: "Client Name", type: "lookup", lookup: { table: "Clients", field: "Full Name" } },
        { name: "Client Phone", type: "lookup", lookup: { table: "Clients", field: "Phone" } },
        { name: "Client Email", type: "lookup", lookup: { table: "Clients", field: "Email" } },
        { name: "Interested Vehicles", type: "link", link: "Vehicles" },
        { name: "Budget", type: "currency", currency: "ARS" },
        { name: "Other Interests", type: "singleLineText" },
        { name: "Preferred Contact", type: "singleSelect", options: ["WhatsApp", "Email", "Teléfono"], default: "WhatsApp" },
        { name: "Trade-in Brand", type: "singleLineText" },
        { name: "Trade-in Model", type: "singleLineText" },
        { name: "Trade-in Year", type: "number" },
        { name: "Trade-in Plate", type: "singleLineText" },
        { name: "Trade-in Kilometers", type: "number" },
        { name: "Trade-in Color", type: "singleLineText" },
        { name: "Trade-in Value ARS", type: "currency", currency: "ARS" },
        { name: "Status", type: "singleSelect", options: ["Nuevo", "Contactado", "En negociación", "Concretado", "Perdido"], default: "Nuevo" },
        { name: "Interest Level", type: "singleSelect", options: ["Bajo", "Medio", "Alto", "Muy alto"], default: "Medio" },
        { name: "Observations", type: "singleLineText" },
        { name: "Follow-up Date", type: "date" },
        { name: "Follow-up Time", type: "dateTime" },
        { name: "Days Since Consultation", type: "formula", formula: "DATETIME_DIFF(TODAY(), {Consultation Date}, 'days')" },
        { name: "Is Overdue", type: "formula", formula: "IF(AND({Follow-up Date} < TODAY(), {Status} != 'Concretado', {Status} != 'Perdido'), 'SÍ', 'NO')" },
        { name: "Vehicle Count", type: "formula", formula: "ARRAYLEN({Interested Vehicles})" }
      ]
    },
    {
      name: "Sales",
      description: "Ventas completadas",
      fields: [
        { name: "Name", type: "formula", formula: "{Client Name} & ' - ' & {Vehicle Description} & ' - ' & DATETIME_FORMAT({Sale Date}, 'DD/MM/YYYY')" },
        { name: "ID", type: "formula", formula: "'S-' & RECORD_ID()" },
        { name: "Vehicle", type: "link", link: "Vehicles" },
        { name: "Vehicle Description", type: "lookup", lookup: { table: "Vehicles", field: "Name" } },
        { name: "Client", type: "link", link: "Clients" },
        { name: "Client Name", type: "lookup", lookup: { table: "Clients", field: "Full Name" } },
        { name: "Sale Date", type: "date" },
        { name: "Seller", type: "link", link: "Users" },
        { name: "Sale Price", type: "currency", currency: "ARS" },
        { name: "Sale Price Currency", type: "singleSelect", options: ["ARS", "USD"], default: "ARS" },
        { name: "Sale Price Exchange Rate", type: "number" },

        // Seña
        { name: "Deposit Amount", type: "currency", currency: "ARS" },
        { name: "Deposit Currency", type: "singleSelect", options: ["ARS", "USD"], default: "ARS" },
        { name: "Deposit Exchange Rate", type: "number" },
        { name: "Deposit Date", type: "date" },
        { name: "Deposit Payment Method", type: "singleSelect", options: ["Efectivo", "Transferencia", "Cheque", "Tarjeta"] },
        { name: "Deposit Description", type: "singleLineText" },

        // Pago en efectivo
        { name: "Cash Payment Amount", type: "currency", currency: "ARS" },
        { name: "Cash Payment Currency", type: "singleSelect", options: ["ARS", "USD"], default: "ARS" },
        { name: "Cash Payment Exchange Rate", type: "number" },
        { name: "Cash Payment Date", type: "date" },
        { name: "Cash Payment Method", type: "singleSelect", options: ["Efectivo", "Transferencia", "Cheque", "Tarjeta"] },

        // Financiación
        { name: "Financing Amount", type: "currency", currency: "ARS" },
        { name: "Financing Currency", type: "singleSelect", options: ["ARS", "USD"], default: "ARS" },
        { name: "Financing Exchange Rate", type: "number" },
        { name: "Financing Date", type: "date" },
        { name: "Financing Bank", type: "singleLineText" },
        { name: "Financing Installments", type: "number" },
        { name: "Financing Installment Value", type: "currency", currency: "ARS" },

        // Permutas
        { name: "Trade-ins", type: "link", link: "TradeIns" },
        { name: "Balance Due Date", type: "date" },
        { name: "Observations", type: "singleLineText" },

        // Cálculos
        { name: "Deposit Amount ARS", type: "formula", formula: "IF({Deposit Currency}='USD', {Deposit Amount}*{Deposit Exchange Rate}, {Deposit Amount})" },
        { name: "Cash Payment Amount ARS", type: "formula", formula: "IF({Cash Payment Currency}='USD', {Cash Payment Amount}*{Cash Payment Exchange Rate}, {Cash Payment Amount})" },
        { name: "Financing Amount ARS", type: "formula", formula: "IF({Financing Currency}='USD', {Financing Amount}*{Financing Exchange Rate}, {Financing Amount})" },
        { name: "Trade-ins Total Value", type: "rollup", rollup: { table: "TradeIns", field: "Value ARS", function: "SUM(values)" } },
        { name: "Total Paid", type: "formula", formula: "{Deposit Amount ARS} + {Cash Payment Amount ARS} + {Trade-ins Total Value}" },
        { name: "Remaining Balance", type: "formula", formula: "{Sale Price} - {Total Paid}" },
        { name: "Financing Monthly Payment", type: "formula", formula: "IF({Financing Installments}>0, {Financing Amount ARS}/{Financing Installments}, 0)" }
      ]
    },
    {
      name: "Reservations",
      description: "Reservas activas",
      fields: [
        { name: "Name", type: "formula", formula: "{Client Name} & ' - ' & {Vehicle Description}" },
        { name: "ID", type: "formula", formula: "'R-' & RECORD_ID()" },
        { name: "Vehicle", type: "link", link: "Vehicles" },
        { name: "Vehicle Description", type: "lookup", lookup: { table: "Vehicles", field: "Name" } },
        { name: "Client", type: "link", link: "Clients" },
        { name: "Client Name", type: "lookup", lookup: { table: "Clients", field: "Full Name" } },
        { name: "Reservation Date", type: "date" },
        { name: "Agreed Price", type: "currency", currency: "ARS" },
        { name: "Deposit Amount", type: "currency", currency: "ARS" },
        { name: "Deposit Currency", type: "singleSelect", options: ["ARS", "USD"], default: "ARS" },
        { name: "Deposit Exchange Rate", type: "number" },
        { name: "Deposit Date", type: "date" },
        { name: "Deposit Description", type: "singleLineText" },
        { name: "Financing Amount", type: "currency", currency: "ARS" },
        { name: "Financing Bank", type: "singleLineText" },
        { name: "Financing Installments", type: "number" },
        { name: "Financing Installment Value", type: "currency", currency: "ARS" },
        { name: "Status", type: "singleSelect", options: ["ACTIVA", "CONVERTIDA", "CANCELADA"], default: "ACTIVA" },
        { name: "Observations", type: "singleLineText" },
        { name: "Days Since Reservation", type: "formula", formula: "DATETIME_DIFF(TODAY(), {Reservation Date}, 'days')" },
        { name: "Deposit Percentage", type: "formula", formula: "IF({Agreed Price}>0, ROUND(({Deposit Amount}/{Agreed Price})*100, 1) & '%', 'N/A')" }
      ]
    },
    {
      name: "Quotes",
      description: "Presupuestos",
      fields: [
        { name: "Name", type: "formula", formula: "{Client Name} & ' - ' & {Vehicle Description}" },
        { name: "ID", type: "formula", formula: "'Q-' & RECORD_ID()" },
        { name: "Vehicle", type: "link", link: "Vehicles" },
        { name: "Vehicle Description", type: "lookup", lookup: { table: "Vehicles", field: "Name" } },
        { name: "Client", type: "link", link: "Clients" },
        { name: "Client Name", type: "lookup", lookup: { table: "Clients", field: "Full Name" } },
        { name: "Quote Date", type: "date" },
        { name: "Quoted Price ARS", type: "currency", currency: "ARS" },
        { name: "Trade-in Brand", type: "singleLineText" },
        { name: "Trade-in Model", type: "singleLineText" },
        { name: "Trade-in Year", type: "number" },
        { name: "Trade-in Value ARS", type: "currency", currency: "ARS" },
        { name: "Net Price", type: "formula", formula: "{Quoted Price ARS} - {Trade-in Value ARS}" }
      ]
    },
    {
      name: "Tasks",
      description: "Calendario de tareas",
      fields: [
        { name: "Name", type: "singleLineText" },
        { name: "ID", type: "formula", formula: "'T-' & RECORD_ID()" },
        { name: "Title", type: "singleLineText" },
        { name: "Description", type: "singleLineText" },
        { name: "Task Date", type: "date" },
        { name: "Task Time", type: "dateTime" },
        { name: "Task Type", type: "singleSelect", options: ["Tarea", "Trámite", "Servicio", "Gestoría", "Evento", "Seguimiento"] },
        { name: "Status", type: "singleSelect", options: ["Pendiente", "En proceso", "Completada", "Cancelada"], default: "Pendiente" },
        { name: "Priority", type: "singleSelect", options: ["Baja", "Media", "Alta", "Urgente"], default: "Media" },
        { name: "Responsible", type: "link", link: "Users" },
        { name: "Responsible Name", type: "lookup", lookup: { table: "Users", field: "Full Name" } },
        { name: "Related Vehicle", type: "link", link: "Vehicles" },
        { name: "Related Vehicle Description", type: "lookup", lookup: { table: "Vehicles", field: "Name" } },
        { name: "Related Client", type: "link", link: "Clients" },
        { name: "Related Client Name", type: "lookup", lookup: { table: "Clients", field: "Full Name" } },
        { name: "Related Lead", type: "link", link: "Leads" },
        { name: "Related Lead Description", type: "lookup", lookup: { table: "Leads", field: "Name" } },
        { name: "Cost", type: "currency", currency: "ARS" },
        { name: "Is Overdue", type: "formula", formula: "IF(AND({Task Date} < TODAY(), {Status} = 'Pendiente'), 'SÍ', 'NO')" },
        { name: "Days Until Due", type: "formula", formula: "DATETIME_DIFF({Task Date}, TODAY(), 'days')" },
        { name: "Full Date Time", type: "formula", formula: "DATETIME_FORMAT({Task Date}, 'DD/MM/YYYY') & ' ' & DATETIME_FORMAT({Task Time}, 'HH:mm')" }
      ]
    },
    {
      name: "Inspections",
      description: "Peritajes técnicos",
      fields: [
        { name: "Name", type: "formula", formula: "{Vehicle Description} & ' - ' & DATETIME_FORMAT({Inspection Date}, 'DD/MM/YYYY')" },
        { name: "ID", type: "formula", formula: "'I-' & RECORD_ID()" },
        { name: "Vehicle", type: "link", link: "Vehicles" },
        { name: "Vehicle Description", type: "lookup", lookup: { table: "Vehicles", field: "Name" } },
        { name: "Inspection Date", type: "date" },
        { name: "Inspector", type: "link", link: "Users" },
        { name: "Inspector Name", type: "lookup", lookup: { table: "Users", field: "Full Name" } },
        { name: "Kilometers at Inspection", type: "number" },

        // Componentes (simplificados para Airtable)
        { name: "Engine Status", type: "singleSelect", options: ["Bueno", "Regular", "Malo", "No aplica"] },
        { name: "Gearbox Status", type: "singleSelect", options: ["Bueno", "Regular", "Malo", "No aplica"] },
        { name: "Suspension Status", type: "singleSelect", options: ["Bueno", "Regular", "Malo", "No aplica"] },
        { name: "Brakes Status", type: "singleSelect", options: ["Bueno", "Regular", "Malo", "No aplica"] },
        { name: "Electrical Status", type: "singleSelect", options: ["Bueno", "Regular", "Malo", "No aplica"] },
        { name: "Lights Status", type: "singleSelect", options: ["Bueno", "Regular", "Malo", "No aplica"] },
        { name: "Upholstery Status", type: "singleSelect", options: ["Bueno", "Regular", "Malo", "No aplica"] },

        // Neumáticos
        { name: "Front Tires", type: "singleSelect", options: ["Bueno", "Regular", "Malo", "No aplica"] },
        { name: "Rear Tires", type: "singleSelect", options: ["Bueno", "Regular", "Malo", "No aplica"] },

        // Pintura
        { name: "Paint Front", type: "singleSelect", options: ["Sin intervenir", "Intervenido"] },
        { name: "Paint Sides", type: "singleSelect", options: ["Sin intervenir", "Intervenido"] },
        { name: "Paint Rear", type: "singleSelect", options: ["Sin intervenir", "Intervenido"] },

        // Servicios
        { name: "Timing Belt Service", type: "checkbox" },
        { name: "Oil Service", type: "checkbox" },

        // Accesorios
        { name: "Has Manuals", type: "checkbox", default: true },
        { name: "Has Spare Key", type: "checkbox", default: true },
        { name: "Has Spare Tire", type: "checkbox", default: true },
        { name: "Has Jack", type: "checkbox", default: true },
        { name: "Has Security Nut", type: "checkbox", default: true },
        { name: "Has Fire Extinguisher", type: "checkbox", default: true },

        // Resultados
        { name: "Recommendation", type: "singleSelect", options: ["TOMAR", "NO TOMAR", "DESCARTAR"] },
        { name: "Total Estimated Cost", type: "currency", currency: "ARS" },
        { name: "General Observations", type: "singleLineText" },
        { name: "Status", type: "singleSelect", options: ["Borrador", "Pendiente aprobación", "Aprobado", "Revisión solicitada"], default: "Borrador" }
      ]
    },
    {
      name: "TradeIns",
      description: "Vehículos en parte de pago",
      fields: [
        { name: "Name", type: "formula", formula: "{Brand} & ' ' & {Model} & ' ' & {Year}" },
        { name: "ID", type: "formula", formula: "'TI-' & RECORD_ID()" },
        { name: "Brand", type: "singleLineText" },
        { name: "Model", type: "singleLineText" },
        { name: "Year", type: "number" },
        { name: "Plate", type: "singleLineText" },
        { name: "Kilometers", type: "number" },
        { name: "Color", type: "singleLineText" },
        { name: "Vehicle Type", type: "singleLineText" },
        { name: "Engine Brand", type: "singleLineText" },
        { name: "Engine Number", type: "singleLineText" },
        { name: "Chassis Brand", type: "singleLineText" },
        { name: "Chassis Number", type: "singleLineText" },
        { name: "Registration City", type: "singleLineText" },
        { name: "Registration Province", type: "singleLineText" },
        { name: "Value", type: "currency", currency: "ARS" },
        { name: "Currency", type: "singleSelect", options: ["ARS", "USD"], default: "ARS" },
        { name: "Exchange Rate", type: "number" },
        { name: "Date", type: "date" },
        { name: "Is Peritado", type: "checkbox" },
        { name: "Value ARS", type: "formula", formula: "IF({Currency}='USD', {Value}*{Exchange Rate}, {Value})" }
      ]
    }
  ],

  // Datos de ejemplo
  sampleData: {
    users: [
      { id: "1", email: "gerente@padrani.com", full_name: "Ivo Padrani", role: "Gerente", phone: "+5491123456789", active: true },
      { id: "2", email: "vendedor1@padrani.com", full_name: "Carlos Vendedor", role: "Vendedor", phone: "+5491187654321", active: true },
      { id: "3", email: "mecanico1@padrani.com", full_name: "Roberto Mecánico", role: "Mecánico", phone: "+5491155566677", active: true }
    ],
    clients: [
      { id: "1", full_name: "Juan Carlos Pérez", phone: "+5491123456789", email: "juan.perez@email.com", dni: "12345678", cuit_cuil: "20123456789", address: "Av. Corrientes 1234", city: "Buenos Aires", province: "Buenos Aires", client_status: "Cliente" },
      { id: "2", full_name: "María González", phone: "+5491187654321", email: "maria.gonzalez@email.com", dni: "87654321", cuit_cuil: "20876543219", address: "Calle Florida 567", city: "Buenos Aires", province: "Buenos Aires", client_status: "Cliente" },
      { id: "3", full_name: "Carlos Rodríguez", phone: "+5491155566677", email: "carlos.rodriguez@email.com", dni: "11223344", cuit_cuil: "20112233449", address: "Av. 9 de Julio 890", city: "Buenos Aires", province: "Buenos Aires", client_status: "Cliente" }
    ],
    exchangeRates: [
      { id: "1", rate_date: "2024-12-19", rate_type: "Diaria", usd_rate: 1200, source: "DolarAPI" }
    ],
    vehicles: [
      { id: "1", brand: "FORD", model: "FIESTA", year: 2020, vehicle_type: "SEDÁN", plate: "ABC123", color: "BLANCO", kilometers: 45000, registration_city: "BUENOS AIRES", registration_province: "Buenos Aires", ownership: "CONSIGNACIÓN", is_consignment: true, entry_date: "2024-01-15", cost_value: 85000, cost_currency: "USD", cost_exchange_rate: 1100, target_price_value: 140000, public_price_value: 160000, infoauto_value: 145000, infoauto_exchange_rate: 1050, infoauto_date: "2024-01-15", status: "DISPONIBLE" },
      { id: "2", brand: "TOYOTA", model: "COROLLA", year: 2021, vehicle_type: "SEDÁN", plate: "JKL012", color: "AZUL", kilometers: 25000, registration_city: "BUENOS AIRES", registration_province: "Buenos Aires", ownership: "100I", entry_date: "2024-01-10", cost_value: 120000, cost_currency: "USD", cost_exchange_rate: 1180, target_price_value: 180000, public_price_value: 195000, infoauto_value: 185000, infoauto_exchange_rate: 1150, infoauto_date: "2024-01-10", status: "RESERVADO" },
      { id: "3", brand: "VOLKSWAGEN", model: "GOLF", year: 2019, vehicle_type: "HATCHBACK", plate: "MNO345", color: "ROJO", kilometers: 55000, registration_city: "BUENOS AIRES", registration_province: "Buenos Aires", ownership: "100", entry_date: "2024-01-05", cost_value: 95000, cost_currency: "USD", cost_exchange_rate: 1120, target_price_value: 155000, public_price_value: 170000, status: "VENDIDO" }
    ]
  },

  // Vistas recomendadas
  views: [
    {
      name: "Dashboard Principal",
      type: "gallery",
      table: "Vehicles",
      filters: [{ field: "Status", operator: "is", value: "DISPONIBLE" }],
      sorts: [{ field: "Entry Date", direction: "desc" }],
      fields: ["Name", "Public Price ARS", "Margin", "Status", "Kilometers"]
    },
    {
      name: "Vehículos - Tabla Completa",
      type: "grid",
      table: "Vehicles",
      fields: ["Name", "Brand", "Model", "Year", "Plate", "Status", "Public Price ARS", "Margin", "Entry Date"]
    },
    {
      name: "CRM - Kanban",
      type: "kanban",
      table: "Leads",
      groupBy: "Status",
      fields: ["Client Name", "Interested Vehicles", "Budget", "Follow-up Date", "Interest Level"]
    },
    {
      name: "Ventas - Calendario",
      type: "calendar",
      table: "Sales",
      dateField: "Sale Date",
      fields: ["Name", "Sale Price", "Client Name"]
    },
    {
      name: "Tareas - Calendario Interactivo",
      type: "calendar",
      table: "Tasks",
      dateField: "Task Date",
      fields: ["Title", "Task Type", "Priority", "Responsible Name", "Status"]
    }
  ]
};

// Generar archivo JSON para importar a Airtable
const outputPath = path.join(__dirname, 'padrani-airtable-structure.json');

fs.writeFileSync(outputPath, JSON.stringify(airtableStructure, null, 2));

console.log('✅ ESTRUCTURA DE AIRTABLE CREADA');
console.log(`📁 Archivo generado: ${outputPath}`);
console.log('');
console.log('📋 CONTENIDO GENERADO:');
console.log(`   🗂️  ${airtableStructure.tables.length} tablas principales`);
console.log(`   👥 ${airtableStructure.sampleData.users.length} usuarios de ejemplo`);
console.log(`   👤 ${airtableStructure.sampleData.clients.length} clientes de ejemplo`);
console.log(`   🚗 ${airtableStructure.sampleData.vehicles.length} vehículos de ejemplo`);
console.log(`   👁️  ${airtableStructure.views.length} vistas configuradas`);
console.log('');
console.log('🎯 PRÓXIMOS PASOS:');
console.log('1. Abrir Airtable.com');
console.log('2. Crear nueva base: "Padrani Automotores"');
console.log('3. Importar el archivo JSON generado');
console.log('4. Ejecutar el script de datos de ejemplo');
console.log('5. Configurar automatizaciones');
console.log('');
console.log('✨ ¡La base de datos estará lista para usar!');