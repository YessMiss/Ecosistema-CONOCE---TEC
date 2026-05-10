// ========================================
// INICIALIZACIÓN Y VARIABLES GLOBALES
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('CONOCE-TEC Editar Perfil - Página Cargada');
    
    // Cargar datos del usuario
    cargarDatosFormulario();
    
    // Configurar eventos
    configurarEventos();
});

// ========================================
// CARGAR DATOS DEL FORMULARIO
// ========================================

function cargarDatosFormulario() {
    // Correo del alumno actual (identifica su perfil)
    var correoUsuario = sessionStorage.getItem('correoUsuario') ||
                        localStorage.getItem('correoUsuarioActual') ||
                        localStorage.getItem('correoAlumno') || '';

    // Intentar cargar perfil guardado específico de este alumno
    var perfilGuardado = {};
    if (correoUsuario) {
        try { perfilGuardado = JSON.parse(localStorage.getItem('perfil_' + correoUsuario) || '{}'); } catch(e) {}
    }

    // También buscar en alumnosRegistrados para recuperar numControl del registro
    var numControlRegistro = '';
    if (correoUsuario) {
        var alumnosArr = JSON.parse(localStorage.getItem('alumnosRegistrados') || '[]');
        var alumnoReg = alumnosArr.find(function(a) { return (a.correo || a.email) === correoUsuario; });
        if (alumnoReg) numControlRegistro = alumnoReg.numControl || alumnoReg.numeroControl || '';
    }

    var nombreUsuario = perfilGuardado.nombre ||
                        sessionStorage.getItem('usuarioActual') ||
                        sessionStorage.getItem('nombreUsuario') ||
                        localStorage.getItem('nombreUsuarioActual') || '';

    var numControl = perfilGuardado.numControl ||
                     sessionStorage.getItem('numeroControl') ||
                     localStorage.getItem('numControlActual') ||
                     localStorage.getItem('numControlGuardado') ||
                     numControlRegistro || '';

    var carrera  = perfilGuardado.carrera  || sessionStorage.getItem('carreraUsuario')  || localStorage.getItem('carreraActual')  || localStorage.getItem('carreraGuardada')  || '';
    var semestre = perfilGuardado.semestre || sessionStorage.getItem('semestreUsuario') || localStorage.getItem('semestreActual') || localStorage.getItem('semestreGuardado') || '';
    var telefono       = perfilGuardado.telefono       || sessionStorage.getItem('telefonoUsuario')    || '';
    var telEmergencia  = perfilGuardado.telEmergencia  || sessionStorage.getItem('telefonoEmergencia') || '';
    var direccion      = perfilGuardado.direccion      || sessionStorage.getItem('direccionUsuario')   || '';
    var ciudad         = perfilGuardado.ciudad         || sessionStorage.getItem('ciudadUsuario')      || '';

    document.getElementById('editNombre').value              = nombreUsuario;
    document.getElementById('editCorreo').value              = correoUsuario;
    document.getElementById('editMatricula').value           = numControl;
    document.getElementById('editCarrera').value             = carrera;
    document.getElementById('editSemestre').value            = semestre;
    document.getElementById('editTelefono').value            = telefono;
    document.getElementById('editTelefonoEmergencia').value  = telEmergencia;
    document.getElementById('editDireccion').value           = direccion;
    document.getElementById('editCiudad').value              = ciudad;
}

// ========================================
// CONFIGURAR EVENTOS
// ========================================

function configurarEventos() {
    // Evento para enviar el formulario
    const formEditarPerfil = document.getElementById('formEditarPerfil');
    if (formEditarPerfil) {
        formEditarPerfil.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarCambios();
        });
    }

    // Botón Cerrar Sesión
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }

    // Botones mostrar/ocultar contraseña
    document.querySelectorAll('.btn-toggle-pw').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // Validar coincidencia de contraseñas en tiempo real
    const pwNueva = document.getElementById('editContrasenaNueva');
    const pwConfirmar = document.getElementById('editContrasenaConfirmar');
    const pwMatchMsg = document.getElementById('pwMatchMsg');
    const pwStrengthMsg = document.getElementById('pwStrengthMsg');

    if (pwNueva) {
        pwNueva.addEventListener('input', function() {
            const val = this.value;
            if (val.length === 0) {
                pwStrengthMsg.textContent = '';
            } else if (val.length < 6) {
                pwStrengthMsg.textContent = 'Contraseña muy corta (mínimo 6 caracteres)';
                pwStrengthMsg.style.color = '#ef4444';
            } else if (val.length < 12) {
                pwStrengthMsg.textContent = 'Contraseña débil';
                pwStrengthMsg.style.color = '#f97316';
            } else {
                pwStrengthMsg.textContent = 'Contraseña fuerte ✓';
                pwStrengthMsg.style.color = '#10b981';
            }
            if (pwConfirmar && pwConfirmar.value) validarCoincidencia();
        });
    }

    if (pwConfirmar) {
        pwConfirmar.addEventListener('input', validarCoincidencia);
    }

    function validarCoincidencia() {
        if (!pwNueva || !pwConfirmar || !pwMatchMsg) return;
        if (pwConfirmar.value === '') {
            pwMatchMsg.textContent = '';
            return;
        }
        if (pwNueva.value === pwConfirmar.value) {
            pwMatchMsg.textContent = 'Las contraseñas coinciden ✓';
            pwMatchMsg.className = 'form-text ok';
        } else {
            pwMatchMsg.textContent = 'Las contraseñas no coinciden';
            pwMatchMsg.className = 'form-text error';
        }
    }
}

// ========================================
// GUARDAR CAMBIOS
// ========================================

function guardarCambios() {
    var nombre            = document.getElementById('editNombre').value.trim();
    var correo            = document.getElementById('editCorreo').value.trim();
    var telefono          = document.getElementById('editTelefono').value.trim();
    var matricula         = document.getElementById('editMatricula').value.trim();
    var carrera           = document.getElementById('editCarrera').value;
    var semestre          = document.getElementById('editSemestre').value;
    var telefonoEmergencia= document.getElementById('editTelefonoEmergencia').value.trim();
    var direccion         = document.getElementById('editDireccion').value.trim();
    var ciudad            = document.getElementById('editCiudad').value.trim();

    // Validar campos requeridos
    if (!nombre || !correo) {
        mostrarAlerta('Por favor completa los campos requeridos', 'warning');
        return;
    }

    if (!validarCorreo(correo)) {
        mostrarAlerta('Por favor ingresa un correo válido', 'warning');
        return;
    }

    // Cambio de contraseña: SOLO si el alumno llenó algún campo de contraseña
    var pwActual    = document.getElementById('editContrasenaActual')    ? document.getElementById('editContrasenaActual').value    : '';
    var pwNueva     = document.getElementById('editContrasenaNueva')     ? document.getElementById('editContrasenaNueva').value     : '';
    var pwConfirmar = document.getElementById('editContrasenaConfirmar') ? document.getElementById('editContrasenaConfirmar').value : '';

    if (pwNueva || pwConfirmar || pwActual) {
        // Solo entonces validamos la contraseña
        if (!pwActual) {
            mostrarAlerta('Ingresa tu contraseña actual para cambiarla', 'warning');
            return;
        }
        if (pwNueva.length < 6) {
            mostrarAlerta('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }
        if (pwNueva !== pwConfirmar) {
            mostrarAlerta('Las contraseñas nuevas no coinciden', 'warning');
            return;
        }
        // Guardar nueva contraseña en el perfil del alumno
        localStorage.setItem('contrasena_' + correo, pwNueva);
        sessionStorage.setItem('contrasenaUsuario', pwNueva);
    }

    // ── Guardar perfil con clave por correo (persiste entre sesiones) ──────
    var perfilData = {
        nombre:         nombre,
        correo:         correo,
        numControl:     matricula,
        carrera:        carrera,
        semestre:       semestre,
        telefono:       telefono,
        telEmergencia:  telefonoEmergencia,
        direccion:      direccion,
        ciudad:         ciudad
    };
    localStorage.setItem('perfil_' + correo, JSON.stringify(perfilData));

    // ── También actualizar claves genéricas para compatibilidad ────────────
    localStorage.setItem('nombreUsuarioActual',  nombre);
    localStorage.setItem('correoUsuarioActual',  correo);
    if (matricula) {
        localStorage.setItem('numControlActual',   matricula);
        localStorage.setItem('numControlGuardado', matricula);
    }
    localStorage.setItem('carreraActual',    carrera);
    localStorage.setItem('carreraGuardada',  carrera);
    localStorage.setItem('semestreActual',   semestre);
    localStorage.setItem('semestreGuardado', semestre);

    // ── Actualizar sessionStorage para la sesión actual ────────────────────
    sessionStorage.setItem('usuarioActual',       nombre);
    sessionStorage.setItem('nombreUsuario',       nombre);
    sessionStorage.setItem('correoUsuario',       correo);
    sessionStorage.setItem('telefonoUsuario',     telefono);
    if (matricula) sessionStorage.setItem('numeroControl', matricula);
    sessionStorage.setItem('carreraUsuario',      carrera);
    sessionStorage.setItem('semestreUsuario',     semestre);
    sessionStorage.setItem('telefonoEmergencia',  telefonoEmergencia);
    sessionStorage.setItem('direccionUsuario',    direccion);
    sessionStorage.setItem('ciudadUsuario',       ciudad);

    // ── Actualizar también en el array alumnosRegistrados ──────────────────
    var alumnosArr = JSON.parse(localStorage.getItem('alumnosRegistrados') || '[]');
    var idx = alumnosArr.findIndex(function(a) { return (a.correo || a.email) === correo; });
    if (idx !== -1) {
        alumnosArr[idx].nombreCompleto = nombre;
        alumnosArr[idx].nombre        = nombre;
        alumnosArr[idx].numControl    = matricula;
        alumnosArr[idx].carrera       = carrera;
        alumnosArr[idx].semestre      = semestre;
        localStorage.setItem('alumnosRegistrados', JSON.stringify(alumnosArr));
    }

    mostrarAlerta('¡Perfil actualizado correctamente!', 'success');

    setTimeout(function() {
        window.location.href = 'perfil-alumno.html';
    }, 1500);
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
// FUNCIONES AUXILIARES
// ========================================

function validarCorreo(correo) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
}

function mostrarAlerta(mensaje, tipo = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.insertBefore(alertDiv, document.body.firstChild);

    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '400px';
    alertDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';

    setTimeout(function() {
        alertDiv.remove();
    }, 5000);
}

// ========================================
// FUNCIONES DE DEPURACIÓN
// ========================================

window.verDatosEdicion = function() {
    console.log('=== DATOS DE EDICIÓN ===');
    console.log('Nombre:', document.getElementById('editNombre').value);
    console.log('Correo:', document.getElementById('editCorreo').value);
    console.log('Carrera:', document.getElementById('editCarrera').value);
    console.log('Semestre:', document.getElementById('editSemestre').value);
    console.log('=======================');
};

console.log('Escribe verDatosEdicion() para ver los datos');