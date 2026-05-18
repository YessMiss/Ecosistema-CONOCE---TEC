// ========================================
// INICIALIZACIÓN Y VARIABLES GLOBALES
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('CONOCE-TEC Login - Sistema Iniciado');
    
    // Obtener elementos del DOM
    const btnAlumno = document.getElementById('btnAlumno');
    const btnVisitante = document.getElementById('btnVisitante');
    const btnConfirmarAlumno = document.getElementById('btnConfirmarAlumno');
    const btnConfirmarVisitante = document.getElementById('btnConfirmarVisitante');
    const formAlumno = document.getElementById('formAlumno');
    const formVisitante = document.getElementById('formVisitante');
    const modalAlumno = new bootstrap.Modal(document.getElementById('modalAlumno'));
    const modalVisitante = new bootstrap.Modal(document.getElementById('modalVisitante'));

    // ========================================
    // EVENTOS DE BOTONES PRINCIPALES
    // ========================================

    // Evento para el botón de Alumno
    btnAlumno.addEventListener('click', function() {
        console.log('Abriendo modal de Alumno');
        modalAlumno.show();
        // Limpiar formulario
        formAlumno.reset();
        document.getElementById('usuarioAlumno').focus();
    });

    // Evento para el botón de Visitante
    btnVisitante.addEventListener('click', function() {
        console.log('Abriendo modal de Visitante');
        modalVisitante.show();
        // Limpiar formulario
        formVisitante.reset();
        document.getElementById('nombreVisitante').focus();
    });

    // ========================================
    // VALIDACIÓN Y ENVÍO DE FORMULARIOS
    // ========================================

    // Confirmar login de Alumno
    btnConfirmarAlumno.addEventListener('click', function() {
        if (validarFormularioAlumno()) {
            procesarLoginAlumno();
        }
    });

    // Confirmar acceso de Visitante
    btnConfirmarVisitante.addEventListener('click', function() {
        if (validarFormularioVisitante()) {
            procesarLoginVisitante();
        }
    });

    // Permitir envío con Enter en los formularios
    formAlumno.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnConfirmarAlumno.click();
        }
    });

    formVisitante.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnConfirmarVisitante.click();
        }
    });

    // ========================================
    // FUNCIONES DE VALIDACIÓN
    // ========================================

    function validarFormularioAlumno() {
        const usuario = document.getElementById('usuarioAlumno').value.trim();
        const password = document.getElementById('passwordAlumno').value.trim();

        if (usuario === '') {
            mostrarAlerta('Por favor ingresa tu usuario', 'warning');
            document.getElementById('usuarioAlumno').focus();
            return false;
        }

        if (usuario.length < 3) {
            mostrarAlerta('El usuario debe tener al menos 3 caracteres', 'warning');
            document.getElementById('usuarioAlumno').focus();
            return false;
        }

        if (password === '') {
            mostrarAlerta('Por favor ingresa tu contraseña', 'warning');
            document.getElementById('passwordAlumno').focus();
            return false;
        }

        if (password.length < 6) {
            mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'warning');
            document.getElementById('passwordAlumno').focus();
            return false;
        }

        return true;
    }

    function validarFormularioVisitante() {
        const nombre = document.getElementById('nombreVisitante').value.trim();
        const email = document.getElementById('emailVisitante').value.trim();
        const motivo = document.getElementById('motivoVisitante').value;

        if (nombre === '') {
            mostrarAlerta('Por favor ingresa tu nombre completo', 'warning');
            document.getElementById('nombreVisitante').focus();
            return false;
        }

        if (nombre.length < 3) {
            mostrarAlerta('El nombre debe tener al menos 3 caracteres', 'warning');
            document.getElementById('nombreVisitante').focus();
            return false;
        }

        if (email === '') {
            mostrarAlerta('Por favor ingresa tu correo electrónico', 'warning');
            document.getElementById('emailVisitante').focus();
            return false;
        }

        if (!validarEmail(email)) {
            mostrarAlerta('Por favor ingresa un correo electrónico válido', 'warning');
            document.getElementById('emailVisitante').focus();
            return false;
        }

        if (motivo === '') {
            mostrarAlerta('Por favor selecciona un motivo de visita', 'warning');
            document.getElementById('motivoVisitante').focus();
            return false;
        }

        return true;
    }

    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Configurar mostrar/ocultar contraseña
    configurarMostrarOcultarContrasena();

    // ========================================
    // FUNCIONES DE PROCESAMIENTO
    // ========================================

    function procesarLoginAlumno() {
        const usuario = document.getElementById('usuarioAlumno').value.trim();
        const password = document.getElementById('passwordAlumno').value.trim();
        const recordar = document.getElementById('recordarAlumno').checked;

        console.log('Procesando login de Alumno:', { usuario, recordar });

        // Simular envío al servidor
        btnConfirmarAlumno.disabled = true;
        btnConfirmarAlumno.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ingresando...';

        setTimeout(function() {
            // Guardar datos si se selecciona "Recuérdame"
            if (recordar) {
                localStorage.setItem('usuarioAlumno', usuario);
                localStorage.setItem('recordarAlumno', 'true');
            } else {
                localStorage.removeItem('usuarioAlumno');
                localStorage.removeItem('recordarAlumno');
            }

            // Guardar información de sesión
            sessionStorage.setItem('tipoUsuario', 'alumno');
            sessionStorage.setItem('rolUsuario',  'alumno');
            sessionStorage.setItem('usuarioActual', usuario);
            sessionStorage.setItem('nombreUsuario', usuario);
            sessionStorage.setItem('horaLogin', new Date().toLocaleTimeString());

            // Guardar nombre en localStorage para persistencia entre páginas
            localStorage.setItem('nombreUsuarioActual', usuario);
            // Preservar correo guardado si existe (de registro previo)
            if (!localStorage.getItem('correoUsuarioActual')) {
                localStorage.setItem('correoUsuarioActual', '');
            }

            mostrarAlerta('¡Bienvenido ' + usuario + '! Acceso de alumno concedido.', 'success');
            
            // Cerrar modal después de 1.5 segundos
            setTimeout(function() {
                modalAlumno.hide();
                btnConfirmarAlumno.disabled = false;
                btnConfirmarAlumno.innerHTML = 'Ingresar';
                // Redireccionar a la página del alumno
                window.location.href = 'pages/dashboard-alumno.html';
            }, 1500);
        }, 1000);
    }

    function procesarLoginVisitante() {
        const nombre = document.getElementById('nombreVisitante').value.trim();
        const email = document.getElementById('emailVisitante').value.trim();
        const motivo = document.getElementById('motivoVisitante').value;

        console.log('Procesando acceso de Visitante:', { nombre, email, motivo });

        // Simular envío al servidor
        btnConfirmarVisitante.disabled = true;
        btnConfirmarVisitante.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

        setTimeout(function() {
            // Guardar información de sesión
            sessionStorage.setItem('tipoUsuario', 'visitante');
            sessionStorage.setItem('rolUsuario',  'visitante');
            sessionStorage.setItem('nombreVisitante', nombre);
            sessionStorage.setItem('emailVisitante', email);
            sessionStorage.setItem('motivoVisita', motivo);
            sessionStorage.setItem('horaLogin', new Date().toLocaleTimeString());
            // También en localStorage para que sobreviva redirecciones en Vercel
            localStorage.setItem('tipoUsuarioActual', 'visitante');
            localStorage.setItem('nombreVisitanteActual', nombre);
            localStorage.setItem('emailVisitanteActual', email);

            mostrarAlerta('¡Bienvenido ' + nombre + '! Acceso de visitante concedido.', 'success');
            
            // Cerrar modal después de 1.5 segundos
            setTimeout(function() {
                modalVisitante.hide();
                btnConfirmarVisitante.disabled = false;
                btnConfirmarVisitante.innerHTML = 'Continuar';
                // Redireccionar a la página del visitante
                window.location.href = 'pages/dashboard-visitante.html';
            }, 1500);
        }, 1000);
    }

    // ========================================
    // FUNCIONES AUXILIARES
    // ========================================

    function configurarMostrarOcultarContrasena() {
        const togglePasswordButtons = document.querySelectorAll('.toggle-password');
        togglePasswordButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = this.querySelector('i');

                if (input) {
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        input.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            });
        });
    }

    function mostrarAlerta(mensaje, tipo = 'info') {
        // Crear elemento de alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        // Insertar alerta al inicio del body
        document.body.insertBefore(alertDiv, document.body.firstChild);

        // Agregar estilos personalizados
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '400px';
        alertDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';

        // Auto-cerrar después de 5 segundos
        setTimeout(function() {
            alertDiv.remove();
        }, 5000);
    }

    // ========================================
    // CARGAR DATOS GUARDADOS
    // ========================================

    function cargarDatosGuardados() {
        const usuarioGuardado = localStorage.getItem('usuarioAlumno');
        const recordarGuardado = localStorage.getItem('recordarAlumno');

        if (recordarGuardado === 'true' && usuarioGuardado) {
            document.getElementById('usuarioAlumno').value = usuarioGuardado;
            document.getElementById('recordarAlumno').checked = true;
            console.log('Datos guardados cargados');
        }
    }

    // Cargar datos al iniciar
    cargarDatosGuardados();

    // ========================================
    // MENU DE REDES SOCIALES
    // ========================================

    const btnSocialMenu = document.getElementById('btnSocialMenu');
    const socialMenuDropdown = document.getElementById('socialMenuDropdown');
    const socialTooltip = document.getElementById('socialTooltip');

    // Abrir/cerrar menu de redes sociales
    if (btnSocialMenu) {
        btnSocialMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            socialMenuDropdown.classList.toggle('active');
        });
    }

    // Cerrar menu al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (socialMenuDropdown && !socialMenuDropdown.contains(e.target) && e.target !== btnSocialMenu) {
            socialMenuDropdown.classList.remove('active');
        }
    });

    // Tooltips de redes sociales
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', function(e) {
            const tooltip = this.getAttribute('data-tooltip');
            if (tooltip && socialTooltip) {
                socialTooltip.textContent = tooltip;
                socialTooltip.classList.add('show');
                
                // Posicionar el tooltip
                const rect = this.getBoundingClientRect();
                socialTooltip.style.left = (rect.left + rect.width / 2 - 50) + 'px';
                socialTooltip.style.top = (rect.top - 40) + 'px';
            }
        });
        
        link.addEventListener('mouseleave', function() {
            if (socialTooltip) {
                socialTooltip.classList.remove('show');
            }
        });
    });

    // ========================================
    // EFECTOS DE INTERACTIVIDAD
    // ========================================

    // Agregar efecto de enfoque a los campos de entrada
    const inputs = document.querySelectorAll('.form-control, .form-select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.boxShadow = '0 0 0 0.2rem rgba(59, 130, 246, 0.25)';
        });

        input.addEventListener('blur', function() {
            this.style.boxShadow = 'none';
        });
    });

    // Efecto de clic en botones
    const botones = document.querySelectorAll('.btn-login');
    botones.forEach(boton => {
        boton.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.98)';
        });

        boton.addEventListener('mouseup', function() {
            this.style.transform = '';
        });

        boton.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // ========================================
    // FUNCIONES DE DEPURACIÓN
    // ========================================

    // Función para ver datos de sesión (solo en desarrollo)
    window.verSesion = function() {
        console.log('=== DATOS DE SESIÓN ===');
        console.log('Tipo de Usuario:', sessionStorage.getItem('tipoUsuario'));
        console.log('Rol:', sessionStorage.getItem('rolUsuario'));
        console.log('Usuario/Nombre:', sessionStorage.getItem('usuarioActual') || sessionStorage.getItem('nombreVisitante'));
        console.log('Hora de Login:', sessionStorage.getItem('horaLogin'));
        console.log('========================');
    };

    // Función para limpiar sesión
    window.limpiarSesion = function() {
        sessionStorage.clear();
        localStorage.clear();
        console.log('Sesión limpiada');
        location.reload();
    };

    // ========================================
    // LOGIN ADMINISTRADOR
    // ========================================
    // ========================================
    // LOGIN ADMINISTRADOR (ACTUALIZADO)
    // ========================================
    // Credenciales estáticas de respaldo (si no hay admin registrado)
    const ADMIN_USUARIO_FALLBACK  = 'admin';
    const ADMIN_PASSWORD_FALLBACK = 'conocetec2024';

    const btnAdmin = document.getElementById('btnAdmin');
    const btnConfirmarAdmin = document.getElementById('btnConfirmarAdmin');

    if (btnAdmin) {
        btnAdmin.addEventListener('click', function() {
            const modalAdminEl = document.getElementById('modalAdmin');
            if (modalAdminEl) {
                const m = new bootstrap.Modal(modalAdminEl);
                m.show();
            }
        });
    }

    // También actualizar el modal de admin para mostrar enlace de registro
    const modalAdminEl2 = document.getElementById('modalAdmin');
    if (modalAdminEl2) {
        const body = modalAdminEl2.querySelector('.modal-body');
        if (body && !body.querySelector('.admin-register-link')) {
            const link = document.createElement('div');
            link.className = 'admin-register-link';
            link.style.cssText = 'text-align:center;margin-top:8px;font-size:.78rem;color:#888;';
            link.innerHTML = '¿No tienes cuenta? <a href="pages/registro-admin.html" style="color:#1e2a5a;font-weight:700;">Registrarse como Administrador</a>';
            body.appendChild(link);
        }
    }

    if (btnConfirmarAdmin) {
        btnConfirmarAdmin.addEventListener('click', function() {
            const usuario  = document.getElementById('usuarioAdmin').value.trim();
            const password = document.getElementById('passwordAdmin').value.trim();
            const errDiv   = document.getElementById('adminLoginError');

            const adminUsuarioGuardado  = localStorage.getItem('adminUsuario');
            const adminPasswordGuardado = localStorage.getItem('adminPassword');
            const adminDataStr          = localStorage.getItem('adminData');

            let credencialesOK = false;
            let nombreAdmin = 'Administrador';

            if (adminUsuarioGuardado && adminPasswordGuardado) {
                if (usuario === adminUsuarioGuardado && password === adminPasswordGuardado) {
                    credencialesOK = true;
                    if (adminDataStr) {
                        const adminData = JSON.parse(adminDataStr);
                        nombreAdmin = adminData.nombreCompleto || adminUsuarioGuardado;
                    } else {
                        nombreAdmin = adminUsuarioGuardado;
                    }
                }
            }

            // Fallback a credenciales estáticas
            if (!credencialesOK && usuario === ADMIN_USUARIO_FALLBACK && password === ADMIN_PASSWORD_FALLBACK) {
                credencialesOK = true;
                nombreAdmin = 'Administrador';
            }

            if (credencialesOK) {
                _completarLoginAdmin(usuario, password, nombreAdmin);
            } else {
                // No encontrado en localStorage → verificar en servidor (soporte para móvil)
                errDiv.style.display = 'none';
                var btnOrig = btnConfirmarAdmin.innerHTML;
                btnConfirmarAdmin.disabled = true;
                btnConfirmarAdmin.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verificando...';
                fetch('/api/users/admin/check?usuario=' + encodeURIComponent(usuario) + '&password=' + encodeURIComponent(password))
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        btnConfirmarAdmin.disabled = false;
                        btnConfirmarAdmin.innerHTML = btnOrig;
                        if (data.ok) {
                            localStorage.setItem('adminUsuario', usuario);
                            localStorage.setItem('adminPassword', password);
                            if (data.nombre && data.nombre !== 'Administrador') {
                                localStorage.setItem('nombreUsuarioActual', data.nombre);
                            }
                            _completarLoginAdmin(usuario, password, data.nombre || usuario);
                        } else {
                            errDiv.style.display = 'block';
                            document.getElementById('passwordAdmin').value = '';
                            document.getElementById('passwordAdmin').focus();
                        }
                    })
                    .catch(function() {
                        btnConfirmarAdmin.disabled = false;
                        btnConfirmarAdmin.innerHTML = btnOrig;
                        errDiv.style.display = 'block';
                        document.getElementById('passwordAdmin').value = '';
                        document.getElementById('passwordAdmin').focus();
                    });
            }
        });
    }

    function _completarLoginAdmin(usuario, password, nombreAdmin) {
        var errDiv = document.getElementById('adminLoginError');
        errDiv.style.display = 'none';
        sessionStorage.setItem('tipoUsuario',  'admin');
        sessionStorage.setItem('rolUsuario',   'admin');
        sessionStorage.setItem('usuarioActual', usuario);
        sessionStorage.setItem('nombreUsuario', nombreAdmin);
        sessionStorage.setItem('horaLogin', new Date().toLocaleTimeString());
        if (nombreAdmin !== 'Administrador') {
            localStorage.setItem('nombreUsuarioActual', nombreAdmin);
        }
        var modalAdminEl = document.getElementById('modalAdmin');
        var m = bootstrap.Modal.getInstance(modalAdminEl);
        if (m) m.hide();
        mostrarAlerta('¡Bienvenido, ' + nombreAdmin.split(' ')[0] + '!', 'success');
        setTimeout(function() {
            window.location.href = 'pages/dashboard-admin.html';
        }, 1200);
    }

    console.log('Escribe verSesion() para ver los datos de sesión');
    console.log('Escribe limpiarSesion() para limpiar la sesión');
});
//