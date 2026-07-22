// ======================
// ALMACÉN COPIHUE — MÓDULO FLYER MULTICOMPRA
// flyer_multicompra.gs v1.0
//
// ⚠️ ESTE ARCHIVO VA EN EL MISMO PROYECTO QUE Code.gs
//    Usa SS_ID, HOJA_INVENTARIO y respuestaJSON() que ya están
//    definidos en Code.gs. NO redefinir esas constantes.
//
//    Lee las mismas columnas que ya usa calcularOfertas() para el bloque
//    MULTICOMPRA (MULTICOMPRA_ACTIVA / MULTICOMPRA_TIPO /
//    MULTICOMPRA_CANTIDAD / MULTICOMPRA_PRECIO / GRUPO en "inventario"),
//    pero sin el límite de 6 que usa la web de ofertas — trae TODAS las
//    activas para que puedas elegir cuáles van en el flyer.
//
// 📋 AGREGAR AL doGet DE Code.gs, junto a las demás acciones:
//
//    if (e && e.parameter && e.parameter.action === 'getMulticompraTodas') {
//      return respuestaJSON(getMulticompraTodas());
//    }
//
// ======================

function getMulticompraTodas() {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sh = ss.getSheetByName(HOJA_INVENTARIO);
    if (!sh) return { ok: false, error: 'Hoja inventario no encontrada' };

    var datos  = sh.getDataRange().getValues();
    var header = datos[0].map(function (h) { return String(h || '').trim().toUpperCase(); });

    var colActiva   = header.indexOf('MULTICOMPRA_ACTIVA');
    var colTipo     = header.indexOf('MULTICOMPRA_TIPO');
    var colCantidad = header.indexOf('MULTICOMPRA_CANTIDAD');
    var colPrecio   = header.indexOf('MULTICOMPRA_PRECIO');
    var colGrupo    = header.indexOf('GRUPO');

    if (colActiva === -1) {
      return { ok: false, error: 'No se encontró la columna MULTICOMPRA_ACTIVA en "inventario"' };
    }

    var items = [];
    for (var i = 1; i < datos.length; i++) {
      var fila = datos[i];
      var nombre = String(fila[0] || '').trim();
      if (!nombre) continue;

      var activa = String(fila[colActiva] || '').trim().toUpperCase();
      if (activa !== 'SI') continue;

      var stock = parseFloat(fila[5]) || 0;
      if (stock <= 0) continue; // sin stock no tiene sentido ofertarlo

      var cantidad   = colCantidad !== -1 ? (parseInt(fila[colCantidad], 10) || 0) : 0;
      var precioPack = colPrecio   !== -1 ? (parseFloat(fila[colPrecio]) || 0)     : 0;
      if (cantidad <= 0 || precioPack <= 0) continue; // fila mal cargada, se omite

      items.push({
        id:           String(fila[3] || '').trim(),
        nombre:       nombre,
        proveedor:    String(fila[4] || '').trim().toUpperCase(),
        categoria:    String(fila[2] || '').trim().toUpperCase(),
        precioActual: parseFloat(fila[1]) || 0,
        stock:        stock,
        tipo:         colTipo  !== -1 ? String(fila[colTipo]  || '').trim().toUpperCase() : '',
        cantidad:     cantidad,
        precioPack:   precioPack,
        grupo:        colGrupo !== -1 ? String(fila[colGrupo] || '').trim().toUpperCase() : ''
      });
    }

    items.sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });

    var proveedoresSet = {};
    items.forEach(function (it) { if (it.proveedor) proveedoresSet[it.proveedor] = true; });

    return {
      ok:          true,
      total:       items.length,
      proveedores: Object.keys(proveedoresSet).sort(),
      items:       items,
      generadoEn:  new Date().toISOString()
    };

  } catch (e) {
    return { ok: false, error: e.toString() };
  }
}
