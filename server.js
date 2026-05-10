/**
 * =====================================================
 *  CONOCE - TEC V72  —  Servidor Node.js
 *  Funciona tanto en LOCAL como en VERCEL
 * =====================================================
 *
 *  LOCAL:   npm start  → abre el navegador automáticamente
 *  VERCEL:  se despliega automáticamente desde GitHub
 *
 *  NOTA: En Vercel los reportes del mapa se guardan en
 *  memoria (se reinician si el servidor se reinicia).
 *  En local se guardan en map/data/reports.json.
 * =====================================================
 */

const express    = require('express');
const path       = require('path');
const fs         = require('fs');
const { exec }   = require('child_process');

const app  = express();
const PORT = process.env.PORT || 3000;

const IS_VERCEL    = !!process.env.VERCEL;
const ROOT         = __dirname;
const REPORTS_FILE = path.join(ROOT, 'map', 'data', 'reports.json');

// Reportes en memoria (respaldo para Vercel)
let reportsMemory = [];

// ─────────────────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(ROOT));

// ─────────────────────────────────────────────────────
//  Inicializar reports.json (solo en local)
// ─────────────────────────────────────────────────────
if (!IS_VERCEL) {
  const dataDir = path.join(ROOT, 'map', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(REPORTS_FILE)) {
    fs.writeFileSync(REPORTS_FILE, '[]', 'utf-8');
  }
  try { reportsMemory = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8')); } catch { reportsMemory = []; }
}

// ─────────────────────────────────────────────────────
//  API — Sistema de Reportes
// ─────────────────────────────────────────────────────

app.get('/api/reports', (req, res) => {
  if (IS_VERCEL) return res.json(reportsMemory);
  fs.readFile(REPORTS_FILE, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error al cargar reportes' });
    try { res.json(JSON.parse(data)); } catch { res.json([]); }
  });
});

app.post('/api/report', (req, res) => {
  const reporte = req.body;
  if (!reporte || !reporte.type || !reporte.location)
    return res.status(400).json({ error: 'Faltan campos: type y location' });
  if (!reporte.timestamp) reporte.timestamp = new Date().toISOString();

  if (IS_VERCEL) {
    reportsMemory.push(reporte);
    return res.status(201).json({ ok: true, total: reportsMemory.length });
  }

  fs.readFile(REPORTS_FILE, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error al leer reportes' });
    let lista = [];
    try { lista = JSON.parse(data); } catch { lista = []; }
    lista.push(reporte);
    fs.writeFile(REPORTS_FILE, JSON.stringify(lista, null, 2), 'utf-8', (err) => {
      if (err) return res.status(500).json({ error: 'Error al guardar reporte' });
      reportsMemory = lista;
      res.status(201).json({ ok: true, total: lista.length });
    });
  });
});

app.delete('/api/reports', (req, res) => {
  reportsMemory = [];
  if (!IS_VERCEL) {
    fs.writeFile(REPORTS_FILE, '[]', 'utf-8', (err) => {
      if (err) return res.status(500).json({ error: 'No se pudo limpiar' });
      res.json({ ok: true });
    });
  } else {
    res.json({ ok: true });
  }
});

// ─────────────────────────────────────────────────────
//  Ruta raíz
// ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

// ─────────────────────────────────────────────────────
//  Iniciar servidor (local) o exportar (Vercel)
// ─────────────────────────────────────────────────────
if (!IS_VERCEL) {
  app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║      CONOCE - TEC V72  ✅  Listo         ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║   http://localhost:${PORT}                    ║`);
    console.log('║   Ctrl + C  para detener                 ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    const cmd = process.platform === 'win32'  ? `start ${url}`
              : process.platform === 'darwin' ? `open ${url}`
              : `xdg-open ${url}`;
    exec(cmd, (err) => {
      if (err) console.log(`  → Abre manualmente: ${url}`);
    });
  });
}

// Necesario para que Vercel lo use como función serverless
module.exports = app;