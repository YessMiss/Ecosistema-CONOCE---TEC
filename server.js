/**
 * =====================================================
 *  CONOCE - TEC V72  —  Servidor Node.js
 * =====================================================
 *
 *  Coloca este archivo en la RAÍZ del proyecto:
 *
 *  CONOCE - TEC V72/
 *  ├── server.js          ← ESTE ARCHIVO
 *  ├── package.json       ← también nuevo
 *  ├── index.html
 *  ├── css/
 *  ├── js/
 *  ├── img/
 *  ├── pages/
 *  │   └── mapa-campus.html
 *  └── map/
 *      ├── images/        (ya existente)
 *      ├── css/           ← carpeta nueva
 *      │   ├── waze_reports.css
 *      │   ├── waze_dark_mode.css
 *      │   └── styles_mejoras.css
 *      ├── js/            ← carpeta nueva
 *      │   ├── waze_reports.js
 *      │   └── service-worker.js
 *      └── data/
 *          ├── pois.geojson
 *          ├── campus_routes.geojson
 *          └── reports.json   ← se crea automáticamente
 *
 *  PRIMERA VEZ:  npm install
 *  CADA VEZ:     npm start
 *  ABRIR EN:     http://localhost:3000
 * =====================================================
 */

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

const ROOT         = __dirname;
const REPORTS_FILE = path.join(ROOT, 'map', 'data', 'reports.json');

// ─────────────────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────────────────
app.use(express.json());

// Sirve todos los archivos del proyecto como estáticos
app.use(express.static(ROOT));

// ─────────────────────────────────────────────────────
//  Inicializar reports.json automáticamente
// ─────────────────────────────────────────────────────
const dataDir = path.join(ROOT, 'map', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('  📁 Carpeta map/data/ creada');
}
if (!fs.existsSync(REPORTS_FILE)) {
  fs.writeFileSync(REPORTS_FILE, '[]', 'utf-8');
  console.log('  📄 Archivo map/data/reports.json creado');
}

// ─────────────────────────────────────────────────────
//  API — Sistema de Reportes del mapa (estilo Waze)
// ─────────────────────────────────────────────────────

/**
 * GET /api/reports
 * Devuelve todos los reportes guardados (peligros, cierres, eventos, policía)
 */
app.get('/api/reports', (req, res) => {
  fs.readFile(REPORTS_FILE, 'utf-8', (err, data) => {
    if (err) {
      console.error('[API] Error al leer reportes:', err.message);
      return res.status(500).json({ error: 'Error al cargar reportes' });
    }
    try {
      res.json(JSON.parse(data));
    } catch {
      res.json([]);
    }
  });
});

/**
 * POST /api/report
 * Guarda un nuevo reporte enviado desde el mapa
 * Body: { type: "hazard"|"police"|"closure"|"event", location: [lng, lat] }
 */
app.post('/api/report', (req, res) => {
  const reporte = req.body;

  if (!reporte || !reporte.type || !reporte.location) {
    return res.status(400).json({ error: 'Faltan campos requeridos: type y location' });
  }

  if (!reporte.timestamp) {
    reporte.timestamp = new Date().toISOString();
  }

  fs.readFile(REPORTS_FILE, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error al leer reportes' });

    let lista = [];
    try { lista = JSON.parse(data); } catch { lista = []; }

    lista.push(reporte);

    fs.writeFile(REPORTS_FILE, JSON.stringify(lista, null, 2), 'utf-8', (err) => {
      if (err) return res.status(500).json({ error: 'Error al guardar reporte' });
      console.log(`  📌 Reporte guardado: ${reporte.type} en [${Array.isArray(reporte.location) ? reporte.location.join(', ') : reporte.location}]`);
      res.status(201).json({ ok: true, total: lista.length });
    });
  });
});

/**
 * DELETE /api/reports
 * Limpia todos los reportes (para pruebas o mantenimiento)
 */
app.delete('/api/reports', (req, res) => {
  fs.writeFile(REPORTS_FILE, '[]', 'utf-8', (err) => {
    if (err) return res.status(500).json({ error: 'No se pudo limpiar' });
    console.log('  🗑️  Todos los reportes eliminados');
    res.json({ ok: true });
  });
});

// ─────────────────────────────────────────────────────
//  Ruta raíz → index.html
// ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

// ─────────────────────────────────────────────────────
//  Iniciar servidor
// ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║      CONOCE - TEC V72  ✅  Listo         ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║   Abre:  http://localhost:${PORT}             ║`);
  console.log('║                                          ║');
  console.log('║   API de reportes:                       ║');
  console.log(`║   GET  http://localhost:${PORT}/api/reports   ║`);
  console.log(`║   POST http://localhost:${PORT}/api/report    ║`);
  console.log('║                                          ║');
  console.log('║   Ctrl + C  para detener                 ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
