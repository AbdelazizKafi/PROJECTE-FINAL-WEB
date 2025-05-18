document.addEventListener('DOMContentLoaded', function () {
    const dateIcon = document.getElementById('date-icon');
    const dateInput = document.getElementById('date-input');
    const timeIcon = document.getElementById('time-icon');
    const timeInput = document.getElementById('time-input');

    function checkAuth() {
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        const loginButton = document.getElementById('open-login');
        const userIcon = document.getElementById('user-icon');

        if (token && userId) {
            loginButton.style.display = 'none';
            userIcon.style.display = 'inline-block';
        } else {
            loginButton.style.display = 'inline-block';
            userIcon.style.display = 'none';
        }
    }

    checkAuth();

    if (dateIcon && dateInput) {
        dateIcon.addEventListener('click', function () {
            dateInput.focus();
            dateInput.click();
        });
    }

    if (timeIcon && timeInput) {
        timeIcon.addEventListener('click', function () {
            timeInput.focus();
            timeInput.click();
        });
    }
    
    const openLogin = document.getElementById("open-login");
    const closeLogin = document.getElementById("close-login");
    const overlay = document.getElementById("overlay");
    const loginBox = document.querySelector(".login__box");
    const registerBox = document.getElementById("register-box");
    const closeRegisterBtn = document.getElementById("close-register");
    const toRegisterLink = document.querySelector(".login__box a");
    const backToLogin = document.getElementById("back-to-login");
    const body = document.body;

    function disableScroll() {
        body.classList.add("no-scroll");
    }

    function enableScroll() {
        body.classList.remove("no-scroll");
    }

    if (openLogin) {
        openLogin.addEventListener("click", function () {
            overlay.style.display = "flex";
            loginBox.style.display = "block";
            registerBox.style.display = "none";
            disableScroll();
        });
    }

    if (closeLogin) {
        closeLogin.addEventListener("click", function () {
            overlay.style.display = "none";
            enableScroll();
        });
    }

    if (closeRegisterBtn) {
        closeRegisterBtn.addEventListener("click", function () {
            overlay.style.display = "none";
            enableScroll();
        });
    }

    if (toRegisterLink) {
        toRegisterLink.addEventListener("click", function (e) {
            e.preventDefault();
            loginBox.style.display = "none";
            registerBox.style.display = "block";
        });
    }

    if (backToLogin) {
        backToLogin.addEventListener("click", function (e) {
            e.preventDefault();
            registerBox.style.display = "none";
            loginBox.style.display = "block";
        });
    }

    window.addEventListener("click", function (event) {
        if (event.target === overlay) {
            overlay.style.display = "none";
            enableScroll();
        }
    });

    window.addEventListener("wheel", function (e) {
        if (body.classList.contains("no-scroll")) {
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener("touchmove", function (e) {
        if (body.classList.contains("no-scroll")) {
            e.preventDefault();
        }
    }, { passive: false });

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            fetch('http://dinetime.freeddns.org:8000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: email, 
                    password: password 
                })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Credenciales incorrectas');
                    }
                    return response.json();
                })
                .then(data => {
                    localStorage.setItem('accessToken', data.access_token);
                    localStorage.setItem('userId', data.user_id);
                    localStorage.setItem('userName', data.nombre);
                    localStorage.setItem('userRole', data.rol);
                    
                    overlay.style.display = 'none';
                    enableScroll();
                    
                    checkAuth();
                    
                    alert('Inicio de sesión exitoso');
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al iniciar sesión: ' + error.message);
                });
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const nombre = document.getElementById('name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            fetch('http://dinetime.freeddns.org:8000/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    nombre: nombre, 
                    email: email, 
                    password_hash: password 
                })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.detail || 'Error al registrar el usuario');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    alert('Usuario registrado con éxito');
                    
                    registerBox.style.display = "none";
                    loginBox.style.display = "block";
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error: ' + error.message);
                });
        });
    }

    function logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        checkAuth(); 
    }

    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.getElementById('restaurant-carousel');
    if (!carousel) return; 
    
    const leftArrow = document.querySelector('.carousel__arrow--left');
    const rightArrow = document.querySelector('.carousel__arrow--right');
    const cards = carousel.querySelectorAll('.room__card');

    let currentIndex = 0;
    const cardsToShow = 3;
    const totalCards = cards.length;

    carousel.style.position = 'relative';
    carousel.style.overflow = 'hidden';

    const cardsContainer = document.createElement('div');
    cardsContainer.style.display = 'flex';
    cardsContainer.style.transition = 'transform 0.3s ease-in-out';
    carousel.appendChild(cardsContainer);

    cards.forEach((card) => {
        card.style.flex = '0 0 auto';
        card.style.width = `${100 / cardsToShow}%`;
        cardsContainer.appendChild(card);
    });

    function updateCarousel() {
        const cardWidth = 100 / cardsToShow;
        cardsContainer.style.transform = `translateX(-${currentIndex * cardWidth}%)`;
    }

    updateCarousel();

    if (leftArrow) {
        leftArrow.addEventListener('click', function () {
            if (currentIndex === 0) {
                currentIndex = totalCards - cardsToShow;
            } else {
                currentIndex = Math.max(currentIndex - cardsToShow, 0);
            }
            updateCarousel();
        });
    }
    
    if (rightArrow) {
        rightArrow.addEventListener('click', function () {
            if (currentIndex >= totalCards - cardsToShow) {
                currentIndex = 0;
            } else {
                currentIndex = Math.min(currentIndex + cardsToShow, totalCards - cardsToShow);
            }
            updateCarousel();
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const fechaExplore = document.getElementById("fecha-explore");
    if (fechaExplore) {
      const hoy = new Date();
      const opciones = { day: "numeric", month: "long", year: "numeric" };
      const fechaFormateada = hoy.toLocaleDateString("es-ES", opciones);
      fechaExplore.textContent = fechaFormateada;
    }

    const exploreSection = document.getElementById("explore");
    const destino = document.getElementById("restaurantes");
  
    if (exploreSection && destino) {
      exploreSection.style.cursor = "pointer";
      exploreSection.addEventListener("click", () => {
        destino.scrollIntoView({ behavior: "smooth" });
      });
    }
});
