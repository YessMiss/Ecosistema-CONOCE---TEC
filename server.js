/**
 * =====================================================
 *  CONOCE - TEC V72  —  Servidor Node.js + Supabase
 *  Funciona tanto en LOCAL como en VERCEL
 * =====================================================
 *
 *  LOCAL:   npm start  → abre el navegador automáticamente
 *  VERCEL:  se despliega automáticamente desde GitHub
 *
 *  BASE DE DATOS: Supabase (PostgreSQL)
 *  Variables de entorno requeridas:
 *    SUPABASE_URL  → URL del proyecto en Supabase
 *    SUPABASE_KEY  → anon public key de Supabase
 *
 *  Tablas en Supabase:
 *    alumnos, admins, contactos, visitas,
 *    opiniones_cafeteria, perfiles,
 *    reportes_soporte, menus_cafeteria
 * =====================================================
 */

const express          = require('express');
const path             = require('path');
const fs               = require('fs');
const { exec }         = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 3000;

const IS_VERCEL = !!process.env.VERCEL;
const ROOT      = __dirname;

// ─────────────────────────────────────────────────────
//  Cliente Supabase
// ─────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const supabaseDisponible = !!(SUPABASE_URL && SUPABASE_KEY);
const supabase = supabaseDisponible
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Memoria de respaldo (solo si Supabase no está configurado)
let reportsMemory   = [];
let visitsMemory    = { total: 0, hoy: 0, fecha: '' };
let usersMemory     = { alumnos: [], admins: [], visitantes: 0 };
let cafeteriaMemory = { total: 0, hoy: 0, fecha: '' };
let contactsMemory  = [];

// Archivos locales (solo modo LOCAL sin Supabase)
const REPORTS_FILE   = path.join(ROOT, 'map', 'data', 'reports.json');
const VISITS_FILE    = path.join(ROOT, 'data', 'visits.json');
const USERS_FILE     = path.join(ROOT, 'data', 'users.json');
const CAFETERIA_FILE = path.join(ROOT, 'data', 'cafeteria_visits.json');
const CONTACTS_FILE  = path.join(ROOT, 'data', 'contacts.json');

// ─────────────────────────────────────────────────────
//  Inicializar archivos locales (solo sin Supabase y sin Vercel)
// ─────────────────────────────────────────────────────
if (!IS_VERCEL && !supabaseDisponible) {
  const dataDir  = path.join(ROOT, 'map', 'data');
  const dataDir2 = path.join(ROOT, 'data');
  if (!fs.existsSync(dataDir))  fs.mkdirSync(dataDir,  { recursive: true });
  if (!fs.existsSync(dataDir2)) fs.mkdirSync(dataDir2, { recursive: true });

  if (!fs.existsSync(REPORTS_FILE))   fs.writeFileSync(REPORTS_FILE,   '[]', 'utf-8');
  if (!fs.existsSync(VISITS_FILE))    fs.writeFileSync(VISITS_FILE,    JSON.stringify(visitsMemory), 'utf-8');
  if (!fs.existsSync(USERS_FILE))     fs.writeFileSync(USERS_FILE,     JSON.stringify(usersMemory, null, 2), 'utf-8');
  if (!fs.existsSync(CAFETERIA_FILE)) fs.writeFileSync(CAFETERIA_FILE, JSON.stringify(cafeteriaMemory), 'utf-8');
  if (!fs.existsSync(CONTACTS_FILE))  fs.writeFileSync(CONTACTS_FILE,  '[]', 'utf-8');

  try { reportsMemory   = JSON.parse(fs.readFileSync(REPORTS_FILE,   'utf-8')); } catch { reportsMemory = []; }
  try { visitsMemory    = JSON.parse(fs.readFileSync(VISITS_FILE,    'utf-8')); } catch { visitsMemory  = { total: 0, hoy: 0, fecha: '' }; }
  try { usersMemory     = JSON.parse(fs.readFileSync(USERS_FILE,     'utf-8')); } catch { usersMemory   = { alumnos: [], admins: [], visitantes: 0 }; }
  try { cafeteriaMemory = JSON.parse(fs.readFileSync(CAFETERIA_FILE, 'utf-8')); } catch { cafeteriaMemory = { total: 0, hoy: 0, fecha: '' }; }
  try { contactsMemory  = JSON.parse(fs.readFileSync(CONTACTS_FILE,  'utf-8')); } catch { contactsMemory = []; }
}

// ─────────────────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(ROOT, {
  setHeaders: function (res, filePath) {
    if (filePath.endsWith('.ico'))     res.setHeader('Content-Type', 'image/x-icon');
    if (filePath.endsWith('.geojson')) res.setHeader('Content-Type', 'application/json');
  }
}));

function getHoy() { return new Date().toISOString().slice(0, 10); }

// ─────────────────────────────────────────────────────
//  API — Reportes del Mapa (Waze-style)
//  Supabase: tabla reportes_soporte
// ─────────────────────────────────────────────────────

app.get('/api/reports', async (req, res) => {
  if (supabaseDisponible) {
    const { data, error } = await supabase
      .from('reportes_soporte')
      .select('*')
      .order('fecha', { ascending: false });
    return res.json(error ? [] : data);
  }
  if (IS_VERCEL) return res.json(reportsMemory);
  fs.readFile(REPORTS_FILE, 'utf-8', (err, data) => {
    try { res.json(JSON.parse(data)); } catch { res.json([]); }
  });
});

app.post('/api/report', async (req, res) => {
  const reporte = req.body;
  if (!reporte || !reporte.type || !reporte.location)
    return res.status(400).json({ error: 'Faltan campos: type y location' });
  if (!reporte.timestamp) reporte.timestamp = new Date().toISOString();

  if (supabaseDisponible) {
    const { error } = await supabase.from('reportes_soporte').insert([{
      tipo:        reporte.type,
      pantalla:    reporte.location,
      descripcion: reporte.description || reporte.type,
      origen:      reporte.user        || '',
      estado:      'Enviado',
      fecha:       reporte.timestamp
    }]);
    if (error) return res.status(500).json({ error: error.message });
    const { count } = await supabase
      .from('reportes_soporte').select('*', { count: 'exact', head: true });
    return res.status(201).json({ ok: true, total: count || 0 });
  }

  if (IS_VERCEL) {
    reportsMemory.push(reporte);
    return res.status(201).json({ ok: true, total: reportsMemory.length });
  }
  fs.readFile(REPORTS_FILE, 'utf-8', (err, data) => {
    let lista = [];
    try { lista = JSON.parse(data); } catch {}
    lista.push(reporte);
    fs.writeFile(REPORTS_FILE, JSON.stringify(lista, null, 2), 'utf-8', () => {
      reportsMemory = lista;
      res.status(201).json({ ok: true, total: lista.length });
    });
  });
});

app.delete('/api/reports', async (req, res) => {
  if (supabaseDisponible) {
    await supabase.from('reportes_soporte').delete().neq('id', 0);
    return res.json({ ok: true });
  }
  reportsMemory = [];
  if (!IS_VERCEL) {
    fs.writeFile(REPORTS_FILE, '[]', 'utf-8', () => res.json({ ok: true }));
  } else {
    res.json({ ok: true });
  }
});

// ─────────────────────────────────────────────────────
//  API — Usuarios: Alumnos, Admins, Visitantes
//  Supabase: tablas alumnos, admins
// ─────────────────────────────────────────────────────

app.get('/api/users', async (req, res) => {
  if (supabaseDisponible) {
    const [{ data: alumnos }, { data: admins }] = await Promise.all([
      supabase.from('alumnos').select('*').order('fecha_registro', { ascending: false }),
      supabase.from('admins').select('id,nombre_completo,correo_institucional,usuario,num_empleado,area_departamento,rol,fecha_registro')
    ]);
    return res.json({ alumnos: alumnos || [], admins: admins || [], visitantes: 0 });
  }
  if (IS_VERCEL) return res.json(usersMemory);
  fs.readFile(USERS_FILE, 'utf-8', (err, data) => {
    try { res.json(JSON.parse(data)); } catch { res.json({ alumnos: [], admins: [], visitantes: 0 }); }
  });
});

app.post('/api/users/alumno', async (req, res) => {
  const alumno = req.body;
  if (!alumno || !alumno.nombre || !alumno.correo)
    return res.status(400).json({ error: 'Faltan datos del alumno' });

  if (supabaseDisponible) {
    const { data: existente } = await supabase
      .from('alumnos').select('id').eq('correo', alumno.correo).maybeSingle();
    if (existente) return res.status(409).json({ error: 'Correo ya registrado' });

    const { error } = await supabase.from('alumnos').insert([{
      nombre:         alumno.nombre,
      correo:         alumno.correo,
      num_control:    alumno.numControl || '',
      carrera:        alumno.carrera    || '',
      semestre:       alumno.semestre   || '',
      fecha_registro: new Date().toISOString()
    }]);
    if (error) return res.status(500).json({ error: error.message });

    // Crear perfil inicial en tabla perfiles
    await supabase.from('perfiles').upsert([{
      correo:      alumno.correo,
      nombre:      alumno.nombre,
      num_control: alumno.numControl || '',
      carrera:     alumno.carrera    || '',
      semestre:    ''
    }], { onConflict: 'correo' });

    return res.status(201).json({ ok: true });
  }

  // Fallback sin Supabase
  alumno.fecha = new Date().toISOString();
  if (IS_VERCEL) {
    if (usersMemory.alumnos.find(a => a.correo === alumno.correo))
      return res.status(409).json({ error: 'Correo ya registrado' });
    usersMemory.alumnos.push(alumno);
    return res.status(201).json({ ok: true });
  }
  fs.readFile(USERS_FILE, 'utf-8', (err, data) => {
    let u = { alumnos: [], admins: [], visitantes: 0 };
    try { u = JSON.parse(data); } catch {}
    if (u.alumnos.find(a => a.correo === alumno.correo))
      return res.status(409).json({ error: 'Correo ya registrado' });
    u.alumnos.push(alumno);
    fs.writeFile(USERS_FILE, JSON.stringify(u, null, 2), 'utf-8', () => {
      usersMemory = u;
      res.status(201).json({ ok: true });
    });
  });
});

app.post('/api/users/admin', async (req, res) => {
  const admin = req.body;
  if (!admin || !admin.nombre) return res.status(400).json({ error: 'Faltan datos' });

  if (supabaseDisponible) {
    const { data: existente } = await supabase
      .from('admins').select('id').eq('usuario', admin.usuario || '').maybeSingle();
    if (existente) {
      await supabase.from('admins').update({
        nombre_completo:      admin.nombreCompleto || admin.nombre,
        correo_institucional: admin.correo         || '',
        password:             admin.password       || '',
        num_empleado:         admin.numEmpleado    || '',
        area_departamento:    admin.areaDepartamento || admin.area || '',
        rol:                  admin.rol            || 'Administrador'
      }).eq('usuario', admin.usuario);
      return res.status(201).json({ ok: true });
    }
    const { error } = await supabase.from('admins').insert([{
      nombre_completo:      admin.nombreCompleto || admin.nombre,
      correo_institucional: admin.correo         || '',
      usuario:              admin.usuario        || '',
      password:             admin.password       || '',
      num_empleado:         admin.numEmpleado    || '',
      area_departamento:    admin.areaDepartamento || admin.area || '',
      rol:                  admin.rol            || 'Administrador',
      fecha_registro:       new Date().toISOString()
    }]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ ok: true });
  }

  admin.fecha = new Date().toISOString();
  if (IS_VERCEL) { usersMemory.admins.push(admin); return res.status(201).json({ ok: true }); }
  fs.readFile(USERS_FILE, 'utf-8', (err, data) => {
    let u = { alumnos: [], admins: [], visitantes: 0 };
    try { u = JSON.parse(data); } catch {}
    u.admins.push(admin);
    fs.writeFile(USERS_FILE, JSON.stringify(u, null, 2), 'utf-8', () => {
      usersMemory = u;
      res.status(201).json({ ok: true });
    });
  });
});

app.get('/api/users/admin/check', async (req, res) => {
  const { usuario, password } = req.query;
  if (!usuario || !password) return res.status(400).json({ ok: false });

  if (supabaseDisponible) {
    const { data } = await supabase
      .from('admins')
      .select('nombre_completo,usuario')
      .eq('usuario',  usuario)
      .eq('password', password)
      .maybeSingle();
    return res.json(data ? { ok: true, nombre: data.nombre_completo || usuario } : { ok: false });
  }

  const lista = IS_VERCEL ? usersMemory.admins : (() => {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')).admins || []; } catch { return []; }
  })();
  const admin = lista.find(a => a.usuario === usuario && a.password === password);
  res.json(admin ? { ok: true, nombre: admin.nombre || admin.nombreCompleto || usuario } : { ok: false });
});

app.post('/api/users/visitante', async (req, res) => {
  if (supabaseDisponible) {
    const { data } = await supabase.from('visitas').select('*').maybeSingle();
    if (data) {
      const hoy        = getHoy();
      const nuevoHoy   = data.fecha_hoy === hoy ? data.hoy + 1 : 1;
      const nuevoTotal = data.total + 1;
      await supabase.from('visitas').update({ total: nuevoTotal, hoy: nuevoHoy, fecha_hoy: hoy }).eq('id', data.id);
      return res.json({ total: nuevoTotal });
    }
    return res.json({ total: 0 });
  }
  if (IS_VERCEL) {
    usersMemory.visitantes = (usersMemory.visitantes || 0) + 1;
    return res.json({ total: usersMemory.visitantes });
  }
  fs.readFile(USERS_FILE, 'utf-8', (err, rawData) => {
    let u = { alumnos: [], admins: [], visitantes: 0 };
    try { u = JSON.parse(rawData); } catch {}
    u.visitantes = (u.visitantes || 0) + 1;
    fs.writeFile(USERS_FILE, JSON.stringify(u, null, 2), 'utf-8', () => {
      usersMemory = u;
      res.json({ total: u.visitantes });
    });
  });
});

app.delete('/api/users/:tipo/:correo', async (req, res) => {
  const { tipo, correo } = req.params;
  if (supabaseDisponible) {
    if (tipo === 'alumno') await supabase.from('alumnos').delete().eq('correo', correo);
    if (tipo === 'admin')  await supabase.from('admins').delete().eq('usuario', correo);
    return res.json({ ok: true });
  }
  const actualizar = (u) => {
    if (tipo === 'alumno') u.alumnos = u.alumnos.filter(a => a.correo !== correo);
    if (tipo === 'admin')  u.admins  = u.admins.filter(a => a.correo !== correo);
    return u;
  };
  if (IS_VERCEL) { usersMemory = actualizar(usersMemory); return res.json({ ok: true }); }
  fs.readFile(USERS_FILE, 'utf-8', (err, data) => {
    let u = { alumnos: [], admins: [], visitantes: 0 };
    try { u = JSON.parse(data); } catch {}
    u = actualizar(u);
    fs.writeFile(USERS_FILE, JSON.stringify(u, null, 2), 'utf-8', () => {
      usersMemory = u; res.json({ ok: true });
    });
  });
});

// ─────────────────────────────────────────────────────
//  API — Perfil extendido de alumno
//  Supabase: tabla perfiles
// ─────────────────────────────────────────────────────

app.get('/api/perfil/:correo', async (req, res) => {
  if (!supabaseDisponible) return res.json(null);
  const { data } = await supabase
    .from('perfiles').select('*').eq('correo', req.params.correo).maybeSingle();
  res.json(data || null);
});

app.post('/api/perfil', async (req, res) => {
  if (!supabaseDisponible) return res.json({ ok: true });
  const p = req.body;
  if (!p || !p.correo) return res.status(400).json({ error: 'Falta correo' });
  const { error } = await supabase.from('perfiles').upsert([{
    correo:              p.correo,
    nombre:              p.nombre          || '',
    num_control:         p.numControl      || p.num_control      || '',
    carrera:             p.carrera         || '',
    semestre:            p.semestre        || '',
    telefono:            p.telefono        || '',
    tel_emergencia:      p.telEmergencia   || p.tel_emergencia   || '',
    direccion:           p.direccion       || '',
    ciudad:              p.ciudad          || '',
    estado:              p.estado          || '',
    fecha_actualizacion: new Date().toISOString()
  }], { onConflict: 'correo' });
  res.json(error ? { ok: false, error: error.message } : { ok: true });
});

// ─────────────────────────────────────────────────────
//  API — Visitas a la sección Cafetería
//  Supabase: tabla visitas (columnas cafeteria_*)
// ─────────────────────────────────────────────────────

app.get('/api/cafeteria/visits', async (req, res) => {
  if (supabaseDisponible) {
    const { data } = await supabase
      .from('visitas')
      .select('cafeteria_total,cafeteria_hoy,cafeteria_fecha')
      .maybeSingle();
    return res.json(data
      ? { total: data.cafeteria_total || 0, hoy: data.cafeteria_hoy || 0, fecha: data.cafeteria_fecha || '' }
      : { total: 0, hoy: 0, fecha: '' });
  }
  if (IS_VERCEL) return res.json(cafeteriaMemory);
  fs.readFile(CAFETERIA_FILE, 'utf-8', (err, data) => {
    try { res.json(JSON.parse(data)); } catch { res.json({ total: 0, hoy: 0, fecha: '' }); }
  });
});

app.post('/api/cafeteria/visit', async (req, res) => {
  const hoy = getHoy();
  if (supabaseDisponible) {
    const { data } = await supabase.from('visitas').select('*').maybeSingle();
    if (data) {
      const nuevoHoy   = data.cafeteria_fecha === hoy ? (data.cafeteria_hoy || 0) + 1 : 1;
      const nuevoTotal = (data.cafeteria_total || 0) + 1;
      await supabase.from('visitas')
        .update({ cafeteria_total: nuevoTotal, cafeteria_hoy: nuevoHoy, cafeteria_fecha: hoy })
        .eq('id', data.id);
      return res.json({ total: nuevoTotal, hoy: nuevoHoy, fecha: hoy });
    }
    return res.json({ total: 0, hoy: 0, fecha: hoy });
  }
  if (IS_VERCEL) {
    if (cafeteriaMemory.fecha !== hoy) { cafeteriaMemory.hoy = 0; cafeteriaMemory.fecha = hoy; }
    cafeteriaMemory.total += 1; cafeteriaMemory.hoy += 1;
    return res.json(cafeteriaMemory);
  }
  fs.readFile(CAFETERIA_FILE, 'utf-8', (err, rawData) => {
    let v = { total: 0, hoy: 0, fecha: '' };
    try { v = JSON.parse(rawData); } catch {}
    if (v.fecha !== hoy) { v.hoy = 0; v.fecha = hoy; }
    v.total += 1; v.hoy += 1;
    cafeteriaMemory = v;
    fs.writeFile(CAFETERIA_FILE, JSON.stringify(v, null, 2), 'utf-8', () => res.json(v));
  });
});

// ─────────────────────────────────────────────────────
//  API — Contador de visitas global
//  Supabase: tabla visitas (fila única con id=1)
// ─────────────────────────────────────────────────────

app.get('/api/visits', async (req, res) => {
  if (supabaseDisponible) {
    const { data } = await supabase
      .from('visitas').select('total,hoy,fecha_hoy').maybeSingle();
    if (data) {
      if (data.fecha_hoy !== getHoy()) {
        await supabase.from('visitas').update({ hoy: 0, fecha_hoy: getHoy() }).eq('id', 1);
        return res.json({ total: data.total, hoy: 0, fecha: getHoy() });
      }
      return res.json({ total: data.total, hoy: data.hoy, fecha: data.fecha_hoy });
    }
    return res.json({ total: 0, hoy: 0, fecha: getHoy() });
  }
  if (IS_VERCEL) return res.json(visitsMemory);
  fs.readFile(VISITS_FILE, 'utf-8', (err, data) => {
    try { res.json(JSON.parse(data)); } catch { res.json({ total: 0, hoy: 0, fecha: '' }); }
  });
});

app.post('/api/visits', async (req, res) => {
  const hoy = getHoy();
  if (supabaseDisponible) {
    const { data } = await supabase.from('visitas').select('*').maybeSingle();
    if (data) {
      const nuevoHoy   = data.fecha_hoy === hoy ? data.hoy + 1 : 1;
      const nuevoTotal = data.total + 1;
      await supabase.from('visitas')
        .update({ total: nuevoTotal, hoy: nuevoHoy, fecha_hoy: hoy })
        .eq('id', data.id);
      return res.json({ total: nuevoTotal, hoy: nuevoHoy, fecha: hoy });
    }
    return res.json({ total: 0, hoy: 0, fecha: hoy });
  }
  if (IS_VERCEL) {
    if (visitsMemory.fecha !== hoy) { visitsMemory.hoy = 0; visitsMemory.fecha = hoy; }
    visitsMemory.total += 1; visitsMemory.hoy += 1;
    return res.json(visitsMemory);
  }
  fs.readFile(VISITS_FILE, 'utf-8', (err, rawData) => {
    let v = { total: 0, hoy: 0, fecha: '' };
    try { v = JSON.parse(rawData); } catch {}
    if (v.fecha !== hoy) { v.hoy = 0; v.fecha = hoy; }
    v.total += 1; v.hoy += 1;
    visitsMemory = v;
    fs.writeFile(VISITS_FILE, JSON.stringify(v, null, 2), 'utf-8', () => res.json(v));
  });
});

// ─────────────────────────────────────────────────────
//  API — Directorio de contactos institucionales
//  Supabase: tabla contactos
// ─────────────────────────────────────────────────────

app.get('/api/contacts', async (req, res) => {
  if (supabaseDisponible) {
    const { data, error } = await supabase
      .from('contactos')
      .select('*')
      .eq('es_institucional', true)
      .order('nombre');
    return res.json(error ? [] : data);
  }
  if (IS_VERCEL) return res.json(contactsMemory);
  fs.readFile(CONTACTS_FILE, 'utf-8', (err, data) => {
    try { res.json(JSON.parse(data)); } catch { res.json([]); }
  });
});

app.post('/api/contacts', async (req, res) => {
  const lista = req.body;
  if (!Array.isArray(lista)) return res.status(400).json({ error: 'Se esperaba un array' });

  if (supabaseDisponible) {
    // Reemplazar todos los contactos institucionales
    await supabase.from('contactos').delete().eq('es_institucional', true);
    if (lista.length > 0) {
      const rows = lista.map(c => ({
        nombre:           c.nombre        || '',
        cargo:            c.cargo         || c.puesto || '',
        area:             c.area          || '',
        carrera_esp:      c.carreraEsp    || c.carrera_esp || '',
        correo:           c.correo        || c.email || '',
        telefono:         c.celular       || c.telefono || '',
        especialidad:     c.especialidad  || '',
        color:            c.color         || 'azul',
        es_institucional: true,
        favorito:         c.favorito      || false,
        archivado:        c.archivado     || false
      }));
      const { error } = await supabase.from('contactos').insert(rows);
      if (error) return res.status(500).json({ error: error.message });
    }
    return res.json({ ok: true, total: lista.length });
  }

  contactsMemory = lista;
  if (IS_VERCEL) return res.json({ ok: true, total: lista.length });
  fs.writeFile(CONTACTS_FILE, JSON.stringify(lista, null, 2), 'utf-8', (err) => {
    if (err) return res.status(500).json({ error: 'Error al guardar contactos' });
    res.json({ ok: true, total: lista.length });
  });
});

// ─────────────────────────────────────────────────────
//  API — Opiniones de Cafetería
//  Supabase: tabla opiniones_cafeteria
// ─────────────────────────────────────────────────────

app.get('/api/opiniones', async (req, res) => {
  if (supabaseDisponible) {
    const { data, error } = await supabase
      .from('opiniones_cafeteria')
      .select('*')
      .order('fecha', { ascending: false });
    return res.json(error ? [] : data);
  }
  res.json([]);
});

app.post('/api/opiniones', async (req, res) => {
  const { texto, origen, correo_usuario } = req.body;
  if (!texto) return res.status(400).json({ error: 'Falta el texto' });
  if (supabaseDisponible) {
    const { error } = await supabase.from('opiniones_cafeteria').insert([{
      texto,
      origen:         origen         || 'alumno',
      correo_usuario: correo_usuario || '',
      fecha:          new Date().toLocaleString('es-MX')
    }]);
    return res.json(error ? { ok: false } : { ok: true });
  }
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────
//  API — Menú de Cafetería
//  Supabase: tabla menus_cafeteria
// ─────────────────────────────────────────────────────

app.get('/api/menu', async (req, res) => {
  if (supabaseDisponible) {
    const { data, error } = await supabase
      .from('menus_cafeteria')
      .select('*')
      .eq('activo', true)
      .order('fecha_publicacion', { ascending: false })
      .limit(10);
    return res.json(error ? [] : data);
  }
  res.json([]);
});

app.post('/api/menu', async (req, res) => {
  if (!supabaseDisponible) return res.json({ ok: true });
  const item = req.body;
  const { error } = await supabase.from('menus_cafeteria').insert([{
    titulo:           item.titulo      || '',
    descripcion:      item.descripcion || '',
    precio:           item.precio      || '',
    imagen_url:       item.imagen_url  || '',
    activo:           true,
    fecha_publicacion: new Date().toISOString()
  }]);
  res.json(error ? { ok: false, error: error.message } : { ok: true });
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
    console.log(`║   Supabase: ${supabaseDisponible ? '✅ Conectado         ' : '⚠️  Sin variables .env'}   ║`);
    console.log('║   Ctrl + C  para detener                 ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    const cmd = process.platform === 'win32'  ? `start ${url}`
              : process.platform === 'darwin' ? `open ${url}`
              : `xdg-open ${url}`;
    exec(cmd, (err) => { if (err) console.log(`  → Abre manualmente: ${url}`); });
  });
}

module.exports = app;