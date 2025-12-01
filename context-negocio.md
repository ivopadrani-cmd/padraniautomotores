1. Identidad del producto

Nombre interno: Padrani Automotores – Sistema de Gestión Integral

El producto es una plataforma de gestión automotriz pensada para concesionarias argentinas de vehículos usados y 0km, especialmente PYMES.
Objetivo principal: unificar todos los procesos de la concesionaria en un solo sistema, evitando tareas duplicadas, mejorando el flujo, y guiando al usuario de forma intuitiva, simple y ordenada.

El diseño debe ser:

Minimalista

Moderno

Estético

Práctico

Enfocado en UX

Muy fácil de usar

Sin pantallas innecesarias

Sin carga repetida de datos

Todo interconectado

Visión a futuro: escalar para múltiples agencias, varias sucursales, incluso adaptaciones internacionales.

2. Filosofía del producto

El sistema se construye bajo estos principios:

Todo se conecta: Vehículos, clientes, consultas, peritajes, ventas, reservas, presupuestos, tareas.

Nada se carga dos veces: un dato cargado en un módulo debe servir en todos los demás.

Guía inteligente: el sistema debe guiar el proceso paso por paso, indicando qué falta completar.

Minimalismo funcional: solo las funciones necesarias, sin ruido visual ni complejidad.

Documentación clara: contratos automáticos, estados del vehículo, historial completo.

Escalabilidad real: arquitectura lista para crecer pero sin implementar módulos antes de tiempo.

3. Módulos ACTUALES (únicos presentes hoy)

Cursor solo debe trabajar sobre estos módulos.
No debe crear módulos nuevos sin instrucción explícita.

3.1 Vehículos (módulo principal del sistema)

Es el módulo más importante. Contiene:

Lista navegable de vehículos.

Vista de detalle con SECCIONES:

Información general

Proveedor / consignación

Contrato de consignación automático con un clic

Costos & gastos con su moneda + cotización según fecha

Documentos (solo checklist simple + opcional subir archivos)

Fotos

Peritaje cargado por mecánico

Estados del vehículo

Flujo comercial completo:

Presupuesto

Reserva (con recibo de seña)

Venta en proceso (boleto/contrato automático)

Venta finalizada / Entrega

Historial completo centralizado: todas las acciones quedan registradas.

Es un módulo pensado para trabajar rápido, sin pantallas innecesarias, todo en una vista limpia.

3.2 CRM (Consultas + Clientes)
Consultas

Registrar leads.

Asignar cliente.

Ver historial y estado del lead.

Desde la consulta se puede:

vincular vehículos de interés del stock,

crear presupuestos,

imprimir y enviar presupuesto,

avanzar a reserva o venta (integrado al módulo Vehículos).

Clientes

Base de datos de prospectos y clientes.

Información del cliente + operaciones asociadas.

Consultas y clientes eventualmente se podrán separar, pero hoy funcionan dentro del mismo módulo CRM.

3.3 Tareas / Agenda

Crear tareas y eventos.

Vincularlos a:

cliente,

consulta,

vehículo,

operación (venta/reserva).

Campos: título, fecha/hora, responsable, estado, descripción.

Notificaciones en el dashboard.

Vista calendario + lista.

3.4 Peritajes (solo rol Mecánico)

Módulo operativo para mecánicos, integrado al flujo del vehículo.

Solo visible para:

Mecanico

Owner

Administrador

Gerente

Flujo:

El agenciero solicita peritaje.

El mecánico ve lista de peritajes pendientes.

Carga diagnóstico + daños + sugerencias + costos.

El agenciero aprueba o pide revisión.

Resultado final:

El peritaje queda guardado dentro del vehículo, no como entidad separada a nivel negocio.

3.5 Agencia (configuración)

Usuarios

Roles

Datos de agencia y sucursales

Plantillas de contratos

Cotizaciones internas del dólar

3.6 Dashboard

Resumen del día.

Calendario.

Tareas próximas.

Notificaciones.

Alertas generales.

Acceso rápido a procesos frecuentes.

4. Cosas que NO existen actualmente (no deben aparecer)

Esto es MUY importante para evitar que Cursor agregue cosas que no querés todavía.

NO existe módulo financiero de ingresos/egresos.

NO existe módulo de trámites independiente.

NO existe documentación escaneada compleja.

NO existe un DMS grande o herramientas contables.

NO existen integraciones externas "pesadas".

Todo eso puede venir en el futuro, pero HOY no existe.

5. Escalabilidad futura (sin implementarlo ahora)

El sistema se diseña para permitir:

Multi-agencia

Multi-sucursal

Multi-usuario con permisos detallados

Integración con publicadores (Meta, ML)

Flujos personalizados por agencia

Roles avanzados

Seguridad robusta

API pública

Internacionalización

Pero no debe implementarse nada de esto sin orden explícita.

6. Estándares esperados para el desarrollo

Cursor debe desarrollar con:

Código claro

Arquitectura modular

Explicaciones técnicas antes de implementar cambios grandes

Respeto estricto por los módulos existentes y la intención del producto

UX minimalista, limpia y rápida

Evitar sobrecarga de pantallas y menús

Evitar complejidad innecesaria

7. Meta final para Cursor

Este contexto existe para que Cursor:

Entienda el negocio.

Entienda la intención del sistema.

Entienda los módulos reales.

Entienda el tipo de usuario final.

Evalúe consistencia, errores y mejoras posibles.

Diseñe un backend/arquitectura escalable en Supabase o Node según convenga.

Genere mejoras alineadas al producto, no caprichos técnicos.

8. Instrucción explícita para trabajo futuro

Cada vez que se pida a Cursor mejorar, modificar o crear funcionalidad, debe:

Leer este archivo completo.

Verificar que su interpretación sea consistente.

Explicar en 3–5 bullets qué va a hacer.

Preguntar confirmación si el cambio puede alterar algún módulo.

Recién ahí modificar el código.

9. Nota para IA

Este documento tiene prioridad en la toma de decisiones sobre:

código existente,

dudas sobre arquitectura,

decisiones de diseño,

interpretación de funciones,

comportamiento de cada módulo.

Si algo en el código contradice este documento, se asume que el documento es la versión correcta.

---

## 10. ROADMAP FUTURO - Integraciones y Módulos Planificados

Esta sección documenta funcionalidades e integraciones futuras que NO deben implementarse hasta recibir instrucción explícita. Son ideas a largo plazo que guían la arquitectura pero no se desarrollan todavía.

### 10.1 Integraciones de Comunicación

#### WhatsApp Business API
- Envío automático de fotos de vehículos
- Compartir presupuestos directamente
- Envío de documentos (contratos, facturas)
- Notificaciones de estado de operaciones
- Chatbot para consultas frecuentes

#### Email Marketing
- Envío masivo de presupuestos
- Newsletters con stock destacado
- Seguimiento automático de leads
- Integración con templates personalizables

#### Google Drive / Cloud Storage
- Sincronización automática de documentos
- Backup de fotos y archivos
- Compartir carpetas con clientes
- Acceso desde múltiples dispositivos
- Sin necesidad de descargar/subir manualmente

### 10.2 Integraciones con APIs Externas (Argentina)

#### DNRPA (Dirección Nacional de Registro de la Propiedad del Automotor)
- Consulta de dominio vehicular
- Verificación de titularidad
- Estado de inhibiciones
- Valuación fiscal automática
- Validación de datos técnicos

#### InfoAuto
- Cotizaciones automáticas de mercado
- Precios de referencia por modelo/año/versión
- Actualización diaria/mensual de valores
- Comparación con precio de venta
- Alertas de desviación significativa

### 10.3 Módulo de Multipublicador

Publicación unificada en múltiples plataformas con UN solo formulario:

#### Plataformas Soportadas:
- **Mercado Libre**: Publicación automática con fotos, descripción, precio
- **Facebook Marketplace**: Integración con perfil comercial
- **Instagram**: Feed de vehículos disponibles
- **Meta Business Suite**: Gestión centralizada
- **WhatsApp Catalog**: Catálogo de productos automático

#### Características:
- Formulario único con datos comunes
- Mapeo automático de campos por plataforma
- Uso de fotos y datos ya cargados en el sistema
- Publicación con un solo click
- Sincronización de estado (disponible/vendido)
- Gestión de respuestas centralizada

### 10.4 Chatbot Inteligente Multi-Plataforma

#### Canales Integrados:
- WhatsApp Business
- Instagram Direct
- Facebook Messenger
- Facebook Marketplace

#### Funcionalidades del Chatbot:
- **Automáticas**:
  - Responder consultas frecuentes
  - Enviar fotos de vehículos específicos
  - Compartir información técnica
  - Agendar test drives
  - Recolectar datos del prospecto
  
- **Semiautomáticas**:
  - Flujo de pre-aprobación de crédito
  - Recolección de documentación para trámites
  - Cotización express con datos básicos
  - Generación de presupuestos preliminares

- **Escalamiento a Humano**:
  - Detección de consultas complejas
  - Derivación automática a vendedor
  - Notificación al equipo comercial
  - Contexto completo de la conversación

### 10.5 CRM Unificado Avanzado

Evolución del CRM actual hacia una plataforma completa:

#### Bandeja de Entrada Unificada:
- Todas las conversaciones en un solo lugar
- WhatsApp, Instagram, Facebook, Marketplace, Email
- Vista cronológica por cliente
- Historial completo de interacciones

#### Gestión de Leads:
- **Segmentación Automática**:
  - Por presupuesto
  - Por tipo de vehículo buscado
  - Por etapa del funnel
  - Por fuente de origen
  
- **Segmentación Manual**:
  - Tags personalizados
  - Estados custom
  - Categorías de prioridad

#### Seguimientos:
- **Automáticos**:
  - Recordatorios programados
  - Emails de seguimiento
  - WhatsApp de reactivación
  - Actualización de estado de leads

- **Manuales**:
  - Agenda de llamadas
  - Tareas asignadas por vendedor
  - Notas y observaciones

#### Control del Chatbot:
- Panel de administración de respuestas
- Pausar/activar bot por cliente
- Revisar conversaciones del bot
- Entrenar respuestas nuevas
- Estadísticas de efectividad

#### Features Avanzadas:
- Scoring de leads (probabilidad de compra)
- Predicción de cierre
- Análisis de sentimiento
- Dashboard de conversión por canal
- Reportes de performance por vendedor

#### Objetivo Final:
Reemplazar CUALQUIER CRM genérico (Pipedrive, HubSpot, Bitrix24) con uno diseñado 100% para concesionarias argentinas, con todas las particularidades del negocio automotor (consignación, permuta, financiación, etc.)

### 10.6 Módulo Financiero Completo

#### Gestión de Ingresos y Egresos:
- Registro de todas las transacciones
- Categorización automática
- Vinculación con ventas y gastos de vehículos
- Multi-moneda (ARS, USD) con tipo de cambio

#### Integración Bidireccional:
- Gastos de vehículos → Automáticamente en finanzas
- Ventas → Automáticamente generan ingresos
- Reservas → Anticipos registrados
- Sin doble carga de datos
- Flujo natural desde cualquier módulo

#### Arqueos de Caja:
- Múltiples cajas simultáneas
- Cajas por sucursal o por usuario
- Asignación de monedas (ARS, USD)
- Conciliación diaria/semanal/mensual
- Detección de diferencias

#### Cuentas Bancarias:
- Simulación de múltiples cuentas
- NO vinculación real (seguridad)
- Control de saldos
- Transferencias entre cuentas
- Movimientos registrados

#### Reportes y Dashboard:
- Estado financiero en tiempo real
- Flujo de caja proyectado
- Rentabilidad por vehículo
- Comparación de períodos
- Gráficos de tendencias
- Alertas de saldos bajos

### 10.7 Internacionalización

Adaptar el sistema para uso en otros países:

#### Aspectos a Considerar:
- Formatos de documentos por país
- Regulaciones locales
- Monedas locales
- Idiomas
- APIs gubernamentales específicas
- Flujos de venta adaptados
- Documentación legal por región

### 10.8 Arquitectura Multi-Agencia

Sistema SaaS con múltiples agencias:

#### Características:
- Registro de agencias independientes
- Aislamiento total de datos entre agencias
- Cada agencia con sus propios usuarios y roles
- Planes de suscripción diferenciados
- Panel super-admin para gestión
- Onboarding automático
- Facturación por agencia

---

## 11. Notas Sobre el Roadmap Futuro

### Priorización:
Las funcionalidades del Roadmap se implementarán SOLO cuando:
1. Los módulos actuales estén 100% funcionales y probados
2. Se reciba instrucción explícita del usuario
3. Se valide la necesidad real con uso en producción

### Desarrollo Iterativo:
- Cada integración se desarrolla, prueba y perfecciona individualmente
- NO implementar todo junto
- Validar con usuarios reales antes de continuar
- Mantener siempre la filosofía de simplicidad

### Viabilidad Técnica:
La mayoría de estas integraciones son **técnicamente factibles** con IA (Cursor + Claude) pero requieren:
- Acceso a APIs (algunas son de pago)
- Permisos y autorizaciones (Meta Business, WhatsApp Business)
- Tiempo de desarrollo e iteración (semanas/meses)
- Testing exhaustivo

### Complejidad Estimada por Feature:
- ✅ **Fácil** (1-2 semanas con IA): Email, Drive, Finanzas básicas
- ⚠️ **Medio** (2-4 semanas con IA): CRM avanzado, Chatbot básico, InfoAuto
- 🔴 **Complejo** (1-2 meses con IA + posible developer): Multipublicador completo, Chatbot IA avanzado, Multi-agencia completo

Fin del archivo
