// ============================================================
//  MOTOR DE INVENTARIO — Almacén Copihue
//  Función principal: actualizarMotorInventario()
//  Escribe columnas V..AH en hoja "inventario"
//  usando datos reales de hoja "Ventas"
//
//  ⚠️ NO hay onOpen() aquí — está en Code.gs (único del proyecto)
//  ⚠️ NO hay actualizarTodo() aquí — está en Code.gs
// ============================================================

// Helper: alert solo si hay UI (falla silencioso en triggers automáticos)
function _uiAlert_(msg) {
  try { SpreadsheetApp.getUi().alert(msg); } catch(e) { Logger.log(msg); }
}

/**
 * COLUMNAS QUE ESCRIBE:
 *  V  (22) Ventas7d
 *  W  (23) Ventas30d
 *  X  (24) PromDia
 *  Y  (25) DiasStock
 *  Z  (26) DiasRepo
 *  N  (14) stock_min_popup
 *  AA (27) StockObjetivo
 *  AB (28) CompraSugerida
 *  AC (29) DiasParaVencer
 *  AD (30) DiasParaLiquidar
 *  AE (31) RiesgoVencimiento
 *  AF (32) PrioridadEmpuje
 *  AG (33) StockPisoManual  ← NO SE TOCA si ya tiene valor
 *  AH (34) AlertaPisoManual
 */

function actualizarMotorInventario() {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var shInv  = ss.getSheetByName('inventario');
  var shVent = ss.getSheetByName('Ventas');

  if (!shInv || !shVent) {
    _uiAlert_('❌ No se encontró la hoja "inventario" o "Ventas".');
    return;
  }

  // ── 1. Encabezado AH si no existe ──────────────────────────
  var headerAH = shInv.getRange(1, 34).getValue();
  if (!headerAH || headerAH === '') {
    shInv.getRange(1, 34).setValue('AlertaPisoManual');
  }

  // ── 2. Leer hoja Ventas completa de una vez ─────────────────
  var ventasData = shVent.getDataRange().getValues();
  var hoy        = new Date();
  hoy.setHours(0, 0, 0, 0);
  var hace7  = new Date(hoy); hace7.setDate(hoy.getDate() - 7);
  var hace30 = new Date(hoy); hace30.setDate(hoy.getDate() - 30);

  // Mapa { nombreProducto: { v7: N, v30: N } }
  var ventasMap = {};
  for (var r = 1; r < ventasData.length; r++) {
    var prod  = ventasData[r][3];
    var fecha = ventasData[r][1];
    var cant  = ventasData[r][4];

    if (!prod || typeof prod !== 'string') continue;
    if (prod.indexOf('─── TOTAL') !== -1) continue;
    if (!cant || isNaN(cant) || cant <= 0) continue;
    if (!(fecha instanceof Date)) continue;

    var fNorm = new Date(fecha); fNorm.setHours(0, 0, 0, 0);

    if (!ventasMap[prod]) ventasMap[prod] = { v7: 0, v30: 0 };
    if (fNorm >= hace7)  ventasMap[prod].v7  += cant;
    if (fNorm >= hace30) ventasMap[prod].v30 += cant;
  }

  // ── 3. Leer inventario de una vez ───────────────────────────
  var invData = shInv.getDataRange().getValues();
  var numRows = invData.length - 1;

  var outVtoAH = [];
  var outN     = [];

  var diasRepo      = { 5: 5,  4: 7,  3: 10, 2: 14, 1: 21 };
  var diasCobertura = { 5: 21, 4: 18, 3: 14, 2: 10, 1: 7  };
  var fallbackMin   = { 5: 5,  4: 4,  3: 5,  2: 3,  1: 2  };

  for (var i = 1; i <= numRows; i++) {
    var row            = invData[i];
    var nombre         = row[0];
    var stock          = parseFloat(row[5])  || 0;
    var rotacionManual = parseInt(row[14])   || 0;
    var venc           = row[15];
    var pisoManu       = row[32];

    // ── Ventas PRIMERO (deben declararse antes de usarse en rotación)
    var vm  = ventasMap[nombre] || { v7: 0, v30: 0 };
    var v7  = vm.v7;
    var v30 = vm.v30;

    // ── Rotación calculada desde ventas reales ────────────────
    var rotacion;
    if (v30 > 0 || v7 > 0) {
      if      (v30 > 60) rotacion = 5;
      else if (v30 > 30) rotacion = 4;
      else if (v30 > 15) rotacion = 3;
      else if (v30 > 5)  rotacion = 2;
      else               rotacion = 1;
    } else {
      rotacion = rotacionManual || 2;
    }

    // PromDia ponderado
    var promDia = ((v7 / 7) * 3 + (v30 / 30) * 2) / 5;
    promDia = Math.round(promDia * 1000) / 1000;

    var diasStock    = (promDia > 0) ? (stock / promDia) : '';
    var dRepo        = (rotacion >= 1 && rotacion <= 5) ? diasRepo[rotacion] : 14;
    var sinHistorial = (v7 === 0 && v30 === 0);

    // stock_min (N)
    var stockMin;
    if (promDia > 0) {
      stockMin = Math.ceil(promDia * dRepo);
    } else if (!sinHistorial) {
      stockMin = (rotacion >= 1 && rotacion <= 5) ? fallbackMin[rotacion] : 3;
    } else {
      stockMin = 0;
    }

    // StockObjetivo
    var cobDias  = (rotacion >= 1 && rotacion <= 5) ? diasCobertura[rotacion] : 14;
    var stockObj = promDia > 0 ? promDia * cobDias : 0;

    // CompraSugerida
    var compra;
    if (sinHistorial) {
      compra = 0;
    } else {
      var objCompra = Math.max(stockMin, stockObj);
      if (objCompra <= stock) {
        compra = 0;
      } else {
        var falta = objCompra - stock;
        compra = falta < 1 ? 1 : Math.ceil(falta);
      }
    }

    // DiasParaVencer
    var diasVencer = '';
    if (venc instanceof Date) {
      var vencNorm = new Date(venc); vencNorm.setHours(0, 0, 0, 0);
      diasVencer = Math.round((vencNorm - hoy) / 86400000);
    }

    var diasLiquidar = (promDia > 0) ? (stock / promDia) : '';

    var riesgo;
    if (diasVencer === '') {
      riesgo = 'OK';
    } else if (diasLiquidar !== '' && diasLiquidar > diasVencer) {
      riesgo = 'ALERTA';
    } else {
      riesgo = 'OK';
    }

    var prioridad;
    if (riesgo === 'ALERTA') {
      prioridad = 'EMPUJAR YA';
    } else if (stockObj > 0 && stock > stockObj * 1.5) {
      prioridad = 'EMPUJAR';
    } else if (stockObj > 0 && stock > stockObj) {
      prioridad = 'EMPUJAR SUAVE';
    } else {
      prioridad = 'NORMAL';
    }

    var alertaPiso = '';
    if (pisoManu !== null && pisoManu !== '' && !isNaN(pisoManu)) {
      alertaPiso = (stock <= pisoManu) ? 'PEDIR YA' : 'OK';
    }

    var pisoSalida = (pisoManu !== null && pisoManu !== '') ? pisoManu : '';

    outVtoAH.push([
      v7,           // V  col22
      v30,          // W  col23
      promDia,      // X  col24
      diasStock,    // Y  col25
      dRepo,        // Z  col26
      stockObj,     // AA col27
      compra,       // AB col28
      diasVencer,   // AC col29
      diasLiquidar, // AD col30
      riesgo,       // AE col31
      prioridad,    // AF col32
      pisoSalida,   // AG col33
      alertaPiso    // AH col34
    ]);

    outN.push([stockMin]);
  }

  // ── 4. Escribir en bloque ───────────────────────────────────
  if (outVtoAH.length > 0) {
    shInv.getRange(2, 22, outVtoAH.length, 13).setValues(outVtoAH);
    shInv.getRange(2, 14, outN.length, 1).setValues(outN);
  }

  SpreadsheetApp.flush();
  Logger.log('✅ Motor ejecutado: ' + numRows + ' productos actualizados.');

  var alertas = outVtoAH.filter(function(r){ return r[9]  === 'ALERTA';    }).length;
  var compras = outVtoAH.filter(function(r){ return r[6]  >   0;           }).length;
  var pisosYa = outVtoAH.filter(function(r){ return r[12] === 'PEDIR YA'; }).length;

  _uiAlert_(
    '✅ Motor actualizado\n\n' +
    '📦 Productos procesados: ' + numRows + '\n' +
    '🛒 Con compra sugerida: '  + compras + '\n' +
    '⚠️ Riesgo vencimiento: '   + alertas + '\n' +
    '🔔 Piso manual activo: '   + pisosYa
  );
}

// ============================================================
//  LISTA DE COMPRA AUTOMÁTICA
// ============================================================

function actualizarListaCompra() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var shInv   = ss.getSheetByName('inventario');
  var shLista = ss.getSheetByName('Lista de compra');

  if (!shInv || !shLista) {
    _uiAlert_('❌ No se encontró "inventario" o "Lista de compra".');
    return;
  }

  var inv   = shInv.getDataRange().getValues();
  var items = [];

  for (var i = 1; i < inv.length; i++) {
    var row        = inv[i];
    var nombre     = row[0];
    var precio     = row[1]  || 0;
    var proveedor  = row[4]  || '';
    var stock      = row[5]  || 0;
    var stockMin   = row[13] || 0;
    var compra     = row[27] || 0;
    var diasStock  = row[24];
    var prioridad  = row[31] || 'NORMAL';
    var riesgo     = row[30] || 'OK';
    var alertaPiso = row[33] || '';

    if (!nombre) continue;
    if (compra <= 0 && alertaPiso !== 'PEDIR YA') continue;

    var cantidad = compra > 0 ? compra : 1;

    var orden;
    if      (alertaPiso === 'PEDIR YA')                              orden = 0;
    else if (prioridad  === 'EMPUJAR YA')                            orden = 1;
    else if (riesgo     === 'ALERTA')                                orden = 2;
    else if (prioridad  === 'EMPUJAR')                               orden = 3;
    else if (prioridad  === 'EMPUJAR SUAVE')                         orden = 4;
    else if (typeof diasStock === 'number' && diasStock <= 3)        orden = 5;
    else if (typeof diasStock === 'number' && diasStock <= 7)        orden = 6;
    else                                                             orden = 7;

    items.push({
      nombre:    nombre,
      stock:     stock,
      minimo:    stockMin,
      cantidad:  cantidad,
      precio:    precio,
      total:     Math.round(precio * cantidad),
      proveedor: proveedor,
      orden:     orden,
      diasStock: (typeof diasStock === 'number') ? diasStock : 999
    });
  }

  items.sort(function(a, b) {
    if (a.orden !== b.orden) return a.orden - b.orden;
    return a.diasStock - b.diasStock;
  });

  var lastRow = shLista.getLastRow();
  if (lastRow > 1) shLista.getRange(2, 1, lastRow - 1, 7).clearContent();

  if (items.length === 0) {
    _uiAlert_('✅ No hay productos para comprar hoy.');
    return;
  }

  var out = items.map(function(it) {
    return [it.nombre, it.stock, it.minimo, it.cantidad, it.precio, it.total, it.proveedor];
  });

  shLista.getRange(2, 1, out.length, 7).setValues(out);

  var totalFila  = out.length + 2;
  var totalPesos = items.reduce(function(s, it){ return s + it.total; }, 0);
  shLista.getRange(totalFila, 1).setValue('── TOTAL ──');
  shLista.getRange(totalFila, 6).setValue(totalPesos);

  SpreadsheetApp.flush();

  _uiAlert_(
    '🛒 Lista de compra actualizada\n\n' +
    '📋 Productos a comprar: ' + items.length + '\n' +
    '💰 Total estimado: $' + totalPesos.toLocaleString('es-AR') + '\n\n' +
    '⚡ Urgentes (piso / vencimiento): ' +
    items.filter(function(it){ return it.orden <= 2; }).length
  );
}
