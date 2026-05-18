// =============================================
// SCRIPT — DASHBOARD ADMINISTRADOR
// CONOCE-TEC v1.2
// =============================================

document.addEventListener('DOMContentLoaded', function () {

    // ---- PROTECCIÓN: solo admins ----
    var rol = sessionStorage.getItem('rolUsuario');
    if (rol !== 'admin') {
        window.location.href = '../index.html';
        return;
    }

    // ---- SIDEBAR: empieza COLAPSADO (ya viene con clase en HTML) ----
    var adminSidebar  = document.getElementById('adminSidebar');
    var adminMain     = document.getElementById('adminMain');
    var sidebarToggle = document.getElementById('sidebarToggle');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            if (window.innerWidth <= 768) {
                // Móvil: slide in/out
                adminSidebar.classList.toggle('open');
            } else {
                // Desktop: colapsar/expandir
                adminSidebar.classList.toggle('collapsed');
                if (adminMain) adminMain.classList.toggle('sidebar-collapsed');
            }
        });
    }

    // Cerrar sidebar en móvil al hacer clic fuera
    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 768 && adminSidebar && adminSidebar.classList.contains('open')) {
            if (!adminSidebar.contains(e.target) && sidebarToggle && !sidebarToggle.contains(e.target)) {
                adminSidebar.classList.remove('open');
            }
        }
    });

    // ---- CARGAR DATOS DEL ADMIN ----
    cargarDatosAdmin();

    // ---- NAVEGACIÓN ----
    configurarNavegacion();

    // ---- NOTIFICACIONES ----
    configurarNotificaciones();

    // ---- CERRAR SESIÓN ----
    var btnCerrarSesion = document.getElementById('btnCerrarSesionSidebar');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', function (e) {
            e.preventDefault();
            if (confirm('¿Seguro que deseas cerrar sesión?')) {
                sessionStorage.clear();
                window.location.href = '../index.html';
            }
        });
    }

    // ---- KPIs en tiempo real ----
    actualizarKPIs();
    window.addEventListener('storage', function (e) {
        actualizarKPIs();
        generarNotificaciones();
        // Si el alumno cambió su directorio, refrescar el panel si está activo
        if (e.key === 'conoce_tec_directorio') {
            var panelDir = document.getElementById('panel-directorio-content');
            if (panelDir && panelDir.classList.contains('active')) {
                cargarTablaDirectorio();
            }
        }
        // Si cambió la lista de alumnos, refrescar usuarios si está activo
        if (e.key === 'alumnosRegistrados' || e.key === 'visitantesRegistrados') {
            var panelUsers = document.getElementById('panel-usuarios-content');
            if (panelUsers && panelUsers.classList.contains('active')) {
                cargarTablaUsuarios();
            }
        }
    });

    // ---- ACCESOS RÁPIDOS / DATA-PANEL ----
    document.querySelectorAll('[data-panel]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            navegarPanel(this.getAttribute('data-panel'));
        });
    });

    // ---- PERFIL: foto ----
    var perfilFotoInput = document.getElementById('perfilFotoInput');
    if (perfilFotoInput) {
        perfilFotoInput.addEventListener('change', function () {
            var file = this.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (e) {
                localStorage.setItem('adminFotoPerfil', e.target.result);
                actualizarAvatars(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // ---- NOTIFICACIONES: marcar leídas ----
    var btnMarcar = document.getElementById('btnMarcarTodasLeidas');
    if (btnMarcar) {
        btnMarcar.addEventListener('click', function () {
            document.querySelectorAll('.notif-item.unread').forEach(function (el) { el.classList.remove('unread'); });
            var badge = document.getElementById('notifBadge');
            if (badge) badge.style.display = 'none';
            // También limpiar el badge del menú lateral
            var snavBadge = document.getElementById('snavNotifBadge');
            if (snavBadge) snavBadge.style.display = 'none';
            // Guardar timestamp de última lectura para no volver a mostrar como nuevo
            localStorage.setItem('notifUltimaLectura', new Date().toISOString());
        });
    }

    // ---- CONFIGURACIÓN ----
    var btnSaveConfig = document.querySelector('.btn-save-config');
    if (btnSaveConfig) btnSaveConfig.addEventListener('click', function () { mostrarToast('Configuración guardada.', 'success'); });

    // ---- RESPALDO ----
    var btnRespaldo = document.getElementById('btnGenerarRespaldo');
    if (btnRespaldo) btnRespaldo.addEventListener('click', generarRespaldo);
    var btnRespaldarLink = document.getElementById('btnRespaldar');
    if (btnRespaldarLink) btnRespaldarLink.addEventListener('click', function (e) { e.preventDefault(); generarRespaldo(); });

    // ---- GESTIÓN DE USUARIOS ----
    inicializarGestionUsuarios();

    // ---- SECCIÓN ADMINISTRADORES ----
    inicializarSeccionAdmins();

    // ---- GESTIÓN DE DIRECTORIO ----
    inicializarGestionDirectorio();

    // ---- ESTADÍSTICAS: exportar ----
    var btnExportar = document.getElementById('btnExportarReporte');
    if (btnExportar) btnExportar.addEventListener('click', exportarReporte);

    // ---- ESTADÍSTICAS: simular error ----
    var btnSimularError = document.getElementById('btnSimularError');
    if (btnSimularError) btnSimularError.addEventListener('click', simularError);

    // ---- SOPORTE TÉCNICO ----
    inicializarSoporte();

    // ---- MODO OSCURO ----
    inicializarModoOscuroAdmin();

    // ---- NOTIF BADGE inicial ----
    setTimeout(cargarPanelNotificaciones, 300);

    // Actualizar actividad cada 10s
    setInterval(actualizarActividadReciente, 10000);
    actualizarActividadReciente();

    // Renderizar reportes de soporte guardados
    renderizarReportesSoporte();

});

// =============================================
// DATOS DEL ADMIN
// =============================================
function cargarDatosAdmin() {
    var nombreAdmin  = sessionStorage.getItem('nombreUsuario') || 'Administrador';
    var adminDataStr = localStorage.getItem('adminData');
    var adminData    = adminDataStr ? JSON.parse(adminDataStr) : null;
    var esGenerico   = (nombreAdmin === 'Administrador');

    var welcomeName = document.getElementById('adminWelcomeName');
    if (welcomeName) welcomeName.textContent = esGenerico ? 'Administrador' : nombreAdmin.split(' ')[0];

    var topbarName = document.getElementById('topbarAdminName');
    if (topbarName) topbarName.textContent = nombreAdmin;

    var topbarRole = document.getElementById('topbarAdminRole');
    if (topbarRole) {
        topbarRole.textContent = (!esGenerico && adminData && adminData.correoInstitucional)
            ? adminData.correoInstitucional
            : 'admin@tec.edu.mx';
    }

    // Perfil
    var perfilAviso   = document.getElementById('perfilAvisoGenerico');
    var btnEditPerfil = document.querySelector('.btn-edit-perfil');
    if (esGenerico || !adminData) {
        if (document.getElementById('perfilNombreDisplay')) document.getElementById('perfilNombreDisplay').textContent = 'Administrador';
        if (document.getElementById('perfilRolDisplay'))    document.getElementById('perfilRolDisplay').textContent    = 'Administrador';
        setPerfilField('piNombre',   '— (acceso de incógnito)');
        setPerfilField('piCorreo',   '—'); setPerfilField('piEmpleado', '—');
        setPerfilField('piArea',     '—'); setPerfilField('piRol',      'Administrador');
        setPerfilField('piUsuario',  sessionStorage.getItem('usuarioActual') || 'admin');
        if (btnEditPerfil) btnEditPerfil.style.display = 'none';
        if (perfilAviso)   perfilAviso.style.display   = 'block';
    } else {
        if (document.getElementById('perfilNombreDisplay')) document.getElementById('perfilNombreDisplay').textContent = adminData.nombreCompleto || nombreAdmin;
        if (document.getElementById('perfilRolDisplay'))    document.getElementById('perfilRolDisplay').textContent    = adminData.rol || 'Administrador';
        setPerfilField('piNombre',   adminData.nombreCompleto);
        setPerfilField('piCorreo',   adminData.correoInstitucional);
        setPerfilField('piEmpleado', adminData.numEmpleado);
        setPerfilField('piArea',     adminData.areaDepartamento);
        setPerfilField('piRol',      adminData.rol);
        setPerfilField('piUsuario',  adminData.usuario);
        if (btnEditPerfil) btnEditPerfil.style.display = '';
        if (perfilAviso)   perfilAviso.style.display   = 'none';
    }

    var fotoPerfil = localStorage.getItem('adminFotoPerfil');
    if (fotoPerfil) actualizarAvatars(fotoPerfil);
}

function setPerfilField(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val || '—';
}

function actualizarAvatars(src) {
    ['topbarAvatarImg','perfilAvatarImg'].forEach(function(id) {
        var img = document.getElementById(id);
        if (img) { img.src = src; img.style.display = 'block'; }
    });
    ['topbarAvatarIcon','perfilAvatarIcon'].forEach(function(id) {
        var icon = document.getElementById(id);
        if (icon) icon.style.display = 'none';
    });
}

// =============================================
// KPIs REALES
// =============================================
function actualizarKPIs() {
    var registrados   = parseInt(localStorage.getItem('contadorRegistrados') || '0', 10);
    var visitas       = parseInt(localStorage.getItem('contadorVisitas')     || '0', 10);
    var visitasHoy    = parseInt(localStorage.getItem('contadorVisitasHoy') || '0', 10);
    var menus         = JSON.parse(localStorage.getItem('menusCafeteria')    || '[]');
    var contactos     = JSON.parse(localStorage.getItem('contactosTECAdmin') || '[]');
    var bloqueados    = JSON.parse(localStorage.getItem('usuariosBloqueados')|| '[]');
    var visitantesArr = JSON.parse(localStorage.getItem('visitantesRegistrados') || '[]');
    var visitasCafe   = parseInt(localStorage.getItem('visitasCafeteria') || '0', 10);
    var ultimo        = localStorage.getItem('ultimoUsuarioRegistrado') || '—';

    var set = function(id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val > 0 ? val.toLocaleString('es-MX') : '0';
    };
    var setText = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };

    // KPI cards dashboard principal
    set('kpiVisitasTotales', visitas);
    set('kpiUsuariosReg',    registrados);
    set('kpiVisitasHoy',     visitasHoy);
    set('kpiMenus',          menus.length);
    set('kpiContactos',      contactos.filter(function(c) { return !c.esInstitucional; }).length);
    set('kpiVisitasCafeteria', visitasCafe);

    // Resumen del sistema
    setText('resumVisitas',     visitas > 0     ? visitas + ' visita(s)'      : 'Sin visitas aún');
    setText('resumRegistrados', registrados > 0 ? registrados + ' usuario(s)' : 'Sin registros aún');
    setText('resumContactos',   contactos.length + ' contacto(s)');

    // Actividad reciente
    setText('actVisitas',     visitas + ' visita(s) registrada(s) en total.');
    setText('actRegistrados', registrados + ' alumno(s) en el sistema.');
    setText('actMenus',       menus.length + ' menú(s) publicado(s).');
    setText('actNuevoUsuario', ultimo);

    // KPIs estadísticas
    set('statKpiVisitas',     visitas);
    set('statKpiRegistrados', registrados);
    set('statKpiMenus',       menus.length);
    set('statKpiContactos',   contactos.length);
    set('statKpiVisitantes',  visitantesArr.length);

    // Uso del sistema
    setText('usoLogin',      localStorage.getItem('ctec_usoLogin')      || '0');
    setText('usoRegistros',  localStorage.getItem('ctec_usoRegistros')  || '0');
    setText('usoMapa',       localStorage.getItem('ctec_usoMapa')       || '0');
    setText('usoDirectorio', localStorage.getItem('ctec_usoDirectorio') || '0');
    setText('usoCafeteria',  localStorage.getItem('ctec_usoCafeteria')  || '0');

    // Usuarios bloqueados
    var ustatB = document.getElementById('ustatBloqueados');
    if (ustatB) ustatB.textContent = bloqueados.length;

    // Bitácora
    setText('bitMsgVisitas',   visitas > 0     ? visitas + ' visita(s) acumuladas.'          : 'Sin visitas aún.');
    setText('bitMsgRegistros', registrados > 0 ? registrados + ' alumno(s) registrado(s).'   : 'Sin alumnos registrados aún.');
    setText('bitMsgMenus',     menus.length > 0 ? menus.length + ' menú(s) en cafetería.'    : 'Sin menús publicados aún.');

    // Estadísticas paneles
    setText('statVisTotal',        String(visitas));
    setText('statRegTotal',        String(registrados));
    setText('statVisitantesTotal', String(visitantesArr.length));
    setText('statMenus',           menus.length + ' publicado(s)');
    setText('statContactos',       contactos.length + ' en directorio');
    setText('resumContactos',      contactos.length + ' contacto(s)');

    // Contador admins
    var admins    = JSON.parse(localStorage.getItem('adminsRegistrados') || '[]');
    var adminData = JSON.parse(localStorage.getItem('adminData') || 'null');
    var numAdmins = admins.length || (adminData ? 1 : 0);
    var ustatAd   = document.getElementById('ustatAdmins');
    if (ustatAd) ustatAd.textContent = numAdmins;
}

function actualizarActividadReciente() { actualizarKPIs(); }

// =============================================
// NAVEGACIÓN
// =============================================
function configurarNavegacion() {
    document.querySelectorAll('.snav-item[data-panel]').forEach(function (item) {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            navegarPanel(this.getAttribute('data-panel'));
            if (window.innerWidth <= 768) {
                document.getElementById('adminSidebar').classList.remove('open');
            }
        });
    });
}

function navegarPanel(panelId) {
    document.querySelectorAll('.snav-item').forEach(function (el) { el.classList.remove('active'); });
    var activeItem = document.querySelector('.snav-item[data-panel="' + panelId + '"]');
    if (activeItem) activeItem.classList.add('active');

    document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.remove('active'); });
    var target = document.getElementById('panel-' + panelId);
    if (target) target.classList.add('active');
    else { var dash = document.getElementById('panel-dashboard'); if(dash) dash.classList.add('active'); }

    var titulos = {
        'dashboard':               null,
        'inicio-content':          'Gestión de Inicio',
        'mapa-content':            'Gestión de Mapa',
        'directorio-content':      'Gestión de Directorio',
        'cafeteria-content':       'Gestión de Cafetería',
        'usuarios-content':        'Gestión de Usuarios',
        'roles-content':           'Roles y Permisos',
        'notificaciones-content':  'Notificaciones',
        'seguridad-content':       'Seguridad',
        'estadisticas-content':    'Estadísticas y Reportes',
        'configuracion-content':   'Configuración del Sistema',
        'bitacora-content':        'Bitácora de Actividad',
        'respaldos-content':       'Respaldos del Sistema',
        'perfil-admin':            'Mi Perfil',
        'soporte-content':         'Soporte Técnico'
    };

    var topbarH2  = document.querySelector('.topbar-title h2');
    var topbarSub = document.querySelector('.topbar-title p');
    if (panelId === 'dashboard') {
        var nombre = sessionStorage.getItem('nombreUsuario') || 'Administrador';
        if (topbarH2)  topbarH2.innerHTML = '¡Bienvenido, <span id="adminWelcomeName">' + nombre.split(' ')[0] + '</span>!';
        if (topbarSub) topbarSub.textContent = 'Aquí tienes un resumen general del sistema.';
    } else {
        if (topbarH2)  topbarH2.textContent = titulos[panelId] || panelId;
        if (topbarSub) topbarSub.textContent = '';
    }

    if (panelId === 'estadisticas-content')    generarGrafica();
    if (panelId === 'usuarios-content')        cargarTablaUsuarios();
    if (panelId === 'directorio-content')      { cargarTablaDirectorio(); cargarContactosAlumnos(); }
    if (panelId === 'perfil-admin')            cargarDatosAdmin();
    if (panelId === 'soporte-content')         renderizarReportesSoporte();
    if (panelId === 'notificaciones-content')  cargarPanelNotificaciones();
    if (panelId === 'seguridad-content')       cargarPanelSeguridad();
    if (panelId === 'configuracion-content')   cargarPanelConfiguracion();
    if (panelId === 'cafeteria-content')       cargarOpinionesCafeteria();

    // Registrar en el historial del navegador para que el botón "atrás" funcione internamente
    history.pushState({ panel: panelId }, '', '#' + panelId);
}

// ---- Manejo del botón "atrás" del navegador en Admin ----
(function () {
    // Al cargar: reemplazar la entrada del login en el historial con el dashboard
    history.replaceState({ panel: 'dashboard' }, '', '#dashboard');

    window.addEventListener('popstate', function (e) {
        var state = e.state;
        if (state && state.panel) {
            // Navegar al panel indicado SIN volver a hacer pushState
            _navegarPanelSinHistorial(state.panel);
        } else {
            // No hay estado — regresar al dashboard en lugar del login
            _navegarPanelSinHistorial('dashboard');
            history.replaceState({ panel: 'dashboard' }, '', '#dashboard');
        }
    });
})();

/** Versión interna de navegarPanel que NO hace pushState (evita loop). */
function _navegarPanelSinHistorial(panelId) {
    document.querySelectorAll('.snav-item').forEach(function (el) { el.classList.remove('active'); });
    var activeItem = document.querySelector('.snav-item[data-panel="' + panelId + '"]');
    if (activeItem) activeItem.classList.add('active');

    document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.remove('active'); });
    var target = document.getElementById('panel-' + panelId);
    if (target) target.classList.add('active');
    else { var dash = document.getElementById('panel-dashboard'); if (dash) dash.classList.add('active'); }

    var titulos = {
        'dashboard': null, 'inicio-content': 'Gestión de Inicio', 'mapa-content': 'Gestión de Mapa',
        'directorio-content': 'Gestión de Directorio', 'cafeteria-content': 'Gestión de Cafetería',
        'usuarios-content': 'Gestión de Usuarios', 'roles-content': 'Roles y Permisos',
        'notificaciones-content': 'Notificaciones', 'seguridad-content': 'Seguridad',
        'estadisticas-content': 'Estadísticas y Reportes', 'configuracion-content': 'Configuración del Sistema',
        'bitacora-content': 'Bitácora de Actividad', 'respaldos-content': 'Respaldos del Sistema',
        'perfil-admin': 'Mi Perfil', 'soporte-content': 'Soporte Técnico'
    };
    var topbarH2  = document.querySelector('.topbar-title h2');
    var topbarSub = document.querySelector('.topbar-title p');
    if (panelId === 'dashboard') {
        var nombre = sessionStorage.getItem('nombreUsuario') || 'Administrador';
        if (topbarH2)  topbarH2.innerHTML = '¡Bienvenido, <span id="adminWelcomeName">' + nombre.split(' ')[0] + '</span>!';
        if (topbarSub) topbarSub.textContent = 'Aquí tienes un resumen general del sistema.';
    } else {
        if (topbarH2)  topbarH2.textContent = titulos[panelId] || panelId;
        if (topbarSub) topbarSub.textContent = '';
    }
    if (panelId === 'estadisticas-content')   generarGrafica();
    if (panelId === 'usuarios-content')       cargarTablaUsuarios();
    if (panelId === 'directorio-content')     { cargarTablaDirectorio(); cargarContactosAlumnos(); }
    if (panelId === 'perfil-admin')           cargarDatosAdmin();
    if (panelId === 'soporte-content')        renderizarReportesSoporte();
    if (panelId === 'notificaciones-content') cargarPanelNotificaciones();
    if (panelId === 'seguridad-content')      cargarPanelSeguridad();
    if (panelId === 'configuracion-content')  cargarPanelConfiguracion();
    if (panelId === 'cafeteria-content')      cargarOpinionesCafeteria();
}

// =============================================
// NOTIFICACIONES
// =============================================
function configurarNotificaciones() {
    var notifWrap = document.getElementById('notifWrap');
    if (!notifWrap) return;
    notifWrap.addEventListener('click', function (e) {
        e.stopPropagation();
        this.classList.toggle('open');
    });
    document.addEventListener('click', function () { if(notifWrap) notifWrap.classList.remove('open'); });
    generarNotificaciones();
}

function generarNotificaciones() {
    var notifList  = document.getElementById('notifList');
    var notifBadge = document.getElementById('notifBadge');
    if (!notifList) return;

    var registrados = parseInt(localStorage.getItem('contadorRegistrados') || '0', 10);
    var visitas     = parseInt(localStorage.getItem('contadorVisitas')     || '0', 10);
    var errores     = JSON.parse(localStorage.getItem('reportesError')     || '[]');
    var notifs = [];

    if (registrados > 0) notifs.push({ icon:'fa-user-plus', color:'#3b82f6', title:'Usuarios registrados', sub: registrados + ' alumno(s) en el sistema.', time:'Hoy' });
    if (visitas > 0)     notifs.push({ icon:'fa-eye',       color:'#10b981', title:'Visitas registradas',  sub: visitas + ' visita(s) en total.',           time:'Hoy' });
    if (errores.length)  notifs.push({ icon:'fa-bug',       color:'#ef4444', title:'Reportes de error',    sub: errores.length + ' reporte(s) pendiente(s).', time:'Revisar' });

    if (notifs.length === 0) {
        notifList.innerHTML = '<div style="padding:16px;text-align:center;color:#888;font-size:.8rem;">Sin notificaciones. El sistema se actualizará conforme sea utilizado.</div>';
        if (notifBadge) notifBadge.style.display = 'none';
        return;
    }

    // Respetar última lectura: si ya se marcaron como leídas, no mostrar badge ni unread
    var _ultimaLect = localStorage.getItem('notifUltimaLectura');

    notifList.innerHTML = notifs.map(function(n) {
        var claseUnread = _ultimaLect ? '' : ' unread';
        return '<div class="notif-item' + claseUnread + '"><i class="fas ' + n.icon + ' notif-icon" style="color:' + n.color + ';"></i>' +
            '<div class="notif-text"><strong>' + n.title + '</strong><span>' + n.sub + '</span><time>' + n.time + '</time></div></div>';
    }).join('');

    if (_ultimaLect) {
        if (notifBadge) notifBadge.style.display = 'none';
    } else {
        if (notifBadge) { notifBadge.textContent = notifs.length; notifBadge.style.display = 'flex'; }
    }
}

// =============================================
// GRÁFICA
// =============================================
function generarGrafica() {
    var chartBars   = document.getElementById('chartBars');
    var chartLabels = document.getElementById('chartLabels');
    if (!chartBars || !chartLabels) return;

    var historial = JSON.parse(localStorage.getItem('historialVisitasDiarias') || '{}');
    var dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var hoy  = new Date().getDay();
    var ordenDias = [];
    for (var i = 6; i >= 0; i--) ordenDias.push(dias[(hoy - i + 7) % 7]);

    var maxVal = 1;
    var valores = ordenDias.map(function(dia) {
        var v = parseInt(historial[dia] || '0', 10);
        if (v > maxVal) maxVal = v;
        return v;
    });

    chartBars.innerHTML = '';
    chartLabels.innerHTML = '';

    if (valores.every(function(v){ return v===0; })) {
        chartBars.innerHTML = '<div style="width:100%;text-align:center;color:#94a3b8;font-size:.8rem;padding:20px 0;align-self:center;">Sin datos aún.<br>Se actualizará conforme el sistema sea visitado.</div>';
        return;
    }

    valores.forEach(function (val, i) {
        var bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = Math.max((val / maxVal) * 85, val > 0 ? 6 : 2) + 'px';
        bar.style.opacity = val === 0 ? '0.2' : '0.85';
        bar.title = ordenDias[i] + ': ' + val + ' visita(s)';
        chartBars.appendChild(bar);
        var lbl = document.createElement('span');
        lbl.textContent = ordenDias[i];
        chartLabels.appendChild(lbl);
    });
}

// =============================================
// GESTIÓN DE USUARIOS — CRUD COMPLETO
// =============================================
var todosUsuarios = [];

function inicializarGestionUsuarios() {
    // Botón nuevo usuario
    var btnNuevo = document.getElementById('btnNuevoUsuario');
    if (btnNuevo) btnNuevo.addEventListener('click', function() { abrirModalUsuario(); });

    // Cerrar modal
    var btnCerrar  = document.getElementById('btnCerrarModalUsuario');
    var btnCancelar= document.getElementById('btnCancelarModalUsuario');
    if (btnCerrar)   btnCerrar.addEventListener('click',   cerrarModalUsuario);
    if (btnCancelar) btnCancelar.addEventListener('click', cerrarModalUsuario);

    // Guardar
    var btnGuardar = document.getElementById('btnGuardarUsuario');
    if (btnGuardar) btnGuardar.addEventListener('click', guardarUsuario);

    // Filtros
    var usersSearch = document.getElementById('usersSearchInput');
    var usersFilter = document.getElementById('usersFilterType');
    var usersStatus = document.getElementById('usersFilterStatus');
    if (usersSearch) usersSearch.addEventListener('input',  filtrarUsuarios);
    if (usersFilter) usersFilter.addEventListener('change', filtrarUsuarios);
    if (usersStatus) usersStatus.addEventListener('change', filtrarUsuarios);

    // Cerrar modal al hacer clic en backdrop
    var backdrop = document.getElementById('modalUsuarioBackdrop');
    if (backdrop) backdrop.addEventListener('click', function(e) { if(e.target===this) cerrarModalUsuario(); });
}

function cargarTablaUsuarios() {
    todosUsuarios = obtenerTodosUsuarios();
    var bloqueados = JSON.parse(localStorage.getItem('usuariosBloqueados') || '[]');

    var alumnos    = todosUsuarios.filter(function(u){ return u.tipo==='alumno'; }).length;
    var visitantes = todosUsuarios.filter(function(u){ return u.tipo==='visitante'; }).length;
    var ustatA = document.getElementById('ustatAlumnos');
    var ustatV = document.getElementById('ustatVisitantes');
    var ustatB = document.getElementById('ustatBloqueados');
    if (ustatA) ustatA.textContent = alumnos;
    if (ustatV) ustatV.textContent = visitantes;
    if (ustatB) ustatB.textContent = bloqueados.length;

    // Actualizar contador de administradores
    var admins = JSON.parse(localStorage.getItem('adminsRegistrados') || '[]');
    var adminData = JSON.parse(localStorage.getItem('adminData') || 'null');
    var numAdmins = admins.length || (adminData ? 1 : 0);
    var ustatAd = document.getElementById('ustatAdmins');
    if (ustatAd) ustatAd.textContent = numAdmins;

    renderizarTablaUsuarios(todosUsuarios);
}

function obtenerTodosUsuarios() {
    var lista = [];
    var bloqueados = JSON.parse(localStorage.getItem('usuariosBloqueados') || '[]');

    JSON.parse(localStorage.getItem('alumnosRegistrados') || '[]').forEach(function(a) {
        lista.push({ id: a.id || Date.now(), nombre: a.nombreCompleto||a.nombre||'—',
            tipo:'alumno', email:a.correo||a.email||'—', fecha:a.fecha||'',
            rol: a.rol || 'alumno',
            estado: bloqueados.indexOf(a.correo||a.email||a.id) !== -1 ? 'bloqueado' : 'activo' });
    });

    JSON.parse(localStorage.getItem('visitantesRegistrados') || '[]').forEach(function(v) {
        lista.push({ id: v.id || Date.now()+1, nombre: v.nombre||v.nombreVisitante||'—',
            tipo:'visitante', email:v.email||v.emailVisitante||'—', fecha:v.fecha||'',
            rol: 'visitante',
            estado: bloqueados.indexOf(v.email||v.emailVisitante) !== -1 ? 'bloqueado' : 'activo' });
    });

    // Fallback
    if (lista.length === 0) {
        var nombreActual = localStorage.getItem('nombreUsuarioActual');
        var correoActual = localStorage.getItem('correoUsuarioActual');
        if (nombreActual && nombreActual !== 'Administrador') {
            lista.push({ id:1, nombre:nombreActual, tipo:'alumno', email:correoActual||'—', fecha:'', rol:'alumno',
                estado: bloqueados.indexOf(correoActual) !== -1 ? 'bloqueado' : 'activo' });
        }
    }
    return lista;
}

function renderizarTablaUsuarios(lista) {
    var table = document.getElementById('usersTable');
    var body  = document.getElementById('usersTableBody');
    var noMsg = document.getElementById('noUsersMsg');
    if (!body) return;
    body.innerHTML = '';

    if (lista.length === 0) {
        if (table) table.style.display = 'none';
        if (noMsg) noMsg.style.display = 'block';
        return;
    }
    if (table) table.style.display = 'table';
    if (noMsg) noMsg.style.display = 'none';

    lista.forEach(function (u, i) {
        var tr = document.createElement('tr');
        var bTipo   = u.tipo==='alumno' ? '<span class="task-badge badge-done">Alumno</span>' : '<span class="task-badge badge-pending">Visitante</span>';
        var bEstado = u.estado==='bloqueado'
            ? '<span class="task-badge badge-bloqueado">Bloqueado</span>'
            : '<span class="task-badge badge-activo">Activo</span>';
        var fecha = u.fecha ? (function(f){ var d=new Date(f); return isNaN(d)?f:d.toLocaleDateString('es-MX'); })(u.fecha) : '—';
        var btnBloquear = u.estado==='bloqueado'
            ? '<button class="tbl-btn" onclick="toggleBloquearUsuario(\'' + (u.email||u.id) + '\', false)"><i class="fas fa-unlock"></i></button>'
            : '<button class="tbl-btn tbl-btn-warn" onclick="toggleBloquearUsuario(\'' + (u.email||u.id) + '\', true)"><i class="fas fa-ban"></i></button>';

        tr.innerHTML = '<td>' + (i+1) + '</td>' +
            '<td>' + u.nombre + '</td>' +
            '<td>' + bTipo + '</td>' +
            '<td>' + u.email + '</td>' +
            '<td>' + bEstado + '</td>' +
            '<td>' + fecha + '</td>' +
            '<td style="display:flex;gap:4px;">' +
                '<button class="tbl-btn" onclick="abrirModalUsuario(' + JSON.stringify(u).replace(/"/g,'&quot;') + ')"><i class="fas fa-edit"></i></button>' +
                btnBloquear +
                '<button class="tbl-btn tbl-btn-danger" onclick="eliminarUsuario(\'' + (u.email||u.id) + '\', \'' + u.tipo + '\')"><i class="fas fa-trash"></i></button>' +
            '</td>';
        body.appendChild(tr);
    });
}

function filtrarUsuarios() {
    var query  = (document.getElementById('usersSearchInput')  ? document.getElementById('usersSearchInput').value  : '').toLowerCase();
    var tipo   = document.getElementById('usersFilterType')    ? document.getElementById('usersFilterType').value    : '';
    var estado = document.getElementById('usersFilterStatus')  ? document.getElementById('usersFilterStatus').value  : '';
    var filtrados = todosUsuarios.filter(function (u) {
        return (!tipo   || u.tipo   === tipo) &&
               (!estado || u.estado === estado) &&
               (!query  || u.nombre.toLowerCase().indexOf(query) !== -1 || u.email.toLowerCase().indexOf(query) !== -1);
    });
    renderizarTablaUsuarios(filtrados);
}

function abrirModalUsuario(usuario) {
    var backdrop = document.getElementById('modalUsuarioBackdrop');
    var titulo   = document.getElementById('modalUsuarioTitle');
    if (!backdrop) return;

    if (usuario && typeof usuario === 'object') {
        if (titulo) titulo.textContent = 'Editar Usuario';
        document.getElementById('modalUsuarioId').value    = usuario.id    || '';
        document.getElementById('muNombre').value  = usuario.nombre  || '';
        document.getElementById('muCorreo').value  = usuario.email   || '';
        document.getElementById('muTipo').value    = usuario.tipo    || 'alumno';
        document.getElementById('muRol').value     = usuario.rol     || 'alumno';
        document.getElementById('muEstado').value  = usuario.estado  || 'activo';
        document.getElementById('muPassword').value= '';
    } else {
        if (titulo) titulo.textContent = 'Nuevo Usuario';
        ['modalUsuarioId','muNombre','muCorreo','muPassword'].forEach(function(id) {
            var el = document.getElementById(id); if(el) el.value='';
        });
        document.getElementById('muTipo').value   = 'alumno';
        document.getElementById('muRol').value    = 'alumno';
        document.getElementById('muEstado').value = 'activo';
    }
    var errEl = document.getElementById('modalUsuarioError');
    if (errEl) errEl.style.display = 'none';
    backdrop.style.display = 'flex';
}

function cerrarModalUsuario() {
    var backdrop = document.getElementById('modalUsuarioBackdrop');
    if (backdrop) backdrop.style.display = 'none';
}

function guardarUsuario() {
    var nombre = document.getElementById('muNombre').value.trim();
    var correo = document.getElementById('muCorreo').value.trim();
    var tipo   = document.getElementById('muTipo').value;
    var rol    = document.getElementById('muRol').value;
    var estado = document.getElementById('muEstado').value;
    var errEl  = document.getElementById('modalUsuarioError');

    if (!nombre || !correo) {
        if (errEl) { errEl.textContent = 'Nombre y correo son obligatorios.'; errEl.style.display = 'block'; }
        return;
    }

    var id = document.getElementById('modalUsuarioId').value;
    var nuevo = { id: id || Date.now(), nombre: nombre, correo: correo, email: correo,
        tipo: tipo, rol: rol, estado: estado, fecha: new Date().toISOString() };

    // Guardar en la lista correspondiente
    var key = tipo === 'alumno' ? 'alumnosRegistrados' : 'visitantesRegistrados';
    var lista = JSON.parse(localStorage.getItem(key) || '[]');

    if (id) {
        // Editar
        var idx = lista.findIndex(function(u) { return String(u.id) === String(id) || u.correo === correo || u.email === correo; });
        if (idx !== -1) lista[idx] = Object.assign(lista[idx], nuevo);
        else lista.push(nuevo);
    } else {
        lista.push(nuevo);
    }
    localStorage.setItem(key, JSON.stringify(lista));

    // Actualizar estado bloqueado
    var bloqueados = JSON.parse(localStorage.getItem('usuariosBloqueados') || '[]');
    var idxBlq = bloqueados.indexOf(correo);
    if (estado === 'bloqueado' && idxBlq === -1) bloqueados.push(correo);
    if (estado === 'activo'    && idxBlq !== -1) bloqueados.splice(idxBlq, 1);
    localStorage.setItem('usuariosBloqueados', JSON.stringify(bloqueados));

    cerrarModalUsuario();
    cargarTablaUsuarios();
    actualizarKPIs();
    mostrarToast(id ? 'Usuario actualizado.' : 'Usuario creado correctamente.', 'success');
}

function toggleBloquearUsuario(emailOId, bloquear) {
    var bloqueados = JSON.parse(localStorage.getItem('usuariosBloqueados') || '[]');
    var idx = bloqueados.indexOf(emailOId);
    if (bloquear && idx === -1) bloqueados.push(emailOId);
    if (!bloquear && idx !== -1) bloqueados.splice(idx, 1);
    localStorage.setItem('usuariosBloqueados', JSON.stringify(bloqueados));
    cargarTablaUsuarios();
    actualizarKPIs();
    mostrarToast(bloquear ? 'Usuario bloqueado.' : 'Usuario desbloqueado.', 'success');
}

function eliminarUsuario(emailOId, tipo) {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    var key = tipo === 'alumno' ? 'alumnosRegistrados' : 'visitantesRegistrados';
    var lista = JSON.parse(localStorage.getItem(key) || '[]');
    lista = lista.filter(function(u) { return u.correo !== emailOId && u.email !== emailOId && String(u.id) !== String(emailOId); });
    localStorage.setItem(key, JSON.stringify(lista));
    cargarTablaUsuarios();
    actualizarKPIs();
    mostrarToast('Usuario eliminado.', 'success');
}

// =============================================
// DIRECTORIO — CONTACTOS DE ALUMNOS (solo lectura)
// =============================================
function cargarContactosAlumnos() {
    var alumnoDir = JSON.parse(localStorage.getItem('conoce_tec_directorio') || '[]');
    var personales = alumnoDir.filter(function(c) { return c.esInstitucional === false; });
    var body  = document.getElementById('dirAlumnosTableBody');
    var noMsg = document.getElementById('noDirAlumnosMsg');
    var count = document.getElementById('dirAlumnosCount');
    if (!body) return;
    body.innerHTML = '';
    if (count) count.textContent = personales.length;
    if (personales.length === 0) {
        if (noMsg) noMsg.style.display = 'block';
        return;
    }
    if (noMsg) noMsg.style.display = 'none';
    personales.forEach(function(c, i) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + (i + 1) + '</td>' +
            '<td>' + (c.nombre || '—') + '</td>' +
            '<td>' + (c.cargo || c.puesto || '—') + '</td>' +
            '<td>' + (c.area || '—') + '</td>' +
            '<td>' + (c.correo || c.email || '—') + '</td>' +
            '<td>' + (c.celular || c.telefono || '—') + '</td>';
        body.appendChild(tr);
    });
}

// =============================================
// CAFETERÍA — OPINIONES DE ALUMNOS Y VISITANTES
// =============================================
function cargarOpinionesCafeteria() {
    var opAlumnos   = JSON.parse(localStorage.getItem('cafeteria_opiniones')   || '[]');
    var opVisitantes= JSON.parse(localStorage.getItem('cafeteria_opiniones_v') || '[]');

    // Combinar y etiquetar origen
    var todas = [];
    opAlumnos.forEach(function(o)    { todas.push({ texto: o.texto, fecha: o.fecha, origen: 'Alumno' }); });
    opVisitantes.forEach(function(o) { todas.push({ texto: o.texto, fecha: o.fecha, origen: 'Visitante' }); });
    // Ordenar por fecha desc (texto simple, funciona para la mayoría de formatos)
    todas.sort(function(a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });

    var body  = document.getElementById('opinionesTableBody');
    var noMsg = document.getElementById('noOpinionesMsg');
    var count = document.getElementById('opinionesCount');
    if (!body) return;
    body.innerHTML = '';
    if (count) count.textContent = todas.length;
    if (todas.length === 0) {
        if (noMsg) noMsg.style.display = 'block';
        return;
    }
    if (noMsg) noMsg.style.display = 'none';
    todas.forEach(function(o, i) {
        var tr = document.createElement('tr');
        var badgeColor = o.origen === 'Alumno' ? '#3b82f6' : '#10b981';
        tr.innerHTML = '<td>' + (i + 1) + '</td>' +
            '<td><span class="task-badge" style="background:' + badgeColor + ';color:#fff;padding:2px 8px;border-radius:10px;font-size:.75rem;">' + o.origen + '</span></td>' +
            '<td style="max-width:400px;word-break:break-word;">' + (o.texto || '—') + '</td>' +
            '<td style="white-space:nowrap;">' + (o.fecha || '—') + '</td>';
        body.appendChild(tr);
    });
}

// =============================================
// GESTIÓN DE DIRECTORIO — SINCRONIZAR AL NAVEGAR
// =============================================

var DIRECTORIO_ADMIN_KEY = 'contactosTECAdmin';

/**
 * Sincroniza los contactos institucionales del admin dentro de la clave del alumno.
 * Preserva los contactos personales que el alumno haya agregado.
 * @param {Array} nuevosInst - array de contactos institucionales del admin
 */
function sincronizarDirectorioAlumno(nuevosInst) {
    var alumnoKey = 'conoce_tec_directorio';
    var alumnoData = JSON.parse(localStorage.getItem(alumnoKey) || '[]');
    // Conservar solo los personales
    var personales = alumnoData.filter(function(c) { return !c.esInstitucional; });
    // Marcar todos los del admin como institucionales
    var inst = (nuevosInst || []).map(function(c) { c.esInstitucional = true; return c; });
    // Combinar y guardar
    localStorage.setItem(alumnoKey, JSON.stringify(inst.concat(personales)));
}

function inicializarGestionDirectorio() {
    var btnNuevo   = document.getElementById('btnNuevoContactoDir');
    var btnCerrar  = document.getElementById('btnCerrarModalDir');
    var btnCancelar= document.getElementById('btnCancelarModalDir');
    var btnGuardar = document.getElementById('btnGuardarDir');
    var backdrop   = document.getElementById('modalDirBackdrop');
    var dirSearch  = document.getElementById('dirSearchInput');
    var dirFilter  = document.getElementById('dirFilterArea');

    if (btnNuevo)    btnNuevo.addEventListener('click',    function() { abrirModalDir(); });
    if (btnCerrar)   btnCerrar.addEventListener('click',   cerrarModalDir);
    if (btnCancelar) btnCancelar.addEventListener('click', cerrarModalDir);
    if (btnGuardar)  btnGuardar.addEventListener('click',  guardarDir);
    if (backdrop)    backdrop.addEventListener('click', function(e) { if(e.target===this) cerrarModalDir(); });
    if (dirSearch)   dirSearch.addEventListener('input',   filtrarDirectorio);
    if (dirFilter)   dirFilter.addEventListener('change',  filtrarDirectorio);
}

function cargarTablaDirectorio() {
    // Leer institucionales desde la clave del admin
    var adminContactos  = JSON.parse(localStorage.getItem(DIRECTORIO_ADMIN_KEY) || '[]');
    // Leer TODOS los contactos desde la clave del alumno (incluye personales)
    var alumnoContactos = JSON.parse(localStorage.getItem('conoce_tec_directorio') || '[]');

    // Contactos personales del alumno (esInstitucional: false o undefined en alumno-key)
    var personales = alumnoContactos.filter(function(c) { return !c.esInstitucional; });

    // Institucionales: preferir los del admin; si admin no tiene, usar los del alumno
    var institucionales = adminContactos.length > 0
        ? adminContactos.map(function(c){ c.esInstitucional = true; return c; })
        : alumnoContactos.filter(function(c){ return c.esInstitucional !== false; });

    var todos = institucionales.concat(personales);
    renderizarTablaDirectorio(todos);
}

var _dirData = [];

function renderizarTablaDirectorio(lista) {
    _dirData = lista;
    var body  = document.getElementById('dirTableBody');
    var noMsg = document.getElementById('noDirMsg');
    if (!body) return;
    body.innerHTML = '';

    if (lista.length === 0) {
        if (noMsg) noMsg.style.display = 'block';
        return;
    }
    if (noMsg) noMsg.style.display = 'none';

    lista.forEach(function(c, i) {
        var tr = document.createElement('tr');
        var tipoBadge = c.esInstitucional === false
            ? '<span class="task-badge badge-pending" title="Agregado por alumno">Personal</span>'
            : '<span class="task-badge badge-done" title="Contacto institucional">Institucional</span>';
        // Solo mostrar editar/eliminar para institucionales (los del admin)
        var acciones = c.esInstitucional !== false
            ? '<button class="tbl-btn" onclick="abrirModalDir(' + JSON.stringify(c).replace(/"/g,'&quot;') + ')" title="Editar"><i class="fas fa-edit"></i></button>' +
              '<button class="tbl-btn tbl-btn-danger" onclick="eliminarDir(' + (c.id||i) + ')" title="Eliminar"><i class="fas fa-trash"></i></button>'
            : '<span style="font-size:.72rem;color:#94a3b8;">Solo lectura</span>';
        tr.innerHTML = '<td>' + (i+1) + '</td>' +
            '<td>' + (c.nombre||'—') + '</td>' +
            '<td>' + tipoBadge + '</td>' +
            '<td>' + (c.cargo||c.puesto||'—') + '</td>' +
            '<td>' + (c.area||'—') + (c.carreraEsp ? '<br><span style="font-size:.7rem;color:#6b7a90;">' + c.carreraEsp + '</span>' : '') + '</td>' +
            '<td>' + (c.correo||c.email||'—') + '</td>' +
            '<td style="display:flex;gap:4px;align-items:center;">' + acciones + '</td>';
        body.appendChild(tr);
    });
}

function filtrarDirectorio() {
    var query = (document.getElementById('dirSearchInput') ? document.getElementById('dirSearchInput').value : '').toLowerCase();
    var area  = document.getElementById('dirFilterArea')   ? document.getElementById('dirFilterArea').value   : '';
    var adminContactos  = JSON.parse(localStorage.getItem(DIRECTORIO_ADMIN_KEY) || '[]');
    var alumnoContactos = JSON.parse(localStorage.getItem('conoce_tec_directorio') || '[]');
    var personales      = alumnoContactos.filter(function(c) { return !c.esInstitucional; });
    var institucionales = adminContactos.length > 0
        ? adminContactos.map(function(c){ c.esInstitucional = true; return c; })
        : alumnoContactos.filter(function(c){ return c.esInstitucional !== false; });
    var todos = institucionales.concat(personales);
    var filtrados = todos.filter(function(c) {
        return (!area  || c.area === area) &&
               (!query || (c.nombre||'').toLowerCase().indexOf(query) !== -1 || (c.cargo||'').toLowerCase().indexOf(query) !== -1);
    });
    renderizarTablaDirectorio(filtrados);
}

function abrirModalDir(contacto) {
    var backdrop = document.getElementById('modalDirBackdrop');
    var titulo   = document.getElementById('modalDirTitle');
    if (!backdrop) return;
    if (contacto && typeof contacto === 'object') {
        if (titulo) titulo.textContent = 'Editar Personal';
        document.getElementById('modalDirId').value         = contacto.id   || '';
        document.getElementById('dirNombre').value          = contacto.nombre|| '';
        document.getElementById('dirCargo').value           = contacto.cargo || contacto.puesto || '';
        document.getElementById('dirArea').value            = contacto.area  || 'Académico';
        document.getElementById('dirCorreo').value          = contacto.correo|| contacto.email || '';
        document.getElementById('dirTelefono').value        = contacto.celular||contacto.telefono||'';
        document.getElementById('dirEspecialidad').value    = (contacto.materias && contacto.materias.join ? contacto.materias.join(', ') : '') || contacto.especialidad || '';
        var carreraEspEl = document.getElementById('dirCarreraEsp');
        if (carreraEspEl) carreraEspEl.value = contacto.carreraEsp || '';
    } else {
        if (titulo) titulo.textContent = 'Agregar Personal';
        ['modalDirId','dirNombre','dirCargo','dirCorreo','dirTelefono','dirEspecialidad'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
        document.getElementById('dirArea').value = 'Académico';
        var carreraEspElNew = document.getElementById('dirCarreraEsp');
        if (carreraEspElNew) carreraEspElNew.value = '';
    }
    var errEl = document.getElementById('modalDirError');
    if (errEl) errEl.style.display = 'none';
    backdrop.style.display = 'flex';
}

function cerrarModalDir() {
    var backdrop = document.getElementById('modalDirBackdrop');
    if (backdrop) backdrop.style.display = 'none';
}

function guardarDir() {
    var nombre = document.getElementById('dirNombre').value.trim();
    var cargo  = document.getElementById('dirCargo').value.trim();
    var errEl  = document.getElementById('modalDirError');
    if (!nombre || !cargo) {
        if (errEl) { errEl.textContent='Nombre y cargo son obligatorios.'; errEl.style.display='block'; }
        return;
    }
    var id = document.getElementById('modalDirId').value;
    var areaSeleccionada = document.getElementById('dirArea').value;
    // Mapa de colores por área — mismo que usa el dashboard del alumno
    var colorPorAreaAdmin = {
        'Administración':                          'naranja',
        'Académico':                               'azul',
        'Servicios':                               'verde',
        'Coordinación':                            'rosa',
        'Dirección':                               'morado',
        'Dirección General':                       'indigo',
        'Subdirección Académica':                  'cian',
        'Subdirección de Planeación':              'teal',
        'Ingeniería en Gestión Empresarial':       'naranja',
        'Ingeniería Electromecánica':              'coral',
        'Ingeniería en Sistemas Computacionales':  'indigo',
        'Ingeniería Electrónica':                  'cian',
        'Ingeniería Ambiental':                    'teal',
        'Ingeniería Industrial':                   'amarillo',
        'Ingeniería Química':                      'morado',
        'Licenciatura en Administración':          'rosa',
        'Ingeniería en Inteligencia Artificial':   'lima',
        'Ingeniería en Desarrollo de Aplicaciones':'granate',
        'Posgrado':                                'oliva'
    };
    var colorAdmin = colorPorAreaAdmin[areaSeleccionada] || 'azul';
    var dirCarreraEspEl = document.getElementById('dirCarreraEsp');
    var dirCarreraEsp = dirCarreraEspEl ? dirCarreraEspEl.value : '';
    var nuevo = {
        id: id ? parseInt(id) : Date.now(),
        nombre: nombre, cargo: cargo.toUpperCase(), puesto: cargo,
        area: areaSeleccionada,
        carreraEsp: dirCarreraEsp,
        correo: document.getElementById('dirCorreo').value.trim(),
        email:  document.getElementById('dirCorreo').value.trim(),
        celular: document.getElementById('dirTelefono').value.trim(),
        telefono:document.getElementById('dirTelefono').value.trim(),
        especialidad: document.getElementById('dirEspecialidad').value.trim(),
        materias: document.getElementById('dirEspecialidad').value.split(',').map(function(m){return m.trim();}).filter(Boolean),
        esInstitucional: true, favorito: false, archivado: false,
        color: colorAdmin
    };

    var contactos = JSON.parse(localStorage.getItem(DIRECTORIO_ADMIN_KEY) || '[]');
    if (id) {
        var idx = contactos.findIndex(function(c){ return c.id === parseInt(id); });
        if (idx !== -1) contactos[idx] = Object.assign(contactos[idx], nuevo);
        else contactos.push(nuevo);
    } else {
        contactos.push(nuevo);
    }
    localStorage.setItem(DIRECTORIO_ADMIN_KEY, JSON.stringify(contactos));
    // ── Sincronizar con la clave del alumno ────────────────────────────────
    sincronizarDirectorioAlumno(contactos);
    cerrarModalDir();
    cargarTablaDirectorio();
    actualizarKPIs();
    mostrarToast(id ? 'Contacto actualizado.' : 'Personal agregado al directorio.', 'success');
}

function eliminarDir(idContacto) {
    if (!confirm('¿Eliminar este registro del directorio?')) return;
    var contactos = JSON.parse(localStorage.getItem(DIRECTORIO_ADMIN_KEY) || '[]');
    contactos = contactos.filter(function(c){ return c.id !== idContacto && c.id !== String(idContacto); });
    localStorage.setItem(DIRECTORIO_ADMIN_KEY, JSON.stringify(contactos));
    // ── Sincronizar con la clave del alumno ────────────────────────────────
    sincronizarDirectorioAlumno(contactos);
    cargarTablaDirectorio();
    actualizarKPIs();
    mostrarToast('Registro eliminado del directorio.', 'success');
}

// =============================================
// ESTADÍSTICAS — EXPORTAR REPORTE
// =============================================
function exportarReporte() {
    var registrados = parseInt(localStorage.getItem('contadorRegistrados') || '0', 10);
    var visitas     = parseInt(localStorage.getItem('contadorVisitas')     || '0', 10);
    var menus       = JSON.parse(localStorage.getItem('menusCafeteria')    || '[]');
    var contactos   = JSON.parse(localStorage.getItem('contactosTECAdmin') || '[]');
    var visitantes  = JSON.parse(localStorage.getItem('visitantesRegistrados') || '[]');
    var errores     = JSON.parse(localStorage.getItem('reportesError')     || '[]');

    var reporte = [
        '========================================',
        'REPORTE DE ESTADÍSTICAS — CONOCE-TEC',
        'Generado: ' + new Date().toLocaleString('es-MX'),
        '========================================',
        '',
        'VISITAS Y USUARIOS',
        '  Visitas totales:       ' + visitas,
        '  Alumnos registrados:   ' + registrados,
        '  Visitantes:            ' + visitantes.length,
        '',
        'CONTENIDO',
        '  Menús publicados:      ' + menus.length,
        '  Contactos directorio:  ' + contactos.length,
        '',
        'USO DEL SISTEMA',
        '  Inicios de sesión:     ' + (localStorage.getItem('ctec_usoLogin')     || '0'),
        '  Registros:             ' + (localStorage.getItem('ctec_usoRegistros') || '0'),
        '  Visitas al Mapa:       ' + (localStorage.getItem('ctec_usoMapa')      || '0'),
        '  Visitas Directorio:    ' + (localStorage.getItem('ctec_usoDirectorio')|| '0'),
        '  Visitas Cafetería:     ' + (localStorage.getItem('ctec_usoCafeteria') || '0'),
        '',
        'REPORTES DE ERROR',
        '  Total de errores:      ' + errores.length,
        '',
        '========================================'
    ].join('\n');

    var blob = new Blob([reporte], { type: 'text/plain;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = 'reporte_conocetec_' + new Date().toISOString().slice(0,10) + '.txt';
    a.click(); URL.revokeObjectURL(url);
    mostrarToast('Reporte exportado como .txt', 'success');
}

// =============================================
// ESTADÍSTICAS — ERRORES
// =============================================
function simularError() {
    var errores = JSON.parse(localStorage.getItem('reportesError') || '[]');
    errores.push({
        tipo: 'Error de prueba',
        pantalla: 'Dashboard Administrador',
        descripcion: 'Este es un reporte de error generado para pruebas del sistema.',
        fecha: new Date().toISOString(),
        estado: 'pendiente'
    });
    localStorage.setItem('reportesError', JSON.stringify(errores));
    renderizarErrores();
    generarNotificaciones();
    mostrarToast('Error de prueba reportado.', 'success');
}

function renderizarErrores() {
    var erroresList = document.getElementById('erroresList');
    var noErroresMsg= document.getElementById('noErroresMsg');
    if (!erroresList) return;
    var errores = JSON.parse(localStorage.getItem('reportesError') || '[]');
    if (errores.length === 0) {
        if (noErroresMsg) noErroresMsg.style.display = 'block';
        return;
    }
    if (noErroresMsg) noErroresMsg.style.display = 'none';
    erroresList.innerHTML = errores.slice(-3).map(function(e) {
        return '<div class="reporte-item"><strong>' + (e.tipo||'Error') + '</strong>' +
            '<span>' + (e.pantalla ? 'Pantalla: '+e.pantalla+' — ' : '') + (e.descripcion||'') + '</span>' +
            '<time>' + new Date(e.fecha).toLocaleString('es-MX') + '</time></div>';
    }).join('');
}

// =============================================
// SOPORTE TÉCNICO
// =============================================
function inicializarSoporte() {
    var btnEnviar = document.getElementById('btnEnviarReporte');
    if (btnEnviar) btnEnviar.addEventListener('click', enviarReporteSoporte);
}

function enviarReporteSoporte() {
    var tipo        = document.getElementById('soporteTipo')        ? document.getElementById('soporteTipo').value        : '';
    var pantalla    = document.getElementById('soportePantalla')    ? document.getElementById('soportePantalla').value.trim() : '';
    var descripcion = document.getElementById('soporteDescripcion') ? document.getElementById('soporteDescripcion').value.trim() : '';
    var msgEl       = document.getElementById('soporteMsg');

    if (!descripcion) {
        if (msgEl) { msgEl.style.display='block'; msgEl.style.color='#ef4444'; msgEl.textContent='La descripción del problema es obligatoria.'; }
        return;
    }

    var reportes = JSON.parse(localStorage.getItem('reportesSoporte') || '[]');
    reportes.push({ tipo:tipo, pantalla:pantalla, descripcion:descripcion,
        fecha: new Date().toISOString(), estado:'Enviado',
        adminNombre: sessionStorage.getItem('nombreUsuario') || 'Administrador' });
    localStorage.setItem('reportesSoporte', JSON.stringify(reportes));

    // Limpiar formulario
    if (document.getElementById('soportePantalla'))    document.getElementById('soportePantalla').value    = '';
    if (document.getElementById('soporteDescripcion')) document.getElementById('soporteDescripcion').value = '';
    if (msgEl) { msgEl.style.display='block'; msgEl.style.color='#10b981'; msgEl.textContent='✔ Reporte enviado y guardado correctamente.'; }

    renderizarReportesSoporte();
    mostrarToast('Reporte de soporte enviado.', 'success');
}

function renderizarReportesSoporte() {
    var container = document.getElementById('reportesEnviados');
    if (!container) return;
    var reportes = JSON.parse(localStorage.getItem('reportesSoporte') || '[]');
    if (reportes.length === 0) {
        container.innerHTML = '<p style="color:#888;font-size:.8rem;text-align:center;padding:10px 0;">Sin reportes enviados.</p>';
        return;
    }
    container.innerHTML = reportes.slice(-3).map(function(r) {
        return '<div class="reporte-item"><strong>' + (r.tipo||'Reporte') + '</strong>' +
            '<span>' + (r.pantalla ? r.pantalla+' — ' : '') + (r.descripcion||'').substring(0,60) + (r.descripcion && r.descripcion.length>60?'...':'') + '</span>' +
            '<time>' + new Date(r.fecha).toLocaleString('es-MX') + ' · ' + (r.estado||'Enviado') + '</time></div>';
    }).join('');
}

// =============================================
// RESPALDO
// =============================================
function generarRespaldo() {
    var datos = {
        descripcion: 'Respaldo local de datos de CONOCE-TEC.',
        nota: 'Contiene datos del localStorage de este navegador. No es una base de datos remota.',
        fecha: new Date().toISOString(),
        estadisticas: { visitas: parseInt(localStorage.getItem('contadorVisitas')||'0',10), registrados: parseInt(localStorage.getItem('contadorRegistrados')||'0',10) },
        alumnosRegistrados:    JSON.parse(localStorage.getItem('alumnosRegistrados')    ||'[]'),
        visitantesRegistrados: JSON.parse(localStorage.getItem('visitantesRegistrados') ||'[]'),
        contactosDirectorio:   JSON.parse(localStorage.getItem('contactosTECAdmin')    ||'[]'),
        reportesSoporte:       JSON.parse(localStorage.getItem('reportesSoporte')      ||'[]'),
        reportesError:         JSON.parse(localStorage.getItem('reportesError')        ||'[]')
    };
    var blob = new Blob([JSON.stringify(datos, null, 2)], { type:'application/json' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    var fechaStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
    a.href = url; a.download = 'backup_conocetec_' + fechaStr + '.json';
    a.click(); URL.revokeObjectURL(url);
    mostrarToast('Respaldo descargado: backup_conocetec_' + fechaStr + '.json', 'success');
}

// =============================================
// TOAST
// =============================================
function mostrarToast(msg, tipo) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;' +
        'background:' + (tipo==='success' ? '#10b981' : '#ef4444') + ';' +
        'color:#fff;padding:12px 20px;border-radius:10px;font-size:.85rem;font-weight:700;' +
        'box-shadow:0 4px 16px rgba(0,0,0,0.15);max-width:340px;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 4000);
}

// =============================================
// MODO OSCURO — ADMINISTRADOR
// =============================================
function inicializarModoOscuroAdmin() {
    // Aplicar preferencia guardada al cargar
    var savedDark = localStorage.getItem('darkMode_admin') === 'true';
    if (savedDark) document.body.classList.add('dark-mode');

    var btn = document.getElementById('btnDarkModeAdmin');
    if (!btn) return;

    // Actualizar ícono según estado actual
    actualizarIconoDarkAdmin();

    btn.addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');
        var isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode_admin', isDark);
        actualizarIconoDarkAdmin();
    });
}

function actualizarIconoDarkAdmin() {
    var btn  = document.getElementById('btnDarkModeAdmin');
    if (!btn) return;
    var icon = btn.querySelector('i');
    var isDark = document.body.classList.contains('dark-mode');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    btn.title = isDark ? 'Modo claro' : 'Modo oscuro';
}

// =============================================
// PERMISO DE PERFIL POR ALUMNO
// =============================================

/* Clave en localStorage: perfilPermitido_{correo} = "true"|"false" */

function getPerfilPermitido(correo) {
    var key = 'perfilPermitido_' + correo;
    var val = localStorage.getItem(key);
    // Por defecto: permitido si no hay valor guardado
    return val === null ? true : val === 'true';
}

function setPerfilPermitido(correo, permitido) {
    localStorage.setItem('perfilPermitido_' + correo, permitido ? 'true' : 'false');
}

// Sobrescribir renderizarTablaUsuarios para añadir columna de permiso de perfil
(function () {
    var _original = window.renderizarTablaUsuarios || renderizarTablaUsuarios;

    window.renderizarTablaUsuariosAdmin = function (lista) {
        var table = document.getElementById('usersTable');
        var body  = document.getElementById('usersTableBody');
        var noMsg = document.getElementById('noUsersMsg');
        if (!body) return;
        body.innerHTML = '';

        if (lista.length === 0) {
            if (table) table.style.display = 'none';
            if (noMsg) noMsg.style.display = 'block';
            return;
        }
        if (table) table.style.display = 'table';
        if (noMsg) noMsg.style.display = 'none';

        // Asegurar que el encabezado tenga la columna "Perfil"
        var thead = table ? table.querySelector('thead tr') : null;
        if (thead && !thead.querySelector('th[data-col="perfil"]')) {
            var thPerfil = document.createElement('th');
            thPerfil.setAttribute('data-col', 'perfil');
            thPerfil.textContent = 'Perfil';
            // Insertar antes de la columna "Acciones" (última)
            thead.insertBefore(thPerfil, thead.lastElementChild);
        }

        lista.forEach(function (u, i) {
            var tr = document.createElement('tr');
            var bTipo   = u.tipo === 'alumno'
                ? '<span class="task-badge badge-done">Alumno</span>'
                : '<span class="task-badge badge-pending">Visitante</span>';
            var bEstado = u.estado === 'bloqueado'
                ? '<span class="task-badge badge-bloqueado">Bloqueado</span>'
                : '<span class="task-badge badge-activo">Activo</span>';
            var fecha = u.fecha ? (function(f){ var d=new Date(f); return isNaN(d)?f:d.toLocaleDateString('es-MX'); })(u.fecha) : '—';

            var btnBloquear = u.estado === 'bloqueado'
                ? '<button class="tbl-btn" onclick="toggleBloquearUsuario(\'' + (u.email || u.id) + '\', false)" title="Desbloquear"><i class="fas fa-unlock"></i></button>'
                : '<button class="tbl-btn tbl-btn-warn" onclick="toggleBloquearUsuario(\'' + (u.email || u.id) + '\', true)" title="Bloquear"><i class="fas fa-ban"></i></button>';

            // Toggle de permiso de perfil (solo para alumnos)
            var tdPerfil = '—';
            if (u.tipo === 'alumno') {
                var permitido = getPerfilPermitido(u.email || u.id);
                var toggleChecked = permitido ? 'checked' : '';
                tdPerfil = '<label class="adm-toggle-mini" title="' + (permitido ? 'Perfil permitido' : 'Perfil bloqueado') + '">' +
                    '<input type="checkbox" ' + toggleChecked + ' onchange="togglePerfilPermiso(\'' + (u.email || u.id) + '\', this.checked)">' +
                    '<span class="adm-toggle-slider-mini"></span>' +
                    '</label>';
            }

            tr.innerHTML = '<td>' + (i + 1) + '</td>' +
                '<td>' + u.nombre + '</td>' +
                '<td>' + bTipo + '</td>' +
                '<td>' + u.email + '</td>' +
                '<td>' + bEstado + '</td>' +
                '<td>' + fecha + '</td>' +
                '<td>' + tdPerfil + '</td>' +
                '<td style="display:flex;gap:4px;">' +
                    '<button class="tbl-btn" onclick="abrirModalUsuario(' + JSON.stringify(u).replace(/"/g, '&quot;') + ')" title="Editar"><i class="fas fa-edit"></i></button>' +
                    btnBloquear +
                    '<button class="tbl-btn tbl-btn-danger" onclick="eliminarUsuario(\'' + (u.email || u.id) + '\', \'' + u.tipo + '\')" title="Eliminar"><i class="fas fa-trash"></i></button>' +
                '</td>';
            body.appendChild(tr);
        });
    };

    // Parchamos cargarTablaUsuarios para usar la versión extendida
    var _origCargar = window.cargarTablaUsuarios;
    window.cargarTablaUsuarios = function () {
        if (typeof _origCargar === 'function') _origCargar();
        // Re-render con versión extendida
        setTimeout(function () {
            if (window.todosUsuarios && window.todosUsuarios.length > 0) {
                window.renderizarTablaUsuariosAdmin(window.todosUsuarios);
            }
        }, 50);
    };
})();

function togglePerfilPermiso(correo, permitido) {
    setPerfilPermitido(correo, permitido);
    mostrarToast(
        permitido ? '✅ Acceso al perfil habilitado para ' + correo : '🔒 Acceso al perfil bloqueado para ' + correo,
        permitido ? 'success' : 'error'
    );
}



// =============================================
// PANEL NOTIFICACIONES
// =============================================
function cargarPanelNotificaciones() {
    var alumnos    = JSON.parse(localStorage.getItem('alumnosRegistrados') || '[]');
    var visitantes = JSON.parse(localStorage.getItem('visitantesRegistrados') || '[]');
    var menus      = JSON.parse(localStorage.getItem('menusCafeteria') || '[]');
    var visitas    = parseInt(localStorage.getItem('contadorVisitas') || '0', 10);
    var reportes   = JSON.parse(localStorage.getItem('reportesSoporte') || '[]');

    // Alertas del sistema
    var alertaAlumnos = document.getElementById('alertaNuevosAlumnos');
    var alertaMenusEl = document.getElementById('alertaMenus');
    var alertaVisEl   = document.getElementById('alertaVisitas');
    if (alertaAlumnos) alertaAlumnos.textContent = alumnos.length > 0 ? alumnos.length + ' alumno(s) registrado(s) en el sistema.' : 'Sin registros nuevos en este dispositivo.';
    if (alertaMenusEl) alertaMenusEl.textContent = menus.length > 0 ? menus.length + ' menú(s) publicado(s) en cafetería.' : 'Sin menús publicados aún.';
    if (alertaVisEl)   alertaVisEl.textContent   = visitas > 0 ? visitas + ' visita(s) registrada(s) en total.' : 'Sin visitas registradas aún.';

    // Solicitudes pendientes - alumnos recientes
    var solEl = document.getElementById('solicitudesPendientes');
    if (solEl) {
        var recientes = alumnos.slice(-5).reverse(); // últimos 5
        if (recientes.length === 0) {
            solEl.innerHTML = '<p style="color:#888;font-size:.8rem;text-align:center;padding:12px 0;"><i class="fas fa-check-circle" style="color:#10b981;"></i> Sin solicitudes pendientes.</p>';
        } else {
            solEl.innerHTML = recientes.map(function(a) {
                var fecha = a.fecha ? (function(f){ var d=new Date(f); return isNaN(d)?f:d.toLocaleDateString('es-MX'); })(a.fecha) : '—';
                var correo = a.correo || a.email || '—';
                return '<div class="solicitud-item solicitud-item-link" style="cursor:pointer;" onclick="navegarPanel(\'usuarios-content\')" title="Ver en Gestión de Usuarios">' +
                    '<i class="fas fa-user-circle" style="font-size:1.4rem;color:#3b82f6;"></i>' +
                    '<div class="sol-info">' +
                        '<div class="sol-nombre">' + (a.nombreCompleto || a.nombre || '—') + '</div>' +
                        '<div class="sol-fecha">' + correo + ' · ' + fecha + '</div>' +
                    '</div>' +
                    '<span class="sol-badge">Nuevo</span>' +
                    '<i class="fas fa-chevron-right" style="color:#94a3b8;font-size:.75rem;margin-left:4px;flex-shrink:0;"></i>' +
                '</div>';
            }).join('');
        }
    }

    // Mensajes de usuarios (reportes de soporte)
    var mensEl = document.getElementById('mensajesUsuarios');
    if (mensEl) {
        if (reportes.length === 0) {
            mensEl.innerHTML = '<p style="color:#888;font-size:.8rem;text-align:center;padding:12px 0;">Sin mensajes recibidos.</p>';
        } else {
            mensEl.innerHTML = reportes.slice(0, 5).map(function(r) {
                return '<div class="solicitud-item">' +
                    '<i class="fas fa-envelope" style="font-size:1.2rem;color:#8b5cf6;"></i>' +
                    '<div class="sol-info">' +
                        '<div class="sol-nombre">' + r.tipo + (r.pantalla && r.pantalla !== '—' ? ' — ' + r.pantalla : '') + '</div>' +
                        '<div class="sol-fecha">' + (r.origen || 'Desconocido') + ' · ' + new Date(r.fecha).toLocaleDateString('es-MX') + '</div>' +
                    '</div>' +
                    '<span class="sol-badge" style="background:#ede9fe;color:#6d28d9;">' + (r.estado || 'Enviado') + '</span>' +
                '</div>';
            }).join('');
        }
    }

    // Actualizar badge en nav — respetar última lectura
    var ultimaLectura = localStorage.getItem('notifUltimaLectura');
    var nuevosDesdeUltimaLectura = alumnos.filter(function(a) {
        if (!ultimaLectura) return true;
        return a.fecha && new Date(a.fecha) > new Date(ultimaLectura);
    });
    var total = nuevosDesdeUltimaLectura.length + reportes.length;
    var badge = document.getElementById('snavNotifBadge');
    if (badge) {
        if (total > 0) { badge.style.display = 'inline'; badge.textContent = total; }
        else { badge.style.display = 'none'; }
    }
}

// =============================================
// PANEL SEGURIDAD
// =============================================
function cargarPanelSeguridad() {
    // Historial de accesos
    var histEl = document.getElementById('historialAccesos');
    if (histEl) {
        var historial = JSON.parse(localStorage.getItem('historialAccesosAdmin') || '[]');
        // Registrar acceso actual si aún no está
        var ahora = new Date().toISOString();
        if (historial.length === 0 || historial[0].fecha !== ahora) {
            historial.unshift({ fecha: ahora, tipo: 'Sesión activa', ip: 'Dispositivo local' });
            if (historial.length > 10) historial = historial.slice(0, 10);
            localStorage.setItem('historialAccesosAdmin', JSON.stringify(historial));
        }
        if (historial.length === 0) {
            histEl.innerHTML = '<p style="color:#888;font-size:.8rem;text-align:center;padding:8px 0;">Sin historial en este dispositivo.</p>';
        } else {
            histEl.innerHTML = historial.map(function(h) {
                return '<div class="historial-item">' +
                    '<i class="fas fa-sign-in-alt"></i>' +
                    '<div>' +
                        '<span style="font-weight:600;">' + h.tipo + '</span>' +
                        '<span style="color:#94a3b8;margin-left:8px;font-size:.72rem;">' + new Date(h.fecha).toLocaleString('es-MX') + '</span>' +
                    '</div>' +
                '</div>';
            }).join('');
        }
    }

    // Control de permisos de perfil
    var permEl = document.getElementById('permisosPerfilLista');
    if (permEl) {
        var alumnos = JSON.parse(localStorage.getItem('alumnosRegistrados') || '[]');
        if (alumnos.length === 0) {
            permEl.innerHTML = '<p style="color:#888;font-size:.8rem;text-align:center;padding:8px 0;">Sin alumnos registrados aún.</p>';
        } else {
            permEl.innerHTML = alumnos.slice(0, 6).map(function(a) {
                var correo = a.correo || a.email || '';
                var permitido = getPerfilPermitido(correo);
                var checked = permitido ? 'checked' : '';
                return '<div class="permiso-item">' +
                    '<div>' +
                        '<div class="perm-nombre">' + (a.nombreCompleto || a.nombre || '—') + '</div>' +
                        '<div class="perm-correo">' + correo + '</div>' +
                    '</div>' +
                    '<label class="adm-toggle-mini">' +
                        '<input type="checkbox" ' + checked + ' onchange="togglePerfilPermiso(\'' + correo + '\', this.checked)">' +
                        '<span class="adm-toggle-slider-mini"></span>' +
                    '</label>' +
                '</div>';
            }).join('');
        }
    }

    // Estado 2FA
    var t2faAdmin   = document.getElementById('toggle2FAAdmin');
    var t2faAlumnos = document.getElementById('toggle2FAAlumnos');
    if (t2faAdmin)   t2faAdmin.checked   = localStorage.getItem('2fa_admin') === 'true';
    if (t2faAlumnos) t2faAlumnos.checked = localStorage.getItem('2fa_alumnos') === 'true';

    // Cambiar contraseña
    var btnPass = document.getElementById('btnCambiarPassAdmin');
    if (btnPass && !btnPass._bound) {
        btnPass._bound = true;
        btnPass.addEventListener('click', function() {
            var actual   = document.getElementById('segPassActual').value;
            var nueva    = document.getElementById('segPassNueva').value;
            var confirma = document.getElementById('segPassConfirm').value;
            var msg      = document.getElementById('segPassMsg');
            if (!actual || !nueva || !confirma) {
                if (msg) { msg.style.display = 'block'; msg.style.color = '#ef4444'; msg.textContent = 'Completa todos los campos.'; }
                return;
            }
            if (nueva !== confirma) {
                if (msg) { msg.style.display = 'block'; msg.style.color = '#ef4444'; msg.textContent = 'Las contraseñas nuevas no coinciden.'; }
                return;
            }
            // Guardar nueva (simulado)
            localStorage.setItem('adminPassword', nueva);
            ['segPassActual','segPassNueva','segPassConfirm'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
            if (msg) { msg.style.display = 'block'; msg.style.color = '#10b981'; msg.textContent = '✅ Contraseña actualizada correctamente.'; setTimeout(function(){ msg.style.display='none'; }, 3500); }
            mostrarToast('Contraseña de administrador actualizada.', 'success');
        });
    }
}

function toggle2FA(tipo, activo) {
    localStorage.setItem('2fa_' + tipo, activo ? 'true' : 'false');
    var msg = document.getElementById('seg2FAMsg');
    if (msg) {
        msg.style.display = 'block';
        msg.textContent = activo ? '✅ 2FA activado para ' + (tipo === 'admin' ? 'administrador' : 'alumnos') + '.' : 'ℹ️ 2FA desactivado para ' + (tipo === 'admin' ? 'administrador' : 'alumnos') + '.';
        setTimeout(function(){ msg.style.display = 'none'; }, 3000);
    }
}

// =============================================
// PANEL CONFIGURACIÓN
// =============================================
function cargarPanelConfiguracion() {
    // Cargar preferencias guardadas
    var cfg = JSON.parse(localStorage.getItem('sistemConfig') || '{}');

    // Módulos
    document.querySelectorAll('[data-modulo]').forEach(function(input) {
        var m = input.getAttribute('data-modulo');
        input.checked = cfg['modulo_' + m] !== false; // default true
    });

    // Funciones
    document.querySelectorAll('[data-funcion]').forEach(function(input) {
        var f = input.getAttribute('data-funcion');
        input.checked = cfg['funcion_' + f] !== false;
    });

    // Color y modo
    var color = document.getElementById('cfgColorPrimario');
    var modo  = document.getElementById('cfgModoDefault');
    if (color) color.value = cfg.colorPrimario || '#1a3a6b';
    if (modo)  modo.value  = cfg.modoDefault   || 'claro';

    // Guardar
    var btnGuardar = document.getElementById('btnGuardarConfigSistema');
    if (btnGuardar && !btnGuardar._bound) {
        btnGuardar._bound = true;
        btnGuardar.addEventListener('click', function() {
            var nuevoCfg = JSON.parse(localStorage.getItem('sistemConfig') || '{}');
            document.querySelectorAll('[data-modulo]').forEach(function(input) {
                nuevoCfg['modulo_' + input.getAttribute('data-modulo')] = input.checked;
            });
            document.querySelectorAll('[data-funcion]').forEach(function(input) {
                nuevoCfg['funcion_' + input.getAttribute('data-funcion')] = input.checked;
            });
            var c = document.getElementById('cfgColorPrimario');
            var m = document.getElementById('cfgModoDefault');
            if (c) nuevoCfg.colorPrimario = c.value;
            if (m) nuevoCfg.modoDefault   = m.value;
            localStorage.setItem('sistemConfig', JSON.stringify(nuevoCfg));
            var msg = document.getElementById('cfgSistemaMsg');
            if (msg) { msg.style.display = 'block'; msg.textContent = '✅ Configuración guardada.'; setTimeout(function(){ msg.style.display='none'; }, 3000); }
            mostrarToast('Configuración del sistema guardada.', 'success');
        });
    }
}

function guardarModulo(input) {
    var cfg = JSON.parse(localStorage.getItem('sistemConfig') || '{}');
    cfg['modulo_' + input.getAttribute('data-modulo')] = input.checked;
    localStorage.setItem('sistemConfig', JSON.stringify(cfg));
}

function guardarFuncion(input) {
    var cfg = JSON.parse(localStorage.getItem('sistemConfig') || '{}');
    cfg['funcion_' + input.getAttribute('data-funcion')] = input.checked;
    localStorage.setItem('sistemConfig', JSON.stringify(cfg));
}

// =============================================
// SECCIÓN ADMINISTRADORES REGISTRADOS
// =============================================
function inicializarSeccionAdmins() {
    // Card clickeable que muestra/oculta la sección
    var cardAdmins = document.getElementById('ustatCardAdmins');
    if (cardAdmins) {
        cardAdmins.addEventListener('click', function() {
            var sec = document.getElementById('adminsSection');
            if (!sec) return;
            var visible = sec.style.display !== 'none';
            sec.style.display = visible ? 'none' : 'block';
            if (!visible) {
                cargarTablaAdmins();
                sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    // Botón cerrar sección admins
    var btnOcultar = document.getElementById('btnOcultarAdmins');
    if (btnOcultar) {
        btnOcultar.addEventListener('click', function() {
            var sec = document.getElementById('adminsSection');
            if (sec) sec.style.display = 'none';
        });
    }
}

function cargarTablaAdmins() {
    // Cargar lista de admins registrados desde localStorage
    var admins = JSON.parse(localStorage.getItem('adminsRegistrados') || '[]');
    // También incluir el adminData del admin actual si existe
    var adminData = JSON.parse(localStorage.getItem('adminData') || 'null');
    if (adminData && adminData.nombreCompleto) {
        var yaEsta = admins.some(function(a) { return a.usuario === adminData.usuario || a.correoInstitucional === adminData.correoInstitucional; });
        if (!yaEsta) admins.unshift(adminData);
    }

    var num = document.getElementById('ustatAdmins');
    if (num) num.textContent = admins.length || (adminData ? 1 : 0);

    var table   = document.getElementById('adminsTable');
    var body    = document.getElementById('adminsTableBody');
    var noMsg   = document.getElementById('noAdminsMsg');
    if (!body) return;
    body.innerHTML = '';

    if (admins.length === 0) {
        if (table)  table.style.display  = 'none';
        if (noMsg)  noMsg.style.display  = 'block';
        return;
    }
    if (table)  table.style.display  = 'table';
    if (noMsg)  noMsg.style.display  = 'none';

    admins.forEach(function(a, i) {
        var tr = document.createElement('tr');
        var fechaReg = a.fecha ? (function(f){ var d=new Date(f); return isNaN(d)?f:d.toLocaleDateString('es-MX'); })(a.fecha) : '—';
        tr.innerHTML = '<td>' + (i + 1) + '</td>' +
            '<td>' + (a.nombreCompleto || '—') + '</td>' +
            '<td><code>' + (a.usuario || 'admin') + '</code></td>' +
            '<td>' + (a.correoInstitucional || '—') + '</td>' +
            '<td>' + (a.areaDepartamento || '—') + '</td>' +
            '<td><span class="task-badge badge-done">' + (a.rol || 'Administrador') + '</span></td>' +
            '<td>' + fechaReg + '</td>';
        body.appendChild(tr);
    });
}


// =============================================
// SINCRONIZACIÓN DE VISITAS (solo lectura — las registran alumno y visitante)
// =============================================
(function() {
    // El admin NO incrementa el contador de visitas.
    // Solo lee lo que alumno y visitante registraron.
    function sincronizarVisitasConServidor() {
        fetch('/api/visits').then(function(r) { return r.json(); }).then(function(v) {
            var totalServidor = v.total || 0;
            var hoyServidor   = v.hoy   || 0;
            var totalLocal = parseInt(localStorage.getItem('contadorVisitas')    || '0', 10);
            var hoyLocal   = parseInt(localStorage.getItem('contadorVisitasHoy') || '0', 10);
            var totalFinal = Math.max(totalServidor, totalLocal);
            var hoyFinal   = Math.max(hoyServidor,  hoyLocal);
            actualizarKPIsVisitas(totalFinal, hoyFinal);
        }).catch(function() {
            var total = parseInt(localStorage.getItem('contadorVisitas')    || '0', 10);
            var hoy   = parseInt(localStorage.getItem('contadorVisitasHoy') || '0', 10);
            actualizarKPIsVisitas(total, hoy);
        });
    }

    function actualizarKPIsVisitas(total, hoy) {
        var fmt = function(n) { return n > 0 ? n.toLocaleString('es-MX') : '0'; };
        var set = function(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
        set('kpiVisitasTotales', fmt(total));
        set('kpiVisitasHoy',     fmt(hoy));
        set('statKpiVisitas',    fmt(total));
        set('resumVisitas',      total > 0 ? total + ' visita(s)' : 'Sin visitas aún');
        set('actVisitas',        total + ' visita(s) registrada(s) en total.');
    }

    document.addEventListener('DOMContentLoaded', function() {
        sincronizarVisitasConServidor();
        setInterval(sincronizarVisitasConServidor, 30000);
    });

    // Actualizar inmediatamente si otro tab (alumno/visitante) cambia el contador
    window.addEventListener('storage', function(e) {
        if (e.key === 'contadorVisitas' || e.key === 'contadorVisitasHoy') {
            sincronizarVisitasConServidor();
        }
    });
})();