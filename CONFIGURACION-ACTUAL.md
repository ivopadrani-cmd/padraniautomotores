# 🚗 CONFIGURACIÓN ACTUAL - PADRÁN AUTOMOTORES
*Fecha: Diciembre 2025*
*Versión: Commit c73ba26*

## 📋 ESTADO ACTUAL DEL PROYECTO

### ✅ Configuración Confirmada
- **Base de datos**: Supabase (xjziilcxvftaavkxciux)
- **Servidor**: Desarrollo local en http://localhost:5173/
- **API Dólar**: ArgentinaDatos (https://api.argentinadatos.com/v1/cotizaciones/dolares/)
- **Framework**: React + Vite
- **Estado Git**: 2 commits ahead of origin/main

### 🏗️ Arquitectura Actual
- **Frontend**: React con Vite
- **Backend**: Supabase
- **Estilos**: Tailwind CSS + Shadcn/ui
- **Estado**: TanStack Query
- **Notificaciones**: Sonner

### 🔧 Funcionalidades Implementadas
- ✅ Sistema completo de precios con InfoAuto
- ✅ API real de cotizaciones históricas
- ✅ Gestión completa de vehículos
- ✅ CRM con leads y clientes
- ✅ Sistema de presupuestos y ventas
- ✅ Módulo de agencia y usuarios
- ✅ Gestión de documentos y contratos

### 🎯 Últimos Cambios Aplicados
- **Commit c73ba26**: Corrección de errores críticos
  - InfoAuto: Botón guardar deshabilitado correctamente
  - Modal gastos: Z-index corregido
  - CRM: Navegación desde vista de detalle corregida
  - Modales: Blur reducido para mejor visibilidad

- **Commit 4df5cc0**: Mejoras de UI/UX
  - Blur de fondo reducido
  - Z-index modal gastos aumentado

### 📁 Estructura Importante
```
src/
├── api/
│   ├── dollarHistoryApi.js    # ✅ API real de cotizaciones
│   ├── base44Client.js        # ✅ Cliente Supabase
│   └── entities.js           # ✅ Definiciones de entidades
├── components/
│   ├── vehicles/             # ✅ Todos los componentes de vehículos
│   ├── crm/                  # ✅ Sistema CRM completo
│   └── ui/                   # ✅ Componentes Shadcn/ui
└── pages/                    # ✅ Todas las páginas principales
```

### 🔐 Variables de Entorno (.env.local)
```env
VITE_SUPABASE_URL=https://xjziilcxvftaavkxciux.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6InNlcnZpY2Vfcm9sZSJ9...
```

### 🚀 Comando para Desarrollar
```bash
npm run dev
# Servidor en: http://localhost:5173/
```

### 📝 Notas Importantes
- **SIEMPRE** usar esta versión como base
- **NUNCA** hacer reset sin backup
- **ANTES** de cualquier cambio mayor, verificar que el servidor funciona
- **DESPUÉS** de cambios, hacer commit inmediato
- La API de dólar histórico es REAL y actualizada

### 🛠️ Troubleshooting
Si hay problemas al iniciar:
1. `git status` - Verificar estado limpio
2. `npm run dev` - Iniciar servidor
3. Hard refresh en navegador: `Ctrl + Shift + R`
4. Verificar que no hay procesos Node antiguos

---
**Esta es la configuración ESTABLE y COMPLETA del proyecto.**
