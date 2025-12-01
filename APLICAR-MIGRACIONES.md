# 🔧 Aplicar Migraciones a Supabase

## ⚡ Solución al error de carga de archivos

### Paso 1: Ir al SQL Editor
1. Abrí: https://supabase.com/dashboard/project/xjziilcxvftaavkxciux/sql/new
2. Vas a ver un editor SQL

### Paso 2: Copiar y ejecutar este SQL

```sql
-- =============================================
-- POLÍTICAS DE STORAGE PARA BUCKET 'files'
-- =============================================

-- Permitir INSERT (upload) para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir archivos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'files');

-- Permitir INSERT para anónimos también (para testing)
CREATE POLICY "Anónimos pueden subir archivos"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'files');

-- Permitir SELECT (ver/descargar) para todos
CREATE POLICY "Todos pueden ver archivos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'files');

-- Permitir UPDATE para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden actualizar archivos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'files')
WITH CHECK (bucket_id = 'files');

-- Permitir DELETE para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden eliminar archivos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'files');

-- Permitir DELETE para anónimos (solo para desarrollo)
CREATE POLICY "Anónimos pueden eliminar archivos"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'files');

-- =============================================
-- AGREGAR COLUMNAS FALTANTES A VEHICLES
-- =============================================

-- Columna is_consignment (vehículo en consignación o no)
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS is_consignment BOOLEAN DEFAULT false;

-- Agregar comentario explicativo
COMMENT ON COLUMN public.vehicles.is_consignment IS 'Indica si el vehículo está en régimen de consignación';
```

### Paso 3: Ejecutar
1. Pegá todo el código en el editor
2. Hacé click en el botón **"Run"** (abajo a la derecha)
3. Debería decir "Success. No rows returned"

### Paso 4: Probar
1. Volvé a http://localhost:5173/
2. Intentá subir una foto o documento
3. ¡Debería funcionar! ✅

---

## ❓ Si aparece error de "policy already exists"

Es normal, significa que alguna política ya existe. Solo ignorá ese error específico, el resto se aplicará correctamente.

