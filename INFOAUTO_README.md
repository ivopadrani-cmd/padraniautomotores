# Módulo InfoAuto - Integración con API de Precios

## 📋 Descripción

Este módulo implementa una integración completa con la API de InfoAuto para consultar precios de vehículos y actualizar automáticamente los precios InfoAuto en el concesionario.

## 🚀 Características Principales

- ✅ **API Key Management**: Configuración segura de credenciales
- ✅ **Prueba de Conexión**: Verificación de conectividad con la API
- ✅ **Consulta de Marcas**: Lista completa de marcas disponibles
- ✅ **Búsqueda por CODIA**: Obtención de información detallada de modelos
- ✅ **Precios 0km**: Consulta de precios de lista
- ✅ **Actualización Automática**: Sistema background para mantener precios actualizados
- ✅ **Estadísticas de Cobertura**: Métricas de integración

## 🔧 Configuración Inicial

### 1. Obtener API Key
- Solicitar credenciales de acceso a InfoAuto
- La API utiliza autenticación Bearer Token

### 2. Configurar en la Aplicación
1. Ir al módulo **"InfoAuto API"** (disponible para Gerentes/Administradores)
2. Ingresar la API Key en el campo correspondiente
3. Hacer click en **"Configurar API Key"**
4. El sistema iniciará automáticamente la integración

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

### Seguridad

- API Key se almacena localmente (localStorage)
- No se transmite en logs o console
- Considerar encriptación para entornos de producción

## 📞 Soporte

Para problemas con la integración de InfoAuto:

1. Verificar que la API Key sea correcta
2. Comprobar conectividad a internet
3. Revisar logs de consola para errores específicos
4. Contactar soporte de InfoAuto si es necesario

---

**Última actualización**: Diciembre 2025
**Versión**: 1.0.0
