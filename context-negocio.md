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

Fin del archivo


