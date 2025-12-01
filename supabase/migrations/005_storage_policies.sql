-- =============================================
-- POLÍTICAS DE STORAGE PARA BUCKET 'files'
-- =============================================

-- Permitir que usuarios autenticados puedan:
-- 1. Subir archivos (INSERT)
-- 2. Ver sus propios archivos (SELECT)
-- 3. Actualizar sus archivos (UPDATE)
-- 4. Eliminar sus archivos (DELETE)

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

