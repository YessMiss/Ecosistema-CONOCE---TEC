// ========================================
// INICIALIZACIÓN Y VARIABLES GLOBALES
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // ===== VERIFICAR PERMISO DE PERFIL =====
    var correo = sessionStorage.getItem('correoUsuario') ||
                 localStorage.getItem('correoUsuarioActual') ||
                 localStorage.getItem('correoAlumno') || '';

    var key = 'perfilPermitido_' + correo;
    var val = localStorage.getItem(key);
    // Por defecto permitido (null = nunca configurado por admin)
    var permitido = (val === null) ? true : (val === 'true');

    if (!permitido) {
        // Mostrar pantalla bloqueada, ocultar contenido de perfil
        var bloqueado = document.getElementById('perfilBloqueadoWrap');
        var contenido = document.querySelector('.profile-container');
        if (bloqueado) bloqueado.style.display = 'flex';
        if (contenido) contenido.style.display = 'none';
        return; // No cargar datos ni eventos
    }

    cargarDatosUsuario();
    configurarEventos();

    // Escuchar si el admin cambia el permiso de perfil en tiempo real
    window.addEventListener('storage', function(e) {
        if (correo && e.key === 'perfilPermitido_' + correo) {
            var nuevaVal = localStorage.getItem('perfilPermitido_' + correo);
            var ahoraPermitido = (nuevaVal === null) ? true : (nuevaVal === 'true');
            var bloqueado = document.getElementById('perfilBloqueadoWrap');
            var contenido = document.querySelector('.profile-container');
            if (!ahoraPermitido) {
                if (bloqueado) bloqueado.style.display = 'flex';
                if (contenido) contenido.style.display = 'none';
            } else {
                if (bloqueado) bloqueado.style.display = 'none';
                if (contenido) contenido.style.display = '';
            }
        }
    });
});

// ========================================
// CARGAR DATOS DEL USUARIO
// ========================================

function cargarDatosUsuario() {
    // Identificar al alumno actual por su correo
    var correoUsuario = sessionStorage.getItem('correoUsuario') ||
                        localStorage.getItem('correoUsuarioActual') ||
                        localStorage.getItem('correoAlumno') || '';

    // Cargar perfil guardado específico de este alumno (si ya editó su perfil antes)
    var perfilGuardado = {};
    if (correoUsuario) {
        try { perfilGuardado = JSON.parse(localStorage.getItem('perfil_' + correoUsuario) || '{}'); } catch(e) {}
    }

    // Buscar en alumnosRegistrados para recuperar datos del registro inicial
    var numControlRegistro = '';
    var carreraRegistro    = '';
    var semestreRegistro   = '';
    if (correoUsuario) {
        var alumnosArr = JSON.parse(localStorage.getItem('alumnosRegistrados') || '[]');
        var alumnoReg = alumnosArr.find(function(a) { return (a.correo || a.email) === correoUsuario; });
        if (alumnoReg) {
            numControlRegistro = alumnoReg.numControl || alumnoReg.numeroControl || '';
            carreraRegistro    = alumnoReg.carrera    || '';
            semestreRegistro   = alumnoReg.semestre   || '';
        }
    }

    var nombreUsuario = perfilGuardado.nombre ||
                        sessionStorage.getItem('nombreUsuario') ||
                        sessionStorage.getItem('usuarioActual') ||
                        localStorage.getItem('nombreUsuarioActual') || '—';

    var numControl = perfilGuardado.numControl ||
                     sessionStorage.getItem('numeroControl') ||
                     localStorage.getItem('numControlActual') ||
                     localStorage.getItem('numControlGuardado') ||
                     numControlRegistro || '';

    var carrera  = perfilGuardado.carrera  || sessionStorage.getItem('carreraUsuario')  || localStorage.getItem('carreraActual')  || localStorage.getItem('carreraGuardada')  || carreraRegistro  || '';
    var semestre = perfilGuardado.semestre || sessionStorage.getItem('semestreUsuario') || localStorage.getItem('semestreActual') || localStorage.getItem('semestreGuardado') || semestreRegistro || '';
    var telefono      = perfilGuardado.telefono      || sessionStorage.getItem('telefonoUsuario')    || '';
    var telEmergencia = perfilGuardado.telEmergencia || sessionStorage.getItem('telefonoEmergencia') || '';
    var direccion     = perfilGuardado.direccion     || sessionStorage.getItem('direccionUsuario')   || '';
    var estado        = perfilGuardado.estado        || sessionStorage.getItem('estadoUsuario')      || '';
    var ciudad        = perfilGuardado.ciudad        || sessionStorage.getItem('ciudadUsuario')      || '';
    // Mostrar "Estado, Ciudad" o solo uno si el otro falta
    var ciudadDisplay = (estado && ciudad) ? (ciudad + ', ' + estado) : (ciudad || estado || '');

    // Si encontramos datos en el perfil guardado, sincronizamos sessionStorage
    // para que la sesión actual los tenga disponibles
    if (perfilGuardado.nombre) {
        sessionStorage.setItem('nombreUsuario',      perfilGuardado.nombre);
        sessionStorage.setItem('usuarioActual',      perfilGuardado.nombre);
        sessionStorage.setItem('correoUsuario',      correoUsuario);
        if (numControl)     sessionStorage.setItem('numeroControl',       numControl);
        if (carrera)        sessionStorage.setItem('carreraUsuario',      carrera);
        if (semestre)       sessionStorage.setItem('semestreUsuario',     semestre);
        if (telefono)       sessionStorage.setItem('telefonoUsuario',     telefono);
        if (telEmergencia)  sessionStorage.setItem('telefonoEmergencia',  telEmergencia);
        if (direccion)      sessionStorage.setItem('direccionUsuario',    direccion);
        if (estado)         sessionStorage.setItem('estadoUsuario',       estado);
        if (ciudad)         sessionStorage.setItem('ciudadUsuario',       ciudad);
    }

    setText('profileName',  nombreUsuario);
    setText('profileEmail', correoUsuario);
    setText('infoNombre',    nombreUsuario);
    setText('infoCorreo',    correoUsuario);
    setText('infoTelefono',  telefono);
    setText('infoMatricula', numControl || '—');
    setText('infoCarrera',   carrera    || '—');
    setText('infoSemestre',  semestre   || '—');
    setText('infoTelefonoCelular',    telefono);
    setText('infoTelefonoEmergencia', telEmergencia);
    setText('infoDireccion', direccion);
    setText('infoCiudad',    ciudadDisplay);
}

function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ========================================
// CONFIGURAR EVENTOS
// ========================================

function configurarEventos() {
    // Cambiar Avatar
    var btnEditAvatar = document.querySelector('.btn-edit-avatar');
    if (btnEditAvatar) {
        btnEditAvatar.addEventListener('click', function() {
            mostrarAlerta('Función de cambiar foto en desarrollo', 'info');
        });
    }

    // Cambiar Contraseña
    var btnChangePassword = document.getElementById('btnChangePassword');
    if (btnChangePassword) {
        btnChangePassword.addEventListener('click', function() {
            window.location.href = 'editar-perfil.html';
        });
    }

    // Privacidad
    var btnPrivacy = document.getElementById('btnPrivacy');
    if (btnPrivacy) {
        btnPrivacy.addEventListener('click', abrirModalPrivacidad);
    }

    // Eliminar Cuenta
    var btnDeleteAccount = document.getElementById('btnDeleteAccount');
    if (btnDeleteAccount) {
        btnDeleteAccount.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
                mostrarAlerta('Solicitud de eliminación de cuenta enviada', 'warning');
            }
        });
    }

    // Cerrar Sesión
    var btnLogout = document.getElementById('btnLogout');
    var btnLogoutBottom = document.getElementById('btnLogoutBottom');
    if (btnLogout)       btnLogout.addEventListener('click', cerrarSesion);
    if (btnLogoutBottom) btnLogoutBottom.addEventListener('click', cerrarSesion);

    // Soporte técnico en perfil
    var btnSoporte = document.getElementById('btnEnviarSoportePerfil');
    if (btnSoporte) btnSoporte.addEventListener('click', enviarSoportePerfil);
}

// ========================================
// CERRAR SESIÓN
// ========================================

function cerrarSesion() {
    if (confirm('¿Deseas cerrar sesión?')) {
        sessionStorage.clear();
        localStorage.removeItem('recordarAlumno');
        window.location.href = '../index.html';
    }
}

// ========================================
// ALERTA TOAST
// ========================================

function mostrarAlerta(mensaje, tipo) {
    tipo = tipo || 'info';
    var alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-' + tipo + ' alert-dismissible fade show';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = mensaje +
        '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
    alertDiv.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    document.body.appendChild(alertDiv);
    setTimeout(function() { alertDiv.remove(); }, 4000);
}

// MODAL DE PRIVACIDAD
// ============================================================

function abrirModalPrivacidad() {
    var overlay = document.getElementById('privacyModalOverlay');
    if (!overlay) return;

    // Cargar preferencias guardadas
    var prefs    = {};
    try { prefs = JSON.parse(localStorage.getItem('privacy_prefs') || '{}'); } catch(e) {}
    var defaults = { nombre: true, correo: false, carrera: true, telefono: false };
    var cfg      = Object.assign({}, defaults, prefs);

    var map = {
        privPrefNombre:   'nombre',
        privPrefCorreo:   'correo',
        privPrefCarrera:  'carrera',
        privPrefTelefono: 'telefono'
    };

    Object.keys(map).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.checked = !!cfg[map[id]];
    });

    overlay.classList.add('active');

    if (!overlay._listenersAdded) {
        overlay._listenersAdded = true;

        document.getElementById('privacyModalClose').addEventListener('click', function() {
            overlay.classList.remove('active');
        });
        document.getElementById('privacyModalCancel').addEventListener('click', function() {
            overlay.classList.remove('active');
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.classList.remove('active');
        });
        document.getElementById('privacyModalSave').addEventListener('click', function() {
            var saved = {};
            Object.keys(map).forEach(function(id) {
                var el = document.getElementById(id);
                if (el) saved[map[id]] = el.checked;
            });
            localStorage.setItem('privacy_prefs', JSON.stringify(saved));
            overlay.classList.remove('active');
            mostrarAlerta('✅ Preferencias de privacidad guardadas', 'success');
        });
    }
}
// =============================================
// SOPORTE TÉCNICO EN PERFIL
// =============================================
function enviarSoportePerfil() {
    var tipo    = document.getElementById('perfilSoporteTipo')    ? document.getElementById('perfilSoporteTipo').value           : '';
    var pantalla = document.getElementById('perfilSoportePantalla') ? document.getElementById('perfilSoportePantalla').value.trim() : '';
    var desc    = document.getElementById('perfilSoporteDesc')    ? document.getElementById('perfilSoporteDesc').value.trim()     : '';
    var msg     = document.getElementById('perfilSoporteMsg');

    if (!desc) {
        if (msg) { msg.style.display = 'block'; msg.style.color = '#ef4444'; msg.textContent = 'Por favor describe el problema.'; }
        return;
    }

    var correo = sessionStorage.getItem('correoUsuario') || localStorage.getItem('correoUsuarioActual') || 'alumno@desconocido';

    var reporte = {
        tipo:        tipo,
        pantalla:    pantalla || '—',
        descripcion: desc,
        fecha:       new Date().toISOString(),
        origen:      'Alumno (' + correo + ')',
        estado:      'Enviado'
    };

    var reportes = JSON.parse(localStorage.getItem('reportesSoporte') || '[]');
    reportes.unshift(reporte);
    localStorage.setItem('reportesSoporte', JSON.stringify(reportes));

    if (document.getElementById('perfilSoportePantalla')) document.getElementById('perfilSoportePantalla').value = '';
    if (document.getElementById('perfilSoporteDesc'))     document.getElementById('perfilSoporteDesc').value     = '';

    if (msg) {
        msg.style.display = 'block';
        msg.style.color   = '#10b981';
        msg.textContent   = '✅ Reporte enviado correctamente. ¡Gracias!';
        setTimeout(function() { msg.style.display = 'none'; }, 4000);
    }
}