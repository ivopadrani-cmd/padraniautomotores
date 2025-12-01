# Padrani Automotores

Sistema de gestión integral para concesionarias de automotores. Aplicación profesional desarrollada con Vite+React y backend Supabase.

## 🚀 Estado del Proyecto

✅ **Migración a Supabase completada**
- Base de datos PostgreSQL configurada
- Autenticación con roles implementada
- Storage privado para máxima seguridad
- Row Level Security (RLS) activo

## 📋 Características

- **🚗 Vehículos**: Gestión completa de stock, peritajes, documentación, fotos
- **👥 CRM**: Consultas, clientes, seguimiento de leads, historial
- **💰 Ventas**: Presupuestos, reservas, ventas y contratos automáticos
- **📅 Tareas**: Agenda y gestión de tareas vinculadas a vehículos/clientes
- **🔧 Peritajes**: Módulo para mecánicos con workflow de aprobación
- **⚙️ Agencia**: Configuración, usuarios, roles, plantillas de contratos
- **🔐 Seguridad**: Bucket privado, URLs firmadas, control de acceso por roles

## 🛠️ Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Supabase
1. Crear proyecto en https://app.supabase.com
2. Ejecutar SQL: `supabase/migrations/001_initial_schema.sql`
3. Ejecutar SQL: `supabase/migrations/002_rls_policies.sql`
4. Crear bucket "files" en Storage (PRIVADO)

### 3. Variables de entorno
Crear archivo `.env`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. Ejecutar
```bash
npm run dev
```

### 5. Build para producción
```bash
npm run build
```

## 📚 Documentación

- **`context-negocio.md`** - Filosofía del producto, módulos, reglas de negocio ⭐
- **`MIGRATION-README.md`** - Guía de migración a Supabase
- **`SEGURIDAD-ARCHIVOS.md`** - Explicación de seguridad y archivos privados
- **`INFORME-TECNICO-MIGRACION.md`** - Análisis técnico detallado
- **`supabase/README.md`** - Configuración de base de datos y RLS

## 🔑 Usuario por Defecto

El sistema crea automáticamente el usuario gerente:
- **Email**: `ivopadrani@gmail.com`
- **Rol**: Gerente (acceso completo)
- **Password**: Cualquiera (se crea en primer login)

## 🔐 Seguridad

- ✅ Bucket privado con URLs firmadas (1 año)
- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Autenticación Supabase Auth
- ✅ Control de acceso por roles (Gerente, Admin, Vendedor, Mecánico)
- ✅ Protección de datos personales (GDPR ready)

## 🏗️ Stack Tecnológico

- **Frontend**: React 18 + Vite 6
- **Estilos**: TailwindCSS + Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Estado**: React Query (@tanstack/react-query)
- **Navegación**: React Router v7
- **Formularios**: React Hook Form + Zod

## 📁 Estructura del Proyecto

```
padraniautomotores/
├── src/
│   ├── api/
│   │   ├── supabaseClient.js    # Cliente de Supabase (backend)
│   │   ├── base44Client.js      # Adaptador de compatibilidad
│   │   ├── localClient.js       # Fallback localStorage
│   │   └── entities.js          # Entidades exportadas
│   ├── pages/                   # Páginas de la aplicación
│   ├── components/              # Componentes reutilizables
│   └── main.jsx                 # Punto de entrada
├── supabase/
│   ├── migrations/              # Migraciones SQL
│   │   ├── 001_initial_schema.sql
│   │   └── 002_rls_policies.sql
│   └── README.md                # Documentación de BD
├── scripts/                     # Scripts de migración
│   ├── migrate-localStorage-to-supabase.js
│   └── migrate-browser.js
└── docs/                        # Documentación adicional
```

## 🚀 Próximos Pasos

### Si aún no migraste a Supabase:
1. Seguir instrucciones en `MIGRATION-README.md`
2. Ejecutar migraciones SQL
3. Configurar bucket de Storage
4. Crear archivo `.env` con credenciales

### Si ya migraste:
1. Verificar que el bucket "files" sea **PRIVADO**
2. Probar login con `ivopadrani@gmail.com`
3. Subir fotos de vehículos
4. Verificar que aparezcan en Supabase Storage

## 📦 Importación desde Base44 (CSV)

Si tenés datos exportados de Base44 en formato CSV, podés importarlos automáticamente:

### 1. Requisitos previos
- Tener los CSV exportados de Base44 en `C:\Users\usuario\Downloads\`
- Archivos deben llamarse: `Vehicle_export.csv`, `Client_export.csv`, etc.
- Tener la **Service Role Key** de Supabase

### 2. Configurar Service Role Key
Agregá en `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

**⚠️ NUNCA subas esta key a Git**

### 3. Ejecutar importación
```bash
node scripts/import-csv-to-supabase.js
```

El script:
- ✅ Importa todos los CSV en orden correcto
- ✅ Respeta relaciones entre tablas
- ✅ Reporta progreso en tiempo real
- ✅ Maneja errores y continúa

### 4. Post-importación
- 🔗 **URLs de Base44 ya no funcionan**: Re-subir fotos/documentos
- 👤 **Usuarios**: Crear manualmente en Supabase Auth
- ✅ **Verificar datos** antes de usar en producción

---

## ⚠️ Importante

- **Siempre consultar `context-negocio.md`** antes de hacer cambios
- No crear módulos que no existan en `context-negocio.md`
- Respetar la filosofía minimalista del producto
- El bucket DEBE ser privado para proteger datos de clientes

## 📞 Soporte Técnico

Para dudas sobre:
- **Negocio/Funcionalidad**: Ver `context-negocio.md`
- **Migración**: Ver `MIGRATION-README.md`
- **Seguridad**: Ver `SEGURIDAD-ARCHIVOS.md`
- **Base de datos**: Ver `supabase/README.md`

---

**Versión**: 2.0  
**Backend**: Supabase  
**Última actualización**: Noviembre 2024
