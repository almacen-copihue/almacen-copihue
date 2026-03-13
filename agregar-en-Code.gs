// ═══════════════════════════════════════════════════════════════
// REEMPLAZA tu función buscarFotos_ anterior por esta versión
// que descarga las imágenes y las devuelve en base64.
// Así el frontend no tiene problema de CORS al cargarlas en canvas.
// ═══════════════════════════════════════════════════════════════

function buscarFotos_(e) {
  try {
    const q = (e.parameter.q || '').trim();
    if (!q) return json_({ ok: false, fotos: [], error: 'Falta query' });

    const apiKey = PropertiesService.getScriptProperties().getProperty('GOOGLE_API_KEY');
    const cseId  = PropertiesService.getScriptProperties().getProperty('GOOGLE_CSE_ID');

    if (!apiKey || !cseId) {
      return json_({ ok: false, fotos: [], error: 'Faltan GOOGLE_API_KEY o GOOGLE_CSE_ID en Script Properties' });
    }

    // 1. Buscar en Google Custom Search Images
    const endpoint =
      'https://www.googleapis.com/customsearch/v1' +
      '?key='             + encodeURIComponent(apiKey) +
      '&cx='              + encodeURIComponent(cseId) +
      '&q='               + encodeURIComponent(q) +
      '&searchType=image' +
      '&num=10' +
      '&safe=active' +
      '&gl=ar' +
      '&cr=countryAR' +
      '&hl=es';

    const searchResp = UrlFetchApp.fetch(endpoint, { muteHttpExceptions: true });
    if (searchResp.getResponseCode() !== 200) {
      return json_({ ok: false, fotos: [], error: 'Google API respondió ' + searchResp.getResponseCode() });
    }

    const searchData = JSON.parse(searchResp.getContentText());
    const items = Array.isArray(searchData.items) ? searchData.items : [];

    if (!items.length) {
      return json_({ ok: true, fotos: [], urls: [] });
    }

    // 2. Filtrar URLs candidatas
    const candidatas = items
      .map(function(it) { return it.link; })
      .filter(Boolean)
      .filter(function(u) { return /^https?:\/\//i.test(u); })
      .filter(function(u) { return !/logo|icon|favicon/i.test(u); })
      .slice(0, 8);

    // 3. Descargar cada imagen y convertir a base64
    const fotos = [];
    candidatas.forEach(function(url) {
      try {
        const imgResp = UrlFetchApp.fetch(url, {
          muteHttpExceptions: true,
          followRedirects: true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
          }
        });

        if (imgResp.getResponseCode() !== 200) return;

        const headers     = imgResp.getHeaders();
        const contentType = headers['Content-Type'] || headers['content-type'] || '';
        if (!contentType.startsWith('image/')) return;

        const bytes = imgResp.getBlob().getBytes();
        if (bytes.length < 2000) return; // descartar iconos tiny

        fotos.push({
          b64:          Utilities.base64Encode(bytes),
          mime:         contentType.split(';')[0].trim(),
          url_original: url
        });

      } catch(err) { /* silenciar errores individuales */ }
    });

    if (fotos.length) {
      return json_({ ok: true, fotos: fotos });
    } else {
      // fallback: devolver URLs crudas si no se pudo descargar ninguna
      return json_({ ok: true, fotos: [], urls: candidatas });
    }

  } catch (err) {
    return json_({ ok: false, fotos: [], error: String(err) });
  }
}

// ── json_ helper ─────────────────────────────────────────────
// Si ya tenés esta función en tu Code.gs, no la dupliques.
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════
// SCRIPT PROPERTIES (Project Settings → Script Properties)
//
//   GOOGLE_API_KEY  →  console.cloud.google.com
//                      Habilitar "Custom Search API" → crear API Key
//
//   GOOGLE_CSE_ID   →  programmablesearchengine.google.com
//                      Crear motor de búsqueda → copiar Search Engine ID
//
// TEST rápido — abrí esto en el browser:
//   https://script.google.com/.../exec?action=buscarFotos&q=coca+cola
//   Tenés que ver: { "ok": true, "fotos": [ {...}, {...} ] }
// ═══════════════════════════════════════════════════════════════
