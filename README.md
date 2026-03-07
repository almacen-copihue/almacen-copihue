# 🏪 Almacén Copihue — Sistema de Gestión

> Sistema completo de punto de venta, catálogo online y reportes para almacén de barrio.  
> Stack: HTML/CSS/JS puro · Google Apps Script · Google Sheets · Vercel

---

## 📁 Archivos del proyecto

| Archivo | Para qué sirve | Versión actual |
|---|---|---|
| `index.html` | 🛒 **Tienda online** — catálogo, ofertas y horarios para clientes | v002 |
| `venta.html` | 🖥️ **POS / Admin** — punto de venta, ingreso mercadería, ajustes, clientes | v111 |
| `copihue-reportes.html` | 📊 **Reportes** — ventas, ganancias, top productos, tabla 30 días | v1.18 |
| `copihue-tareas.html` | ✅ **Board de tareas** — pendientes y registro de hitos | — |
| `codegs.txt` | ⚙️ **Google Apps Script** — backend, planilla, ofertas, reportes | v6.9 |
| `sw.js` | 📶 Service Worker — modo offline y caché PWA | — |
| `README.md` | 📖 Este archivo | — |

---

## ⚠️ REGLA DE ORO — subir archivos

```
index.html              →  SOLO reemplaza index.html
venta.html              →  SOLO reemplaza venta.html
copihue-reportes.html   →  SOLO reemplaza copihue-reportes.html
codegs.txt              →  Copiar al editor de Apps Script y republicar
```

**Nunca subas un archivo sin verificar el nombre antes de confirmar.**  
**Cada cambio en GAS requiere republicar:** Apps Script → Implementar → Nueva versión

---

## 🔗 Links

| Link | Descripción |
|---|---|
| [almacen-copihue.vercel.app](https://almacen-copihue.vercel.app) | Tienda online (clientes) |
| [/venta.html](https://almacen-copihue.vercel.app/venta.html) | POS Admin |
| [/copihue-reportes.html](https://almacen-copihue.vercel.app/copihue-reportes.html) | Reportes |
| [/copihue-tareas.html](https://almacen-copihue.vercel.app/copihue-tareas.html) | Board de tareas |

---

## 🔧 Backend — Google Apps Script

- **URL:** guardada en `API_URL` dentro de `venta.html` y `copihue-reportes.html`
- **Hojas Sheets:** `inventario` · `Ventas` · `Historial` · `config_sistema` · `Ajuste_Rapido` · `evento_cerveza_log` · `Clientes` (pendiente)
- **Versión actual:** v6.9 ⚠️ *pendiente republicar*

---

## 📦 Historial de versiones

### venta.html
| Versión | Cambios |
|---|---|
| **v111** | Cache busting: link reportes con `?v=118` para forzar descarga en celular |
| v110 | Link reportes `?v=117` |
| v109 | Link reportes `?v=116` |
| v108 | Fix ganancia real negativa: `costoCalculado` por gramos, `precioOriginal` en items con oferta, datos corruptos ignorados |
| v107 | Fix historial ventas: `getHoyKey()` dinámica + migración automática UTC→ARG |
| v106 | Fix timezone: `fechaArgentina()` reemplaza todos los `toISOString()` usados como claves |
| v105 | Fix llave JS faltante en `renderVenta()` — todo el JS posterior no ejecutaba |
| v104 | WakeLock (pantalla no se apaga), desktop: imagen/nombre clickeable → historial |
| v103 | Sistema de clientes: búsqueda, alta, estadísticas, ticket WA directo al número |
| v102 | Modal info producto: stock semáforo, precio/oferta, ventas HOY y últimos 7 días |
| v101 | Ofertas activas en POS: relámpago NxM/%, destacadas, especiales, normal tachado |
| v98 | Sin stock → ⚠️ abre ajuste directo. Badge versión desde `<title>` |
| v97 | Header colapsa al agregar primer producto. Botón ⋯ para expandir |
| v96 | Fix botón Cobrar desaparecía con 3+ productos |
| v95 | Carrito persistente: `visibilitychange` + backup GAS |
| v94 | Punto de conexión en proveedores |
| v93 | ELECTRÓNICA excluida del reporte de reposición |
| v92 | Botones precio $100/$100 en ajuste rápido (fix `touchend`) |
| v91 | Categorías VINOS, CERVEZAS, FIAMBRES, PANADERIA |
| v90 | Ingreso mercadería no se cierra al tocar afuera |

### copihue-reportes.html
| Versión | Cambios |
|---|---|
| **v1.18** | Tap top productos: `<button>` nativo expande 30 días inline con scroll. Sin delegation |
| v1.17 | Tabla 30 días: toggle azul, tabla scrolleable con intensidad de color por unidades |
| v1.12 | Selector jerárquico: HOY → Calendario → S1-S6 → Meses → Años anteriores colapsables |
| v1.11 | Stock badge semáforo en top y modal detalle |
| v1.10 | Mejores días, días de semana, horas, comparativo 6 meses |
| v1.9 | Filtros período avanzados: semanas, modo año |
| v1.1 | Top ganancia + modal detalle producto |
| v1.0 | Primera versión |

### index.html
| Versión | Cambios |
|---|---|
| **v002** | Compartir horario por WhatsApp (canvas con día resaltado en naranja) |
| v001 | Ofertas relámpago, destacadas, especiales. Jueves Cervecero. Catálogo |

### GAS — codegs.txt
| Versión | Cambios |
|---|---|
| **v6.9** ⚠️ | Fix ganancia histórica: qty en gramos detectado por `(Ngr)` + `qty≥50` → `/1000` |
| v6.8 | Fix costos por peso: `nomLimpio` no sacaba `(800gr)`, no matcheaba inventario |
| v6.7 | Backup clientes fire-and-forget |
| v6.6 | Historial ventas por producto para modal POS |
| v6.5 | `obtenerUltimoCosto()` para sugerir precio en ingreso |
| v6.4 | Fix qty gramos en ventas nuevas (productos por kg) |
| v6.3 | `guardarCarritoTemp` para carrito persistente |
| v6.2 | Jueves Cervecero: 1 gancho al 20%, resto 10-15% |
| v6.0 | Jueves Cervecero completo |
| v5.9 | `setConfig` + `logInterruptor` |
| v5.8 | Hoja `Ajuste_Rapido` separada |

---

## 🍺 Jueves Cervecero

- Activa **automáticamente** los jueves entre 18hs y cierre del local
- Hora de cierre desde `config_sistema` → columna JUE
- Override manual: botón **🍺 JC** en el POS
- Flyer para compartir: botón **🖼️ FL** en el POS

---

## 🧠 Lecciones aprendidas

### 1. Mobile Android — tap en elementos dinámicos
En Android WebView, **nunca uses event delegation** (`document.addEventListener + closest()`) para elementos generados con `innerHTML=`. El touch no siempre propaga como `click`.

**✅ Solución:** `<button>` nativo con `onclick` directo referenciando array global por índice:
```js
_topNombres = stats.top.map(p => p.nombre); // array global

// en el HTML generado:
`<button onclick="verProd(_topNombres[${i}])">...</button>`
```

### 2. Timezone Argentina en localStorage
`toISOString()` usa UTC → después de las 21hs ARG guarda con fecha de mañana.

**✅ Solución:** función `fechaArgentina(offsetDias)` con `toLocaleString` y `timeZone: 'America/Argentina/Buenos_Aires'`

### 3. Ganancia real negativa en histórico
Ventas viejas de productos por kg guardaban `qty` en gramos (ej: `800`) en vez de kg (`0.8`). El GAS calculaba `costo × 800` en lugar de `costo × 0.8` → ganancia de -770%.

**✅ Solución GAS v6.9:** detectar nombre con `(Ngr)` y `qty ≥ 50` → dividir `/1000` antes de calcular gananciaReal.

### 4. Cache en Android / PWA
El browser y el service worker cachean agresivamente. Cambiar el archivo no alcanza.

**✅ Solución:** agregar `?v=NNN` en el link del archivo al llamarlo desde otro. Incrementar con cada deploy.

---

## 📋 Pendientes prioritarios

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | **Republicar GAS v6.9** en Apps Script |
| 2 | 🔴 | **Seguridad:** repo GitHub privado + PIN 4 dígitos + token GAS |
| 3 | 🟠 | **Sync ofertas:** GAS escribe timestamp, index recarga cada 2min si cambió |
| 4 | 🟠 | **Endpoint `action=cliente`:** hoja Clientes en Sheets, upsert por teléfono |
| 5 | 🟡 | Carrito de reposición para el super |
| 6 | 🟡 | Semáforo vencimiento en carrito del POS |
| 7 | 🟡 | Notificación vendedor cuando se activa promo |

---

*Última actualización: 07/03/2026 · venta v111 · reportes v1.18 · GAS v6.9 · index v002*
