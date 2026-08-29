# 📊 Auditoría del Repositorio Copihue

**Fecha de auditoría:** Agosto 2026  
**Archivos analizados:** +250 archivos `.html` (se tomaron como referencia los archivos "canónicos" sin sufijo de versión/backup).

---

## 🔍 Hallazgos de contexto

1. **Versiones paralelas:** Existen dos versiones activas de SendWA en el repo (`copihue-sendwa.html` v75 y `sendwa.html` v89) — no quedó claro cuál es la vigente.
2. **Herramientas superpuestas:** Hay tres herramientas de finanzas (`copihue-dinero.html`, `copihue-finanzas.html`, `copihue-finanzalento.html`) sin que se distinga cuál reemplazó a cuál.
3. **Estructura:** La gran mayoría de los archivos son versiones, backups o experimentos con distintos modelos de IA (deepseek, gemini, grok, juegos sueltos como pacman.html, dungeon-fps.html, y un generador de carátulas de PS2 sin relación con el almacén).

---

## 📋 Tabla de auditoría

| Herramienta | Estado | Problema que resuelve | Facilidad para vecino | Potencial comercial | Adaptación necesaria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `copihue-flyer.html` | Funcional, activo (fixes recientes v5.36) | Genera piezas gráficas de ofertas automáticamente | Media — hoy usa fotos ya cargadas en el catálogo, no toma foto en el momento | Alto | Media: agregar input de cámara/galería directo + desacoplar de las 8 categorías internas de Copihue |
| `imagenes-productos/VAO_Marca_de_agua.html` | Funcional, genérico | Aplica marca de agua a fotos en lote | Alta — ya tiene `<input type=file accept="image/*" multiple>`, no depende de la planilla | Alto | Baja: es prácticamente standalone ya |
| `imagenes-productos/VAO_Optimizador de imágenes.html` | Funcional, genérico | Comprime/optimiza fotos de producto | Alta — mismo motivo, sin dependencia de Sheets visible | Medio-Alto | Baja |
| `letrero-copihue.html` | Funcional, liviano (12K) | Genera cartel/letrero para el negocio | Alta — herramienta chica y autocontenida | Medio | Baja-Media |
| `copihue-horario.html` | Funcional | Calcula y muestra si el negocio está abierto/próxima apertura | Alta — la lógica (`esDiaAbierto`, `proximaApertura`) es simple y genérica | Medio | Media: hoy lee horarios desde la planilla; hay que reemplazar eso por config simple en el propio front |
| `copihue-fotos.html` | Funcional (v1.2) | Carga y gestión de fotos de productos del catálogo | Media — tiene input de cámara, pero las funciones (`simplificarNombre`, slugs) están pensadas para el esquema de columnas de Copihue | Medio | Media-Alta |
| `imagenes-productos/VAO_Sincronizador Inteligente.html` | Funcional, semi-genérico | Compara listas (catálogo vs stock) y detecta faltantes | Media — el concepto es útil pero abstracto para un vecino sin catálogo digital previo | Medio | Media |
| `copihue-sendwa.html` / `sendwa.html` | Dos versiones activas en paralelo | Envío de promos personalizadas por WhatsApp con collages | Baja hoy — muy potente pero profundamente atado a columnas específicas de la planilla (`oferta_personalizada`) | Alto (si se simplifica) | Alta: primero unificar versiones, después generalizar |
| `copihue-compras.html` / `copihue-pedidos.html` / `reposicion.html` | Funcionales, se solapan conceptualmente | Listas de compra, pedidos a proveedor, reposición de stock | Baja — requieren que el comercio ya tenga proveedores/stock cargados | Medio (puerta a sistema completo) | Alta |
| `panel-estadisticas.html` / `copihue-dashboard.html` | Funcionales | Visualización de métricas del negocio | Baja — sin datos históricos cargados no aportan nada al momento cero | Medio | Alta |
| `copihue-config-ofertas.html` / `ofertas-admin.html` | Funcionales, se solapan | Configuración de reglas de ofertas (admin) | Muy baja — son paneles de configuración interna, no un producto en sí | Bajo como standalone | No aplica como producto independiente |
| `copihue-dinero.html` / `copihue-finanzas.html` / `copihue-finanzalento.html` | 3 versiones sin resolver cuál es vigente | Caja / control financiero diario | Baja tal cual están (hay que definir primero cuál sobrevive) | Alto (si se ordena) | Alta: primero consolidar internamente |
| `copihue-fiado.html` / `copihue-reportes.html` | Funcionales, maduros | Gestión de fiados/crédito y reportes de ventas | Baja como entrada — presuponen una base de clientes con historial | Alto (tier "sistema completo") | Alta |
| `copihue-raspadita.html` / `copihue-tragamonedas.html` | Funcionales | Juegos de premios para fidelizar clientes finales | Baja como producto standalone — dependen de tienda online + stock de premios | Medio (como add-on, no como entrada) | Alta |
| `index.html` | Funcional, maduro (v173) | Catálogo/tienda online pública | Baja como "producto simple" — es un sistema completo en sí mismo | Alto (pero como tier superior) | Muy alta |
| `seba21.html` | Funcional, maduro (v439, 700K) | Hub central + POS administrativo | No aplica — es la infraestructura interna, no algo que se le entregue a un vecino | No aplica standalone | No aplica |

---

## 🟢 Clasificación de prioridades

### 🟢 PRIORIDAD ALTA (Convertir ya)
- `VAO_Marca_de_agua.html` — ya casi standalone, útil para cualquier comercio con fotos de producto.
- `VAO_Optimizador de imágenes.html` — mismo caso.
- `copihue-flyer.html` — el mayor potencial comercial del lote, coincide con el ejemplo ideal, pero necesita el salto de "foto ya cargada" a "foto tomada ahora con el celular".
- `copihue-horario.html` — chico, simple, fácil de entender de inmediato.

### 🟡 PRIORIDAD MEDIA (Potencial con más trabajo)
- `copihue-fotos.html`
- `letrero-copihue.html`
- `VAO_Sincronizador Inteligente.html`
- `copihue-sendwa.html` / `sendwa.html` — alto potencial, pero primero hay que resolver cuál versión es la vigente y luego desacoplarla de la planilla de Copihue.

### 🔴 LABORATORIO (No convertir todavía)
- `copihue-compras.html`, `copihue-pedidos.html`, `reposicion.html`
- `panel-estadisticas.html`, `copihue-dashboard.html`
- `copihue-config-ofertas.html`, `ofertas-admin.html`
- `copihue-dinero.html`, `copihue-finanzas.html`, `copihue-finanzalento.html` (primero decidir cuál queda)
- `copihue-fiado.html`, `copihue-reportes.html`
- `copihue-raspadita.html`, `copihue-tragamonedas.html`
- `index.html`, `seba21.html` — son el corazón del "sistema completo", no candidatos a producto de entrada.

---

## 🚫 Fuera de este análisis (Excluidos)

- `copihue-publicador.html` — herramienta de deploy interna.
- `copihue-herramientas.html` — navegación interna.
- `copihue-caratulas.html` — proyecto personal sin relación al rubro.
- El resto de los ~200 archivos con sufijo de versión/backup — son duplicados de los canónicos, no herramientas distintas.

---

## 📝 Nota metodológica

Este análisis es **estructural**: se basó en títulos, dependencias de backend, presencia de inputs de cámara/archivo y funciones expuestas sobre archivos reales del repo. No es un review línea por línea de cada UX completa. Se puede profundizar en el flujo interno de cualquier herramienta puntual a pedido.