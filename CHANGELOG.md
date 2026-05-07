# 📜 CHANGELOG — ALMACÉN COPIHUE
## Historial Completo de Versiones

**Inicio del Proyecto**: 09/03/2026  
**Última Actualización**: 07/05/2026 — v331  
**Sistema**: Copihue POS · Catálogo Index · Code.gs GAS

---

## 📌 ARCHIVOS DEL SISTEMA

| Archivo | Descripción | Versión Actual |
|---------|-------------|----------------|
| `seba21.html` | Panel POS vendedor | v331 |
| `index.html` | Catálogo cliente (PWA) | v133 |
| `code.gs` | Backend Google Apps Script | — |

---

## 🔴 ZONA HORARIA — HISTORIAL DE BUGS Y FIXES

> **Problema recurrente**: el parseador de horas de Google Sheets fue roto y reparado varias veces.
> Esta sección documenta el problema de raíz para que no se repita.

### Cómo llegan las horas de Google Sheets

Cuando una celda tiene un valor de hora (ej: `3:00`), el GAS la serializa como:

```
"1899-12-30T06:00:00.000Z"   ← fecha epoch base de Sheets, hora en UTC
```

El valor UTC NO es la hora real. La hora real está en la zona horaria local del browser.

### La solución correcta (index.html — referencia)

```javascript
// index.html _parsearValorHora() — CORRECTO
if (s.includes('T') && s.includes('Z')) {
    const d = new Date(s);
    return { h: d.getHours(), m: d.getMinutes() }; // getHours() local del browser
}
```

`d.getHours()` devuelve la hora en la zona horaria del browser (Argentina UTC-3).
`d.getUTCHours()` devuelve UTC puro — 3 horas de desfase — bug.

### Historia de intentos fallidos en seba21

| Intento | Código | Resultado para "3:00" |
|---------|--------|----------------------|
| Original | `getUTCHours() - 3` | 4:31 ❌ |
| Fix v329 | `getUTCHours()` directo | 7:31 ❌ |
| Fix v330 | `getHours()` (local) | 3:00 ✅ |

### Regla de oro

> Siempre usar `d.getHours()` y `d.getMinutes()` para horas de Sheets.
> Nunca `getUTCHours()`. El browser está en Argentina, `getHours()` ya convierte.

---

## 📌 CODE.GS — CAMBIOS RECIENTES

### getUltimasSeleccion() — Fix límite por día (Mayo 2026)

**Problema**: devolvía solo `{ ok, seleccion }` sin el campo `maximo`.
El selector mostraba siempre `1de3 2de3 3de3` con 3 hardcodeado.

**Fix**: el límite se lee de `config_sistema` fila "maximo ultimas unidades",
columna del día actual (mismo patrón que `calcularOfertas`).

```javascript
// ANTES
return { ok: true, seleccion: ids };

// DESPUÉS
var diaIdxJC = [1,2,3,4,5,6,0].indexOf(new Date().getDay());
return { ok: true, seleccion: ids, maximo: maximo };
```

### ultimasSeleccionadasSiempre — Campo eliminado (Mayo 2026)

Una IA anterior agregó `ultimasSeleccionadasSiempre: _leerUltimasConDias_()` como
workaround para mostrar últimas en seba21 sin importar el horario.
**Eliminado** — el problema real era el parseH de horarios, no la lógica del GAS.

---

## 📌 SEBA21.HTML — HISTORIAL COMPLETO

### v331 — 07/05/2026 ✅
- FIX CRÍTICO `_tipoActivo`: en modo `auto` (estado `null`) ahora consulta `_dentroDeHorario()` con `_configCache` en tiempo real. Antes siempre devolvía `false` para `null`, cerrando todas las ofertas en modo auto.
- FIX `cargarEstadoToggles`: modo auto guarda `null` en `_toggleEstado` (no el bool de horario). El bool de horario solo pinta el botón; `_tipoActivo` lo resuelve en tiempo real.
- FIX `_cargarHorarioSistema`: ahora usa el mismo `parseH` robusto de `_dentroDeHorario` (soporta ISO, fracción de día, entero, string HH:MM). El split simple de antes fallaba con valores ISO de Sheets.
- NUEVO `setInterval` 60s en `iniciarToggleOfertas`: re-evalúa tipos en modo `auto` y recarga pools al detectar apertura o cierre automático. Mismo patrón que v324.
- MEJORA logs `cargarEstadoToggles`: muestra día de semana, valor de planilla, modo e ícono de estado (`⏰✅`/`⏰❌`/`🔒✅`/`✗❌`) para diagnóstico rápido en consola.

### v330 — 07/05/2026 ✅
- FIX parseH definitivo: usa `d.getHours()` (hora local del browser) igual que `index.html`
- Antes: `getUTCHours()` devolvía 7:31 para una hora de 3:00 en planilla
- Ahora: lee correcto en todas las horas

### v329 — 07/05/2026 ⚠️ parcialmente correcto
- FIX parseH intento 2: epoch 1899-12-30 leída directo en UTC (aún incorrecto)
- FIX cargarEstadoToggles: modo auto resuelve horario real con `_dentroDeHorario`
- FIX `_tipoActivo`: eliminado `return true` hardcodeado
- FIX mapa: `ultimas` agregado a `_dentroDeHorario`

### v328 — 07/05/2026 ✅
- Log de versión en consola al iniciar: `🏪 Copihue POS vXXX cargado`

### v327 — 07/05/2026 ❌ regresión
- Intento fallido: `_toggleEstado = null` en auto → todas las ofertas visibles fuera de horario
- Problema real era parseH, no la lógica de toggles

### v326 — 07/05/2026 ✅
- FIX: `calcularOfertaPOS` usaba porcentajes hardcodeados para Últimas Unidades
- Ahora usa `precioOferta` directo desde Code.gs — la planilla manda
- DEBUG: log en cada tick del interval

### v325 — 07/05/2026 ✅
- FIX: `getConfig` se llamaba dos veces, ambas chequeaban `data.success` pero GAS devuelve `data.ok`
- `_getConfigCached()` centraliza la llamada, acepta `ok || success`
- FIX INTERVAL: recarga cache si es null antes de evaluar horarios

### v324 — 07/05/2026 ✅
- AUTO HORARIO: `setInterval` 60s detecta apertura y cierre sin recargar página
- Solo actúa en tipos con modo `auto`
- NUEVO: `alertarFiadosVencidos()` — notifica fiados vencidos al iniciar (una vez por día)

### v323 — 06/05/2026 ✅
- FIX: `_dentroDeHorario` incluye `ultimas` en el mapa
- FIX: `cargarEstadoToggles` resuelve horario real en modo auto
- FIX: eliminado `return true` hardcodeado en `_tipoActivo`
- REVERT: eliminado hack `ultimasSeleccionadasSiempre` del GAS

### v322 — 06/05/2026 ⚠️
- Workaround `ultimasSeleccionadasSiempre` (luego eliminado en v323)
- FIX VISUAL: fila de ofertas con `flex-wrap`

### v321 — 06/05/2026 ✅
- TOGGLE AUTO: al volver a automático recarga el pool de ofertas
- NOTIF: botón Limpiar en panel de notificaciones
- UI: botón REC renombrado a FULL

### v320 — 06/05/2026 ✅
- NOTIF: avisa al cargar si el pool de Últimas tiene slots libres

### v319 — 06/05/2026 ✅
- SELECTOR ÚLTIMAS: buscador de texto en el modal

### v318 — 06/05/2026 ✅
- ÚLTIMAS: eliminado fallback automático, solo productos seleccionados manualmente
- Límite del día desde `config_sistema` aplicado al cargar el pool
- SELECTOR: subtítulo `X/máx`, bloqueo al superar máximo, lee `ds.maximo` al abrir

### v304 — 25/04/2026 ✅
- FIADOS: recordatorio de deuda via Web Share API (reemplazó WhatsApp)

### v303 — 25/04/2026 ✅
- SEGURIDAD: fotos con `createElement` en vez de `innerHTML`
- SEGURIDAD: API key a `sessionStorage`

### v302 — 25/04/2026 ✅
- WA: abre directo con `whatsapp://send`, eliminado modal intermedio

### v301 — 25/04/2026 ✅
- WA BUSINESS: intent Android directo a `com.whatsapp.w4b`

### v300 — 25/04/2026 ✅
- FIADOS: fix botón WA flotante no pasaba el teléfono

### v299 — 25/04/2026 ✅
- FIADO: fix dropdown en Android, teléfono no bloquea registro, modal WA siempre abre

### v298 — 23/04/2026 ✅
- FIADOS: fix desfase UTC en fechas de GAS, extracción directa del string

### v273 — 23/04/2026 ✅
- FIADOS: normalización robusta de fechas en múltiples formatos

### v272 — 23/04/2026 ✅
- FIADOS COBRADOS: orden por fecha de pago más reciente

### v271 — 23/04/2026 ✅
- FIADO: campo teléfono editable, teclado numérico, búsqueda por nombre o teléfono
- WA BUSINESS: intent directo en Android

---

## 📌 INDEX.HTML — CAMBIOS RECIENTES

### v133 — Mayo 2026 ✅
- `_parsearValorHora()` con `d.getHours()` (hora local) — maneja ISO Sheets, fracciones y enteros
- `_dentroDeHorarioIndex()` con mapa completo incluyendo `ultimas`
- Horarios por columna del día actual desde `config_sistema`
- Últimas Unidades respeta horario correctamente en todos los modos

---

## 🧠 LECCIONES APRENDIDAS

### Zona horaria — regla definitiva
```
✅ d.getHours()     → hora local del browser (Argentina UTC-3) ← USAR SIEMPRE
❌ d.getUTCHours()  → UTC puro, 3 horas adelantado ← NUNCA para horas de Sheets
```

### Horas de Google Sheets
- Formato ISO del GAS: `"1899-12-30THH:MM:SS.000Z"` (epoch base de Sheets)
- La hora UTC en ese string no corresponde a la hora real de Argentina
- `new Date(iso).getHours()` en browser Argentina devuelve la hora correcta

### GAS — campos de respuesta
- Code.gs usa `data.ok` (no `data.success`) en la mayoría de las acciones
- Siempre aceptar `data.ok || data.success` para no romper silenciosamente

### Versiones
- Regla de oro: siempre subir versión antes de entregar. Sin excepciones.
- El log `🏪 Copihue POS vXXX cargado` permite confirmar qué está corriendo.

---

## 📌 FLYER CERVECERO — HISTORIAL ORIGINAL

### v111.1 — 09/03/2026 ✅ FUNCIONAL
- Reescritura `abrirFlyerAdmin()`: async/await → Promise.then().catch()
- Eliminadas 2 funciones `_generarCanvasFlyer()` duplicadas (-190 líneas)
- Logs en puntos críticos para debug visible
- Sistema automático de URLs de fotos desde GitHub
- Precarga paralela de imágenes con `Promise.all()`
- Validación mejorada de datos de la API

### v111.0 — 09/03/2026 ❌ BROKEN (superseded)
- Implementación de fotos con async/await roto
- Función `_generarCanvasFlyerConFotos` fallaba silenciosamente
- Superseded por v111.1

### v110.x — Anterior a 09/03/2026 ✅ DEPRECATED
- Funcionalidades básicas sin fotos ni psicología visual avanzada

---

**Última actualización**: 07/05/2026  
**Mantenido por**: Almacén Copihue  
**Licencia**: Uso exclusivo Almacén Copihue
