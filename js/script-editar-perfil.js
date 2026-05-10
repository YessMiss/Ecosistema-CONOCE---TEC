// ========================================
// MUNICIPIOS POR ESTADO
// ========================================
var MUNICIPIOS = {
    'Aguascalientes': ['Aguascalientes','Asientos','Calvillo','Cosío','El Llano','Jesús María','Pabellón de Arteaga','Rincón de Romos','San Francisco de los Romo','Tepezalá'],
    'Baja California': ['Ensenada','Mexicali','Playas de Rosarito','Tecate','Tijuana'],
    'Baja California Sur': ['Comondú','La Paz','Loreto','Los Cabos','Mulegé'],
    'Campeche': ['Calkiní','Campeche','Carmen','Champotón','Escárcega','Hecelchakán','Hopelchén','Palizada','Tenabo','Calakmul','Candelaria'],
    'Chiapas': ['Comitán de Domínguez','Ocosingo','San Cristóbal de las Casas','Tapachula','Tuxtla Gutiérrez','Tonalá','Palenque','Pichucalco'],
    'Chihuahua': ['Chihuahua','Ciudad Juárez','Cuauhtémoc','Delicias','Hidalgo del Parral','Ojinaga'],
    'Ciudad de México': ['Álvaro Obregón','Azcapotzalco','Benito Juárez','Coyoacán','Cuajimalpa','Cuauhtémoc','Gustavo A. Madero','Iztacalco','Iztapalapa','La Magdalena Contreras','Miguel Hidalgo','Milpa Alta','Tláhuac','Tlalpan','Venustiano Carranza','Xochimilco'],
    'Coahuila': ['Monclova','Piedras Negras','Saltillo','Torreón','Acuña'],
    'Colima': ['Colima','Comala','Coquimatlán','Cuauhtémoc','Ixtlahuacán','Manzanillo','Minatitlán','Técpan','Tecomán','Villa de Álvarez'],
    'Durango': ['Durango','Gómez Palacio','Lerdo','Santiago Papasquiaro'],
    'Estado de México': ['Ecatepec','Naucalpan','Nezahualcóyotl','Texcoco','Tlalnepantla','Toluca','Tultitlán','Chimalhuacán','Ixtapaluca'],
    'Guanajuato': ['Celaya','Guanajuato','Irapuato','León','Salamanca','San Miguel de Allende','Silao'],
    'Guerrero': ['Acapulco','Chilpancingo','Iguala','Taxco','Zihuatanejo'],
    'Hidalgo': ['Pachuca','Tula de Allende','Tulancingo','Zimapán'],
    'Jalisco': ['Guadalajara','Puerto Vallarta','Tlaquepaque','Tonalá','Zapopan','Tepatitlán','Lagos de Moreno'],
    'Michoacán': ['Lázaro Cárdenas','Morelia','Uruapan','Zamora','Zitácuaro'],
    'Morelos': ['Cuernavaca','Cuautla','Jiutepec','Temixco','Yautepec'],
    'Nayarit': ['Bahía de Banderas','Compostela','Santiago Ixcuintla','Tepic'],
    'Nuevo León': ['Apodaca','Escobedo','Guadalupe','Monterrey','San Nicolás de los Garza','San Pedro Garza García','Santa Catarina'],
    'Oaxaca': ['Huajuapan de León','Juchitán','Oaxaca de Juárez','Salina Cruz','Tuxtepec'],
    'Puebla': ['Puebla','San Andrés Cholula','San Martín Texmelucan','Tehuacán','Teziutlán'],
    'Querétaro': ['Corregidora','El Marqués','Querétaro','San Juan del Río'],
    'Quintana Roo': ['Benito Juárez (Cancún)','Cozumel','Felipe Carrillo Puerto','Isla Mujeres','Othón P. Blanco (Chetumal)','Playa del Carmen','Solidaridad','Tulum'],
    'San Luis Potosí': ['Ciudad Valles','Matehuala','Rioverde','San Luis Potosí','Soledad de Graciano Sánchez'],
    'Sinaloa': ['Ahome (Los Mochis)','Culiacán','Guasave','Mazatlán','Navolato'],
    'Sonora': ['Cajeme (Cd. Obregón)','Guaymas','Hermosillo','Navojoa','Nogales'],
    'Tabasco': ['Cárdenas','Centro (Villahermosa)','Comalcalco','Cunduacán','Macuspana','Paraíso'],
    'Tamaulipas': ['Altamira','Madero','Matamoros','Nuevo Laredo','Reynosa','Tampico','Victoria'],
    'Tlaxcala': ['Apizaco','Huamantla','Tlaxcala','Zacatelco'],
    'Veracruz': ['Coatzacoalcos','Córdoba','Martínez de la Torre','Minatitlán','Orizaba','Papantla','Poza Rica','Tuxpan','Veracruz','Xalapa'],
    'Yucatán': ['Kanasín','Mérida','Progreso','Umán','Valladolid'],
    'Zacatecas': ['Fresnillo','Guadalupe','Jerez','Zacatecas']
};

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosFormulario();
    configurarEventos();
    configurarSelectEstadoCiudad();
});

// ========================================
// SELECTS ESTADO / CIUDAD
// ========================================
function configurarSelectEstadoCiudad() {
    var selEstado = document.getElementById('editEstado');
    var selCiudad = document.getElementById('editCiudad');
    if (!selEstado || !selCiudad) return;

    selEstado.addEventListener('change', function() {
        var estado = this.value;
        selCiudad.innerHTML = '<option value="">Selecciona una ciudad</option>';
        if (estado && MUNICIPIOS[estado]) {
            MUNICIPIOS[estado].forEach(function(m) {
                var opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                selCiudad.appendChild(opt);
            });
        }
    });
}

function poblarCiudadesPara(estado, ciudadActual) {
    var selCiudad = document.getElementById('editCiudad');
    if (!selCiudad) return;
    selCiudad.innerHTML = '<option value="">Selecciona una ciudad</option>';
    if (estado && MUNICIPIOS[estado]) {
        MUNICIPIOS[estado].forEach(function(m) {
            var opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            if (m === ciudadActual) opt.selected = true;
            selCiudad.appendChild(opt);
        });
    }
}

// ========================================
// CARGAR DATOS DEL FORMULARIO
// ========================================
function cargarDatosFormulario() {
    var correoUsuario = sessionStorage.getItem('correoUsuario') ||
                        localStorage.getItem('correoUsuarioActual') ||
                        localStorage.getItem('correoAlumno') || '';

    var perfilGuardado = {};
    if (correoUsuario) {
        try { perfilGuardado = JSON.parse(localStorage.getItem('perfil_' + correoUsuario) || '{}'); } catch(e) {}
    }

    // Recuperar numControl del array alumnosRegistrados si no está en perfil
    var numControlRegistro = '';
    if (correoUsuario) {
        var alumnosArr = JSON.parse(localStorage.getItem('alumnosRegistrados') || '[]');
        var alumnoReg = alumnosArr.find(function(a) { return (a.correo || a.email) === correoUsuario; });
        if (alumnoReg) numControlRegistro = alumnoReg.numControl || alumnoReg.numeroControl || '';
    }

    var nombre    = perfilGuardado.nombre    || sessionStorage.getItem('usuarioActual')    || sessionStorage.getItem('nombreUsuario')   || localStorage.getItem('nombreUsuarioActual') || '';
    var numControl= perfilGuardado.numControl|| sessionStorage.getItem('numeroControl')    || localStorage.getItem('numControlActual')  || localStorage.getItem('numControlGuardado') || numControlRegistro || '';
    var carrera   = perfilGuardado.carrera   || sessionStorage.getItem('carreraUsuario')  || localStorage.getItem('carreraActual')     || localStorage.getItem('carreraGuardada')    || '';
    var semestre  = perfilGuardado.semestre  || sessionStorage.getItem('semestreUsuario') || localStorage.getItem('semestreActual')    || localStorage.getItem('semestreGuardado')   || '';
    var telefono  = perfilGuardado.telefono  || sessionStorage.getItem('telefonoUsuario') || '';
    var telEm     = perfilGuardado.telEmergencia || sessionStorage.getItem('telefonoEmergencia') || '';
    var direccion = perfilGuardado.direccion || sessionStorage.getItem('direccionUsuario') || '';
    var estado    = perfilGuardado.estado    || sessionStorage.getItem('estadoUsuario')   || '';
    var ciudad    = perfilGuardado.ciudad    || sessionStorage.getItem('ciudadUsuario')   || '';

    document.getElementById('editNombre').value             = nombre;
    document.getElementById('editCorreo').value             = correoUsuario;
    document.getElementById('editMatricula').value          = numControl;
    document.getElementById('editCarrera').value            = carrera;
    document.getElementById('editSemestre').value           = semestre;
    document.getElementById('editTelefono').value           = telefono;
    document.getElementById('editTelefonoEmergencia').value = telEm;
    document.getElementById('editDireccion').value          = direccion;

    // Cargar estado y poblar ciudades
    var selEstado = document.getElementById('editEstado');
    if (selEstado && estado) {
        selEstado.value = estado;
        poblarCiudadesPara(estado, ciudad);
    }
}

// ========================================
// CONFIGURAR EVENTOS
// ========================================
function configurarEventos() {
    var formEditarPerfil = document.getElementById('formEditarPerfil');
    if (formEditarPerfil) {
        formEditarPerfil.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarCambios();
        });
    }

    var btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', cerrarSesion);
}

// ========================================
// GUARDAR CAMBIOS — sin bloqueo de contraseña
// ========================================
function guardarCambios() {
    var nombre    = document.getElementById('editNombre').value.trim();
    var correo    = document.getElementById('editCorreo').value.trim();
    var telefono  = document.getElementById('editTelefono').value.trim();
    var matricula = document.getElementById('editMatricula').value.trim();
    var carrera   = document.getElementById('editCarrera').value;
    var semestre  = document.getElementById('editSemestre').value;
    var telEm     = document.getElementById('editTelefonoEmergencia').value.trim();
    var direccion = document.getElementById('editDireccion').value.trim();
    var estado    = document.getElementById('editEstado')  ? document.getElementById('editEstado').value  : '';
    var ciudad    = document.getElementById('editCiudad')  ? document.getElementById('editCiudad').value  : '';

    if (!nombre || !correo) {
        mostrarAlerta('Por favor completa los campos requeridos (nombre y correo)', 'warning');
        return;
    }
    if (!validarCorreo(correo)) {
        mostrarAlerta('Por favor ingresa un correo válido', 'warning');
        return;
    }

    // Guardar perfil con clave por correo (persiste entre sesiones)
    var perfilData = {
        nombre: nombre, correo: correo, numControl: matricula,
        carrera: carrera, semestre: semestre, telefono: telefono,
        telEmergencia: telEm, direccion: direccion, estado: estado, ciudad: ciudad
    };
    localStorage.setItem('perfil_' + correo, JSON.stringify(perfilData));

    // Claves genéricas de compatibilidad
    localStorage.setItem('nombreUsuarioActual',  nombre);
    localStorage.setItem('correoUsuarioActual',  correo);
    if (matricula) { localStorage.setItem('numControlActual', matricula); localStorage.setItem('numControlGuardado', matricula); }
    localStorage.setItem('carreraActual',    carrera);  localStorage.setItem('carreraGuardada',  carrera);
    localStorage.setItem('semestreActual',   semestre); localStorage.setItem('semestreGuardado', semestre);

    // sessionStorage para la sesión actual
    sessionStorage.setItem('usuarioActual',      nombre);
    sessionStorage.setItem('nombreUsuario',      nombre);
    sessionStorage.setItem('correoUsuario',      correo);
    sessionStorage.setItem('telefonoUsuario',    telefono);
    if (matricula) sessionStorage.setItem('numeroControl', matricula);
    sessionStorage.setItem('carreraUsuario',     carrera);
    sessionStorage.setItem('semestreUsuario',    semestre);
    sessionStorage.setItem('telefonoEmergencia', telEm);
    sessionStorage.setItem('direccionUsuario',   direccion);
    sessionStorage.setItem('estadoUsuario',      estado);
    sessionStorage.setItem('ciudadUsuario',      ciudad);

    // Actualizar en alumnosRegistrados
    var alumnosArr = JSON.parse(localStorage.getItem('alumnosRegistrados') || '[]');
    var idx = alumnosArr.findIndex(function(a) { return (a.correo || a.email) === correo; });
    if (idx !== -1) {
        alumnosArr[idx].nombreCompleto = nombre; alumnosArr[idx].nombre = nombre;
        alumnosArr[idx].numControl = matricula; alumnosArr[idx].carrera = carrera;
        alumnosArr[idx].semestre   = semestre;
        localStorage.setItem('alumnosRegistrados', JSON.stringify(alumnosArr));
    }

    mostrarAlerta('¡Perfil actualizado correctamente!', 'success');
    setTimeout(function() { window.location.href = 'perfil-alumno.html'; }, 1500);
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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function mostrarAlerta(mensaje, tipo) {
    tipo = tipo || 'info';
    var alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-' + tipo + ' alert-dismissible fade show';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = mensaje + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
    alertDiv.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    document.body.appendChild(alertDiv);
    setTimeout(function() { alertDiv.remove(); }, 5000);
}