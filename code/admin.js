document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menu-btn');
    const navLinks = document.getElementById('nav-links');
    
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('open');
      });
    }
    
    const navItems = document.querySelectorAll('.nav-menu a');
    const sections = {
      'Panel Principal': document.getElementById('dashboard-section'),
      'Gestión de Reservas': document.getElementById('reservas-section'),
      'Gestión de Restaurantes': document.getElementById('restaurantes-section'),
      'Gestión de Usuarios': document.getElementById('usuarios-section'),
      'Detalles de la Cuenta': document.getElementById('cuenta-section')
    };
    
    navItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        
        navItems.forEach(link => link.classList.remove('active'));
        this.classList.add('active');
        
        const sectionName = this.textContent;
        
        if (sections[sectionName]) {
          Object.values(sections).forEach(section => {
            if (section) section.style.display = 'none';
          });
          
          sections[sectionName].style.display = 'block';
        }
      });
    });
    
    const actionButtons = document.querySelectorAll('.btn-admin');
    
    actionButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        alert('Acción: ' + this.textContent + ' - Esta funcionalidad estará disponible próximamente');
      });
    });
  });