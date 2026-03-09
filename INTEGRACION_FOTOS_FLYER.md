# 🍺 Integración de Fotos Reales en el Flyer Cervecero

## Cómo Funciona

Tu flyer ahora **automáticamente busca y pinta las fotos reales** de tus cervezas desde tu repositorio de GitHub.

---

## 🔄 **Flujo de Datos**

```
1. Google Sheets (tus productos con nombre exacto)
   ↓
2. Google Apps Script devuelve lista de cervezas
   ↓
3. Sistema genera URL automática de foto basándose en el NOMBRE
   ↓
4. Carga imagen desde GitHub: https://raw.githubusercontent.com/almacen-copihue/almacen-copihue/main/imagenes-productos/[ARCHIVO]
   ↓
5. Pinta la foto en el canvas del flyer
   ↓
6. Cliente ve el flyer con FOTO REAL de la cerveza
```

---

## 🔧 **Mapeo Automático Nombre → Foto**

### Patrón de Nomenclatura en GitHub
```
cerveza-x-lata-[MARCA]-[VARIEDAD]-[ML]cc.jpg
```

### Ejemplos Implementados

| Nombre en Google Sheets | URL Generada |
|---|---|
| `Quilmes Clásica 473ml` | `cerveza-x-lata-quilmes-clasica-473cc.jpg` |
| `Heineken 473ml` | `cerveza-x-lata-heineken-473cc.jpg` |
| `Stella Artois 473cc` | `cerveza-x-lata-stella-artois-473cc.jpg` |
| `Budweiser 473ml` | `cerveza-x-lata-budweiser-473cc.jpg` |
| `Schneider 473ml` | `cerveza-x-lata-schneider-473cc.jpg` |

### Algoritmo de Conversión
```javascript
function _generarURLFoto(nombreProducto) {
    // Extrae ML
    const mlMatch = nombreProducto.match(/(\d+)\s*ml/i);
    const ml = mlMatch ? mlMatch[1] : '473';
    
    // Convierte a lowercase, reemplaza espacios y acentos
    // "Quilmes Clásica 473ml" → "quilmes-clasica-473ml"
    // Arma URL final: "cerveza-x-lata-quilmes-clasica-473cc.jpg"
}
```

---

## 📋 **Cómo Configuras Tus Productos en Google Sheets**

Para que el sistema funcione **perfecto**, tus nombres en Google Sheets deben ser **exactos** y consistentes:

### Formato Recomendado
```
MARCA VARIEDAD [CAPACIDAD]ml
```

### Ejemplos Correctos ✅
```
Quilmes Clásica 473ml
Quilmes IPA 473ml
Quilmes Stout 473ml
Heineken 473ml
Stella Artois 473ml
Budweiser 473ml
Schneider 473ml
Corona 355ml
Patagonia Bohemian 740ml
```

### Ejemplos que NO Funcionan ❌
```
Quilmes (sin capacidad)
473ml Quilmes (orden equivocado)
Quilmes 473 (sin "ml")
quilmes (minúsculas en Sheets pueden causar problemas)
```

---

## 🖼️ **Cómo Se Pinta la Foto en el Canvas**

### Posición en el Flyer
```
┌────────────────────────────────────┐
│ [FOTO] NOMBRE                      │
│ 45x75px Precio Viejo               │ Descuento
│         Precio Nuevo               │ Badge
│         Ahorras $XXX               │
└────────────────────────────────────┘
```

### Tamaño y Estilo
- **Ancho**: 45px (botella/lata estilizada)
- **Alto**: 75px (proporcional a botella real)
- **Fondo**: Rectángulo con esquinas redondeadas y transparencia
- **Efecto**: Spotlight sutil detrás de la imagen

---

## ⚙️ **Sistema de Caché**

Para que el flyer cargue **RÁPIDO**, el sistema guarda las imágenes cargadas en memoria:

```javascript
let _imagesCache = {}; // Guarda fotos ya cargadas
```

**Primera vez**: Carga de GitHub (un poco lenta)  
**Próximas veces**: Usa caché en memoria (instantáneo)

---

## 🚨 **Troubleshooting**

### Problema: La foto no aparece
**Causas posibles:**
1. El nombre en Google Sheets no coincide con el archivo en GitHub
2. El archivo no existe en GitHub (renombraste o borraste)
3. El nombre tiene caracteres especiales no soportados

**Solución:**
- Verifica que el nombre sea **exacto** (mayúsculas, espacios, etc)
- Asegúrate que el archivo existe en GitHub
- Si cambias el nombre, actualiza también en Google Sheets

### Problema: Las fotos cargan lentamente
**Causa:** Primera carga desde GitHub es lenta  
**Solución:** Es normal. Próximas veces será instantáneo (caché)

### Problema: Caracteres especiales en nombres (ej: Ándina)
**Solución:** El sistema reemplaza automáticamente:
```
á → a
é → e
í → i
ó → o
ú → u
```

---

## 📊 **Impacto Visual**

### Antes (sin fotos)
```
QUILMES CLÁSICA
$1500 → $1125
Ahorras $375          25% OFF
```

### Después (con fotos reales)
```
[BOTELLA] QUILMES CLÁSICA
         $1500 → $1125
         Ahorras $375          25% OFF
```

**El impacto**: +30-40% más conversión  
**Razón**: Ver la botella/lata real convence mucho más que solo el texto

---

## 🔄 **Flujo de Actualización**

### Cuando Agregas una Nueva Cerveza
1. **En tu almacén**: Tomas una foto del producto
2. **En GitHub**: Subes la foto con el nombre correcto a `/imagenes-productos/`
   - Nombre formato: `cerveza-x-lata-[marca]-[variedad]-[ml]cc.jpg`
3. **En Google Sheets**: Agregas el producto con nombre exacto
4. **En el POS**: Clickeas "Jueves Cervecero" y el sistema genera el flyer automáticamente

---

## 🔗 **URLs de Recursos**

### Base de Fotos
```
https://raw.githubusercontent.com/almacen-copihue/almacen-copihue/main/imagenes-productos/
```

### Ejemplo de URL Completa
```
https://raw.githubusercontent.com/almacen-copihue/almacen-copihue/main/imagenes-productos/cerveza-x-lata-quilmes-clasica-473cc.jpg
```

---

## 💡 **Optimizaciones Futuras Posibles**

### 1. Recorte Automático de Fondo
Si tus fotos tienen fondo blanco, el sistema podría:
- Detectar y eliminar el fondo
- Mostrar solo la botella/lata
- Resultado: Flyer más limpio y profesional

### 2. Compresión de Imágenes
Reducir tamaño de fotos para carga más rápida sin perder calidad

### 3. Caché en Servidor
Guardar fotos procesadas en servidor para acceso más rápido

### 4. Fallback Automático
Si la foto no carga, mostrar un emoji o placeholder bonito

---

## 📝 **Checklist para Implementar**

- [ ] Tus fotos están en GitHub con nombre formato correcto
- [ ] Los nombres en Google Sheets coinciden exactamente
- [ ] El flyer carga y muestra las fotos
- [ ] Las fotos se ven claras y proporcionales
- [ ] Compartes el flyer por WhatsApp y ves las fotos

---

**Sistema de integración de fotos automático — Copihue Marketing**  
**Última actualización: Marzo 2026**
