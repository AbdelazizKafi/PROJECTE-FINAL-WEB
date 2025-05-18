function obtenerRestauranteDeURL() {
  const params = new URLSearchParams(window.location.search);
  const restauranteParam = params.get('restaurante');
  return restauranteParam ? restauranteParam.replace('.html', '') : null;
}

function aplicarClaseRestaurante() {
  const restaurante = obtenerRestauranteDeURL();
  if (restaurante) {
    document.body.classList.add(restaurante.toLowerCase());
    console.log(`[DineTime] Clase añadida al <body>: ${restaurante}`);
  } else {
    console.warn("[DineTime] No se encontró el parámetro 'restaurante' en la URL.");
  }
}

function obtenerRestauranteParaRedireccion() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurante = urlParams.get('restaurante');
  if (restaurante) return restaurante.endsWith('.html') ? restaurante : `${restaurante}.html`;

  const referrer = document.referrer;
  if (referrer) {
    const pageName = new URL(referrer).pathname.split('/').pop();
    return pageName || 'index.html';
  }

  return 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  aplicarClaseRestaurante();

  const urlParams = new URLSearchParams(window.location.search);
  const date = urlParams.get('date') || '22 abr';
  const time = urlParams.get('time') || '19:00';
  const people = urlParams.get('people') || '2';
  const restaurantPage = obtenerRestauranteParaRedireccion();
  const restaurantName = urlParams.get('restaurant_name') || 'Restaurante';
  const restauranteSlug = obtenerRestauranteDeURL();

  document.getElementById('restaurante-name').textContent = `${restaurantName} - Barcelona`;
  const imgEl = document.getElementById('restaurante-img');
  if (imgEl && restauranteSlug) {
    imgEl.src = `/assets/${restauranteSlug}.jpeg`;
    imgEl.alt = restaurantName;
  }

  document.getElementById('reservation-date').textContent = date;
  document.getElementById('reservation-time').textContent = time;
  document.getElementById('reservation-people').textContent = `${people} personas (Asiento estándar)`;

  let minutes = 5;
  let seconds = 0;
  const countdownTimer = document.getElementById('countdown-timer');

  if (countdownTimer) {
    const countdownInterval = setInterval(() => {
      seconds--;
      if (seconds < 0) {
        minutes--;
        seconds = 59;
      }

      if (minutes < 0) {
        clearInterval(countdownInterval);
        countdownTimer.textContent = '0:00 minutos';
        alert('El tiempo para completar la reserva ha expirado.');
        window.location.href = restaurantPage;
      } else {
        countdownTimer.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds} minutos`;
      }
    }, 1000);

    window.countdownInterval = countdownInterval;
  }

  const confirmBtn = document.querySelector('.btn-confirm');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (window.countdownInterval) clearInterval(window.countdownInterval);

      const nombre = document.getElementById('user-name');
      const telefono = document.getElementById('user-phone');
      const email = document.getElementById('user-email');
      const request = document.getElementById('special-request');

      if (!nombre.value.trim()) {
        alert('Por favor, introduce tu nombre.');
        nombre.focus();
        return;
      }

      if (!telefono.value.trim()) {
        alert('Por favor, introduce tu número de teléfono.');
        telefono.focus();
        return;
      }

      if (!email.value.trim()) {
        alert('Por favor, introduce tu correo electrónico.');
        email.focus();
        return;
      }

      const meses = {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
      };

      const [diaStr, mesStr] = date.split(' ');
      const hora = time.split(':')[0];
      const minuto = time.split(':')[1];
      const now = new Date();
      const year = now.getFullYear();
      const fechaISO = new Date(
        year,
        meses[mesStr.toLowerCase()],
        parseInt(diaStr),
        parseInt(hora),
        parseInt(minuto)
      ).toISOString();

      try {
        const res = await fetch('http://dinetime.freeddns.org:8000/api/reservas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: nombre.value.trim(),
            telefono: telefono.value.trim(),
            email: email.value.trim(),
            fecha_reserva: fechaISO,
            personas: parseInt(people),
            slug_restaurante: restauranteSlug,
          })
        });

        if (res.ok) {
          alert('¡Reserva completada con éxito!');
          window.location.href = "/ajustes.html";
        } else {
          console.error('[DineTime] Error HTTP:', res.status);
          alert('Error al guardar la reserva. Intenta de nuevo.');
          window.location.href = restaurantPage;
        }
      } catch (error) {
        console.error('[DineTime] Error al enviar reserva:', error);
        alert('Error inesperado. Inténtalo más tarde.');
        window.location.href = restaurantPage;
      }
    });
  }
});

