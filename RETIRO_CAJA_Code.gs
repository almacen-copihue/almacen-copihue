// ============================================================
//  RETIRO DE CAJA — Cambios a agregar en Code.gs
//  Instrucciones:
//   1. En el switch/doGet existente, agregar el case debajo
//   2. Pegar la función registrarMovimientoCaja al final del archivo
// ============================================================

// ── PASO 1: Agregar este case en el switch del doGet ──────────
//   (pegarlo junto a los otros cases existentes)

//  case 'registrarMovimientoCaja':
//    return registrarMovimientoCaja(params.data);

// ── PASO 2: Pegar esta función al final de Code.gs ────────────

function registrarMovimientoCaja(dataStr) {
  try {
    var data = JSON.parse(dataStr);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = ss.getSheetByName('CAJA_MOVIMIENTOS');
    if (!hoja) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Hoja CAJA_MOVIMIENTOS no encontrada' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    hoja.appendRow([
      data.fecha       || '',
      data.hora        || '',
      data.tipo        || 'EGRESO',
      data.motivo      || '',
      data.monto       || 0,
      data.medio       || 'EFECTIVO',
      data.categoria   || '',
      data.observacion || '',
      data.vendedor    || 'Victor'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(e) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
