# 🔧 Fixes Realizados - Flyer Cervecero

## Problema Detectado
El flyer no cargaba las cervezas cuando hacías click en el botón. Los datos de Google Sheets no llegaban correctamente.

## Causas Identificadas

### 1. Función async/await problemática
La función `abrirFlyerAdmin()` usaba async/await que podía fallar silenciosamente si había cualquier error.

### 2. Función _generarCanvasFlyerConFotos duplicada
Había dos funciones `_generarCanvasFlyer` en el código, una era la versión vieja sin fotos.

### 3. No había logs de error
Si fallaba, no había forma de saber qué estaba pasando.

---

## Soluciones Implementadas

### ✅ 1. Reescribí abrirFlyerAdmin() con .then().catch()
Cambié de:
```javascript
async function abrirFlyerAdmin() {
    try {
        const r = await fetch(...);
        const data = await r.json();
        // ...
    } catch(e) {
        mostrarToast('❌ Error', 'rojo');
    }
}
```

A:
```javascript
function abrirFlyerAdmin() {
    mostrarToast('⏳ Cargando cervezas...', 'verde');
    
    fetch(GAS_URL_FLYER + '?action=getJuevesCervecero&t=' + Date.now())
        .then(r => r.json())
        .then(data => {
            console.log('Datos recibidos:', data);  // LOG para debug
            
            if (!data.success || !data.productos || !data.productos.length) {
                mostrarToast('⚠️ Sin cervezas disponibles', 'rojo');
                return;
            }
            
            _flyerProductos = data.productos;
            _flyerHoraCierre = data.horaCierre || 22;
            
            // Ordenar por descuento
            _flyerProductos.sort((a, b) => {
                if (b.descuento !== a.descuento) return b.descuento - a.descuento;
                return (b.rotacion || 0) - (a.rotacion || 0);
            });
            
            // Precargar imágenes
            mostrarToast('🖼️ Cargando fotos...', 'verde');
            let promesasCargas = _flyerProductos.map(p => {
                const fotoURL = _generarURLFoto(p.nombre);
                return fotoURL ? _cargarImagen(fotoURL) : Promise.resolve(null);
            });
            
            Promise.all(promesasCargas).then(() => {
                console.log('Fotos cargadas');
                const canvas = _generarCanvasFlyer(_flyerProductos, _flyerHoraCierre);
                _flyerCanvasAdmin = canvas;
                const wrap = document.getElementById('flyerWrapAdmin');
                wrap.innerHTML = '';
                wrap.appendChild(canvas);
                document.getElementById('flyerOverlayAdmin').classList.add('open');
                mostrarToast('✅ Flyer listo!', 'verde');
            });
        })
        .catch(e => {
            console.error('Error:', e);  // LOG para debug
            mostrarToast('❌ Error: ' + e.message, 'rojo');
        });
}
```

**Ventajas:**
- Más robusto (sin async que puede fallar)
- Logs en consola para ver exactamente dónde falla
- Mejor manejo de promesas con `.map()`

### ✅ 2. Eliminé función duplicada
Había dos `function _generarCanvasFlyer()` - eliminé la vieja que no tenía fotos.

### ✅ 3. Cambié async function a function normal
Renombré `async function _generarCanvasFlyerConFotos()` a `function _generarCanvasFlyer()`
- Ahora es síncrona (más rápida)
- Se llama directamente sin await

---

## Cómo Probar

### En Google Chrome / Firefox:
1. Abre tu POS
2. Presiona F12 para abrir Developer Tools
3. Ve a "Console"
4. Clickea el botón "🎨 Flyer Jueves Cervecero"
5. Mira los logs:
   ```
   Datos recibidos: { success: true, productos: [...], horaCierre: 22 }
   Fotos cargadas
   ```

### Si no carga:
- **Error 1**: Si dice "Sin cervezas disponibles"
  → Verifica que Google Sheets tenga productos para el viernes
  
- **Error 2**: Si dice "Error: ..."
  → Mira el mensaje de error completo en la consola
  
- **Error 3**: Si no aparece nada
  → Probablemente error de CORS al cargar fotos desde GitHub (lo ignoramos automáticamente)

---

## Cambios en el Código

| Archivo | Línea | Cambio |
|---------|-------|--------|
| venta.html | 4969 | `async function` → `function` |
| venta.html | 4972-4997 | Reescrita con `.then().catch()` |
| venta.html | 5018 | `async function _generarCanvasFlyerConFotos` → `function _generarCanvasFlyer` |
| venta.html | 5241-5447 | **ELIMINADO** (duplicado) |

---

## Logs Esperados en Consola

### Ejecución Exitosa
```
⏳ Cargando cervezas...
Datos recibidos: {
  success: true,
  productos: [
    { nombre: "Quilmes Clásica 473ml", precio: 1500, precioPromo: 1125, descuento: 25, ... },
    { nombre: "Heineken 473ml", precio: 1800, precioPromo: 1530, descuento: 15, ... }
  ],
  horaCierre: 22
}
🖼️ Cargando fotos...
Fotos cargadas
✅ Flyer listo!
[FLYER APARECE EN PANTALLA]
```

### Ejecución con Error
```
❌ Error cargando datos: fetch timeout
```
o
```
⚠️ Sin cervezas disponibles para flyer
```

---

## Próximas Mejoras

Si el flyer funciona pero:

1. **No ve las fotos** → Verifica que los nombres en Google Sheets coincidan exactamente con los archivos en GitHub
2. **Fotos lentas** → Primera carga lenta es normal (caché en memoria después)
3. **Quieres más productos** → El sistema soporta ilimitados, solo agrega en Google Sheets

---

**Última actualización**: Marzo 2026  
**Versión**: v111 (POS)
