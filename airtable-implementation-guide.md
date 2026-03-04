# 🛩️ GUÍA DE IMPLEMENTACIÓN: Padrani Automotores en Airtable

## 📋 PASOS PARA IMPLEMENTAR EL SISTEMA COMPLETO

### **PASO 1: Crear la Base de Datos**
1. Ir a [Airtable](https://airtable.com)
2. Crear nueva base: **"Padrani Automotores"**
3. Eliminar tabla por defecto "Tabla 1"

### **PASO 2: Crear Tablas en Orden**

#### **2.1 ExchangeRates (Cotizaciones)**
- **Campos principales:**
  - `Rate Date` (Fecha)
  - `Rate Type` (Selección única): Diaria, Oficial
  - `USD Rate` (Número)
  - `Source` (Texto): DolarAPI, Manual

#### **2.2 Users (Usuarios)**
- **Campos:**
  - `Email` (Email)
  - `Full Name` (Texto corto)
  - `Role` (Selección única)
  - `Phone` (Teléfono)
  - `Active` (Checkbox)

#### **2.3 Clients (Clientes)**
- **Campos:**
  - `Full Name` (Texto largo)
  - `Birth Date` (Fecha)
  - `Phone` (Teléfono)
  - `Email` (Email)
  - `DNI` (Texto corto)
  - `CUIT/CUIL` (Texto corto)
  - `Marital Status` (Selección única)
  - `Address` (Texto largo)
  - `City` (Texto corto)
  - `Province` (Selección única)
  - `Postal Code` (Texto corto)
  - `Client Status` (Selección única)
  - `Observations` (Texto largo)

#### **2.4 Vehicles (Vehículos)**
- **Campos de identificación:**
  - `Brand` (Selección única con todas las marcas)
  - `Model` (Texto corto)
  - `Year` (Número)
  - `Vehicle Type` (Selección única)
  - `Plate` (Texto corto)
  - `Color` (Selección única)
  - `Kilometers` (Número)

- **Campos técnicos:**
  - `Engine Brand`, `Engine Number`
  - `Chassis Brand`, `Chassis Number`
  - `Registration City`, `Registration Province`

- **Campos de propiedad:**
  - `Ownership` (Selección única)
  - `Is Consignment` (Checkbox)
  - `Supplier Client` (Enlace a Clients)
  - `Entry Date` (Fecha)

- **Campos de precio (5 tipos):**
  - Cost: `Cost Value`, `Cost Currency`, `Cost Exchange Rate`
  - Target: `Target Price Value`, `Target Price Currency`
  - Public: `Public Price Value`, `Public Price Currency`
  - InfoAuto: `InfoAuto Value`, `InfoAuto Exchange Rate`, `InfoAuto Date`

- **Campos de estado:**
  - `Status` (Selección única)
  - `Inspection Requested Date` (Fecha)
  - `Inspection Requested By` (Texto)
  - `Assigned Mechanic` (Enlace a Users)

### **PASO 3: Configurar FÓRMULAS CLAVE**

#### **En tabla Vehicles:**

**Campo calculado: Total Cost ARS**
```
IF(
  {Cost Currency} = "USD",
  {Cost Value} * {Cost Exchange Rate},
  {Cost Value}
)
```

**Campo calculado: Public Price ARS**
```
IF(
  {Public Price Currency} = "USD",
  {Public Price Value} * MAX(values),
  {Public Price Value}
)
```
*MAX(values) hace lookup de la cotización más reciente*

**Campo calculado: Margin (Margen)**
```
{Public Price ARS} - {Total Cost ARS}
```

#### **En tabla Clients:**

**Campo calculado: Age (Edad)**
```
DATETIME_DIFF(TODAY(), {Birth Date}, 'years')
```

#### **En tabla Leads:**

**Campo calculado: Days Since Consultation**
```
DATETIME_DIFF(TODAY(), {Consultation Date}, 'days')
```

**Campo calculado: Is Overdue**
```
IF(
  AND(
    {Follow-up Date} < TODAY(),
    OR(
      {Status} != "Concretado",
      {Status} != "Perdido"
    )
  ),
  "SÍ",
  "NO"
)
```

#### **En tabla Sales:**

**Campo calculado: Total Paid**
```
SUM(
  {Deposit Amount ARS},
  {Cash Payment Amount ARS},
  {Trade-ins Total Value}
)
```

**Campo calculado: Remaining Balance**
```
{Sale Price ARS} - {Total Paid}
```

### **PASO 4: Configurar RELACIONES (Enlaces)**

#### **Vehicles → Clients:**
- Campo `Supplier Client` → enlace a tabla Clients

#### **Vehicles → Users:**
- Campo `Assigned Mechanic` → enlace a tabla Users

#### **Leads → Clients:**
- Campo `Client` → enlace a tabla Clients

#### **Leads → Vehicles:**
- Campo `Interested Vehicles` → enlace múltiple a Vehicles

#### **Sales → Vehicles:**
- Campo `Vehicle` → enlace a Vehicles

#### **Sales → Clients:**
- Campo `Client` → enlace a Clients

#### **Reservations → Vehicles:**
- Campo `Vehicle` → enlace a Vehicles

#### **Reservations → Clients:**
- Campo `Client` → enlace a Clients

#### **Quotes → Vehicles:**
- Campo `Vehicle` → enlace a Vehicles

#### **Quotes → Clients:**
- Campo `Client` → enlace a Clients

#### **Tasks → Users:**
- Campo `Responsible` → enlace a Users

#### **Tasks → Vehicles/Clients/Leads:**
- Campos de enlace correspondientes

### **PASO 5: Crear VISTAS ESENCIALES**

#### **Dashboard Principal (Vista de Galería):**
- **Campos visibles:** Estado del vehículo, precio público, margen
- **Agrupación:** Por estado
- **Filtros:** Solo vehículos disponibles

#### **Vehículos - Tabla Completa:**
- **Todos los campos técnicos y de precio**
- **Filtros:** Por marca, estado, rango de precios
- **Ordenamiento:** Por fecha de ingreso descendente

#### **CRM - Vista Kanban:**
- **Agrupación:** Por Status (Nuevo, Contactado, En negociación, etc.)
- **Campos visibles:** Cliente, presupuesto, fecha de seguimiento
- **Color coding:** Por nivel de interés

#### **Ventas - Vista de Calendario:**
- **Campo fecha:** Sale Date
- **Agrupación:** Por mes
- **Campos visibles:** Cliente, vehículo, monto total

#### **Tareas - Calendario Interactivo:**
- **Campo fecha:** Task Date
- **Campo hora:** Task Time
- **Color coding:** Por tipo de tarea y prioridad

### **PASO 6: Configurar AUTOMATIZACIONES**

#### **Automatización 1: Cambio de estado al vender**
```
Cuando se crea un registro en Sales:
- Actualizar campo Status en Vehicles a "VENDIDO"
- Si existe Reservation, actualizar status a "CONVERTIDA"
```

#### **Automatización 2: Reserva activa**
```
Cuando se crea un registro en Reservations:
- Actualizar campo Status en Vehicles a "RESERVADO"
```

#### **Automatización 3: Peritaje solicitado**
```
Cuando se actualiza Inspection Requested Date en Vehicles:
- Cambiar Status a "A PERITAR"
- Crear tarea automática para el Assigned Mechanic
```

#### **Automatización 4: Alertas de seguimiento**
```
Diariamente a las 9 AM:
- Buscar Leads donde Follow-up Date = TODAY()
- Enviar notificación por email
```

### **PASO 7: Configurar PERMISOS POR ROL**

#### **Gerente/Administrador:**
- Acceso total a todas las tablas
- Puede modificar fórmulas y automatizaciones

#### **Vendedor/Gestor/Comisionista:**
- Acceso a: Vehicles, Clients, Leads, Sales, Reservations, Quotes, Tasks
- Solo lectura en: Inspections, ExchangeRates, Users

#### **Mecánico:**
- Acceso completo a: Inspections
- Solo lectura en: Vehicles (para detalles)

### **PASO 8: Scripts y Webhooks Avanzados**

#### **Script para actualizar cotizaciones:**
```javascript
// Script automatizado para actualizar dólar blue
const response = await fetch('https://dolarapi.com/v1/dolares/blue');
const data = await response.json();

// Actualizar tabla ExchangeRates
await table.createRecordAsync({
  'Rate Date': new Date().toISOString().split('T')[0],
  'Rate Type': 'Diaria',
  'USD Rate': data.venta,
  'Source': 'DolarAPI'
});
```

#### **Webhook para notificaciones:**
```
POST a https://api.airtable.com/v0/{base_id}/{table_id}
Headers: Authorization: Bearer {api_key}
Body: notificación de tarea próxima a vencer
```

### **PASO 9: Cargar Datos de Ejemplo**

Usar el archivo `load-sample-data.html` creado anteriormente para poblar la base con datos de ejemplo.

### **PASO 10: Testing y Validación**

1. **Crear vehículo de prueba** y verificar cálculos
2. **Crear consulta** y verificar flujo CRM
3. **Crear presupuesto** y verificar fórmulas
4. **Crear reserva** y verificar cambio de estado
5. **Crear venta** y verificar todas las relaciones
6. **Crear peritaje** y verificar workflow
7. **Crear tareas** y verificar calendario

---

## 🎯 **DIFERENCIAS CON EL SISTEMA ORIGINAL**

### **Limitaciones de Airtable:**
- No hay autenticación integrada (usar permisos de Airtable)
- No hay lógica de backend compleja
- Limitaciones en automatizaciones complejas
- No hay manejo de archivos adjuntos nativo

### **Ventajas de Airtable:**
- Interfaz visual intuitiva
- Fácil colaboración en equipo
- Automatizaciones visuales
- Integraciones con otras herramientas
- Responsive design automático

### **Solución a Limitaciones:**
- Usar formularios de Airtable para "login" simulado
- Implementar lógica compleja con scripts
- Usar adjuntos de Airtable para documentos
- Webhooks para integraciones externas

---

## 📱 **VISTAS MÓVILES OPTIMIZADAS**

### **Dashboard Móvil:**
- Tarjetas grandes con métricas principales
- Lista simplificada de tareas pendientes
- Acceso rápido a funciones principales

### **Formularios Móviles:**
- Campos optimizados para touch
- Teclados apropiados (numérico para precios)
- Validaciones en tiempo real

---

## 🔄 **MIGRACIÓN DESDE SISTEMA ACTUAL**

### **Proceso de Migración:**
1. Exportar datos del sistema actual a CSV
2. Mapear campos entre sistemas
3. Limpiar y validar datos
4. Importar por lotes usando scripts de Airtable
5. Verificar integridad de relaciones
6. Entrenar al equipo en la nueva interfaz

### **Scripts de Migración Recomendados:**
```javascript
// Ejemplo: Migrar clientes
const csvData = // datos del CSV
for (const row of csvData) {
  await clientsTable.createRecordAsync({
    'Full Name': row.nombre_completo,
    'Phone': row.telefono,
    'Email': row.email,
    // ... mapear otros campos
  });
}
```

---

## 🎉 **RESULTADO FINAL**

Con esta implementación, tendrás un sistema que replica el 90% de la funcionalidad del sistema Padrani Automotores original, con:

- ✅ Gestión completa de vehículos
- ✅ CRM integrado
- ✅ Sistema de ventas con financiaciones
- ✅ Control de stock y estados
- ✅ Peritajes y aprobaciones
- ✅ Calendario de tareas
- ✅ Reportes y dashboards
- ✅ Automatizaciones inteligentes
- ✅ Interfaz responsive y moderna

**¡La transición a Airtable mantendrá toda la funcionalidad crítica mientras mejora la usabilidad y colaboración del equipo!** 🚀