# 🏪 Almacén Copihue — Sistema de Gestión

> Sistema completo de punto de venta, catálogo online y reportes para almacén de barrio.

---

## 📁 Archivos del proyecto

| Archivo | Para qué sirve | Versión |
|---|---|---|
| `index.html` | 🛒 **Tienda online** — lo que ven los clientes | V2.4+ |
| `venta.html` | 🖥️ **POS / Admin** — punto de venta, ingreso de mercadería, ajustes | v94+ |
| `copihue-reportes.html` | 📊 **Reportes** — ventas, ganancias, top productos | v1.4+ |
| `copihue-tareas.html` | ✅ **Board de tareas** — pendientes del sistema | — |
| `sw.js` | ⚙️ Service Worker — modo offline y caché PWA | — |
| `README.md` | 📖 Este archivo | — |

---

## ⚠️ REGLA DE ORO — subir desde el celular

```
index.html   →  SOLO reemplaza index.html
venta.html   →  SOLO reemplaza venta.html
reportes     →  SOLO reemplaza copihue-reportes.html
```

**Nunca subas un archivo sin verificar el nombre antes de confirmar.**

---

## 🔗 Links útiles

| Link | Descripción |
|---|---|
| [almacen-copihue.vercel.app](https://almacen-copihue.vercel.app) | Tienda online (clientes) |
| [/venta.html](https://almacen-copihue.vercel.app/venta.html) | POS Admin |
| [/copihue-reportes.html](https://almacen-copihue.vercel.app/copihue-reportes.html) | Reportes |

---

## 🔧 Backend — Google Apps Script

- **URL:** guardada en `API_URL` dentro de `venta.html`
- **Planilla:** Google Sheets con hojas: `inventario`, `Ventas`, `Historial`, `config_sistema`, `Ajuste_Rapido`, `evento_cerveza_log`
- **Versión GAS:** v6.2

> ⚠️ Cada vez que modificás el GAS hay que **republicar** en Apps Script → Implementar → Nueva versión

---

## 📦 Historial de versiones

### venta.html
| Versión | Cambios |
|---|---|
| v94 | Punto de conexión en proveedores, ELECTRÓNICA excluida de reposición |
| v93 | ELECTRÓNICA excluida del reporte de reposición |
| v92 | Botones precio $100 en $100 en ajuste rápido (fix touchend) |
| v91 | Categorías VINOS, CERVEZAS, FIAMBRES, PANADERIA agregadas |
| v90 | Ingreso mercadería no se cierra al tocar afuera |

### index.html
| Versión | Cambios |
|---|---|
| V2.9 | Jueves Cervecero — 1 gancho al 20%, resto 10-15% |
| V2.8 | Flyer canvas separado para admin |
| V2.7 | Flyer Jueves Cervecero generado en canvas |
| V2.6 | Compartir texto por WhatsApp |
| V2.5 | Jueves Cervecero automático |

### copihue-reportes.html
| Versión | Cambios |
|---|---|
| v1.4 | Fix tap en top productos (CustomEvent global) |
| v1.3 | Fix listener duplicado |
| v1.2 | Versión inicial con número |
| v1.1 | Top ganancia + modal detalle producto |
| v1.0 | Primera versión |

### GAS (codegs.txt)
| Versión | Cambios |
|---|---|
| v6.2 | 1 solo gancho al 20% en Jueves Cervecero |
| v6.1 | Estrategia gancho top 2 |
| v6.0 | Jueves Cervecero completo |
| v5.9 | setConfig + logInterruptor |
| v5.8 | Hoja Ajuste_Rapido separada |

---

## 🍺 Jueves Cervecero

- Se activa **automáticamente** los jueves entre 18hs y la hora de cierre del local
- La hora de cierre se lee de `config_sistema` → `Horario cierre local` columna JUE
- Override manual desde `venta.html` → botón **🍺 JC**
- Flyer para compartir → botón **🖼️ FL** en el POS

---

*Última actualización: 05/03/2026*
