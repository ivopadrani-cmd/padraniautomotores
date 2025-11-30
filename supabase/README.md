# Supabase Setup para Padrani Automotores

## Estructura de Archivos

- `migrations/001_initial_schema.sql` - Schema completo de la base de datos
- `migrations/002_rls_policies.sql` - Políticas de Row Level Security

## Pasos de Instalación

### 1. Crear Proyecto en Supabase

1. Ve a https://app.supabase.com
2. Crea un nuevo proyecto
3. Anota:
   - Project URL (ej: `https://xxxxx.supabase.co`)
   - Anon Key (en Settings > API)

### 2. Ejecutar Migraciones

1. Ve a **SQL Editor** en tu proyecto Supabase
2. Ejecuta `migrations/001_initial_schema.sql` completo
3. Ejecuta `migrations/002_rls_policies.sql` completo

### 3. Configurar Storage

1. Ve a **Storage** en tu proyecto Supabase
2. Crea un nuevo bucket llamado `files`
3. Configuración recomendada:
   - **Public**: Sí (para archivos públicos)
   - **File size limit**: 50MB
   - **Allowed MIME types**: `image/*, application/pdf, application/*`

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 5. Crear Usuario Inicial

El sistema automáticamente creará el usuario `ivopadrani@gmail.com` con rol "Gerente" al intentar loguearse.

Si prefieres crearlo manualmente:

1. Ve a **Authentication** > **Users** en Supabase
2. Crea un nuevo usuario con email `ivopadrani@gmail.com`
3. En la tabla `users`, inserta:
   ```sql
   INSERT INTO users (id, email, full_name, role)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'ivopadrani@gmail.com'),
     'ivopadrani@gmail.com',
     'Ivo Padrani',
     'Gerente'
   );
   ```

## Estructura de la Base de Datos

### Tablas Principales

- **users** - Usuarios del sistema (extiende auth.users)
- **vehicles** - Vehículos en stock
- **clients** - Clientes y prospectos
- **sales** - Ventas realizadas
- **reservations** - Reservas de vehículos
- **quotes** - Presupuestos
- **leads** - Consultas/leads del CRM
- **tasks** - Tareas y eventos
- **vehicle_inspections** - Peritajes de vehículos
- **sellers** - Vendedores
- **branches** - Sucursales
- **exchange_rates** - Cotizaciones de moneda
- **agency_settings** - Configuración de la agencia

### Relaciones

- `vehicles.supplier_client_id` → `clients.id`
- `sales.client_id` → `clients.id`
- `sales.vehicle_id` → `vehicles.id`
- `reservations.client_id` → `clients.id`
- `reservations.vehicle_id` → `vehicles.id`
- `quotes.client_id` → `clients.id`
- `quotes.vehicle_id` → `vehicles.id`
- `leads.client_id` → `clients.id`
- `tasks.related_*_id` → entidades relacionadas
- `vehicle_inspections.vehicle_id` → `vehicles.id`

## Políticas RLS

Las políticas están configuradas para:

- **Usuarios autenticados**: Pueden leer/escribir en la mayoría de las tablas
- **Admins/Gerentes**: Acceso completo a configuración y usuarios
- **Mecánicos**: Acceso especial a peritajes (puede extenderse)

## Funciones RPC

Actualmente no se requieren funciones RPC adicionales. Las operaciones CRUD se realizan directamente desde el cliente.

## Migración de Datos

Ver `MIGRATION-README.md` para instrucciones de migración desde localStorage.

## Troubleshooting

### Error: "relation does not exist"
- Verifica que ejecutaste todas las migraciones SQL

### Error: "permission denied"
- Verifica que estás autenticado
- Verifica que las políticas RLS están activas

### Error: "bucket not found"
- Crea el bucket `files` en Storage

### Archivos no se suben
- Verifica permisos del bucket
- Verifica que el bucket existe

