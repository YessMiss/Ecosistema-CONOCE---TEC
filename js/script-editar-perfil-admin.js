// ========================================
// EDITAR PERFIL ADMINISTRADOR
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    // Solo admins pueden acceder
    var rol = sessionStorage.getItem('rolUsuario');
    if (rol !== 'admin') {
        window.location.href = '../index.html';
        return;
    }

    cargarDatosFormulario();
    configurarEventos();
});

// ========================================
// CARGAR DATOS ACTUALES DEL ADMIN
// ========================================
function cargarDatosFormulario() {
    var adminData = null;
    try { adminData = JSON.parse(localStorage.getItem('adminData') || 'null'); } catch (e) {}

    // Fallbacks desde sessionStorage si adminData no existe aún
    var nombre  = (adminData && adminData.nombreCompleto)      || sessionStorage.getItem('nombreUsuario')  || '';
    var correo  = (adminData && adminData.correoInstitucional) || '';
    var empId   = (adminData && adminData.numEmpleado)         || '';
    var area    = (adminData && adminData.areaDepartamento)    || '';
    var rol     = (adminData && adminData.rol)                 || '';
    var usuario = (adminData && adminData.usuario)             || sessionStorage.getItem('usuarioActual') || '';

    document.getElementById('adminEditNombre').value   = nombre;
    document.getElementById('adminEditCorreo').value   = correo;
    document.getElementById('adminEditEmpleado').value = empId;
    document.getElementById('adminEditArea').value     = area;
    document.getElementById('adminEditRol').value      = rol;
    document.getElementById('adminEditUsuario').value  = usuario;
}

// ========================================
// CONFIGURAR EVENTOS
// ========================================
function configurarEventos() {
    var form = document.getElementById('formEditarPerfilAdmin');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            guardarCambios();
        });
    }

    var btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function () {
            if (confirm('¿Deseas cerrar sesión?')) {
                sessionStorage.clear();
                window.location.href = '../index.html';
            }
        });
    }
}

// ========================================
// GUARDAR CAMBIOS
// ========================================
function guardarCambios() {
    var nombre  = document.getElementById('adminEditNombre').value.trim();
    var correo  = document.getElementById('adminEditCorreo').value.trim();
    var empId   = document.getElementById('adminEditEmpleado').value.trim();
    var area    = document.getElementById('adminEditArea').value.trim();
    var rol     = document.getElementById('adminEditRol').value;
    var usuario = document.getElementById('adminEditUsuario').value.trim();

    if (!nombre) {
        mostrarAlerta('El nombre completo es obligatorio.', 'warning');
        return;
    }

    // Leer datos previos para no perder campos que no se editan aquí (p.ej. contraseña)
    var adminDataPrev = null;
    try { adminDataPrev = JSON.parse(localStorage.getItem('adminData') || 'null'); } catch (e) {}

    var adminDataNuevo = Object.assign({}, adminDataPrev || {}, {
        nombreCompleto:      nombre,
        correoInstitucional: correo,
        numEmpleado:         empId,
        areaDepartamento:    area,
        rol:                 rol,
        usuario:             usuario || (adminDataPrev && adminDataPrev.usuario) || sessionStorage.getItem('usuarioActual') || 'admin'
    });

    // Guardar en localStorage
    localStorage.setItem('adminData', JSON.stringify(adminDataNuevo));
    localStorage.setItem('nombreUsuarioActual', nombre);

    // Actualizar en adminsRegistrados si ya existe entrada con este usuario
    var adminsArr = JSON.parse(localStorage.getItem('adminsRegistrados') || '[]');
    var usuarioKey = adminDataNuevo.usuario;
    var idx = adminsArr.findIndex(function (a) {
        return a.usuario === usuarioKey || a.nombre === (adminDataPrev && adminDataPrev.nombreCompleto);
    });
    if (idx !== -1) {
        adminsArr[idx] = Object.assign(adminsArr[idx], {
            nombre:      nombre,
            correo:      correo,
            numEmpleado: empId,
            area:        area,
            rol:         rol
        });
        localStorage.setItem('adminsRegistrados', JSON.stringify(adminsArr));
    }

    // Actualizar sessionStorage para la sesión actual
    sessionStorage.setItem('nombreUsuario', nombre);
    sessionStorage.setItem('usuarioActual', adminDataNuevo.usuario);

    mostrarAlerta('¡Perfil actualizado correctamente!', 'success');

    // Regresar al dashboard admin después de 1.5 s
    setTimeout(function () {
        window.location.href = 'dashboard-admin.html';
    }, 1500);
}

// ========================================
// TOAST
// ========================================
function mostrarAlerta(mensaje, tipo) {
    tipo = tipo || 'info';
    var alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-' + tipo + ' alert-dismissible fade show';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = mensaje +
        '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
    alertDiv.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    document.body.appendChild(alertDiv);
    setTimeout(function () { alertDiv.remove(); }, 4000);
}
