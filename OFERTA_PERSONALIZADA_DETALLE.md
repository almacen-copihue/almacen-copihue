# Oferta Personalizada — Detalle técnico completo

Pegá este documento junto con `MANUAL_IA_COPIHUE.md` al arrancar cualquier sesión de
IA que vaya a tocar esta feature. Es la ampliación de la sección 6 del manual, escrita
después de encontrar y corregir el bug real que venía confundiendo a todas las IAs
anteriores (ver punto 6 de este documento — es la parte más importante).

---

## 1. Qué es, en una frase

Una campaña de marketing de texto libre + % de descuento aproximado, aplicada a mano
a un lote de productos elegidos desde `sendwa`, con un precio final ya calculado por
el servidor que se ve **igual** en `sendwa`, `seba21` (POS) e `index` (catálogo
público).

No es un sistema de centavos reales. Argentina hoy no usa centavos en la calle — esto
es 100% un gancho psicológico visual, nunca dinero real fraccionado.

---

## 2. Dónde vive el dato

| Dato | Ubicación |
|---|---|
| Código de oferta (0 = sin oferta, 1-6 = nivel de descuento) | `inventario!AJ` (índice 35, 0-based) |
| Mapa de % por código | `{1:10, 2:20, 3:30, 4:40, 5:50, 6:60}` (hardcodeado en `Code.gs`) |
| Texto de la campaña (ej. "Feliz Día del Padre") | Una sola celda en `config_sistema`, clave **"Texto oferta personalizada"** en columna A, texto en columna B. Es **único y global** — no por producto. Se pisa cada vez que se aplica una tanda nueva. |

⚠️ Esto es independiente de `getConfig()`/`setConfig()` (que manejan las grillas de
7 días de relámpago/destacada/especial). No mezclar los dos sistemas.

---

## 3. Cálculo del precio final — UNA SOLA fuente de verdad

El redondeo psicológico se calcula **una sola vez, en el servidor** (`Code.gs`,
función `psicoRound_`). Ningún frontend lo recalcula — todos reciben `precioFinal`
ya resuelto.

```js
function psicoRound_(precio) {
  var step = precio < 10000 ? 500 : 1000;
  var rounded = Math.ceil(precio / step) * step;
  if (rounded - precio < step * 0.15) rounded += step;
  return rounded - 1; // SIEMPRE termina en ...499 o ...999
}
```

**Dato clave que se nos pasó por alto hasta hoy:** por cómo está armada la fórmula
(un múltiplo del step, menos 1), el resultado **siempre termina exactamente en los
dígitos "99"** — sea `...499` o `...999`. Esto no es casualidad ni un efecto de
redondeo aproximado: es matemáticamente garantizado. Cualquier función de
visualización puede asumir con seguridad que el precio final de esta feature termina
en "99".

Ejemplo real: producto a $2.500, código de oferta 1 (10%):
`2500 × 0.9 = 2250` → `Math.ceil(2250/500)*500 = 2500` → `2500 - 2250 = 250`, que NO
es menor a `500*0.15=75` → no se suma otro escalón → resultado final **2499**.

---

## 4. EL BUG QUE CONFUNDÍA A TODAS LAS IAS (leer esto con atención)

Hasta `sendwa ver.55`, el efecto visual de "cartel de almacén" (número grande + `99`
chiquito arriba, como en los carteles físicos reales) se generaba **cortando los
últimos 2 caracteres del precio ya formateado con separador de miles**:

```js
// VERSIÓN VIEJA — INCORRECTA, YA NO USAR
const str = Number(n).toLocaleString('es-AR');   // 2499 → "2.499"
const head = str.slice(0, -2);                   // "2.4"   ← le falta un dígito real
const tail = str.slice(-2);                       // "99"
// resultado visual: "$2.4" + chico "99" → se lee como "2 pesos con 49/99 centavos"
```

El problema: `toLocaleString` agrega el punto de miles (`"2.499"`, 5 caracteres), y
cortar los últimos 2 **caracteres** del string (no del número) deja el punto de miles
mal ubicado — visualmente queda en el mismo lugar que ocuparía una coma decimal real.
Por eso se leía como "2 pesos con 49 centavos" en vez de "2.499 pesos enteros".

**Esto NO era un error de cálculo.** El número guardado y calculado siempre fue
correcto (2499). Era puramente un error de **cómo se separaba visualmente** el mismo
número para el efecto de cartel.

### La corrección (ver.56 en adelante)

La idea correcta — confirmada con Alma — es: **mostrar el precio completo entero, y
agregarle un `99` chico DECORATIVO de regalo al final**, simulando el cartel clásico
argentino de "termina en 99 centavos" (gancho psicológico puro, no hay centavos
reales en juego):

```js
// fmtPsico() — versión HTML (sendwa, texto normal)
function fmtPsico(n) {
  if (!n && n !== 0) return '';
  const full = Number(n).toLocaleString('es-AR');     // "2.499" — completo, sin cortar
  return `$${full}<sup class="psico-99">99</sup>`;     // + "99" decorativo de gancho
}
```

```js
// fillPriceCentered() — versión Canvas (collage / fotos para WhatsApp)
// (mismo fix: head = precio completo, tail = "99" fijo, no recortado)
function fillPriceCentered(ctx, precio, cx, y, fontPx, color, psico) {
  const full = fmt(precio);          // "$2.499" completo
  if (!psico) { /* dibuja full normal, sin split */ return; }
  const head = full;                 // ya NO se recorta
  const tail = '99';                 // fijo, decorativo
  // ...resto del posicionamiento igual (head grande + tail chico en superíndice)
}
```

Resultado visual correcto: **`$2.499` grande + `⁹⁹` chico** — se lee inequívocamente
como dos mil cuatrocientos noventa y nueve pesos, con un gancho visual de "termina en
99" añadido aparte, sin ninguna ambigüedad de centavos reales.

### Por qué esto importa para cualquier IA futura

Si alguna vez se vuelve a tocar el formateo de precios de esta feature (en `sendwa`,
`seba21` o `index`), **NUNCA** usar `.slice(0, -2)` / `.slice(-2)` sobre un string ya
formateado con `toLocaleString`. Esa técnica es la causa raíz de la confusión
histórica. La regla correcta es: el número completo se muestra entero y grande, y el
`99` decorativo del gancho se agrega aparte, siempre fijo en `"99"` (nunca derivado
de recortar el número real), porque la fórmula de `psicoRound_` ya garantiza que el
precio real también termina en 99 — son dos cosas coincidentes pero conceptualmente
separadas: el número real, y el adorno visual.

---

## 5. Funciones en Code.gs

- `aplicarOfertaPersonalizada({productoIds, tipo, texto})` — escribe el código (1-6)
  en `AJ` para cada ID (fila = `id + 1`, mismo patrón que `activarRelampago`), y
  guarda el texto de campaña en `config_sistema`.
- `quitarOfertaPersonalizada({productoIds})` — pone `AJ` en `0` para esos IDs.
- Rutas en `doGet`: `action=ofertaPersonalizada` / `action=quitarOfertaPersonalizada`.
- En el catálogo principal (bloque por defecto de `doGet`, sin `action` específico),
  cada producto trae:
  ```js
  producto.ofertaPersonalizada = {
    activa: true/false,
    tipo: 1-6,
    porcentaje: 10-60,
    texto: "Feliz Día del Padre",
    precioFinal: 2499,       // ya resuelto por psicoRound_, listo para mostrar
    etiqueta: "..."          // texto corto para el badge
  }
  ```

---

## 6. Prioridad frente a otras ofertas

En los tres frontends (`sendwa.calcularOferta`, `seba21.calcularOfertaPOS`,
`index.addToCart`/render de carrito): la oferta personalizada se chequea **primero**,
antes de Jueves Cervecero, relámpago, destacada, especial, últimas unidades,
PROMO/COMBO (columna J) y multicompra. Si está activa, pisa cualquier otra — el resto
de la cadena debe quedar dentro de un `if (!esOfertaPersonalizada) { ...resto... }`
para que no se re-evalúe y la pise por accidente (este bug de reevaluación ya pasó
una vez en `index.html` — cuidado al copiar el patrón a mano en archivos nuevos).

---

## 7. Visibilidad

A diferencia de PROMO/COMBO (columna J, cuya visibilidad pública depende de la
fórmula de la planilla), la oferta personalizada se muestra **siempre** en el
catálogo público (`index`) — es una campaña de marketing pensada para el público
general, no para comedores/clientes internos. Si en algún momento se pide una
versión oculta, replicar el mismo mecanismo de flag que usa la columna J.

---

## 8. UI de aplicación (sendwa)

Modal con: input de texto libre (placeholder "Ej: Feliz día del padre") + 6 botones
de % (`≈10%` … `≈60%`, mostrados con el símbolo `≈` porque el % final es aproximado,
el número exacto lo decide `psicoRound_`). Se aplica sobre `selectedIds` — la misma
selección que usa el collage. Llama a `_apiAction('ofertaPersonalizada', {...})`, y
tras éxito **re-fetchea el catálogo completo** (no usa mapa local — la fuente de
verdad es siempre la planilla, nunca un estado guardado en el navegador).

Botones del modal: **"✅ Aplicar a selección"** (escribe el código en `AJ` para los
IDs seleccionados) y **"🗑️ Quitar"** (pone `AJ` en 0 para esos mismos IDs).

---

## 9. Pendientes conversados (no implementados todavía)

- Que la selección de productos para Oferta Personalizada suba sola al tope del
  scroll de la grilla al seleccionarlos.
- Agregar, dentro del modal de Oferta Personalizada, una opción de grilla tipo
  Collage (2×2, 3×2, 3×3, 4×3) para previsualizar/descargar la tanda completa como
  imagen — reusando el mismo motor de dibujo de `drawCollage`/`drawProductCard`.
- Evaluar si el botón "✅ Aplicar a selección" puede, en el mismo click, además abrir
  la previsualización del collage con los productos recién aplicados.
