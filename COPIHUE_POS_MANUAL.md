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

**Regla de oro:** el archivo se llama siempre `seba-25.html` para que la URL no cambie. La versión interna se trackea con el badge `vXXX` en el header (ej: `v121`). Cada entrega suma +1.

---

## 🔢 VERSIÓN ACTUAL

Buscar en el archivo:
- `<title>Copihue — POS v120-c0003e</title>` → cambiar número
- `if (el) el.textContent = 'v121';` → cambiar a nueva versión

**Siempre sumar +1 al entregar.** El usuario lo usa para confirmar que cargó la versión correcta.

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

**API_URL:** `https://script.google.com/macros/s/AKfycb.../exec`

---

## 👥 VENDEDORES Y TECLADOS

### Sistema de vendedores
- `VENDEDORES_DEFAULT = ['Víctor', 'Sebastián']`
- `VENDEDOR_KEY = 'copihue_vendedor'` → localStorage
- `VENDEDORES_KEY = 'copihue_vendedores'` → localStorage (lista)
- Al seleccionar vendedor → se aplica su teclado automáticamente

### Sistema de teclados (por vendedor, independiente)
- Clave localStorage: `pos_teclado_{nombre}` (ej: `pos_teclado_Víctor`)
- Valores: `'t9'` | `'qwerty'`
- **Defaults hardcodeados:**
  ```js
  const TECLADO_DEFAULTS = { 'Sebastián': 'qwerty' };
  // El resto → 't9'
  ```
- `getTipoTeclado()` → lee localStorage primero, luego TECLADO_DEFAULTS, luego `'t9'`

### Modo T9
- Teclado numérico fijo abajo (`#pos-t9`), siempre visible
- `body.t9-on` → clase que activa padding-bottom y posición FABs
- Auto-reset texto tras 2 segundos de inactividad
- Al scrollear lista → T9 se oculta, al soltar → vuelve
- **NUNCA se oculta si hay un modal abierto** (función `hayModalAbierto()`)

### Modo QWERTY
- **Barra oculta por defecto** — aparece solo al tocar 🔍 en el FAB stack
- El FAB 🔍 siempre visible en modo QWERTY aunque carrito esté vacío
- Al cerrar cualquier modal → `_ocultarBarraQwerty()` para resetear estado
- Al blur con campo vacío → oculta la barra automáticamente
- `body.qwerty-on` → clase activa

---

## 🛒 FAB STACK (botones flotantes derecha)

```
#fabStack  position:fixed, bottom:24px, right:16px, z-index:3500
  ├── #fabSubir   (↑ azul, solo si hay múltiples qty)
  ├── #fabBuscar  (🔍 azul, solo en modo QWERTY)
  ├── #fabLimpiar (🗑 rojo, siempre cuando hay carrito)
  └── #fabCobrar  (✅ verde, siempre cuando hay carrito)
```

**CSS crítico que DEBE estar:**
```css
body.t9-on #fabStack { bottom: calc(185px + 16px); }
body.qwerty-on #fabStack { bottom: calc(60px + 16px); }
```
Sin esto los botones quedan tapados por el teclado.

---

## ⚖️ VENTA POR PESO

### Cómo funciona
- Productos con nombre que termina en `KG` o `X KG` (sin número antes) → modal de peso
- `esPorPeso(producto)` → detecta automáticamente
- El usuario tipea gramos (200 = 200gr, 1000 = 1kg)

### Precios en la planilla para productos KG
- **`price` = precio por KG** (entero, ej: `3000` = $3.000/kg)
- **`stock` = kg disponibles** (entero, ej: `5` = 5kg)
- Fórmula precio: `Math.round((precioPorKg / 1000) * gramos)`
- Fórmula stock restado: `p.stock - (gramos / 1000)` → puede quedar decimal (ej: 4.8kg)

### ⚠️ BUG RESUELTO en v122 — totalCart en cards
En la lista de resultados, el total mostrado en la card de un producto KG usaba:
```js
const totalCart = precio * qty  // MALO: qty = gramos, precio = $/kg → resultado x1000
```
**Corrección:**
```js
const totalCart = esPesoCard
    ? Math.round((precio / 1000) * qty)   // espejo exacto del modal
    : precio * qty
```
**Regla:** cualquier cálculo de precio para productos KG en la lista de resultados DEBE usar `(precio/1000)*gramos`, igual que el modal de peso.

### Modal peso z-index
```html
<div id="modalPeso" style="z-index:8000; max-height:96vh;">
```
Debe ser mayor que el T9 (z-index:10000 el teclado, pero el modal va encima del overlay).

---

## 🔄 CONEXIÓN Y RECONEXIÓN

### cargarProductos()
- Carga inicial al arrancar
- Actualiza `productos[]` global
- Lanza alertas del día, ranking, ofertas después de cargar

### forzarActualizacion() — botón 🔄
- **NO hace `window.location.reload()`** — actualiza solo los datos
- Limpia SW y caches, luego llama `cargarProductos()` + `renderVenta()`
- Solo hace reload como último recurso si falla

### _recargaSilenciosa()
- Se dispara al volver a la pestaña (`visibilitychange`) y al recuperar wifi (`online`)
- **Mínimo 5 minutos entre recargas automáticas** (`_MIN_ENTRE_CARGAS`)
- Solo actualiza `stock` y `price` de productos existentes — **no toca el carrito**
- Si falla, no muestra error (silenciosa)

### Eventos de conexión
```js
window.addEventListener('online', ...)   // toast verde + recarga silenciosa
window.addEventListener('offline', ...)  // toast rojo
visibilitychange → visible               // wakeLock + recarga silenciosa
```

---

## 🛡️ ANTI-CIERRE

```js
window.addEventListener('beforeunload', ...)  // bloquea si hay carrito activo
window.addEventListener('pagehide', ...)       // respaldo para Android
window.addEventListener('popstate', ...)       // captura botón ← del celu → cierra modal o no hace nada
```
El botón ← del celular **nunca sale de la app** — solo cierra el modal abierto más reciente.

---

## 🔔 NOTIFICACIONES (panel 🔔)

- `agregarNotifPos(icono, titulo, detalle, color)` → agrega al panel
- Badge rojo en botón 🔔 del header cuando hay notificaciones
- **Reposición urgente**: una vez por día, va al panel 🔔 silenciosamente — **NUNCA modal bloqueante**
- LocalStorage key: `alerta_reposicion_{fechaArgentina()}`

---

## 📋 MODALES — lista completa

```
modalResumen      — Resumen del día
modalVendedor     — Selector de vendedor
modalAjuste       — Ajuste rápido de stock/precio
modalIngreso      — Ingreso de mercadería
modalNuevoProducto — Crear producto nuevo
modalConfigTeclado — Selector de tipo de teclado
modalPeso         — Venta por peso (z-index:8000)
modalConfirm      — Confirmación de venta/cobro
modalInfoProd     — Info detallada de producto
modalNotifPos     — Panel de notificaciones
modalCerrarSesion — (existe en popstate list)
modalWifiQR       — (existe en popstate list)
flyerOverlayAdmin — Flyer Jueves Cervecero
```

**Función `hayModalAbierto()`** — usada por T9 scroll para no reactivar teclado:
```js
const ids = ['modalNotifPos','modalResumen','modalVendedor','modalAjuste',
             'modalIngreso','modalNuevoProducto','modalConfigTeclado','modalPeso','modalConfirm'];
```

---

## 🎨 CSS CLASES CLAVE

| Clase | Efecto |
|-------|--------|
| `body.t9-on` | padding-bottom 185px en resultados, FABs suben |
| `body.qwerty-on` | padding-bottom 60px en resultados, FABs suben |
| `.resultado-item.en-carrito` | borde verde izquierdo, fondo verde claro |
| `.resultado-item.sin-stock` | opacidad 0.6, nombre en rojo |
| `.panel-venta.minimizado` | max-height:0, oculto |

---

## 🗃️ LOCALSTORAGE — claves usadas

| Clave | Contenido |
|-------|-----------|
| `copihue_vendedor` | nombre del vendedor activo |
| `copihue_vendedores` | JSON array de vendedores |
| `pos_teclado_{nombre}` | `'t9'` o `'qwerty'` por vendedor |
| `copihue_carrito_pendiente_{vendedor}` | carrito guardado al salir |
| `alerta_reposicion_{fecha}` | flag "ya mostré alerta hoy" |
| `relampago_activado_{fecha}` | flag relámpago del día |
| `relampago_descartado_{fecha}` | flag descartado |
| `vencidos_confirmados_{fecha}` | productos vencidos confirmados |
| `vencidos_autozero_{fecha}` | flag auto-zero ejecutado |
| `pos_rank_{id}` | ranking de ventas por producto |

---

## ⚡ REGLAS PARA IA — CHECKLIST ANTES DE TOCAR

```
[ ] ¿Leí el manual completo?
[ ] ¿Identifiqué la versión actual del archivo subido?
[ ] ¿Estoy trabajando desde el archivo más reciente del usuario (no de sesiones anteriores)?
[ ] ¿El cambio afecta teclados? → Revisar T9, QWERTY, hayModalAbierto, aplicarTeclado
[ ] ¿El cambio afecta modales? → Agregar a lista de hayModalAbierto si es nuevo
[ ] ¿El cambio afecta FABs? → Verificar CSS body.t9-on y body.qwerty-on
[ ] ¿El cambio afecta venta por peso? → Precio en planilla = $/kg, stock en kg
[ ] ¿El cambio afecta cargarProductos? → _recargaSilenciosa NO toca el carrito
[ ] ¿Usé python3 con replace exacto para los patches? → Siempre verificar "OK" vs "NOT FOUND"
[ ] ¿Sumé +1 a la versión?
[ ] ¿El archivo de salida se llama seba-25.html?
```

---

## 🚨 COSAS QUE NO HACER NUNCA

1. **No agregar `window.location.reload()` automático** — rompe el carrito en curso
2. **No mostrar modal bloqueante para alertas del día** — van al panel 🔔
3. **No cambiar el nombre del archivo de salida** — siempre `seba-25.html`
4. **No asumir que el archivo en memoria es el actual** — siempre trabajar desde el upload del usuario
5. **No hacer `inp.focus()` en modo QWERTY al arrancar** — la barra empieza oculta
6. **No quitar `hayModalAbierto()` del scroll listener del T9** — el scroll de notificaciones reactiva el teclado
7. **No cambiar la fórmula de precio por peso** — es `(price/1000)*gramos` donde price=$/kg
8. **No restar stock en enteros para productos KG** — restar `gramos/1000` (puede quedar decimal)
9. **No hacer patch sobre un archivo que no es el más reciente** — preguntar al usuario qué versión tiene activa

---

## 🔧 FLUJO DE TRABAJO CORRECTO

```
1. Usuario sube archivo → trabajar SOLO sobre ese archivo
2. Identificar versión actual (badge en header o título)
3. Aplicar cambios con python3 replace (verificar cada "OK")
4. Sumar +1 a versión
5. Guardar como seba-25.html en outputs
6. Usuario sube a GitHub → Vercel despliega en segundos
7. Confirmar con badge que cargó la versión correcta
```

---

## 📱 ENTORNO DE USO

- **Dispositivo:** Android, Chrome mobile
- **Resolución:** ~390px ancho
- **Orientación:** vertical siempre
- **Conexión:** WiFi del local (puede ser inestable)
- **PWA:** instalada como app en pantalla de inicio
- **Vendedores:** Víctor (T9), Sebastián (QWERTY)
- **Productos KG:** Pepino, Tomate Cherry, Remolacha, etc. — verduras y frutas al peso

---

*Manual generado en sesión activa. Actualizar cuando se agreguen features importantes.*
