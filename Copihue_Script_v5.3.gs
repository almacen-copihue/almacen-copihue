// ======================
// ALMACÉN COPIHUE - SISTEMA COMPLETO v5.3
// Incluye: API productos, Venta en tiempo real, Agregar producto, Hoja Ventas por ticket
// v5.3: Al crear producto nuevo → genera fila en HISTORIAL (igual que ingreso mercadería)
// ======================

const SS_ID = '1hKeM-13t6wyGD5Ya4Rx9NeUJXsgJoVN4dOb-rklPznA';
const HOJA_INVENTARIO = 'inventario';
const HOJA_HISTORIAL = 'Historial';
const MP_ACCESS_TOKEN = 'APP_USR-5614141351834158-022520-6ad6dd5ed431ca58fa841bfd74f0945b-213611899';

// ========== CREAR MENÚ PERSONALIZADO ==========
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏪 COPIHUE')
    .addItem('📦 Ingresar Productos', 'abrirFormularioIngreso')
    .addSeparator()
    .addItem('📊 Ver Historial', 'irAHistorial')
    .addItem('🔄 Actualizar Todo', 'actualizarTodo')
    .addToUi();
  console.log('✅ Menú Copihue creado');
}

// ========== ABRIR FORMULARIO DE INGRESO ==========
function abrirFormularioIngreso() {
  const html = HtmlService.createHtmlOutputFromFile('ingreso')
    .setWidth(520)
    .setHeight(750)
    .setTitle('📦 Ingreso de Mercadería');
  SpreadsheetApp.getUi().showModalDialog(html, '📦 Ingreso de Mercadería - Copihue');
}

// ========== IR A HOJA HISTORIAL ==========
function irAHistorial() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheetHistorial = ss.getSheetByName(HOJA_HISTORIAL);
  if (sheetHistorial) {
    ss.setActiveSheet(sheetHistorial);
  } else {
    SpreadsheetApp.getUi().alert('❌ No se encontró la hoja "Historial"');
  }
}

// ========== ACTUALIZAR TODO ==========
function actualizarTodo() {
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✅ Datos actualizados correctamente');
}

// ========== OBTENER DATOS INICIALES (para formulario ingreso) ==========
function obtenerDatosIniciales() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetInventario = ss.getSheetByName(HOJA_INVENTARIO);
    const datos = sheetInventario.getDataRange().getValues();

    const productos = [];
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][0]) {
        productos.push(String(datos[i][0]).trim());
      }
    }

    const proveedoresSet = new Set();
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][4]) {
        proveedoresSet.add(String(datos[i][4]).trim());
      }
    }

    return {
      productos: productos,
      proveedores: Array.from(proveedoresSet).sort()
    };
  } catch (error) {
    console.error('Error obtenerDatosIniciales:', error);
    return { productos: [], proveedores: [] };
  }
}

// ========== OBTENER INFO DE UN PRODUCTO ==========
function obtenerInfoProducto(nombreProducto) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const datos = sheet.getDataRange().getValues();
    const nombreBuscado = nombreProducto.trim().toUpperCase().replace(/\s+/g, ' ');

    for (let i = 1; i < datos.length; i++) {
      if (!datos[i][0]) continue;
      const nombreEnSheet = String(datos[i][0]).trim().toUpperCase().replace(/\s+/g, ' ');
      if (nombreEnSheet === nombreBuscado) {
        return {
          encontrado: true,
          fila: i + 1,
          precioVenta: datos[i][1] || 0,
          stockActual: datos[i][5] || 0,
          proveedor: datos[i][4] || '',
          precioCosto: obtenerUltimoCosto(nombreProducto)
        };
      }
    }

    return { encontrado: false, mensaje: 'Producto no existe en inventario' };
  } catch (error) {
    console.error('Error obtenerInfoProducto:', error);
    return { encontrado: false, error: error.toString() };
  }
}

// ========== OBTENER ÚLTIMO PRECIO DE COSTO DESDE HISTORIAL ==========
function obtenerUltimoCosto(nombreProducto) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetHistorial = ss.getSheetByName(HOJA_HISTORIAL);
    if (!sheetHistorial) return null;

    const datos = sheetHistorial.getDataRange().getValues();
    const nombreBuscado = nombreProducto.trim().toUpperCase();

    for (let i = datos.length - 1; i >= 1; i--) {
      const nombreEnHistorial = String(datos[i][1] || '').trim().toUpperCase();
      if (nombreEnHistorial === nombreBuscado) {
        const costo = datos[i][6];
        if (costo && !isNaN(costo)) return Number(costo);
      }
    }
    return null;
  } catch (error) {
    console.error('Error obtenerUltimoCosto:', error);
    return null;
  }
}

// ========== INGRESAR MERCADERÍA (desde formulario) ==========
function ingresarMercaderia(datos) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetInventario = ss.getSheetByName(HOJA_INVENTARIO);
    const sheetHistorial = ss.getSheetByName(HOJA_HISTORIAL);

    const producto = datos.producto.trim();
    const cantidad = Number(datos.cantidad);
    const precioCosto = datos.precioCosto;
    const precioVenta = datos.precioVenta;
    const proveedor = datos.proveedor;
    const fechaVencimiento = datos.fechaVencimiento;

    if (!producto) return { success: false, mensaje: 'Nombre de producto vacío' };
    // Si viene stockDirecto (ajuste rápido), saltear validación de cantidad
    const esAjusteDirecto = datos.stockDirecto !== undefined && datos.stockDirecto !== null;
    if (!esAjusteDirecto && cantidad <= 0) return { success: false, mensaje: 'Cantidad debe ser mayor a 0' };

    const datosInventario = sheetInventario.getDataRange().getValues();
    let filaProducto = -1;
    let stockActual = 0;
    const productoNormalizado = producto.trim().toUpperCase().replace(/\s+/g, ' ');

    for (let i = 1; i < datosInventario.length; i++) {
      if (!datosInventario[i][0]) continue;
      const nombreEnSheet = String(datosInventario[i][0]).trim().toUpperCase().replace(/\s+/g, ' ');
      if (nombreEnSheet === productoNormalizado) {
        filaProducto = i + 1;
        stockActual = Number(datosInventario[i][5]) || 0;
        break;
      }
    }

    if (filaProducto === -1) {
      // Producto no existe — crearlo automáticamente al final del inventario
      const ultimaFila = sheetInventario.getLastRow() + 1;
      const nuevoStock = cantidad;
      
      // Generar ID automático
      const todosLosDatos = sheetInventario.getDataRange().getValues();
      let maxId = 0;
      for (let i = 1; i < todosLosDatos.length; i++) {
        const idRaw = String(todosLosDatos[i][3] || '').replace('ID', '');
        const idNum = parseInt(idRaw);
        if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
      }
      const nuevoId = 'ID' + (maxId + 1);

      sheetInventario.getRange(ultimaFila, 1).setValue(producto.toUpperCase());
      sheetInventario.getRange(ultimaFila, 2).setValue(precioVenta || 0);
      sheetInventario.getRange(ultimaFila, 3).setValue('ALMACEN');
      sheetInventario.getRange(ultimaFila, 4).setValue(nuevoId);
      if (proveedor) sheetInventario.getRange(ultimaFila, 5).setValue(proveedor);
      sheetInventario.getRange(ultimaFila, 6).setValue(nuevoStock);
      if (fechaVencimiento) sheetInventario.getRange(ultimaFila, 16).setValue(fechaVencimiento);

      const fechaNuevo = new Date();
      sheetHistorial.appendRow([
        fechaNuevo, producto, cantidad, nuevoStock, nuevoId,
        proveedor || '', precioCosto || '', precioVenta || '', fechaVencimiento || ''
      ]);

      let mensajeNuevo = '✅ Producto NUEVO creado!\n📦 ' + producto + '\n🆔 ' + nuevoId + '\n📊 Stock inicial: ' + nuevoStock;
      if (precioVenta) mensajeNuevo += '\n💰 Precio venta: $' + precioVenta;
      mensajeNuevo += '\n\n⚠️ Revisá la categoría en la planilla (se asignó ALMACEN por defecto)';

      return { success: true, mensaje: mensajeNuevo, nuevoStock: nuevoStock, esNuevo: true };
    }

    // Si viene stockDirecto, usar ese valor exacto. Si no, sumar cantidad.
    const nuevoStock = (datos.stockDirecto !== undefined && datos.stockDirecto !== null)
      ? Number(datos.stockDirecto)
      : stockActual + cantidad;
    sheetInventario.getRange(filaProducto, 6).setValue(nuevoStock);

    if (proveedor) sheetInventario.getRange(filaProducto, 5).setValue(proveedor);
    if (precioVenta && precioVenta > 0) sheetInventario.getRange(filaProducto, 2).setValue(precioVenta);
    if (fechaVencimiento) sheetInventario.getRange(filaProducto, 16).setValue(fechaVencimiento); // Columna P
    if (datos.nombreNuevo && datos.nombreNuevo.trim()) sheetInventario.getRange(filaProducto, 1).setValue(datos.nombreNuevo.trim().toUpperCase()); // Renombrar
    if (datos.categoria && datos.categoria.trim()) sheetInventario.getRange(filaProducto, 3).setValue(datos.categoria.trim().toUpperCase()); // Columna C = Categoría

    const fecha = new Date();
    sheetHistorial.appendRow([
      fecha, producto, cantidad, nuevoStock, '',
      proveedor || '', precioCosto || '', precioVenta || '', fechaVencimiento || ''
    ]);

    let mensaje = '✅ Ingreso exitoso!\n📦 ' + producto + '\n➕ Cantidad: ' + cantidad + '\n📊 Stock: ' + stockActual + ' → ' + nuevoStock;
    if (precioVenta) mensaje += '\n💰 Precio venta actualizado: $' + precioVenta;

    return { success: true, mensaje: mensaje, nuevoStock: nuevoStock };
  } catch (error) {
    console.error('Error ingresarMercaderia:', error);
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}


// ========== CEREBRO ÚNICO DE OFERTAS ==========
// El front no decide nada — este función devuelve los arrays listos para renderizar
// ===== HELPERS MOTOR OFERTAS (fuera de función para compatibilidad Apps Script) =====
function _ofertaDiasVencer_(fila) {
  try {
    const v = fila.length > 15 ? fila[15] : '';
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return null;
    return Math.round((d - new Date()) / (1000 * 60 * 60 * 24));
  } catch(e) { return null; }
}

function _ofertaDiasDesdePromo_(fila) {
  try {
    const v = fila.length > 17 ? fila[17] : '';
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return null;
    return Math.round((new Date() - d) / (1000 * 60 * 60 * 24));
  } catch(e) { return null; }
}

function _ofertaPuntaje_(fila) {
  var p = 0;
  var dv = _ofertaDiasVencer_(fila);
  var dp = _ofertaDiasDesdePromo_(fila);
  var stock = parseInt(fila[5]) || 0;
  var rotacion = fila.length > 14 ? (parseInt(fila[14]) || 0) : 0;
  var precio = parseInt(fila[1]) || 0;
  if (dp !== null && dp < 15) return -99;
  if (dv !== null) {
    if (dv <= 3) p += 5;
    else if (dv <= 7 && stock >= 5) p += 4;
  }
  if (rotacion >= 3) p += 3;
  if (precio > 1000) p += 2;
  return p;
}

function _ofertaBuildProducto_(fila, i) {
  var tz = Session.getScriptTimeZone();
  var venc = '';
  try {
    var v = fila.length > 15 ? fila[15] : '';
    if (v) {
      venc = v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v).trim();
    }
  } catch(e) {}
  return {
    id: i,
    name: String(fila[0] || '').trim(),
    price: parseInt(fila[1]) || 0,
    category: String(fila[2] || 'ALMACEN').trim().toUpperCase(),
    stock: parseInt(fila[5]) || 0,
    relampago: parseInt(fila[6]) || 0,
    rotacion: fila.length > 14 ? (parseInt(fila[14]) || 0) : 0,
    vencimiento: venc,
    diasParaVencer: _ofertaDiasVencer_(fila),
    puntaje: _ofertaPuntaje_(fila)
  };
}

function calcularOfertas() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName(HOJA_INVENTARIO);
  var datos = sheet.getDataRange().getValues();
  var tz = Session.getScriptTimeZone();

  var relampagoActivo = [];
  var ultimasUnidades = [];
  var idsUsados = {};

  // FASE 1: ÚLTIMAS UNIDADES — vencimiento crítico (<= 3 días), stock > 0
  var candidatosUltimas = [];
  for (var i = 1; i < datos.length; i++) {
    var fila = datos[i];
    if (!fila[0]) continue;
    var stock = parseInt(fila[5]) || 0;
    if (stock <= 0) continue;
    var dv = _ofertaDiasVencer_(fila);
    if (dv === null || dv > 3) continue;
    candidatosUltimas.push({ fila: fila, i: i, p: _ofertaPuntaje_(fila) + 10 });
  }

  // FASE 2: ÚLTIMAS UNIDADES — stock bajo (<= 5) con relampago > 0
  for (var i2 = 1; i2 < datos.length; i2++) {
    var fila2 = datos[i2];
    if (!fila2[0]) continue;
    var stock2 = parseInt(fila2[5]) || 0;
    var relampago2 = parseInt(fila2[6]) || 0;
    if (stock2 <= 0 || stock2 > 5 || relampago2 <= 0) continue;
    var dv2 = _ofertaDiasVencer_(fila2);
    if (dv2 !== null && dv2 <= 3) continue;
    var p2 = _ofertaPuntaje_(fila2);
    if (p2 <= -99) continue;
    candidatosUltimas.push({ fila: fila2, i: i2, p: p2 });
  }

  candidatosUltimas
    .sort(function(a, b) { return b.p - a.p; })
    .slice(0, 6)
    .forEach(function(c) {
      ultimasUnidades.push(_ofertaBuildProducto_(c.fila, c.i));
      idsUsados[c.i] = true;
    });

  // FASE 3: RELÁMPAGO ACTIVO
  var candidatosRelampago = [];
  for (var i3 = 1; i3 < datos.length; i3++) {
    var fila3 = datos[i3];
    if (!fila3[0]) continue;
    if (idsUsados[i3]) continue;
    var stock3 = parseInt(fila3[5]) || 0;
    var relampago3 = parseInt(fila3[6]) || 0;
    if (stock3 <= 0 || relampago3 <= 0) continue;
    var p3 = _ofertaPuntaje_(fila3);
    if (p3 <= -99) continue;
    candidatosRelampago.push({ fila: fila3, i: i3, p: p3 });
  }

  candidatosRelampago
    .sort(function(a, b) { return b.p - a.p; })
    .slice(0, 4)
    .forEach(function(c) {
      relampagoActivo.push(_ofertaBuildProducto_(c.fila, c.i));
    });

  return {
    success: true,
    relampagoActivo: relampagoActivo,
    ultimasUnidades: ultimasUnidades,
    fecha: Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm'),
    stats: {
      totalRelampago: relampagoActivo.length,
      totalUltimas: ultimasUnidades.length
    }
  };
}

// ========== MOTOR DE PUNTAJE - SUGERENCIAS ==========
function calcularMotorSugerencias() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const datos = sheet.getDataRange().getValues();
    const tz = Session.getScriptTimeZone();
    const hoy = new Date();

    const sugerencias = [];

    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      if (!fila[0]) continue;

      const nombre = String(fila[0] || '').trim();
      const precio = parseInt(fila[1]) || 0;
      const stock = parseInt(fila[5]) || 0;
      const relampago = parseInt(fila[6]) || 0;
      const rotacion = fila.length > 14 ? (parseInt(fila[14]) || 0) : 0;

      if (stock <= 0) continue; // Sin stock no aplica
      if (relampago <= 0) continue; // Solo productos marcados para relámpago

      // Fecha de vencimiento (Col P = índice 15)
      let diasParaVencer = null;
      try {
        const v = fila.length > 15 ? fila[15] : '';
        if (v) {
          const vDate = v instanceof Date ? v : new Date(v);
          if (!isNaN(vDate.getTime())) {
            diasParaVencer = Math.round((vDate - hoy) / (1000 * 60 * 60 * 24));
          }
        }
      } catch(e) {}

      // Fecha última promo (Col R = índice 17)
      let diasDesdeUltimaPromo = null;
      try {
        const up = fila.length > 17 ? fila[17] : '';
        if (up) {
          const upDate = up instanceof Date ? up : new Date(up);
          if (!isNaN(upDate.getTime())) {
            diasDesdeUltimaPromo = Math.round((hoy - upDate) / (1000 * 60 * 60 * 24));
          }
        }
      } catch(e) {}

      // REGLA: si estuvo en promo en los últimos 15 días, omitir
      if (diasDesdeUltimaPromo !== null && diasDesdeUltimaPromo < 15) continue;

      // MOTOR DE PUNTAJE
      let puntaje = 0;

      if (diasParaVencer !== null) {
        if (diasParaVencer <= 3)  puntaje += 5; // vencimiento crítico
        else if (diasParaVencer <= 7 && stock >= 5) puntaje += 4; // stock alto + vence pronto
      }
      if (rotacion >= 3) puntaje += 3; // rotación alta
      // Buen margen: si precio > 1000 y tiene relampago definido
      if (precio > 1000) puntaje += 2;

      // CLASIFICACIÓN
      let tipo = 'relampago';
      if (diasParaVencer !== null && diasParaVencer <= 3) {
        tipo = 'ultimas'; // Vencimiento crítico va a Últimas Unidades, NO relámpago
      }

      sugerencias.push({
        id: i,
        nombre,
        stock,
        rotacion,
        diasParaVencer,
        diasDesdeUltimaPromo,
        puntaje,
        tipo,
        relampago
      });
    }

    // Ordenar por puntaje DESC
    sugerencias.sort((a, b) => b.puntaje - a.puntaje);

    return {
      success: true,
      sugerencias: sugerencias.slice(0, 10), // top 10
      fecha: Utilities.formatDate(hoy, tz, 'yyyy-MM-dd HH:mm')
    };

  } catch (error) {
    console.error('Error motorSugerencias:', error);
    return { success: false, mensaje: error.toString() };
  }
}

// ========== ACTIVAR RELÁMPAGO INTELIGENTE ==========
function activarRelampago(datos) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const todosLosDatos = sheet.getDataRange().getValues();
    const productoId = datos.productoId; // índice de fila (id del producto)
    const tipoRelampago = datos.tipo;    // 11-14 = pct, 0 = desactivar
    
    // Buscar la fila exacta por índice
    const filaProducto = parseInt(productoId) + 1; // +1 por encabezado
    if (filaProducto < 2 || filaProducto > todosLosDatos.length) {
      return { success: false, mensaje: 'Producto no encontrado' };
    }
    
    // Actualizar columna G (índice 7, columna relámpago)
    sheet.getRange(filaProducto, 7).setValue(tipoRelampago);
    // Limpiar destacada (col H) y especial (col I) para evitar conflicto
    if (datos.limpiarOfertas && tipoRelampago > 0) {
      sheet.getRange(filaProducto, 8).setValue(0); // destacada = 0
      sheet.getRange(filaProducto, 9).setValue(0); // especial = 0
    }
    
    const nombreProducto = todosLosDatos[filaProducto - 1][0];
    
    // Guardar fecha de última promo en Col R (índice 18)
    if (tipoRelampago > 0) {
      sheet.getRange(filaProducto, 18).setValue(new Date());
    }

    if (tipoRelampago === 0) {
      return { success: true, mensaje: '✅ Relámpago desactivado: ' + nombreProducto };
    }
    
    const descuentos = { 11: '10%', 12: '15%', 13: '20%', 14: '25%' };
    const desc = descuentos[tipoRelampago] || tipoRelampago;
    return { success: true, mensaje: '⚡ Relámpago activado! ' + nombreProducto + ' - Descuento: ' + desc };
    
  } catch (error) {
    return { success: false, mensaje: 'Error: ' + error.toString() };
  }
}

// ========== API PRINCIPAL doGet ==========
function doGet(e) {
  try {

    // ACCIÓN: VENDER (rebaja stock)
    if (e && e.parameter && e.parameter.action === 'vender') {
      return procesarVenta(e.parameter.data);
    }

    // ACCIÓN: AGREGAR PRODUCTO NUEVO
    if (e && e.parameter && e.parameter.action === 'agregar') {
      return agregarProducto(e.parameter.data);
    }

    // ACCIÓN: INGRESO DE MERCADERÍA
    if (e && e.parameter && e.parameter.action === 'ingresar') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(ingresarMercaderia(datos));
    }

    // ACCIÓN: CREAR ORDEN MP
    if (e && e.parameter && e.parameter.action === 'crearOrdenMP') {
      const monto = parseFloat(e.parameter.monto) || 0;
      if (monto <= 0) return respuestaJSON({ ok: false, error: 'Monto inválido' });
      return respuestaJSON(crearOrdenMP(monto));
    }

    // ACCIÓN: REPORTES — aislado para que nunca rompa ventas
    if (e && e.parameter && e.parameter.action === 'getReportes') {
      try {
        return respuestaJSON(getReportes());
      } catch(errReportes) {
        return respuestaJSON({ error: true, mensaje: 'Error en reportes: ' + errReportes.toString() });
      }
    }

    // ACCIÓN: OFERTAS PROCESADAS POR EL BACKEND (un solo cerebro)
    if (e && e.parameter && e.parameter.action === 'getOfertas') {
      try {
        return respuestaJSON(calcularOfertas());
      } catch(errOfertas) {
        return respuestaJSON({ error: true, mensaje: 'Error en ofertas: ' + errOfertas.toString() });
      }
    }

    // ACCIÓN: ACTIVAR/DESACTIVAR RELÁMPAGO INTELIGENTE
    if (e && e.parameter && e.parameter.action === 'motorSugerencias') {
      return respuestaJSON(calcularMotorSugerencias());
    }

    if (e && e.parameter && e.parameter.action === 'relampago') {
      const datos = JSON.parse(decodeURIComponent(e.parameter.data));
      return respuestaJSON(activarRelampago(datos));
    }

    // ACCIÓN: GET PRODUCTOS (carga la tienda)
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const datos = sheet.getDataRange().getValues();

    console.log('🔥 API 5.3 - Copihue completo');

    const productos = [];

    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      if (!fila[0]) continue;

      const producto = {
        id: i,
        name: String(fila[0] || '').trim(),
        price: parseInt(fila[1]) || 0,
        category: String(fila[2] || 'ALMACEN').trim().toUpperCase(),
        stock: parseInt(fila[5]) || 0,
        descripcion: fila[3] || '',
        image: '',
        relampago: parseInt(fila[6]) || 0,
        destacada: parseInt(fila[7]) || 0,
        especial: parseInt(fila[8]) || 0,
        normal: 0,
        proveedor: String(fila[4] || '').trim(),
        vencimiento: (() => {
          try {
            const v = fila.length > 15 ? fila[15] : '';
            if (!v) return '';
            if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            return String(v).trim();
          } catch(e) { return ''; }
        })(),  // Columna P
        rotacion: fila.length > 14 ? (parseInt(fila[14]) || 0) : 0,  // Columna O = ROTACION
        costo: fila.length > 18 ? (parseFloat(fila[18]) || 0) : 0,  // Columna S = COSTO (fórmula)
        diaCritico: fila.length > 16 ? String(fila[16] || '').trim().toLowerCase() : '',  // Columna Q
        ultimaPromo: (() => {  // Columna R = última vez en promoción
          try {
            const v = fila.length > 17 ? fila[17] : '';
            if (!v) return '';
            if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            return String(v).trim();
          } catch(e) { return ''; }
        })()
      };

      // Columna L = promos/precio ANTES (índice 11) — prioridad para PROMOS
      if (fila.length > 11) {
        const columnaL = fila[11];
        if (columnaL !== undefined && columnaL !== '' && columnaL !== null) {
          const num = parseInt(columnaL);
          if (!isNaN(num) && num > 0) producto.normal = num;
        }
      }
      // Columna K = precio técnico (índice 10) — fallback si no hay columna L
      if (producto.normal === 0 && fila.length > 10) {
        const columnaK = fila[10];
        if (columnaK !== undefined && columnaK !== '' && columnaK !== null) {
          const num = parseInt(columnaK);
          if (!isNaN(num) && num > 0) producto.normal = num;
        }
      }

      productos.push(producto);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        productos: productos,
        total: productos.length,
        fecha: new Date().toISOString(),
        version: '5.3'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('❌ Error API:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ error: true, mensaje: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== PROCESAR VENTA (rebaja stock + registra en Ventas) ==========
function procesarVenta(dataStr) {
  try {
    const payload = JSON.parse(decodeURIComponent(dataStr));
    
    // Soporta formato viejo (array) y nuevo (objeto con items + metodoPago)
    const items = Array.isArray(payload) ? payload : (payload.items || []);
    const metodoPago = Array.isArray(payload) ? 'efectivo' : (payload.metodoPago || 'efectivo');
    const vendedor = Array.isArray(payload) ? '' : (payload.vendedor || '');

    if (!items || !Array.isArray(items) || items.length === 0) {
      return respuestaJSON({ success: false, mensaje: 'Sin items' });
    }

    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetInventario = ss.getSheetByName(HOJA_INVENTARIO);
    const datos = sheetInventario.getDataRange().getValues();

    const errores = [];
    const procesados = [];
    const fecha = new Date();
    let totalVenta = 0;

    for (const item of items) {
      const filaIndex = item.id;

      if (filaIndex < 1 || filaIndex >= datos.length) {
        errores.push(`ID ${item.id} no encontrado`);
        continue;
      }

      const fila = datos[filaIndex];
      const nombreEnSheet = String(fila[0] || '').trim();
      const stockActual = parseInt(fila[5]) || 0;
      const precioUnit = parseInt(fila[1]) || 0;
      const qty = parseInt(item.qty) || 0;
      const esPeso = item.esPeso === true;
      const gramos = parseInt(item.gramos) || 0;
      const precioVenta = item.precioVenta !== undefined && item.precioVenta !== null && item.precioVenta !== '' ? parseInt(item.precioVenta) : precioUnit;
      const precioOriginal = parseInt(item.precioOriginal) || 0;
      const precioModificado = item.precioModificado === true;

      if (qty <= 0) continue;

      if (esPeso) {
        // Producto por peso: NO rebajar stock, solo registrar
        const nombreConPeso = gramos > 0 ? `${nombreEnSheet} (${gramos}gr)` : nombreEnSheet;

        totalVenta += precioVenta;
        procesados.push({ name: nombreConPeso, qty: gramos, nuevoStock: stockActual, precio: precioVenta, esPeso: true });
      } else {
        // Producto normal: rebajar stock
        if (stockActual < qty) {
          errores.push(`${nombreEnSheet}: stock insuficiente (tiene ${stockActual}, vendió ${qty})`);
        }
        const nuevoStock = Math.max(0, stockActual - qty);
        sheetInventario.getRange(filaIndex + 1, 6).setValue(nuevoStock);

        totalVenta += precioUnit * qty;
        procesados.push({ name: nombreEnSheet, qty, nuevoStock, precio: precioVenta, precioModificado, precioOriginal });
      }
    }

    // Registrar en hoja Ventas — una fila por producto con número de ticket
    try {
      const sheetVentas = ss.getSheetByName('Ventas');
      if (sheetVentas) {
        const hora = Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'HH:mm');

        // Buscar el mayor número de ticket en columna A
        const filasTotales = sheetVentas.getLastRow();
        let ultimoTicket = 0;
        if (filasTotales > 1) {
          const colA = sheetVentas.getRange(2, 1, filasTotales - 1, 1).getValues();
          for (const fila of colA) {
            const num = parseInt(fila[0]);
            if (!isNaN(num) && num > ultimoTicket) ultimoTicket = num;
          }
        }
        const nroTicket = ultimoTicket + 1;
        const ticketStr = String(nroTicket).padStart(4, '0'); // 0001, 0002...

        // Una fila por producto — escribir de a una para forzar texto en columna A
        for (const p of procesados) {
          const filaActual = sheetVentas.getLastRow() + 1;
          // Primero formatear la celda A como texto ANTES de escribir el valor
          const celdaTicket = sheetVentas.getRange(filaActual, 1);
          celdaTicket.setNumberFormat('@STRING@');
          celdaTicket.setValue(ticketStr);
          // Resto de la fila
          // Para peso: subtotal = precio ya calculado, mostrar gramos como cantidad
          // Para normal: subtotal = precio × qty
          const subtotal = p.esPeso ? p.precio : p.precio * p.qty;
          const cantDisplay = p.esPeso ? p.qty + 'gr' : p.qty;
          const nombreDisplay = p.precioModificado
            ? p.name + (p.precioOriginal ? ' [PRECIO ESP: $' + p.precioOriginal + '→$' + p.precio + ']' : ' [PRECIO ESPECIAL]')
            : p.name;
          sheetVentas.getRange(filaActual, 2, 1, 6).setValues([[
            fecha, hora, nombreDisplay, cantDisplay, p.precio, subtotal
          ]]);
        }

        // Fila total del ticket — columna A vacía para diferenciarlo
        // Para peso contar como 1 unidad, no como gramos
        const totalUnidades = procesados.reduce((s, p) => s + (p.esPeso ? 1 : p.qty), 0);
        const metodoPagoEmoji = metodoPago === 'posnet' ? '💳' : metodoPago === 'transferencia' ? '📱' : '💵';
        sheetVentas.appendRow([
          '',
          fecha,
          hora,
          `─── TOTAL TICKET N° ${ticketStr} ───`,
          totalUnidades,
          metodoPagoEmoji + ' ' + metodoPago.toUpperCase(),
          vendedor,
          totalVenta
        ]);
      }
    } catch (e) {
      console.warn('No se pudo registrar en hoja Ventas:', e);
    }

    return respuestaJSON({
      success: true,
      procesados: procesados.length,
      total: totalVenta,
      errores: errores,
      fecha: fecha.toISOString()
    });

  } catch (error) {
    console.error('❌ Error procesarVenta:', error);
    return respuestaJSON({ success: false, mensaje: error.toString() });
  }
}

// ========== AGREGAR PRODUCTO NUEVO ==========
function agregarProducto(dataStr) {
  try {
    const datos = JSON.parse(decodeURIComponent(dataStr));

    if (!datos.name || !datos.name.trim()) {
      return respuestaJSON({ success: false, mensaje: 'El nombre es obligatorio' });
    }
    if (!datos.price || parseInt(datos.price) <= 0) {
      return respuestaJSON({ success: false, mensaje: 'El precio debe ser mayor a 0' });
    }

    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(HOJA_INVENTARIO);
    const datosActuales = sheet.getDataRange().getValues();

    // Verificar duplicado
    const nombreNuevo = datos.name.trim().toUpperCase().replace(/\s+/g, ' ');
    for (let i = 1; i < datosActuales.length; i++) {
      const nombreExistente = String(datosActuales[i][0] || '').trim().toUpperCase().replace(/\s+/g, ' ');
      if (nombreExistente === nombreNuevo) {
        return respuestaJSON({
          success: false,
          mensaje: `Ya existe: "${datosActuales[i][0]}" en fila ${i + 1}`
        });
      }
    }

    const totalFilas = datosActuales.length;
    const idDesc = 'ID' + String(totalFilas).padStart(3, '0');

    // Columnas A hasta P (16 columnas)
    const nuevaFila = [
      datos.name.trim().toUpperCase(),                          // A: Nombre
      parseInt(datos.price) || 0,                               // B: Precio venta
      String(datos.category || 'ALMACEN').trim().toUpperCase(), // C: Categoría
      idDesc,                                                    // D: Descripción/ID
      String(datos.proveedor || '').trim().toUpperCase(),       // E: Proveedor
      parseInt(datos.stock) || 0,                               // F: Stock
      0, 0, 0, 0, 0, 0, 0, 0, 0,                              // G a O: ofertas en 0
      datos.vencimiento || ''                                   // P: Vencimiento
    ];

    sheet.appendRow(nuevaFila);
    console.log(`✅ Producto agregado: ${datos.name} - Fila ${totalFilas + 1}`);

    // --- Registro en HISTORIAL (mismo formato que ingreso de mercadería) ---
    // Activa las fórmulas de Costo, Vencimiento, ESTADO y diaCritico en INVENTARIO
    // que dependen de que el producto exista en HISTORIAL.
    try {
      const hojaHistorial = ss.getSheetByName(HOJA_HISTORIAL);
      if (hojaHistorial) {
        const ahora        = new Date();
        const nombreProd   = datos.name.trim().toUpperCase();
        const stockInicial = parseInt(datos.stock) || 0;
        const costoVal     = parseInt(datos.precioCosto) || 0;
        const proveedorVal = String(datos.proveedor || '').trim().toUpperCase();
        const precioVenta  = parseInt(datos.price) || 0;
        const vencVal      = datos.vencimiento ? new Date(datos.vencimiento) : '';

        // Columnas en orden exacto del Historial:
        // A: FECHA/HORA | B: PRODUCTO | C: add | D: N. Stock
        // E: tipo mov.  | F: PROVEEDOR | G: Costo | H: Venta | I: vencimiento
        hojaHistorial.appendRow([
          ahora,          // A - FECHA/HORA
          nombreProd,     // B - PRODUCTO
          stockInicial,   // C - add (cantidad inicial)
          stockInicial,   // D - N. Stock (igual, es producto nuevo)
          'ALTA',         // E - tipo de movimiento
          proveedorVal,   // F - PROVEEDOR
          costoVal,       // G - Costo
          precioVenta,    // H - Venta
          vencVal         // I - vencimiento
        ]);
      }
    } catch(eHist) {
      // No interrumpir el flujo principal si falla el Historial
      console.warn('⚠️ No se pudo escribir en Historial:', eHist.toString());
    }

    return respuestaJSON({
      success: true,
      mensaje: `✅ "${datos.name.trim()}" agregado correctamente`,
      fila: totalFilas + 1,
      id: totalFilas
    });

  } catch (error) {
    console.error('❌ Error agregarProducto:', error);
    return respuestaJSON({ success: false, mensaje: error.toString() });
  }
}

// ========== HELPER ==========
function respuestaJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========== FUNCIÓN DE PRUEBA ==========
function pruebaRapida() {
  const resultado = doGet(null);
  const json = JSON.parse(resultado.getContent());
  console.log('Versión API:', json.version);
  console.log('Total productos:', json.total);
  return json;
}

// ========== REPORTES COMPLETOS ==========
function getReportes() {
  try {
    // Cada sección está aislada — si falla una parte, devuelve lo que pudo
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetVentas = ss.getSheetByName('Ventas');
    const sheetInv    = ss.getSheetByName(HOJA_INVENTARIO);
    if (!sheetVentas) return { error: 'No existe hoja Ventas' };

    const tz = Session.getScriptTimeZone();
    const filas = sheetVentas.getDataRange().getValues();
    const hoy = new Date();

    // Costos: fuente primaria = Inventario col S (índice 18) — fórmula que trae último costo de Historial
    // Fallback = Historial col G (índice 6) directo
    const costos = {};
    const sheetHist2 = ss.getSheetByName(HOJA_HISTORIAL);
    const stockInfo = {};

    // 1. Inventario col S = costo calculado por fórmula (más confiable, ya trae el último)
    if (sheetInv) {
      const inv = sheetInv.getDataRange().getValues();
      for (let i = 1; i < inv.length; i++) {
        const nom = String(inv[i][0]||'').trim().toUpperCase();
        const sto = parseInt(inv[i][5]) || 0;
        const cos = parseFloat(inv[i][18]) || 0; // Col S = índice 18
        if (nom) {
          stockInfo[nom] = sto;
          if (cos > 0) costos[nom] = cos;
        }
      }
    }

    // 2. Fallback: Historial col G (índice 6) para productos sin costo en Inventario
    if (sheetHist2) {
      const hist = sheetHist2.getDataRange().getValues();
      for (let i = 1; i < hist.length; i++) {
        const nom = String(hist[i][1]||'').trim().toUpperCase(); // col B
        const cos = parseFloat(hist[i][6]) || 0;                 // col G
        if (nom && cos > 0 && !costos[nom]) costos[nom] = cos;   // solo si no tiene de inventario
      }
    }

    // Vencimientos próximos (30 días)
    const vencProximos = [];
    if (sheetInv) {
      const inv = sheetInv.getDataRange().getValues();
      const limite = new Date(); limite.setDate(limite.getDate() + 30);
      for (let i = 1; i < inv.length; i++) {
        const nom = String(inv[i][0]||'').trim();
        const stock = parseInt(inv[i][5])||0;
        const venc = inv[i].length > 15 ? inv[i][15] : '';
        if (!venc || !nom) continue;
        let fechaVenc;
        try { fechaVenc = venc instanceof Date ? venc : new Date(venc); } catch(e) { continue; }
        if (isNaN(fechaVenc.getTime())) continue;
        const dias = Math.round((fechaVenc - hoy) / 86400000);
        if (dias <= 30) {
          vencProximos.push({ nombre: nom, stock, fecha: Utilities.formatDate(fechaVenc, tz, 'yyyy-MM-dd'), dias, vencido: dias < 0 });
        }
      }
      vencProximos.sort((a,b) => a.dias - b.dias);
    }

    // Parsear hoja Ventas
    // Estructura item: A=ticket, B=fecha, C=hora, D=nombre, E=qty, F=precio, G=subtotal
    // Estructura total: A='', B=fecha, C=hora, D='─── TOTAL TICKET N° XXXX ───', E=units, F=metodo, G=vendedor, H=total
    const items = [];
    const totales = [];

    for (let i = 1; i < filas.length; i++) {
      const f = filas[i];
      const colA  = String(f[0]||'').trim();
      const fecha = f[1];
      if (!fecha || !(fecha instanceof Date)) continue;
      const fechaStr = Utilities.formatDate(fecha, tz, 'yyyy-MM-dd');
      // Columna C puede ser string 'HH:mm' o Date (si Sheets formatea como hora)
      const rawHora = f[2];
      let hora = '';
      if (rawHora instanceof Date) {
        hora = Utilities.formatDate(rawHora, tz, 'HH:mm');
      } else {
        hora = String(rawHora||'').trim();
        // Si viene como "Sat Dec 30 1899..." extraer HH:mm
        const hm = hora.match(/\b(\d{1,2}):(\d{2}):/);
        if (hm) hora = hm[1].padStart(2,'0') + ':' + hm[2];
      }
      const nombre   = String(f[3]||'').trim();

      if (nombre.includes('TOTAL TICKET')) {
        // Fila total — extraer ticket del nombre
        const ticketMatch = nombre.match(/N[°ºo]?\s*(\d+)/i);
        const ticket = ticketMatch ? String(ticketMatch[1]).padStart(4,'0') : colA;
        const metodo   = String(f[5]||'').replace(/[💵📱💳🔀🏦]/g,'').trim().toUpperCase();
        const vendedor = String(f[6]||'').trim();
        const total    = parseFloat(f[7]) || 0;
        totales.push({ fechaStr, hora, ticket, metodo, vendedor, total });
      } else if (nombre && !nombre.startsWith('─')) {
        // Fila item
        const ticket   = colA;
        const qtyRaw   = f[4];
        const qty      = parseFloat(String(qtyRaw).replace('gr','')) || 0;
        const precio   = parseFloat(f[5]) || 0;
        const subtotal = parseFloat(f[6]) || 0;
        const nomLimpio = nombre.replace(/\[PRECIO ESP[^]]*\]/,'').trim().toUpperCase();
        const costo    = costos[nomLimpio] || 0;
        const tieneCosto = costo > 0;
        // Ganancia real: subtotal - (costo × qty). Solo si tenemos costo confiable.
        const gananciaReal = tieneCosto ? subtotal - (costo * qty) : null;
        // Ganancia aprox: 40% del subtotal (asume margen mínimo de almacén ~40% sobre venta)
        // Se usa SOLO para productos sin costo en historial — siempre positiva, nunca explota
        const gananciaAprox = subtotal * 0.4;
        items.push({ fechaStr, hora, ticket, nombre: nomLimpio, qty, precio, subtotal, costo, gananciaReal, gananciaAprox, tieneCosto });
      }
    }

    return { items, totales, vencProximos, stockInfo };

  } catch(e) {
    return { error: e.toString() };
  }
}

// ========== MERCADO PAGO — CREAR ORDEN QR DINÁMICO ==========
function crearOrdenMP(monto) {
  try {
    const payload = {
      items: [{
        title: 'Compra Almacén Copihue',
        quantity: 1,
        unit_price: parseFloat(monto),
        currency_id: 'ARS'
      }],
      payment_methods: {
        excluded_payment_types: [],
        installments: 1
      },
      statement_descriptor: 'ALMACEN COPIHUE',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min
    };

    const resp = UrlFetchApp.fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + MP_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const data = JSON.parse(resp.getContentText());
    if (data.init_point) {
      return { ok: true, url: data.init_point, id: data.id };
    } else {
      return { ok: false, error: JSON.stringify(data) };
    }
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}
