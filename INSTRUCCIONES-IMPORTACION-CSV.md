# 📦 Guía Completa: Importación de Datos desde Base44 (CSV)

Esta guía te muestra cómo importar todos tus datos desde Base44 a Supabase usando los archivos CSV exportados.

---

## 🎯 ¿Cuándo usar esta guía?

✅ **USA esta guía si:**
- Exportaste datos de Base44 en formato CSV
- Querés migrar TODO tu histórico (vehículos, clientes, ventas, etc.)
- Acabas de configurar Supabase por primera vez

❌ **NO uses esta guía si:**
- Ya tenés datos en Supabase y querés actualizarlos (usá la UI de la app)
- Querés importar datos manualmente (usá la UI de la app)
- Solo querés probar la app (ya hay un usuario demo)

---

## 📋 Requisitos Previos

Antes de empezar, asegurate de tener:

- ✅ Node.js instalado (v18 o superior)
- ✅ Proyecto de Supabase creado y configurado
- ✅ Migraciones SQL ejecutadas (`001_initial_schema.sql` y `002_rls_policies.sql`)
- ✅ Bucket `files` creado en Supabase Storage (PRIVADO)
- ✅ Archivo `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- ✅ Archivos CSV exportados de Base44

---

## 📂 PASO 1: Ubicar los Archivos CSV

Todos los CSV exportados de Base44 deben estar en:

```
C:\Users\usuario\Downloads\
```

### Archivos esperados:

**Configuración:**
- ✅ `AgencySettings_export.csv` - Datos de tu agencia
- ✅ `ExchangeRate_export.csv` - Cotizaciones del dólar
- ✅ `Branch_export.csv` - Sucursales

**Usuarios y Personal:**
- ✅ `Seller_export.csv` - Vendedores y usuarios del sistema

**Clientes:**
- ✅ `Client_export.csv` - Base de datos de clientes
- ✅ `Spouse_export.csv` - Cónyuges (opcional)

**Plantillas:**
- ✅ `DocumentTemplate_export.csv` - Plantillas de presupuestos, boletos, etc.
- ✅ `ContractTemplate_export.csv` - Plantillas de contratos
- ✅ `ClauseTemplate_export.csv` - Cláusulas estándar

**Vehículos:**
- ✅ `Vehicle_export.csv` - Todo tu stock de vehículos
- ✅ `VehicleInspection_export.csv` - Peritajes

**CRM:**
- ✅ `Lead_export.csv` - Consultas de clientes
- ✅ `Quote_export.csv` - Presupuestos enviados

**Ventas:**
- ✅ `Sale_export.csv` - Todas las ventas
- ✅ `Reservation_export.csv` - Reservas (señas)
- ✅ `Consignment_export.csv` - Consignaciones

**Documentación:**
- ✅ `Contract_export.csv` - Contratos generados
- ✅ `Document_export.csv` - Documentos varios

**Gestión:**
- ✅ `Transaction_export.csv` - Trámites
- ✅ `CalendarEvent_export.csv` - Eventos de agenda
- ✅ `Task_export.csv` - Tareas pendientes

**Opcional (pueden estar vacíos):**
- `FinancialRecord_export.csv` - Registros financieros
- `Service_export.csv` - Servicios

---

## 🔑 PASO 2: Obtener la Service Role Key

La **Service Role Key** es una clave especial que permite acceso total a tu base de datos. Solo la usaremos para este script de importación.

### 2.1. Ir a Supabase

1. Abrí tu navegador
2. Andá a https://app.supabase.com
3. Seleccioná tu proyecto: **`padraniautomotores`**

### 2.2. Copiar la Service Role Key

1. En el menú lateral, andá a **Settings** ⚙️
2. Click en **API**
3. Buscá la sección **Project API keys**
4. Verás DOS keys:
   - `anon` `public` - Esta ya la tenés configurada ✅
   - `service_role` `secret` - **Esta es la que necesitás** 🔑

5. Click en **Reveal** junto a `service_role`
6. **Copiá la key completa** (empieza con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 2.3. Configurar la Key

Abrí el archivo `.env.local` en la raíz del proyecto y agregá:

```env
VITE_SUPABASE_URL=https://xjziilcxvftaavkxciux.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp... (ya está)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (NUEVA)
```

**⚠️ MUY IMPORTANTE:**
- ❌ **NUNCA subas este archivo a Git**
- ❌ **NUNCA compartas esta key**
- ❌ **NUNCA la uses en el frontend**
- ✅ Solo úsala para este script (backend)

---

## ▶️ PASO 3: Ejecutar la Importación

### 3.1. Abrir PowerShell

1. Presioná `Win + X`
2. Seleccioná **Windows PowerShell**
3. Navegá a la carpeta del proyecto:

```bash
cd C:\Users\usuario\Downloads\padraniautomotores
```

### 3.2. Ejecutar el Script

```bash
node scripts/import-csv-to-supabase.js
```

### 3.3. Qué Esperar

El script mostrará algo como esto:

```
🚀 INICIANDO IMPORTACIÓN DE CSV A SUPABASE

============================================================

📦 Importando agency_settings...
   📊 1 registros encontrados
   ✅ 1 exitosos, ❌ 0 errores

📦 Importando exchange_rates...
   📊 194 registros encontrados
   ✓ 10/194 importados...
   ✓ 20/194 importados...
   ✓ 30/194 importados...
   ...
   ✅ 194 exitosos, ❌ 0 errores

📦 Importando branches...
   📊 1 registros encontrados
   ✅ 1 exitosos, ❌ 0 errores

📦 Importando sellers...
   📊 5 registros encontrados
   ✅ 5 exitosos, ❌ 0 errores

📦 Importando clients...
   📊 4 registros encontrados
   ✅ 4 exitosos, ❌ 0 errores

📦 Importando vehicles...
   📊 25 registros encontrados
   ✓ 10/25 importados...
   ✓ 20/25 importados...
   ✅ 25 exitosos, ❌ 0 errores

... (continúa con todas las tablas)

============================================================

📊 RESUMEN FINAL:
   Total de registros procesados: 523
   ✅ Exitosos: 518
   ❌ Errores: 5
   ⏱️  Tiempo: 45.32s

🎉 IMPORTACIÓN COMPLETADA

⚠️  NOTAS IMPORTANTES:
   • Las URLs de archivos de Base44 ya no funcionarán
   • Deberás re-subir fotos y documentos a Supabase Storage
   • Verifica los datos en Supabase antes de usar en producción
   • Los usuarios NO se crearon en auth.users (hazlo manualmente)
```

### 3.4. Si Hay Errores

Es normal que haya algunos errores (5-10) por:
- Campos que cambiaron de nombre
- Valores incompatibles
- Relaciones rotas (ej: vehículo referencia cliente que no existe)

**Qué hacer:**
- ✅ Si son pocos errores (< 10): Ignoralos, se pueden corregir manualmente
- ⚠️ Si son muchos errores (> 50): Revisar logs y contactar soporte

---

## ✅ PASO 4: Verificar la Importación

### 4.1. Verificar en Supabase

1. Andá a https://app.supabase.com
2. Seleccioná tu proyecto
3. Andá a **Table Editor**
4. Revisá cada tabla:

**Tablas principales a verificar:**

| Tabla | Qué verificar |
|-------|---------------|
| `vehicles` | Cantidad de vehículos = cantidad en CSV |
| `clients` | Todos tus clientes están |
| `sales` | Ventas históricas completas |
| `leads` | Consultas registradas |
| `tasks` | Tareas pendientes |
| `sellers` | Todos los vendedores |
| `exchange_rates` | Cotizaciones del dólar |

### 4.2. Verificar en la App

1. Ejecutá: `npm run dev`
2. Abrí http://localhost:5173
3. Logeate con `ivopadrani@gmail.com`
4. Navegá a **Vehículos**: ¿Ves todos tus autos?
5. Navegá a **Clientes**: ¿Ves todos tus clientes?
6. Navegá a **Ventas**: ¿Ves el historial completo?

---

## 👤 PASO 5: Crear Usuarios en Supabase Auth

**IMPORTANTE:** Los sellers se importaron a la tabla `sellers`, pero **NO se crearon automáticamente en `auth.users`**.

Esto significa que los usuarios **NO pueden loguearse todavía**.

### 5.1. Usuarios a crear

Según tu CSV, necesitás crear estos usuarios:

| Email | Rol | Password sugerido |
|-------|-----|-------------------|
| `ivopadrani@gmail.com` | Gerente | (el que quieras) |
| `juancarlospadrani@hotmail.com` | Gerente | (el que quieras) |
| `soolhermosiid.9@gmail.com` | Administrador | (el que quieras) |
| `padraniautomotores@gmail.com` | Mecánico | (el que quieras) |

### 5.2. Crear cada usuario

Para cada usuario:

1. Ve a Supabase → https://app.supabase.com
2. Seleccioná tu proyecto
3. Andá a **Authentication** 🔐 → **Users**
4. Click en **Add user** (botón verde)
5. Seleccioná **Create new user**
6. Completá:
   - **Email**: `ivopadrani@gmail.com` (debe coincidir EXACTAMENTE con el CSV)
   - **Password**: El que quieras (mínimo 6 caracteres)
   - **Auto Confirm User**: ✅ SÍ (marcá el checkbox)
7. Click en **Create user**
8. Repetí para los otros usuarios

### 5.3. Verificar que funciona

1. Abrí la app: http://localhost:5173
2. Logeate con `ivopadrani@gmail.com` y el password que configuraste
3. Deberías ver tu nombre y rol "Gerente" en la esquina superior derecha ✅

---

## 📷 PASO 6: Re-subir Archivos

Las URLs de Base44 (fotos, documentos) ya NO funcionan porque apuntan a los servidores de Base44.

### 6.1. ¿Qué archivos se perdieron?

- 🖼️ **Fotos de vehículos**
- 📄 **Documentos** (títulos, cédulas, etc.)
- 📋 **Contratos generados**

### 6.2. ¿Cómo recuperarlos?

**Opción A: Re-subir desde la app** (Recomendado)
1. Descargá las fotos/documentos de Base44 (si tenés acceso)
2. Guardá en tu PC
3. Subí desde la app de Padrani Automotores:
   - Andá a **Vehículos**
   - Abrí cada vehículo
   - Subí las fotos en la sección "Fotos"

**Opción B: Subida masiva** (Avanzado)
- Requiere script custom para subir a Supabase Storage
- Contactar soporte si necesitás ayuda

---

## 🎉 ¡Listo!

Tu app ahora tiene:
- ✅ Toda tu base de datos importada
- ✅ Usuarios configurados
- ✅ Sistema funcionando con Supabase
- ⚠️ Solo faltan fotos (re-subir manualmente)

---

## 🆘 Solución de Problemas

### "Error: Missing Supabase environment variables"
- Verificá que `.env.local` tenga `VITE_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- Reiniciá PowerShell después de editar `.env.local`

### "Error: relation does not exist"
- No ejecutaste las migraciones SQL
- Ejecutá `001_initial_schema.sql` y `002_rls_policies.sql` en Supabase

### "Error: duplicate key value violates unique constraint"
- Ya importaste los datos antes
- Si querés re-importar, borrá los datos de Supabase primero

### "Muchos errores (> 50)"
- Algún CSV puede estar corrupto
- Abrí el CSV en Excel/LibreOffice y verificá que esté bien formateado
- Contactá soporte

### "No puedo logearme después de crear el usuario"
- Verificá que el email en `auth.users` coincida EXACTAMENTE con el de la tabla `sellers`
- Verificá que marcaste "Auto Confirm User" al crear el usuario

---

## 📞 Soporte

Si tenés problemas:
1. Leé los errores en la consola
2. Verificá la sección "Solución de Problemas"
3. Revisá que todos los pasos previos estén completos

---

**Última actualización:** Noviembre 2024  
**Versión del script:** 1.0

