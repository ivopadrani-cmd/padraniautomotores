# 🔒 Seguridad de Archivos - Padrani Automotores

## Configuración de Seguridad Implementada

Tu aplicación está configurada con **máxima protección de datos** usando un bucket PRIVADO en Supabase.

---

## ✅ Qué significa BUCKET PRIVADO

### Ventajas de Seguridad
1. **🔐 Archivos no accesibles públicamente**
   - Nadie puede acceder a los archivos sin autenticación
   - No se pueden "adivinar" URLs de archivos
   
2. **⏱️ URLs firmadas con expiración**
   - Cada archivo tiene una URL temporal firmada
   - URL válida por **1 año** (configurable)
   - Después de expirar, se regenera automáticamente
   
3. **👥 Control de acceso basado en roles**
   - Solo usuarios autenticados pueden subir/ver archivos
   - Las políticas RLS de Supabase validan permisos

---

## 📂 Estructura de Carpetas

```
files/ (bucket privado)
├── uploads/         → Fotos de vehículos, documentos generales
└── private/         → Documentos sensibles (DNI, contratos, etc.)
```

### ¿Cuándo usa cada carpeta?

**`uploads/`** - Función `UploadFile()`
- Fotos de vehículos
- Documentos de vehículos (cédula, VTV)
- Archivos adjuntos en ventas
- Fotos de peritajes

**`private/`** - Función `UploadPrivateFile()`
- DNI de clientes
- Contratos firmados
- Documentación personal sensible
- Documentos financieros

---

## ⚙️ Cómo Funciona Técnicamente

### 1. Subida de Archivo
```javascript
// Usuario sube foto de vehículo
const result = await base44.integrations.Core.UploadFile(file);

// Resultado:
{
  id: "1234567890_abc123.jpg",
  name: "vehiculo-foto.jpg",
  url: "https://xxx.supabase.co/storage/v1/object/sign/files/uploads/123.jpg?token=...",
  file_url: "...", // URL firmada válida por 1 año
  path: "uploads/1234567890_abc123.jpg" // Para regenerar URL
}
```

### 2. Visualización de Archivo
- La URL firmada permite acceso directo
- Se puede usar en `<img src={url}>` normalmente
- Funciona por 1 año sin problemas

### 3. Regeneración de URL (opcional)
Si una URL expira (después de 1 año):
```javascript
// Regenerar URL firmada
const newUrl = await base44.integrations.Core.CreateFileSignedUrl(path);
```

---

## 🛡️ Protección de Datos Implementada

### ✅ Datos Protegidos
- ✅ DNI y CUIT de clientes
- ✅ Documentos personales
- ✅ Contratos y boletos de compraventa
- ✅ Fotos de vehículos en consignación
- ✅ Documentación de vehículos (cédulas)
- ✅ Presupuestos y cotizaciones
- ✅ Peritajes mecánicos

### 🔐 Seguridad Multi-Capa
1. **Capa 1**: Bucket privado (Supabase Storage)
2. **Capa 2**: Autenticación obligatoria (Supabase Auth)
3. **Capa 3**: Row Level Security (RLS policies)
4. **Capa 4**: URLs firmadas con expiración

---

## 🚀 Configuración en Supabase

### Paso 1: Crear Bucket Privado
1. Ve a **Storage** en Supabase
2. Click en **New bucket**
3. Nombre: `files`
4. **Public bucket**: ❌ **OFF** (IMPORTANTE)
5. File size limit: `50 MB` (o más)
6. Click en **Create**

### Paso 2: Políticas de Acceso (ya configuradas en RLS)
Las políticas de `002_rls_policies.sql` controlan:
- Solo usuarios autenticados pueden subir archivos
- Gerentes y Administradores tienen acceso completo
- Vendedores pueden subir/ver archivos relacionados con sus operaciones

---

## 📋 Comparación: Público vs Privado

| Característica | Bucket PÚBLICO | Bucket PRIVADO ✅ |
|----------------|----------------|-------------------|
| Seguridad | ⚠️ Baja | 🔐 Alta |
| URLs | Permanentes | Firmadas (expiran) |
| Acceso | Cualquiera con URL | Solo autenticados |
| GDPR/PDPA | ❌ No cumple | ✅ Cumple |
| Uso recomendado | Logos, imágenes web | **Datos de clientes** |

---

## ⚠️ Consideraciones Importantes

### URLs con Expiración de 1 Año
- ✅ **Ventaja**: No tenés que regenerar URLs constantemente
- ⚠️ **Consideración**: Después de 1 año, la URL expira
- 💡 **Solución**: El sistema guarda el `path` para regenerar automáticamente

### Rendimiento
- Las URLs firmadas funcionan igual de rápido que URLs públicas
- No hay diferencia en velocidad de carga
- Las imágenes se cachean normalmente en el navegador

### Backup y Migración
- Los archivos están en Supabase Storage
- Se pueden descargar usando la API
- El script de migración maneja archivos automáticamente

---

## 🔄 Migración desde localStorage

El script de migración (`migrate-localStorage-to-supabase.js`) automáticamente:
1. ✅ Convierte archivos base64 a archivos reales
2. ✅ Sube a Supabase Storage (bucket privado)
3. ✅ Genera URLs firmadas
4. ✅ Actualiza referencias en la base de datos

---

## 📞 Troubleshooting

### Error: "File not found" o "Invalid token"
**Causa**: URL firmada expiró
**Solución**: Regenerar URL con `CreateFileSignedUrl(path)`

### Error: "Bucket not found"
**Causa**: Bucket no existe
**Solución**: Crear bucket "files" en Supabase Storage

### Error: "Permission denied"
**Causa**: Usuario no autenticado o sin permisos
**Solución**: Verificar que el usuario esté logueado y tenga rol adecuado

### Archivos no se suben
**Causa**: Bucket configurado como público pero código espera privado
**Solución**: Configurar bucket como PRIVADO en Supabase

---

## 🎯 Resumen Ejecutivo

**Tu aplicación está configurada con máxima seguridad:**
- ✅ Todos los archivos están protegidos
- ✅ Solo usuarios autenticados pueden acceder
- ✅ URLs temporales que expiran
- ✅ Control de acceso por roles
- ✅ Cumple con regulaciones de protección de datos

**No tenés que hacer nada especial:**
- El sistema maneja todo automáticamente
- Subís archivos normalmente
- Se muestran normalmente en la UI
- La seguridad funciona en segundo plano

---

**Última actualización**: Noviembre 2024  
**Configuración**: Bucket Privado con URLs Firmadas (1 año)

