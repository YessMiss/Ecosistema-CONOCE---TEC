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
const VISITS_FILE  = path.join(ROOT, 'data', 'visits.json');
const USERS_FILE   = path.join(ROOT, 'data', 'users.json');
const CAFETERIA_FILE = path.join(ROOT, 'data', 'cafeteria_visits.json');

// En memoria (respaldo para Vercel)
let reportsMemory = [];
let visitsMemory  = { total: 0, hoy: 0, fecha: '' };
let usersMemory   = { alumnos: [], admins: [], visitantes: 0 };
let cafeteriaMemory = { total: 0, hoy: 0, fecha: '' };

// ─────────────────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(ROOT, {
  setHeaders: function(res, filePath) {
    if (filePath.endsWith('.ico'))     res.setHeader('Content-Type', 'image/x-icon');
    if (filePath.endsWith('.geojson')) res.setHeader('Content-Type', 'application/json');
  }
}));

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

  // Inicializar visits.json
  const dataDir2 = path.join(ROOT, 'data');
  if (!fs.existsSync(dataDir2)) fs.mkdirSync(dataDir2, { recursive: true });
  if (!fs.existsSync(VISITS_FILE)) fs.writeFileSync(VISITS_FILE, JSON.stringify(visitsMemory), 'utf-8');
  try { visitsMemory = JSON.parse(fs.readFileSync(VISITS_FILE, 'utf-8')); } catch { visitsMemory = { total: 0, hoy: 0, fecha: '' }; }

  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify(usersMemory, null, 2), 'utf-8');
  try { usersMemory = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); } catch { usersMemory = { alumnos: [], admins: [], visitantes: 0 }; }

  if (!fs.existsSync(CAFETERIA_FILE)) fs.writeFileSync(CAFETERIA_FILE, JSON.stringify(cafeteriaMemory), 'utf-8');
  try { cafeteriaMemory = JSON.parse(fs.readFileSync(CAFETERIA_FILE, 'utf-8')); } catch { cafeteriaMemory = { total: 0, hoy: 0, fecha: '' }; }
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
//  API — Usuarios (alumnos, admins, visitantes)
// ─────────────────────────────────────────────────────

function leerUsuarios(cb) {
  if (IS_VERCEL) return cb(null, usersMemory);
  fs.readFile(USERS_FILE, 'utf-8', (err, data) => {
    try { cb(null, JSON.parse(data)); } catch { cb(null, { alumnos:[], admins:[], visitantes:0 }); }
  });
}
function guardarUsuarios(u, cb) {
  usersMemory = u;
  if (IS_VERCEL) return cb && cb();
  fs.writeFile(USERS_FILE, JSON.stringify(u, null, 2), 'utf-8', () => cb && cb());
}

// GET /api/users → obtener todos los usuarios
app.get('/api/users', (req, res) => {
  leerUsuarios((err, u) => res.json(u));
});

// POST /api/users/alumno → registrar alumno
app.post('/api/users/alumno', (req, res) => {
  const alumno = req.body;
  if (!alumno || !alumno.nombre || !alumno.correo)
    return res.status(400).json({ error: 'Faltan datos del alumno' });
  alumno.fecha = new Date().toISOString();
  leerUsuarios((err, u) => {
    // Verificar si ya existe
    if (u.alumnos.find(a => a.correo === alumno.correo))
      return res.status(409).json({ error: 'Correo ya registrado' });
    u.alumnos.push(alumno);
    guardarUsuarios(u, () => res.status(201).json({ ok: true }));
  });
});

// POST /api/users/admin → registrar admin
app.post('/api/users/admin', (req, res) => {
  const admin = req.body;
  if (!admin || !admin.nombre) return res.status(400).json({ error: 'Faltan datos' });
  admin.fecha = new Date().toISOString();
  leerUsuarios((err, u) => {
    u.admins.push(admin);
    guardarUsuarios(u, () => res.status(201).json({ ok: true }));
  });
});

// POST /api/users/visitante → contar visita de visitante
app.post('/api/users/visitante', (req, res) => {
  leerUsuarios((err, u) => {
    u.visitantes = (u.visitantes || 0) + 1;
    guardarUsuarios(u, () => res.json({ total: u.visitantes }));
  });
});

// DELETE /api/users/:tipo/:correo → eliminar usuario
app.delete('/api/users/:tipo/:correo', (req, res) => {
  const { tipo, correo } = req.params;
  leerUsuarios((err, u) => {
    if (tipo === 'alumno') u.alumnos = u.alumnos.filter(a => a.correo !== correo);
    if (tipo === 'admin')  u.admins  = u.admins.filter(a => a.correo !== correo);
    guardarUsuarios(u, () => res.json({ ok: true }));
  });
});

// ─────────────────────────────────────────────────────
//  API — Visitas a la sección Cafetería
// ─────────────────────────────────────────────────────

app.get('/api/cafeteria/visits', (req, res) => {
  if (IS_VERCEL) return res.json(cafeteriaMemory);
  fs.readFile(CAFETERIA_FILE, 'utf-8', (err, data) => {
    try { res.json(JSON.parse(data)); } catch { res.json({ total: 0, hoy: 0, fecha: '' }); }
  });
});

app.post('/api/cafeteria/visit', (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);
  if (IS_VERCEL) {
    if (cafeteriaMemory.fecha !== hoy) { cafeteriaMemory.hoy = 0; cafeteriaMemory.fecha = hoy; }
    cafeteriaMemory.total += 1;
    cafeteriaMemory.hoy   += 1;
    return res.json(cafeteriaMemory);
  }
  fs.readFile(CAFETERIA_FILE, 'utf-8', (err, data) => {
    let v = { total: 0, hoy: 0, fecha: '' };
    try { v = JSON.parse(data); } catch {}
    if (v.fecha !== hoy) { v.hoy = 0; v.fecha = hoy; }
    v.total += 1; v.hoy += 1;
    cafeteriaMemory = v;
    fs.writeFile(CAFETERIA_FILE, JSON.stringify(v, null, 2), 'utf-8', () => res.json(v));
  });
});

// ─────────────────────────────────────────────────────
//  API — Contador de visitas global
// ─────────────────────────────────────────────────────

function getHoy() { return new Date().toISOString().slice(0,10); }

function leerVisitas(cb) {
  if (IS_VERCEL) return cb(null, visitsMemory);
  fs.readFile(VISITS_FILE, 'utf-8', (err, data) => {
    if (err) return cb(null, { total: 0, hoy: 0, fecha: '' });
    try { cb(null, JSON.parse(data)); } catch { cb(null, { total: 0, hoy: 0, fecha: '' }); }
  });
}

function guardarVisitas(v, cb) {
  visitsMemory = v;
  if (IS_VERCEL) return cb && cb();
  fs.writeFile(VISITS_FILE, JSON.stringify(v, null, 2), 'utf-8', () => cb && cb());
}

// GET /api/visits → obtener contadores actuales
app.get('/api/visits', (req, res) => {
  leerVisitas((err, v) => {
    const hoy = getHoy();
    if (v.fecha !== hoy) { v.hoy = 0; v.fecha = hoy; guardarVisitas(v); }
    res.json(v);
  });
});

// POST /api/visits → registrar una visita nueva
app.post('/api/visits', (req, res) => {
  leerVisitas((err, v) => {
    const hoy = getHoy();
    if (v.fecha !== hoy) { v.hoy = 0; v.fecha = hoy; }
    v.total += 1;
    v.hoy   += 1;
    guardarVisitas(v, () => res.json(v));
  });
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