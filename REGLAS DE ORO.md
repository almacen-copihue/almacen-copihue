# 🔒 REGLAS DE ORO — CONTRATO DE DESARROLLO DE LA APP

**Estas reglas son obligatorias para TODA modificación, corrección, mejora o nueva versión de esta APP.**

La IA debe respetarlas antes de modificar código.  
**No debe interpretar una solicitud nueva como autorización para cambiar, eliminar, reorganizar o alterar comportamientos existentes que no hayan sido solicitados expresamente.**

---

## 1. CONTROL DE VERSIÓN

La APP tiene **una única constante `APP_VERSION`** ubicada cerca del principio del script.

* Cada nueva salida debe incrementar `APP_VERSION` en **+1 entero**.
* Las versiones siempre son números enteros consecutivos.
* No utilizar formatos como `v1.2`, `v1.2.x`, `1a`, `1b`, etc.
* La versión debe salir automáticamente de esa única constante.
* **Nunca hardcodear el número de versión en otros lugares del código.**
* El `<title>` de la pestaña y el badge de versión del header deben obtener la versión desde `APP_VERSION`.

**Regla fundamental:**  
`APP_VERSION` es la única fuente de verdad para la versión de la APP.

---

## 2. ARCHIVOS DE SALIDA

Cada modificación terminada debe entregar **DOS archivos con exactamente el mismo contenido**:

1. `[nombre-original].html`  
   * Nombre limpio.  
   * Listo para subir directamente al servidor.

2. `[nombre-original]_v[N]_backup.html`  
   * Exactamente el mismo contenido.  
   * Incluye el número de versión en el nombre.  
   * Listo para guardar como respaldo.

**Los dos archivos deben ser idénticos internamente.**

---

## 3. NUNCA SALIR DE LA PÁGINA SIN CONFIRMACIÓN

La APP **nunca debe abandonar la página sin preguntar al usuario**, salvo que una acción haya sido diseñada explícitamente como excepción.

La protección debe contemplar TODAS las vías de salida:

* Botón "Atrás" creado por la APP.
* Botón atrás del navegador.
* Botón físico/software de atrás del teléfono.
* Gesto de deslizar desde el borde para volver.
* Links internos que naveguen hacia otra página.
* Botones que cambien de página.
* Cualquier otra navegación que provoque abandono de la página actual.

Antes de abandonar debe aparecer **el mismo sistema de confirmación**.

La protección no debe limitarse al botón "Atrás" dibujado por la APP.

### Interpretación técnica

Cuando corresponda, utilizar mecanismos como `history`, `popstate`, interceptación de navegación y control de enlaces/botones.

**Importante:** la solución técnica no debe romper formularios, modales, navegación interna legítima ni provocar bucles de navegación.

---

## 4. EDICIONES DEL USUARIO = INDICADOR DE GUARDADO

Cuando el usuario pueda modificar cualquier dato directamente en la página:

* El indicador/icono de guardar debe cambiar al **icono clásico de disquete 💾**.
* El cambio debe indicar claramente que existen modificaciones pendientes de guardar.
* Una vez guardados los cambios, debe volver al estado correspondiente de "sin cambios".

No reemplazar este comportamiento por otro sistema visual sin autorización.

---

## 5. NO PREGUNTAR NUEVAMENTE POR EL FORMATO

Estas reglas son permanentes para esta APP.

La IA **no debe volver a preguntar**:

* cómo numerar versiones;
* cómo nombrar los archivos;
* si debe generar backup;
* qué formato de salida utilizar.

Debe aplicar automáticamente este contrato en cada nueva versión.

Si existe una contradicción real entre una nueva solicitud y estas reglas, debe señalarla antes de modificar el comportamiento protegido.

---

## 6. DESPLAZAMIENTO VERTICAL NUNCA DEBE RECARGAR LA PÁGINA

El desplazamiento vertical normal del usuario **jamás debe provocar una recarga de la página**.

Esto incluye especialmente el gesto móvil conocido como:

**pull-to-refresh**

Cuando el usuario está arriba de la página y desliza hacia abajo, el navegador puede interpretar el gesto como una orden de recargar.

La APP debe impedir ese comportamiento cuando corresponda.

### Regla de comportamiento

* Desplazarse verticalmente ≠ recargar.
* Llegar al comienzo de la página ≠ recargar.
* Seguir deslizando hacia abajo ≠ recargar.
* El usuario debe disponer de herramientas/botones explícitos para actualizar los datos cuando sea necesario.

### Interpretación técnica

Utilizar mecanismos apropiados como:

```css
overscroll-behavior-y: contain;