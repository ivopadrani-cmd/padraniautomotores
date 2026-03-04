-- ESTRUCTURA COMPLETA DE AIRTABLE PARA SISTEMA PADRANI AUTOMOTORES
-- Este archivo contiene la definición completa de todas las tablas, campos, fórmulas y relaciones

================================================================================
                                PADRANI AUTOMOTORES
                           SISTEMA DE GESTIÓN EN AIRTABLE
================================================================================

BASE DE DATOS PRINCIPAL: "Padrani Automotores"

================================================================================
TABLA 1: Vehicles (Vehículos)
================================================================================

Campos principales:
- Name (Título) - Fórmula: {Brand} & " " & {Model} & " " & {Year} & " - " & {Plate}
- ID (Campo de fórmula auto-incremental): "V-" & RECORD_ID()

Campos de identificación:
- Brand (Selección única): FORD, TOYOTA, VOLKSWAGEN, RENAULT, PEUGEOT, CHERY, etc.
- Model (Texto corto)
- Year (Número)
- Vehicle Type (Selección única): SEDÁN, HATCHBACK, SUV, PICKUP, FURGÓN, etc.
- Plate (Texto corto) - Dominio/Patente
- Color (Selección única): BLANCO, NEGRO, GRIS, AZUL, ROJO, etc.
- Kilometers (Número)

Campos técnicos:
- Engine Brand (Texto corto)
- Engine Number (Texto corto)
- Chassis Brand (Texto corto)
- Chassis Number (Texto corto)
- Registration City (Texto corto)
- Registration Province (Selección única): Buenos Aires, Córdoba, Santa Fe, etc.

Campos de propiedad:
- Ownership (Selección única): CONSIGNACIÓN, 100I, 100L, 100, 50I, 50L
- Is Consignment (Checkbox)
- Supplier Client (Enlace a Clients)
- Entry Date (Fecha)

Campos de precio (5 tipos):
- Cost Value (Número de moneda)
- Cost Currency (Selección única): ARS, USD
- Cost Exchange Rate (Número)
- Target Price Value (Número de moneda)
- Target Price Currency (Selección única): ARS, USD
- Public Price Value (Número de moneda)
- Public Price Currency (Selección única): ARS, USD
- InfoAuto Value (Número de moneda)
- InfoAuto Exchange Rate (Número)
- InfoAuto Date (Fecha)

Campos de estado:
- Status (Selección única): A PERITAR, A INGRESAR, EN REPARACIÓN, DISPONIBLE, PAUSADO, RESERVADO, VENDIDO, ENTREGADO
- Inspection Requested Date (Fecha)
- Inspection Requested By (Texto corto)
- Assigned Mechanic (Enlace a Users)

Campos calculados importantes:

Total Cost ARS (Fórmula):
IF({Cost Currency}="USD", {Cost Value}*{Cost Exchange Rate}, {Cost Value}) + SUM(values)

Public Price ARS (Fórmula):
IF({Public Price Currency}="USD", {Public Price Value}*{Current Blue Rate}, {Public Price Value})

Margin (Fórmula):
{Public Price ARS} - {Total Cost ARS}

Current Blue Rate (Lookup desde ExchangeRates):
MAX(values) donde Rate Type = "Diaria"

================================================================================
TABLA 2: Clients (Clientes)
================================================================================

Campos principales:
- Name (Título) - Fórmula: {Full Name}
- ID (Campo de fórmula): "C-" & RECORD_ID()

Campos personales:
- Full Name (Texto largo)
- Birth Date (Fecha)
- Phone (Teléfono)
- Email (Email)
- DNI (Texto corto)
- CUIT/CUIL (Texto corto)
- Marital Status (Selección única): Soltero/a, Casado/a, Divorciado/a, Viudo/a

Campos de dirección:
- Address (Texto largo)
- City (Texto corto)
- Province (Selección única): Buenos Aires, Córdoba, Santa Fe, etc.
- Postal Code (Texto corto)

Campos de control:
- Client Status (Selección única): Cliente, Prospecto, Inactivo
- Observations (Texto largo)
- Created Date (Fecha, auto-relleno)
- Last Contact (Fecha)

Campos calculados:
- Age (Fórmula): DATETIME_DIFF(TODAY(), {Birth Date}, 'years')
- Total Vehicles Bought (Lookup/Count desde Sales)
- Total Amount Spent (Rollup SUM desde Sales)

================================================================================
TABLA 3: Leads (Consultas/CRM)
================================================================================

Campos principales:
- Name (Título) - Fórmula: {Client Name} & " - " & DATETIME_FORMAT({Consultation Date}, 'DD/MM/YYYY')
- ID (Campo de fórmula): "L-" & RECORD_ID()

Campos de consulta:
- Consultation Date (Fecha)
- Consultation Time (Hora)
- Source (Selección única): Salón, Llamada, Redes sociales, Recomendado, Otros
- Client (Enlace a Clients)
- Client Name (Lookup desde Client)
- Client Phone (Lookup desde Client)
- Client Email (Lookup desde Client)

Campos de interés:
- Interested Vehicles (Enlace múltiple a Vehicles)
- Budget (Número de moneda)
- Other Interests (Texto largo)
- Preferred Contact (Selección única): WhatsApp, Email, Teléfono

Campos de permuta:
- Trade-in Brand (Texto corto)
- Trade-in Model (Texto corto)
- Trade-in Year (Número)
- Trade-in Plate (Texto corto)
- Trade-in Kilometers (Número)
- Trade-in Color (Texto corto)
- Trade-in Value ARS (Número de moneda)

Campos de seguimiento:
- Status (Selección única): Nuevo, Contactado, En negociación, Concretado, Perdido
- Interest Level (Selección única): Bajo, Medio, Alto, Muy alto
- Observations (Texto largo)
- Follow-up Date (Fecha)
- Follow-up Time (Hora)

Campos calculados:
- Days Since Consultation (Fórmula): DATETIME_DIFF(TODAY(), {Consultation Date}, 'days')
- Is Overdue (Fórmula): IF({Follow-up Date} < TODAY() AND {Status} != "Concretado" AND {Status} != "Perdido", "SÍ", "NO")
- Vehicle Count (Fórmula): ARRAYLEN({Interested Vehicles})

================================================================================
TABLA 4: Sales (Ventas)
================================================================================

Campos principales:
- Name (Título) - Fórmula: {Client Name} & " - " & {Vehicle Description} & " - " & DATETIME_FORMAT({Sale Date}, 'DD/MM/YYYY')
- ID (Campo de fórmula): "S-" & RECORD_ID()

Campos de venta:
- Vehicle (Enlace a Vehicles)
- Vehicle Description (Lookup): {Brand} & " " & {Model} & " " & {Year}
- Client (Enlace a Clients)
- Client Name (Lookup desde Client)
- Sale Date (Fecha)
- Seller (Enlace a Users)

Campos de precio:
- Sale Price (Número de moneda)
- Sale Price Currency (Selección única): ARS, USD
- Sale Price Exchange Rate (Número)

Campos de pagos:
- Deposit Amount (Número de moneda)
- Deposit Currency (Selección única): ARS, USD
- Deposit Exchange Rate (Número)
- Deposit Date (Fecha)
- Deposit Payment Method (Selección única): Efectivo, Transferencia, Cheque, etc.
- Deposit Description (Texto corto)

- Cash Payment Amount (Número de moneda)
- Cash Payment Currency (Selección única): ARS, USD
- Cash Payment Exchange Rate (Número)
- Cash Payment Date (Fecha)
- Cash Payment Method (Selección única): Efectivo, Transferencia, etc.

Campos de financiación:
- Financing Amount (Número de moneda)
- Financing Currency (Selección única): ARS, USD
- Financing Exchange Rate (Número)
- Financing Date (Fecha)
- Financing Bank (Texto corto)
- Financing Installments (Número)
- Financing Installment Value (Número de moneda)

Campos de permuta:
- Trade-ins (Enlace múltiple a TradeIns)

Campos adicionales:
- Balance Due Date (Fecha)
- Observations (Texto largo)

Campos calculados:
- Total Paid (Fórmula): {Deposit Amount ARS} + {Cash Payment Amount ARS} + {Trade-ins Total Value}
- Remaining Balance (Fórmula): {Sale Price ARS} - {Total Paid}
- Financing Monthly Payment (Fórmula): {Financing Amount ARS} / {Financing Installments}

================================================================================
TABLA 5: Reservations (Reservas)
================================================================================

Campos principales:
- Name (Título) - Fórmula: {Client Name} & " - " & {Vehicle Description}
- ID (Campo de fórmula): "R-" & RECORD_ID()

Campos de reserva:
- Vehicle (Enlace a Vehicles)
- Vehicle Description (Lookup)
- Client (Enlace a Clients)
- Client Name (Lookup)
- Reservation Date (Fecha)

Campos económicos:
- Agreed Price (Número de moneda)
- Deposit Amount (Número de moneda)
- Deposit Currency (Selección única): ARS, USD
- Deposit Exchange Rate (Número)
- Deposit Date (Fecha)
- Deposit Description (Texto corto)

Campos de financiación:
- Financing Amount (Número de moneda)
- Financing Bank (Texto corto)
- Financing Installments (Número)
- Financing Installment Value (Número de moneda)

Campos de control:
- Status (Selección única): ACTIVA, CONVERTIDA, CANCELADA
- Observations (Texto largo)

Campos calculados:
- Days Since Reservation (Fórmula): DATETIME_DIFF(TODAY(), {Reservation Date}, 'days')
- Deposit Percentage (Fórmula): {Deposit Amount} / {Agreed Price} * 100

================================================================================
TABLA 6: Quotes (Presupuestos)
================================================================================

Campos principales:
- Name (Título) - Fórmula: {Client Name} & " - " & {Vehicle Description}
- ID (Campo de fórmula): "Q-" & RECORD_ID()

Campos de presupuesto:
- Vehicle (Enlace a Vehicles)
- Vehicle Description (Lookup)
- Client (Enlace a Clients)
- Client Name (Lookup)
- Quote Date (Fecha)
- Quoted Price ARS (Número de moneda)

Campos de permuta:
- Trade-in Brand (Texto corto)
- Trade-in Model (Texto corto)
- Trade-in Year (Número)
- Trade-in Value ARS (Número de moneda)

Campos calculados:
- Net Price (Fórmula): {Quoted Price ARS} - {Trade-in Value ARS}

================================================================================
TABLA 7: Tasks (Tareas)
================================================================================

Campos principales:
- Name (Título) - {Title}
- ID (Campo de fórmula): "T-" & RECORD_ID()

Campos básicos:
- Title (Texto corto)
- Description (Texto largo)
- Task Date (Fecha)
- Task Time (Hora)
- Task Type (Selección única): Tarea, Trámite, Servicio, Gestoría, Evento, Seguimiento
- Status (Selección única): Pendiente, En proceso, Completada, Cancelada
- Priority (Selección única): Baja, Media, Alta, Urgente

Campos de asignación:
- Responsible (Enlace a Users)
- Responsible Name (Lookup)

Campos de vinculación:
- Related Vehicle (Enlace a Vehicles)
- Related Vehicle Description (Lookup)
- Related Client (Enlace a Clients)
- Related Client Name (Lookup)
- Related Lead (Enlace a Leads)
- Related Lead Description (Lookup)

Campos adicionales:
- Cost (Número de moneda)

Campos calculados:
- Is Overdue (Fórmula): IF({Task Date} < TODAY() AND {Status} = "Pendiente", "SÍ", "NO")
- Days Until Due (Fórmula): DATETIME_DIFF({Task Date}, TODAY(), 'days')
- Full Date Time (Fórmula): DATETIME_FORMAT({Task Date}, 'DD/MM/YYYY') & " " & {Task Time}

================================================================================
TABLA 8: Inspections (Peritajes)
================================================================================

Campos principales:
- Name (Título) - Fórmula: {Vehicle Description} & " - " & DATETIME_FORMAT({Inspection Date}, 'DD/MM/YYYY')
- ID (Campo de fórmula): "I-" & RECORD_ID()

Campos básicos:
- Vehicle (Enlace a Vehicles)
- Vehicle Description (Lookup)
- Inspection Date (Fecha)
- Inspector (Enlace a Users)
- Inspector Name (Lookup)
- Kilometers at Inspection (Número)

Campos de evaluación (Lookup arrays):
- General Components (Campo de texto largo con JSON o campos separados)
- Tires Status (Campos separados para cada rueda)
- Paint Detail (Campos separados para cada parte)

Campos de servicios:
- Timing Belt Change Done (Checkbox)
- Timing Belt Type (Selección única): Correa, Cadena
- Oil Service Done (Checkbox)
- Oil Service Date (Fecha)

Campos de accesorios:
- Manuals (Checkbox)
- Spare Key (Checkbox)
- Spare Tire (Checkbox)
- Jack (Checkbox)
- Security Nut (Checkbox)
- Fire Extinguisher (Checkbox)

Campos de resultados:
- Recommendation (Selección única): TOMAR, NO TOMAR, DESCARTAR
- Total Estimated Cost (Número de moneda)
- General Observations (Texto largo)
- Status (Selección única): Borrador, Pendiente aprobación, Aprobado, Revisión solicitada

================================================================================
TABLA 9: TradeIns (Permutas)
================================================================================

Campos principales:
- Name (Título) - Fórmula: {Brand} & " " & {Model} & " " & {Year}
- ID (Campo de fórmula): "TI-" & RECORD_ID()

Campos del vehículo:
- Brand (Texto corto)
- Model (Texto corto)
- Year (Número)
- Plate (Texto corto)
- Kilometers (Número)
- Color (Texto corto)
- Vehicle Type (Texto corto)

Campos técnicos:
- Engine Brand (Texto corto)
- Engine Number (Texto corto)
- Chassis Brand (Texto corto)
- Chassis Number (Texto corto)
- Registration City (Texto corto)
- Registration Province (Texto corto)

Campos de valuación:
- Value (Número de moneda)
- Currency (Selección única): ARS, USD
- Exchange Rate (Número)
- Date (Fecha)
- Is Peritado (Checkbox)

================================================================================
TABLA 10: ExchangeRates (Cotizaciones)
================================================================================

Campos principales:
- Name (Título) - Fórmula: {Rate Type} & " - " & DATETIME_FORMAT({Rate Date}, 'DD/MM/YYYY')
- ID (Campo de fórmula): "ER-" & RECORD_ID()

Campos de cotización:
- Rate Date (Fecha)
- Rate Type (Selección única): Diaria, Oficial, etc.
- USD Rate (Número)
- Source (Texto corto): DolarAPI, Manual, etc.

================================================================================
TABLA 11: Users (Usuarios)
================================================================================

Campos principales:
- Name (Título) - {Full Name}
- ID (Campo de fórmula): "U-" & RECORD_ID()

Campos de usuario:
- Email (Email)
- Full Name (Texto corto)
- Role (Selección única): Gerente, Administrador, Vendedor, Gestor, Comisionista, Mecánico
- Phone (Teléfono)
- Active (Checkbox)

================================================================================
VISTAS Y DASHBOARDS RECOMENDADOS
================================================================================

1. DASHBOARD PRINCIPAL (Vista de Galería + Kanban)
   - Métricas principales (contadores calculados)
   - Calendario de tareas
   - Vehículos por estado (Kanban)
   - Consultas activas
   - Peritajes pendientes

2. VEHÍCULOS - Vista de Tabla Principal
   - Filtros por estado, marca, precio
   - Agrupación por estado
   - Campos calculados de márgenes

3. VEHÍCULOS - Vista de Galería (Fotos)
   - Imágenes de vehículos
   - Información esencial visible

4. CRM - Vista de Kanban
   - Estados: Nuevo → Contactado → En negociación → Concretado/Perdido
   - Colores por nivel de interés

5. VENTAS - Vista de Calendario
   - Ventas por fecha
   - Montos totales

6. TAREAS - Vista de Calendario
   - Eventos y tareas programadas
   - Colores por tipo y prioridad

================================================================================
AUTOMATIZACIONES RECOMENDADAS
================================================================================

1. Cuando se crea una venta:
   - Cambiar estado del vehículo a "VENDIDO"
   - Si hay reserva, marcar como "CONVERTIDA"

2. Cuando se crea una reserva:
   - Cambiar estado del vehículo a "RESERVADO"

3. Cuando se solicita peritaje:
   - Cambiar estado del vehículo a "A PERITAR"
   - Crear tarea para el mecánico asignado

4. Recordatorios de seguimiento:
   - Notificaciones cuando follow-up date se acerca

5. Actualización automática de cotizaciones:
   - Script para actualizar dólar blue diariamente

================================================================================
FÓRMULAS DE EJEMPLO
================================================================================

Cálculo de precio en ARS (Vehicles):
IF({Public Price Currency}="USD", {Public Price Value}*{Current Blue Rate}, {Public Price Value})

Margen de ganancia (Vehicles):
{Public Price ARS} - {Total Cost ARS}

Días desde consulta (Leads):
DATETIME_DIFF(TODAY(), {Consultation Date}, 'days')

Estado de vencimiento (Tasks):
IF({Task Date} < TODAY() AND {Status} = "Pendiente", "VENCIDA", "PENDIENTE")

================================================================================
INSTRUCCIONES DE IMPLEMENTACIÓN EN AIRTABLE
================================================================================

1. Crear nueva base de datos llamada "Padrani Automotores"

2. Crear las 11 tablas en orden:
   - ExchangeRates (primero, para lookups)
   - Users
   - Clients
   - Vehicles
   - Leads
   - Reservations
   - Quotes
   - Sales
   - Tasks
   - Inspections
   - TradeIns

3. Configurar campos según especificaciones

4. Establecer enlaces (Link to another record) entre tablas

5. Crear fórmulas calculadas

6. Configurar vistas y dashboards

7. Implementar automatizaciones con scripts o webhooks

================================================================================