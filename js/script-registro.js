// ========================================
// INICIALIZACIÓN Y VARIABLES GLOBALES
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('CONOCE-TEC Registro - Sistema Iniciado');
    
    // Obtener elementos del DOM
    const formRegistro = document.getElementById('formRegistro');
    const inputNombre = document.getElementById('nombreCompleto');
    const inputNumeroControl = document.getElementById('numeroControl');
    const inputCorreo = document.getElementById('correo');
    const inputContrasena = document.getElementById('contrasena');
    const inputConfirmar = document.getElementById('confirmarContrasena');
    const checkboxTerminos = document.getElementById('terminos');
    const checkboxRecordar = document.getElementById('recordarme');
    const btnCrearCuenta = document.getElementById('btnCrearCuenta');
    const toggleEmail = document.getElementById('toggleEmail');
    const togglePassword = document.getElementById('togglePassword');

    // ========================================
    // EVENTOS DE VISIBILIDAD DE CONTRASEÑA
    // ========================================

    toggleEmail.addEventListener('click', function() {
        const input = document.getElementById('correo');
        const icon = this.querySelector('i');
        
        if (input.type === 'email') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'email';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    togglePassword.addEventListener('click', function() {
        const input = document.getElementById('contrasena');
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    const toggleConfirmar = document.getElementById('toggleConfirmar');
    if (toggleConfirmar) {
        toggleConfirmar.addEventListener('click', function() {
            const input = document.getElementById('confirmarContrasena');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // ========================================
    // VALIDACIÓN EN TIEMPO REAL
    // ========================================

    // Validar número de control en tiempo real
    if (inputNumeroControl) {
        inputNumeroControl.addEventListener('input', function() {
            const val = this.value.trim();
            const errorEl = document.getElementById('errorNumeroControl');
            const grp = this.parentElement;
            if (val.length > 0 && val.length < 5) {
                mostrarError(grp, errorEl, 'El número de control debe tener al menos 5 caracteres');
            } else {
                limpiarError(grp, errorEl);
            }
        });
    }

    // Validar nombre en tiempo real
    inputNombre.addEventListener('blur', function() {
        validarNombre();
    });

    inputNombre.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            validarNombre();
        }
    });

    // Validar correo en tiempo real
    inputCorreo.addEventListener('blur', function() {
        validarCorreo();
    });

    inputCorreo.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            validarCorreo();
        }
    });

    // Validar contraseña en tiempo real
    inputContrasena.addEventListener('input', function() {
        validarContrasena();
        // Validar coincidencia si el campo de confirmación tiene valor
        if (inputConfirmar.value.trim() !== '') {
            validarConfirmacion();
        }
    });

    // Validar confirmación en tiempo real
    inputConfirmar.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            validarConfirmacion();
        }
    });

    inputConfirmar.addEventListener('blur', function() {
        validarConfirmacion();
    });

    // ========================================
    // ENVÍO DEL FORMULARIO
    // ========================================

    formRegistro.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar todos los campos
        const esValido = validarFormularioCompleto();
        
        if (esValido) {
            procesarRegistro();
        }
    });

    // ========================================
    // FUNCIONES DE VALIDACIÓN
    // ========================================

    function validarNombre() {
        const nombre = inputNombre.value.trim();
        const errorElement = document.getElementById('errorNombre');
        const inputGroup = inputNombre.parentElement;

        if (nombre === '') {
            mostrarError(inputGroup, errorElement, 'El nombre completo es requerido');
            return false;
        }

        if (nombre.length < 3) {
            mostrarError(inputGroup, errorElement, 'El nombre debe tener al menos 3 caracteres');
            return false;
        }

        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
            mostrarError(inputGroup, errorElement, 'El nombre solo debe contener letras');
            return false;
        }

        limpiarError(inputGroup, errorElement);
        return true;
    }

    function validarCorreo() {
        const correo = inputCorreo.value.trim();
        const errorElement = document.getElementById('errorCorreo');
        const inputGroup = inputCorreo.parentElement;

        if (correo === '') {
            mostrarError(inputGroup, errorElement, 'El correo electrónico es requerido');
            return false;
        }

        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(correo)) {
            mostrarError(inputGroup, errorElement, 'Por favor ingresa un correo válido');
            return false;
        }

        limpiarError(inputGroup, errorElement);
        return true;
    }

    function validarContrasena() {
        const contrasena = inputContrasena.value;
        const errorElement = document.getElementById('errorContrasena');
        const inputGroup = inputContrasena.parentElement;
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');

        // Limpiar clases previas
        strengthBar.classList.remove('weak', 'medium', 'strong');

        if (contrasena === '') {
            mostrarError(inputGroup, errorElement, 'La contraseña es requerida');
            strengthText.textContent = '';
            return false;
        }

        if (contrasena.length < 6) {
            mostrarError(inputGroup, errorElement, 'La contraseña debe tener al menos 6 caracteres');
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Contraseña débil';
            return false;
        }

        if (contrasena.length > 30) {
            mostrarError(inputGroup, errorElement, 'La contraseña no puede tener más de 30 caracteres');
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Contraseña demasiado larga';
            return false;
        }

        // Fortaleza basada en longitud
        if (contrasena.length < 15) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Contraseña débil';
        } else if (contrasena.length < 30) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Contraseña media';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Contraseña fuerte';
        }

        limpiarError(inputGroup, errorElement);
        return true;
    }

    function validarConfirmacion() {
        const contrasena = inputContrasena.value;
        const confirmar = inputConfirmar.value;
        const errorElement = document.getElementById('errorConfirmar');
        const inputGroup = inputConfirmar.parentElement;

        if (confirmar === '') {
            mostrarError(inputGroup, errorElement, 'Debes confirmar la contraseña');
            return false;
        }

        if (contrasena !== confirmar) {
            mostrarError(inputGroup, errorElement, 'Las contraseñas no coinciden');
            return false;
        }

        limpiarError(inputGroup, errorElement);
        return true;
    }

    function validarTerminos() {
        const errorElement = document.getElementById('errorTerminos');
        
        if (!checkboxTerminos.checked) {
            errorElement.textContent = 'Debes aceptar los términos y condiciones';
            errorElement.classList.add('show');
            return false;
        }

        errorElement.classList.remove('show');
        return true;
    }

    function validarFormularioCompleto() {
        const validaciones = [
            validarNombre(),
            validarCorreo(),
            validarContrasena(),
            validarConfirmacion(),
            validarTerminos()
        ];

        return validaciones.every(v => v === true);
    }

    // ========================================
    // FUNCIONES AUXILIARES
    // ========================================

    function mostrarError(inputGroup, errorElement, mensaje) {
        inputGroup.classList.add('error');
        inputGroup.classList.remove('success');
        errorElement.textContent = mensaje;
        errorElement.classList.add('show');
    }

    function limpiarError(inputGroup, errorElement) {
        inputGroup.classList.remove('error');
        inputGroup.classList.add('success');
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }

    function mostrarAlerta(mensaje, tipo = 'success') {
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
    // PROCESAMIENTO DE REGISTRO
    // ========================================

    function procesarRegistro() {
        const nombre = inputNombre.value.trim();
        const correo = inputCorreo.value.trim();
        const contrasena = inputContrasena.value;
        const recordar = checkboxRecordar.checked;

        console.log('Procesando registro:', { nombre, correo, recordar });

        // Deshabilitar botón
        btnCrearCuenta.disabled = true;
        btnCrearCuenta.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creando cuenta...';

        // Simular envío al servidor
        setTimeout(function() {
            // Guardar datos en localStorage si se selecciona "Recuérdame"
            if (recordar) {
                localStorage.setItem('nombreAlumno', nombre);
                localStorage.setItem('correoAlumno', correo);
                localStorage.setItem('recordarRegistro', 'true');
            }

            // Guardar información de sesión
            const numCtrl = inputNumeroControl ? inputNumeroControl.value.trim() : '';
            sessionStorage.setItem('tipoUsuario', 'alumno');
            sessionStorage.setItem('nombreUsuario', nombre);
            sessionStorage.setItem('usuarioActual', nombre);
            sessionStorage.setItem('correoUsuario', correo);
            sessionStorage.setItem('numeroControl', numCtrl);
            sessionStorage.setItem('horaRegistro', new Date().toLocaleTimeString());

            // Guardar siempre en localStorage para persistencia entre páginas
            localStorage.setItem('nombreUsuarioActual', nombre);
            localStorage.setItem('correoUsuarioActual', correo);

            // Incrementar contador de personas registradas
            var registrados = parseInt(localStorage.getItem('contadorRegistrados') || '0', 10);
            localStorage.setItem('contadorRegistrados', registrados + 1);

            // Guardar en lista de alumnos registrados (para notificaciones del admin)
            var alumnosArr = JSON.parse(localStorage.getItem('alumnosRegistrados') || '[]');
            var fechaReg   = new Date().toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' });
            alumnosArr.push({ nombre: nombre, correo: correo, fecha: fechaReg, numControl: numCtrl });
            localStorage.setItem('alumnosRegistrados', JSON.stringify(alumnosArr));
            localStorage.setItem('ultimoUsuarioRegistrado', nombre);

            mostrarAlerta('¡Cuenta creada exitosamente! Bienvenido ' + nombre, 'success');

            // Redirigir después de 2 segundos
            setTimeout(function() {
                // Redireccionar al dashboard del alumno
                window.location.href = 'dashboard-alumno.html';
            }, 2000);
        }, 1500);
    }

    // ========================================
    // CARGAR DATOS GUARDADOS
    // ========================================

    function cargarDatosGuardados() {
        const nombreGuardado = localStorage.getItem('nombreAlumno');
        const correoGuardado = localStorage.getItem('correoAlumno');
        const recordarGuardado = localStorage.getItem('recordarRegistro');

        if (recordarGuardado === 'true') {
            if (nombreGuardado) inputNombre.value = nombreGuardado;
            if (correoGuardado) inputCorreo.value = correoGuardado;
            checkboxRecordar.checked = true;
            console.log('Datos guardados cargados');
        }
    }

    // Cargar datos al iniciar
    cargarDatosGuardados();

    // ========================================
    // FUNCIONES DE DEPURACIÓN
    // ========================================

    window.verRegistro = function() {
        console.log('=== DATOS DE REGISTRO ===');
        console.log('Nombre:', sessionStorage.getItem('nombreUsuario'));
        console.log('Correo:', sessionStorage.getItem('correoUsuario'));
        console.log('Hora de Registro:', sessionStorage.getItem('horaRegistro'));
        console.log('========================');
    };

    window.limpiarRegistro = function() {
        sessionStorage.clear();
        localStorage.clear();
        console.log('Datos de registro limpiados');
        location.reload();
    };

    console.log('Escribe verRegistro() para ver los datos de registro');
    console.log('Escribe limpiarRegistro() para limpiar los datos');
});