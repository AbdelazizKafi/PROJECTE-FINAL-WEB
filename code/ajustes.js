document.addEventListener('DOMContentLoaded', function () {
    const baseURL = 'http://192.168.34.1:8000';
    const logoutButton = document.querySelector('.nav-menu a[data-action="logout"]');
    const userIcon = document.getElementById('user-icon');
    const loginButton = document.querySelector('.nav-menu a[href="login.html"]');

    let reservasCargadas = false;

    function checkAuth() {
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        const isLoggedIn = token && userId;

        if (userIcon) userIcon.style.display = isLoggedIn ? 'inline-block' : 'none';
        if (loginButton) loginButton.style.display = isLoggedIn ? 'none' : 'inline-block';
        if (logoutButton) logoutButton.style.display = isLoggedIn ? 'inline-block' : 'none';

        if (!isLoggedIn && window.location.pathname.includes('ajustes.html')) {
            console.log('Usuario no autenticado, redirigiendo...');
        } else if (isLoggedIn) {
            console.log('Usuario autenticado, cargando datos...');
            cargarDatosUsuario(userId);
        }
    }

    function logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        alert("Sesión cerrada correctamente");
        window.location.href = 'index.html';
        setTimeout(() => window.location.reload(), 100);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function (e) {
            e.preventDefault();
            logout();
        });
    }

    checkAuth();

    const navLinks = document.querySelectorAll('.nav-menu a:not([data-action="logout"])');
    const secciones = {
        'Mis Reservas': 'reservas-section',
        'Detalles de la Cuenta': 'cuenta-section',
        'Mis Reseñas': 'resenas-section'
    };

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const text = this.textContent.trim();
            if (this.getAttribute('data-action') === 'logout') return;
            e.preventDefault();

            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            Object.values(secciones).forEach(id => {
                const section = document.getElementById(id);
                if (section) section.style.display = 'none';
            });

            const targetId = secciones[text];
            if (targetId) {
                const sectionToShow = document.getElementById(targetId);
                if (sectionToShow) sectionToShow.style.display = 'block';

                if (text === 'Mis Reservas' && !reservasCargadas) {
                    const userId = localStorage.getItem('userId');
                    cargarReservasUsuario(userId);
                    reservasCargadas = true;
                }
            }
        });
    });

    async function cargarDatosUsuario(userId) {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token || !userId) {
                console.error('No hay token o ID de usuario');
                return;
            }

            const response = await fetch(`http://dinetime.freeddns.org:8000/usuarios/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error al obtener datos: ${response.status}`);
            }

            const userData = await response.json();

            mostrarDatosUsuario(userData);
            actualizarTarjetaUsuario(userData);

        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
        }
    }

    function mostrarDatosUsuario(usuario) {
        const nombreInput = document.querySelector('.form-group input[type="text"]');
        if (nombreInput && usuario.nombre) nombreInput.value = usuario.nombre;

        const emailInput = document.getElementById('email');
        if (emailInput && usuario.email) emailInput.value = usuario.email;

        const telefonoInput = document.getElementById('phone');
        if (telefonoInput && usuario.telefono) telefonoInput.value = usuario.telefono;

        const fechaRegistroInput = document.getElementById('birthdate');
        if (fechaRegistroInput && usuario.fecha_registro) {
            fechaRegistroInput.value = formatearFecha(usuario.fecha_registro);
        }

        const paisSelect = document.getElementById('country');
        if (paisSelect && usuario.pais) paisSelect.value = usuario.pais;

        const ciudadInput = document.getElementById('city');
        if (ciudadInput && usuario.ciudad) ciudadInput.value = usuario.ciudad;
    }

    function actualizarTarjetaUsuario(usuario) {
        const userNameElement = document.querySelector('.user-info h2');
        const avatarElement = document.querySelector('.user-avatar');
        const userSinceElement = document.querySelector('.user-info p');

        if (userNameElement && usuario.nombre) userNameElement.textContent = usuario.nombre;

        if (avatarElement && usuario.nombre) {
            const iniciales = usuario.nombre
                .split(' ')
                .map(n => n.charAt(0))
                .join('')
                .substring(0, 2)
                .toUpperCase();
            avatarElement.textContent = iniciales;
        }

        if (userSinceElement && usuario.fecha_registro) {
            const fecha = new Date(usuario.fecha_registro);
            const mes = fecha.toLocaleString('es-ES', { month: 'long' });
            const anio = fecha.getFullYear();
            userSinceElement.textContent = `Usuario desde ${mes} de ${anio}`;
        }
    }

    function formatearFecha(fechaStr) {
        try {
            const fecha = new Date(fechaStr);
            return fecha.toISOString().split('T')[0];
        } catch (e) {
            console.error('Error al formatear fecha:', e);
            return '';
        }
    }

    const accountForm = document.querySelector('.account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('accessToken');
            if (!userId || !token) {
                alert('No hay sesión activa');
                return;
            }

            const nombreInput = document.querySelector('#cuenta-section input[type="text"]:first-child');
            const emailInput = document.querySelector('#cuenta-section #email');
            const telefonoInput = document.querySelector('#cuenta-section #phone');
            const paisSelect = document.querySelector('#cuenta-section #country');
            const ciudadInput = document.querySelector('#cuenta-section #city');

            const datosActualizados = {
                nombre: nombreInput?.value || '',
                email: emailInput?.value || '',
                telefono: telefonoInput?.value || '',
                pais: paisSelect?.value || '',
                ciudad: ciudadInput?.value || ''
            };

            try {
                const response = await fetch(`http://dinetime.freeddns.org:8000/usuarios/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datosActualizados)
                });

                if (!response.ok) {
                    throw new Error(`Error al actualizar: ${response.status}`);
                }

                const usuarioActualizado = await response.json();
                mostrarDatosUsuario(usuarioActualizado);
                actualizarTarjetaUsuario(usuarioActualizado);
                alert('Datos actualizados correctamente');

            } catch (error) {
                console.error('Error al guardar cambios:', error);
                alert('Error al guardar los cambios');
            }
        });
    }

    async function cargarReservasUsuario(userId) {
        const token = localStorage.getItem('accessToken');
        if (!token || !userId) return;

        try {
            const response = await fetch(`http://dinetime.freeddns.org:8000/usuarios/${userId}/reservas`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Error al obtener reservas');

            const reservas = await response.json();
            mostrarReservasUsuario(reservas);

        } catch (error) {
            console.error('Error cargando reservas:', error);
        }
    }

    function mostrarReservasUsuario(reservas) {
        const contenedor = document.getElementById('reservas-dinamicas');
        const mensaje = document.getElementById('no-reservations-message');
    
        if (!contenedor) return;
    
        if (reservas.length === 0) {
            contenedor.innerHTML = '';
            if (mensaje) mensaje.style.display = 'block';
            return;
        }
    
        if (mensaje) mensaje.style.display = 'none';
    
        contenedor.innerHTML = reservas.map(reserva => `
            <div class="reserva-card" data-id="${reserva.id}">
                <h4>${reserva.restaurante}</h4>
                <p><strong>Fecha y hora:</strong> ${reserva.fecha}</p>
                <p><strong>Personas:</strong> ${reserva.personas}</p>
                <button class="btn-edit">Editar</button>
                <button class="btn-delete">Eliminar</button>
            </div>
        `).join('');
    
        agregarEventosReservas();
    }
    
});
function agregarEventosReservas() {
    const botonesEditar = document.querySelectorAll('.btn-edit');
    const botonesEliminar = document.querySelectorAll('.btn-delete');

    botonesEditar.forEach(btn => {
        btn.addEventListener('click', manejarEdicionReserva);
    });

    botonesEliminar.forEach(btn => {
        btn.addEventListener('click', manejarEliminacionReserva);
    });
}

async function manejarEdicionReserva(event) {
    const reservaCard = event.target.closest('.reserva-card');
    const reservaId = reservaCard.getAttribute('data-id');
    const token = localStorage.getItem('accessToken');

    const fechaActual = reservaCard.querySelector('p:nth-child(2)').textContent.replace('Fecha y hora: ', '');

    const nuevaFechaInput = prompt('Nueva fecha y hora (formato YYYY-MM-DD HH:mm):', fechaActual);
    if (!nuevaFechaInput) return;

    const nuevaFecha = nuevaFechaInput.length === 16 ? nuevaFechaInput + ':00' : nuevaFechaInput;
    const nuevaFechaIso = nuevaFecha.replace(' ', 'T');

    const personasActuales = reservaCard.querySelector('p:nth-child(3)').textContent.replace('Personas: ', '');
    const nuevasPersonas = prompt('Número de personas:', personasActuales);
    if (!nuevasPersonas) return;

    const personasNum = Number(nuevasPersonas);
    if (isNaN(personasNum) || personasNum <= 0) {
        alert('Número de personas inválido');
        return;
    }

    console.log('Enviando datos:', {
        fecha_reserva: nuevaFechaIso,
        personas: personasNum
    });

    try {
        const response = await fetch(`http://dinetime.freeddns.org:8000/reservas/${reservaId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fecha_reserva: nuevaFechaIso,
                personas: personasNum
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error backend:', errorData);
            throw new Error('Error al actualizar reserva');
        }

        alert('Reserva actualizada correctamente');
        const userId = localStorage.getItem('userId');
        cargarReservasUsuario(userId);

    } catch (error) {
        console.error(error);
        alert('No se pudo actualizar la reserva');
    }
}


async function manejarEliminacionReserva(event) {
    const reservaCard = event.target.closest('.reserva-card');
    const reservaId = reservaCard.getAttribute('data-id');
    const token = localStorage.getItem('accessToken');

    if (!confirm('¿Estás seguro de que quieres eliminar esta reserva?')) return;

    try {
        const response = await fetch(`http://dinetime.freeddns.org:8000/reservas/${reservaId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al eliminar reserva');

        alert('Reserva eliminada correctamente');
        reservaCard.remove();

    } catch (error) {
        console.error(error);
        alert('No se pudo eliminar la reserva');
    }
}

