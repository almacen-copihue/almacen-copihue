# 📋 COPIHUE POS — Manual técnico para IA
> Leer COMPLETO antes de tocar una sola línea de código.

---

## 🗂️ ESTRUCTURA DEL PROYECTO

```
almacen-copihue.vercel.app/seba-25.html   ← URL permanente en producción
│
├── GitHub repo                            ← Vercel despliega automáticamente al hacer push
├── seba-25.html                           ← EL ÚNICO ARCHIVO. Todo en un solo HTML.
└── imagenes-productos/*.jpg               ← Fotos de productos (no tocar)
```

**Regla de oro:** el archivo se llama siempre `seba-25.html` para que la URL no cambie. La versión interna se trackea con el badge `vXXX` en el header. Cada entrega suma +1.

---

## 🔢 VERSIÓN ACTUAL: v125

Buscar en el archivo:
- `<title>Copihue — POS v125-c0003e</title>` → cambiar número
- `if (el) el.textContent = 'v125';` → cambiar a nueva versión

**Siempre sumar +1 al entregar.**

---

## 🏗️ ARQUITECTURA

Single-page app HTML/CSS/JS puro. Sin frameworks. Sin build. Sin npm.

```
Google Sheets (base de datos)
    ↕ fetch() JSON
Google Apps Script (API REST)
    ↕ API_URL const
seba-25.html (toda la lógica)
    ↕ Vercel CDN
Chrome mobile Android (cliente)
```

---

## 👥 VENDEDORES

- `VENDEDORES_DEFAULT = ['Víctor', 'Sebastián']`
- `VENDEDOR_KEY = 'copihue_vendedor'` → localStorage
- `VENDEDORES_KEY = 'copihue_vendedores'` → localStorage
- **No hay sistema de teclados por vendedor** — eliminado en v124

---

## ⌨️ BÚSQUEDA — QWERTY NATIVO (desde v124)

**El T9 fue eliminado completamente en v124. No reimplementar nunca.**

- Barra `#pos-barra-wrap` **siempre visible** debajo del header
- Input `#pos-barra-input` conectado al `#buscador` oculto via evento `input`
- Atributos: `autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="search" enterkeyhint="search"`
- El scroll de resultados pasa naturalmente detrás de los FABs

**Funciones que existen como no-ops (compatibilidad):**
```js
function getTipoTeclado() { return 'qwerty'; }
function aplicarTeclado() { /* solo muestra barra */ }
function ocultarTecladoPos() {}
function _ocultarKbdEnModal() {}
function _restaurarKbd() {}
window.t9Limpiar = function(){};
```

**NO existe más:** `pos-t9`, `t9-on`, `modalConfigTeclado`, `TECLADO_DEFAULTS`,
`_toggleTecladoVendedor`, `fabBuscar`, `_ocultarBarraQwerty`, CSS `body.t9-on`, CSS `body.qwerty-on`.

---

## 🛒 FAB STACK (botones flotantes derecha)

```
#fabStack  position:fixed, bottom:24px, right:16px, z-index:3500
  ├── #fabSubir   (↑ azul, solo si hay múltiples qty)
  ├── #fabLimpiar (🗑 rojo)
  └── #fabCobrar  (✅ verde con total)
```

- Solo visibles cuando hay items en el carrito
- Scroll pasa detrás naturalmente (sin padding-bottom forzado)
- `#modalAjuste` tiene `z-index:4500` para quedar encima de los FABs

---

## ⚖️ VENTA POR PESO

- Productos con nombre `KG` o `X KG` (sin número antes) → modal de peso
- `esPorPeso(producto)` detecta automáticamente
- **`price` = precio por KG** (ej: `3000` = $3.000/kg)
- **`stock` = kg disponibles** (ej: `5` = 5kg)
- Fórmula precio: `Math.round((precioPorKg / 1000) * gramos)`
- Fórmula stock: `p.stock - (gramos / 1000)` → puede ser decimal

**⚠️ NUNCA usar `precio * qty` para KG en totalCart** — `qty` = gramos, da x1000:
```js
// CORRECTO:
const totalCart = esPesoCard
    ? Math.round((precio / 1000) * qty)
    : precio * qty
```

Modal peso: `z-index:8000; max-height:96vh`

---

## 🔔 NOTIFICACIONES

- `agregarNotifPos(icono, titulo, detalle, color)` → panel + **persiste en localStorage**
- Clave: `copihue_notif_pos` → `[{icono, titulo, detalle, color, ts}]`
- Al abrir panel → `_renderNotifGuardadas()` filtra solo las de hoy
- Al arrancar → badge se restaura con count del día
- Sin notificaciones → muestra "Sin notificaciones hoy"
- **NUNCA modal bloqueante** — siempre al panel 🔔

---

## 🔄 CONEXIÓN

- `forzarActualizacion()` → **NO reload** — actualiza datos silenciosamente
- `_recargaSilenciosa()` → mínimo 5min entre recargas, no toca el carrito
- `online` → toast verde + recarga silenciosa
- `offline` → toast rojo

---

## 🛡️ ANTI-CIERRE

- `beforeunload` + `pagehide` → bloquea si hay carrito activo
- `popstate` → botón ← del celu cierra modal, nunca sale de la app

---

## 📋 MODALES

```
modalResumen       — Resumen del día
modalVendedor      — Selector de vendedor
modalAjuste        — Ajuste stock/precio (z-index:4500)
modalIngreso       — Ingreso de mercadería
modalNuevoProducto — Crear producto nuevo
modalPeso          — Venta por peso (z-index:8000)
modalConfirm       — Confirmación cobro
modalInfoProd      — Info producto
modalNotifPos      — Notificaciones (z-index:4000)
flyerOverlayAdmin  — Flyer Jueves Cervecero
```

---

## 🗃️ LOCALSTORAGE

| Clave | Contenido |
|-------|-----------|
| `copihue_vendedor` | vendedor activo |
| `copihue_vendedores` | JSON array vendedores |
| `copihue_notif_pos` | JSON array notificaciones |
| `copihue_carrito_pendiente_{vendedor}` | carrito guardado |
| `alerta_reposicion_{fecha}` | flag alerta diaria |
| `relampago_activado_{fecha}` | flag relámpago |
| `relampago_descartado_{fecha}` | flag descartado |
| `vencidos_confirmados_{fecha}` | vencidos confirmados |
| `vencidos_autozero_{fecha}` | auto-zero ejecutado |
| `pos_rank_{id}` | ranking ventas |

---

## ⚡ CHECKLIST ANTES DE TOCAR

```
[ ] ¿Leí el manual completo?
[ ] ¿Tengo el archivo más reciente del usuario?
[ ] ¿Identifiqué la versión actual?
[ ] ¿El cambio afecta modales? → z-index: ajuste 4500, peso 8000, notif 4000
[ ] ¿El cambio afecta FABs? → Solo con carrito activo
[ ] ¿El cambio afecta venta por peso? → Fórmula (price/1000)*gramos
[ ] ¿El cambio afecta notificaciones? → Persistir en localStorage
[ ] ¿Verifiqué "OK" vs "NOT FOUND" en cada patch?
[ ] ¿Sumé +1 a la versión (título Y versionTag)?
[ ] ¿El archivo de salida se llama seba-25.html?
```

---

## 🚨 NUNCA HACER

1. `window.location.reload()` automático — rompe el carrito
2. Modal bloqueante para alertas — van al panel 🔔
3. Cambiar nombre del archivo — siempre `seba-25.html`
4. Trabajar sobre archivo de sesión anterior — siempre del upload del usuario
5. **Reimplementar T9** — eliminado por problemático
6. `precio * qty` para productos KG — siempre `(precio/1000)*gramos`
7. Restar stock entero para KG — restar `gramos/1000`
8. Patchear sin verificar "OK"

---

## 🔧 FLUJO DE TRABAJO

```
1. Usuario sube seba-25.html + manual
2. cp /mnt/user-data/uploads/seba-25-XX.html /home/claude/seba-25.html
3. Identificar versión actual
4. Aplicar patches con python3 (verificar OK/ERR)
5. Sumar +1 en título Y versionTag
6. cp /home/claude/seba-25.html /mnt/user-data/outputs/seba-25.html
7. Usuario sube a GitHub → Vercel despliega
8. Confirmar badge correcto
```

---

## 📱 ENTORNO

- Android, Chrome mobile, ~390px, vertical
- Vendedores: **Víctor** y **Sebastián** (ambos QWERTY nativo)
- WiFi local (puede ser inestable)
- PWA instalada en pantalla de inicio

---

## 📝 HISTORIAL

| Versión | Cambio clave |
|---------|-------------|
| v122 | Fix totalCart KG: `(precio/1000)*gramos` |
| v123 | Notificaciones persistentes. Scroll modal ajuste. |
| v124 | **T9 eliminado.** Barra QWERTY siempre visible. |
| v125 | Anti-micrófono: `inputmode="search"`, `autocapitalize="off"` |

---
*Almacén Copihue — Víctor y Sebastián*
