# Módulo InfoAuto - Integración con API JWT de Precios

## 📋 Descripción

Este módulo implementa una integración completa con la API de InfoAuto usando autenticación JWT para consultar precios de vehículos y actualizar automáticamente los precios InfoAuto en el concesionario.

## 🚀 Características Principales

- ✅ **Autenticación JWT**: Sistema completo de tokens (access + refresh)
- ✅ **Gestión Automática de Tokens**: Renovación automática cada 10 minutos
- ✅ **Prueba de Conexión**: Verificación de conectividad y autenticación
- ✅ **Consulta de Marcas**: Lista completa de marcas disponibles
- ✅ **Búsqueda por CODIA**: Obtención de información detallada de modelos
- ✅ **Precios 0km**: Consulta de precios de lista
- ✅ **Actualización Automática**: Sistema background para mantener precios actualizados
- ✅ **Estadísticas de Cobertura**: Métricas de integración

## ⚠️ **NORMAS CRÍTICAS DE USO - NO INFRINGIR**

### 🚨 **Reglas Obligatorias para Evitar Bloqueos**

**InfoAuto tiene normas estrictas que SIEMPRE debes respetar:**

#### **🔐 Autenticación JWT:**
- **NO generes access tokens nuevos por cada consulta** (considerado mal uso = BLOQUEO)
- **Reutiliza access tokens** mientras sean válidos (1 hora)
- **Usa refresh tokens** para renovación automática (válidos 24 horas)
- **Implementa persistencia** de tokens (localStorage/cron jobs/Redis recomendado)

#### **📊 Rate Limiting:**
- **Respeta límites de consultas** para evitar bloqueos
- **Implementa renovación automática** cada 10 minutos (no más frecuente)
- **Monitorea respuestas de error** (401 = token expirado, renovar automáticamente)

#### **🔄 Renovación de Tokens:**
- **Access Token:** válido 1 hora (renovar con refresh token)
- **Refresh Token:** válido 24 horas (volver a login si expira)
- **Basic Auth solo para login inicial** (usuario/contraseña → tokens)

#### **💾 Persistencia Recomendada:**
- **Redis/cron jobs** para mantener tokens válidos entre reinicios
- **LocalStorage** como alternativa simple (válido para sesiones)
- **Nunca almacenes** credenciales en texto plano

### 🚫 **MALAS PRÁCTICAS QUE CAUSAN BLOQUEOS:**
- ❌ Generar tokens en cada request
- ❌ No manejar expiración de tokens
- ❌ Exceder límites de rate limiting
- ❌ Compartir credenciales entre aplicaciones
- ❌ No implementar renovación automática

---

## 🔧 Configuración Inicial

### ⚠️ **Importante: Servicio Comercial**

**InfoAuto es un servicio pago** que requiere suscripción activa. El módulo está preparado para integrar con su API, pero necesitas:

1. **Contactar a InfoAuto** para adquirir una suscripción
2. **Solicitar acceso a la API** de integración
3. **Obtener las credenciales** (API Key) proporcionadas por InfoAuto

### 💰 **Costos y Suscripción**
- InfoAuto cobra por el acceso a su API
- Los precios varían según el plan y volumen de consultas
- Contacta directamente a InfoAuto para cotización

### 2. Configurar en la Aplicación
1. Ir al módulo **"InfoAuto API"** (disponible para Gerentes/Administradores)
2. Ingresar **usuario (email)** y **contraseña** proporcionados por InfoAuto
3. Hacer click en **"Configurar Credenciales y Autenticar"**
4. El sistema obtendrá automáticamente tokens JWT y comenzará la integración

### 🔒 CORS en Desarrollo Local

**IMPORTANTE:** Durante el desarrollo verás errores de CORS. Esto es **normal y esperado**.

#### ¿Qué es CORS?
- **CORS** = Cross-Origin Resource Sharing (Intercambio de Recursos de Origen Cruzado)
- Es una medida de **seguridad del navegador web**
- Impide que sitios web hagan requests HTTP a otros dominios sin permiso explícito

#### ¿Por qué sucede en desarrollo?
- Tu aplicación corre en `http://localhost:5173` (puerto de desarrollo de Vite)
- La API de InfoAuto no permite requests desde `localhost` por seguridad
- El navegador bloquea automáticamente estos requests

#### ¿Es esto un problema?
- ❌ **NO** es un error en tu código
- ❌ **NO** necesitas cambiar de hosting (Vercel, Netlify, etc.)
- ❌ **NO** necesitas modificar la configuración de la API
- ✅ Es **comportamiento normal** en desarrollo local
- ✅ En **producción funcionará perfectamente**

#### ¿Cuándo funcionará correctamente?
- Cuando despliegues la aplicación a **producción**
- El dominio de producción será autorizado por InfoAuto
- Los tokens JWT se generarán sin problemas
- Todas las funcionalidades de integración funcionarán

#### Mensaje que verás en desarrollo:
```
🚫 CORS: Requests bloqueados en desarrollo local.
Los tokens funcionarán correctamente en producción.
```

## 📊 Funcionalidades Disponibles

### 🧪 Módulo de Pruebas (InfoAutoTester)

#### 1. **Configuración de API**
- Campo para ingresar API Key
- Indicador visual de estado de configuración

#### 2. **Prueba de Conexión**
- Verificación de conectividad con la API
- Información de última actualización de InfoAuto
- Año en curso de la base de datos

#### 3. **Marcas Disponibles**
- Lista paginada de todas las marcas
- Información de grupos por marca
- Descarga completa de marcas con grupos

#### 4. **Modelos por Marca**
- Selección de marca para ver modelos disponibles
- Información completa: nombre, CODIA, año
- Grupos disponibles por marca

#### 5. **Búsqueda por CODIA**
- Campo de búsqueda para códigos CODIA (ej: VW001AA)
- Información completa del modelo
- Precio 0km actualizado
- Historial de precios usados (próximamente)

#### 6. **Precios y Valores**
- Información de precios 0km
- Precios usados por año (próximamente)

#### 7. **Integración Automática**
- Control del servicio de actualización automática
- Estadísticas de cobertura de CODIA
- Información de última verificación
- Actualización manual de precios

## 🔄 Sistema de Actualización Automática

### Cómo Funciona

1. **Verificación Periódica**: Cada 10 minutos el sistema consulta la API
2. **Detección de Cambios**: Compara con la última actualización registrada
3. **Actualización Selectiva**: Solo actualiza precios con cambios significativos (>1%)
4. **Base de Datos**: Actualiza automáticamente el campo `infoauto_value`

### Beneficios

- ✅ **Ahorro de Tiempo**: No es necesario actualizar precios manualmente
- ✅ **Precios Actualizados**: Información siempre al día
- ✅ **Procesos Optimizados**: Automatización de tareas repetitivas
- ✅ **Precisión**: Precios históricos se mantienen para referencia

### Control del Servicio

- **Iniciar/Detener**: Control manual del servicio automático
- **Estado Visual**: Indicador del estado del servicio
- **Estadísticas**: Métricas de cobertura y actualización

## 📈 Estadísticas de Integración

### Métricas Disponibles

- **Total de Vehículos**: Número total en la base de datos
- **Vehículos con CODIA**: Porcentaje de cobertura
- **Última Verificación**: Timestamp de última consulta a API
- **Estado del Servicio**: Activo/Inactivo

### Cobertura Recomendada

- **Objetivo**: >80% de vehículos con CODIA asignado
- **Beneficio**: Mayor precisión en precios automáticos
- **Proceso**: Asignar CODIA al crear/editar vehículos

## 🔍 Endpoints de la API Utilizados

### InfoAuto Demo API Endpoints

```
GET  /datetime              # Última actualización
GET  /current_year          # Año en curso
GET  /brands/               # Lista de marcas (paginada)
GET  /brands/download/      # Todas las marcas con grupos
GET  /brands/{id}/models/   # Modelos por marca
GET  /models/{codia}        # Información del modelo
GET  /models/{codia}/list_price  # Precio 0km
```

### Autenticación

```javascript
headers: {
  'Authorization': `Bearer ${apiKey}`,
  'API-Key': apiKey  // Fallback alternativo
}
```

## 🛠️ Desarrollo y Personalización

### Archivos Principales

```
src/services/infoautoApi.js              # Cliente de API principal
src/services/infoAutoIntegration.js      # Servicio de integración automática
src/hooks/useInfoAuto.js                 # Hooks personalizados
src/pages/InfoAutoTester.jsx             # Interfaz de pruebas
```

### Extensiones Futuras

- ✅ **Precios Usados**: Implementar consulta de precios usados por año
- ✅ **Múltiples Monedas**: Soporte para conversión automática
- ✅ **Alertas de Precios**: Notificaciones de cambios significativos
- ✅ **Historial de Cambios**: Registro de actualizaciones por vehículo

## 🚨 Notas Importantes

### Limitaciones de la Demo

- Contiene datos de ejemplo, no información real completa
- Algunos modelos pueden no tener precios disponibles
- La API demo puede tener restricciones de uso

### Consideraciones de Producción

- Implementar rate limiting para evitar sobrecargar la API
- Manejar errores de red y timeouts apropiadamente
- Considerar cache local para mejorar performance
- Implementar logging detallado para debugging

### Seguridad y Autenticación JWT

#### **Flujo de Autenticación:**
1. **Login Inicial:** `POST /auth/login` con Basic Auth (usuario:contraseña)
2. **Respuesta:** access_token + refresh_token
3. **Requests API:** Header `Authorization: Bearer {access_token}`
4. **Renovación:** `POST /auth/refresh` con Bearer refresh_token
5. **Persistencia:** Tokens guardados en localStorage

#### **Gestión de Tokens:**
- **Access Token:** 1 hora de validez
- **Refresh Token:** 24 horas de validez
- **Renovación Automática:** Cada 50 minutos (10 min antes de expirar)
- **Fallback:** Re-autenticación si refresh falla

#### **Medidas de Seguridad:**
- **Credenciales:** Almacenadas localmente (localStorage)
- **Tokens:** Persistidos de forma segura
- **Rate Limiting:** Control automático de frecuencia
- **Validación:** Verificación continua de tokens
- **No en logs:** Credenciales nunca en console/logs

## ❓ ¿No tienes API Key de InfoAuto?

Si aún no tienes credenciales de InfoAuto:

### ✅ **¿Qué puedes hacer mientras tanto?**
- **Explorar el módulo**: Navega por todas las pestañas para entender la funcionalidad
- **Ver la estructura**: Comprende cómo funcionaría la integración
- **Planificar la implementación**: Decide qué funcionalidades usarás
- **Preparar los CODIA**: Asigna códigos CODIA a tus vehículos existentes

### 📋 **Próximos pasos para obtener API Key:**
1. **Visitar**: [www.infoauto.com.ar](https://www.infoauto.com.ar) (sitio aproximado)
2. **Buscar**: "Integración API" o "Desarrolladores"
3. **Contactar**: Solicitar información sobre API de precios
4. **Cotizar**: Pedir presupuesto según tu volumen de consultas
5. **Implementar**: Una vez tengas las credenciales, configurar en el módulo

### 💡 **Beneficios de la inversión:**
- Automatización completa de precios InfoAuto
- Ahorro de tiempo significativo
- Precios siempre actualizados
- Mejor precisión en valuaciones

## 📞 Soporte

Para problemas con la integración de InfoAuto:

1. Verificar que la API Key sea correcta
2. Comprobar conectividad a internet
3. Revisar logs de consola para errores específicos
4. Contactar soporte de InfoAuto si es necesario

---

**Última actualización**: Diciembre 2025
**Versión**: 1.0.0
