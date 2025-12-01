# Guía de Migración a Supabase

Esta guía explica cómo migrar la aplicación de localStorage a Supabase.

## Prerequisitos

1. **Crear proyecto en Supabase**
   - Ve a https://app.supabase.com
   - Crea un nuevo proyecto
   - Anota la URL y las API keys

2. **Instalar dependencias**
   ```bash
   npm install
   ```

## Configuración

1. **Crear archivo `.env`** (copia de `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

2. **Ejecutar migraciones SQL en Supabase**
   - Ve a SQL Editor en tu proyecto Supabase
   - Ejecuta `supabase/migrations/001_initial_schema.sql`
   - Ejecuta `supabase/migrations/002_rls_policies.sql`

3. **Crear bucket de Storage (PRIVADO para máxima seguridad)**
   - Ve a Storage en tu proyecto Supabase
   - Crea un bucket llamado `files`
   - ⚠️ **IMPORTANTE**: Configúralo como **PRIVADO** (Public bucket: OFF)
   - Esto garantiza que todos los archivos estén protegidos
   - El sistema usa URLs firmadas que expiran automáticamente

## Migración de Datos

### Opción 1: Migración Manual (Recomendado para empezar)

1. La aplicación automáticamente usará Supabase cuando esté configurado
2. Los datos nuevos se guardarán en Supabase
3. Los datos antiguos en localStorage seguirán funcionando hasta que los migres

### Opción 2: Script de Migración Automática

1. Exporta datos de localStorage a un archivo JSON (desde la consola del navegador):
   ```javascript
   const backup = {};
   for (let i = 0; i < localStorage.length; i++) {
     const key = localStorage.key(i);
     if (key.startsWith('local_db_')) {
       backup[key] = JSON.parse(localStorage.getItem(key));
     }
   }
   console.log(JSON.stringify(backup, null, 2));
   ```

2. Guarda el JSON en `localStorage-backup.json` en la raíz del proyecto

3. Ejecuta el script de migración:
   ```bash
   node scripts/migrate-localStorage-to-supabase.js
   ```

## Verificación

1. **Verificar autenticación**:
   - Intenta loguearte con `ivopadrani@gmail.com` / cualquier password
   - Deberías poder acceder con rol "Gerente"

2. **Verificar datos**:
   - Crea un vehículo nuevo
   - Verifica que aparezca en Supabase (Table Editor)

3. **Verificar archivos**:
   - Sube una foto
   - Verifica que aparezca en Storage

## Solución de Problemas

### Error: "Supabase credentials not found"
- Verifica que `.env` existe y tiene las variables correctas
- Reinicia el servidor de desarrollo

### Error: "relation does not exist"
- Ejecuta las migraciones SQL en Supabase

### Error: "permission denied"
- Verifica que las políticas RLS están configuradas
- Verifica que estás autenticado

### Archivos no se suben
- Verifica que el bucket `files` existe en Storage
- Verifica los permisos del bucket

## Próximos Pasos

Una vez migrado:
1. Elimina `src/api/localClient.js` (ya no se usa)
2. Actualiza las variables de entorno en producción
3. Configura backups automáticos en Supabase

---

## 📦 Importar datos desde Base44 (CSV)

Si exportaste datos de Base44, podés importarlos automáticamente:

### 1. Preparar archivos CSV
Todos los CSV deben estar en: `C:\Users\usuario\Downloads\`

### 2. Obtener Service Role Key
1. Ve a https://app.supabase.com
2. **Settings** → **API**
3. Copiá la **`service_role` key**

### 3. Configurar Service Role Key
Agregá en `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

**⚠️ NO subas esta key a Git**

### 4. Ejecutar importación
```bash
node scripts/import-csv-to-supabase.js
```

### 5. Crear usuarios en Auth
Los sellers se importan a la tabla, pero debes crear los usuarios manualmente en **Authentication** → **Users**

### 6. Re-subir archivos
Las URLs de Base44 ya no funcionan. Debés re-subir fotos y documentos.

