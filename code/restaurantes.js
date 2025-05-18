document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.getElementById("menu-btn");
  const navLinks = document.getElementById("nav-links");
  const inputFecha = document.getElementById("date");
if (inputFecha) {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const fechaActual = `${yyyy}-${mm}-${dd}`;
  inputFecha.value = fechaActual;
}

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  const openLoginBtn = document.getElementById("open-login");
  const closeLoginBtn = document.getElementById("close-login");
  const overlay = document.getElementById("overlay");

  if (openLoginBtn && overlay) {
    openLoginBtn.addEventListener("click", () => {
      overlay.style.display = "flex";
    });
  }

  if (closeLoginBtn && overlay) {
    closeLoginBtn.addEventListener("click", () => {
      overlay.style.display = "none";
    });
  }

  const timeSlots = document.querySelectorAll(".time-slot");
  timeSlots.forEach((slot) => {
    slot.addEventListener("click", () => {
      timeSlots.forEach((s) => s.classList.remove("selected"));
      slot.classList.add("selected");
    });
  });

  if (timeSlots.length > 0 && !document.querySelector(".time-slot.selected")) {
    timeSlots[0].classList.add("selected");
  }

  function obtenerNombreRestaurante() {
    const titleElement = document.querySelector(".restaurant-title h1");
    if (titleElement) return titleElement.textContent;

    const titleParts = document.title.split(" - ");
    return titleParts.length > 0 ? titleParts[0] : "Restaurante";
  }

  const restauranteSlug = window.location.pathname
    .split("/")
    .pop()
    .replace(".html", "")
    .toLowerCase();

  const reservarBtn = document.getElementById("reservar-btn");
  if (reservarBtn) {
    reservarBtn.addEventListener("click", function () {
      const fecha = document.getElementById("date").value;
      const personas = document.getElementById("people").value;
      const slot = document.querySelector(".time-slot.selected");
      const hora = slot ? slot.textContent : null;

      if (!hora) {
        alert("Por favor, selecciona una hora para la reserva.");
        return;
      }

      const formatoFecha = new Date(fecha);
      const opciones = { day: "numeric", month: "short" };
      const fechaFormateada = formatoFecha.toLocaleDateString("es-ES", opciones);

      const nombreRestaurante = obtenerNombreRestaurante();

      const queryParams = new URLSearchParams({
        restaurante: restauranteSlug,
        restaurant_name: nombreRestaurante,
        date: fechaFormateada,
        time: hora,
        people: personas,
      });

      const urlConfirmacion = `confirmacion-reserva.html?${queryParams.toString()}`;
      
      console.log("URL FINAL:", urlConfirmacion);

      window.location.href = urlConfirmacion;
    });
  }
});
function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}


