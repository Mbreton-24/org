// Variables globales
let matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
let currentFilter = 'all';
let searchTerm = '';

// Elementos del DOM
const documentForm = document.getElementById('documentForm');
const documentsContainer = document.getElementById('documentsContainer');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const searchInput = document.getElementById('searchInput');
const tabs = document.querySelectorAll('.tab');

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
  updateStats();
  renderMatriculas();
  
  // Agregar event listeners
  documentForm.addEventListener('submit', handleFormSubmit);
  searchInput.addEventListener('input', handleSearch);
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => handleTabClick(tab));
  });

  // Auto-guardar en localStorage
  window.addEventListener('beforeunload', saveToLocalStorage);
});

// Manejar envío del formulario
function handleFormSubmit(e) {
  e.preventDefault();
  
  const titleInput = document.getElementById('documentTitle');
  const typeInput = document.getElementById('documentType');
  const carreraInput = document.getElementById('senderName');
  const fechaRecibidoInput = document.getElementById('senderEmail');

  const matriculaValue = titleInput.value.trim();
  const typeValue = typeInput.value;
  const carreraValue = carreraInput.value.trim();
  const fechaRecibidoValue = fechaRecibidoInput.value;

  const matriculaRegex = /^[0-9]{2}-[0-9]{4}$/;
  if (!matriculaRegex.test(matriculaValue)) {
    showNotification('La matrícula debe tener el formato 12-3456.', 'error');
    return;
  }

  if (!typeValue) {
    showNotification('Por favor selecciona el tipo de documento.', 'error');
    return;
  }

  if (!carreraValue) {
    showNotification('Por favor ingresa el nombre de la carrera.', 'error');
    return;
  }

  if (!fechaRecibidoValue) {
    showNotification('Por favor ingresa la fecha de recibido.', 'error');
    return;
  }

  const newMatricula = {
    id: Date.now().toString(),
    title: matriculaValue,
    type: typeValue,
    sender: carreraValue,
    email: fechaRecibidoValue,
    status: 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  matriculas.unshift(newMatricula);
  saveToLocalStorage();
  updateStats();
  renderMatriculas();
  
  documentForm.reset();
  
  showNotification('Matrícula registrada exitosamente', 'success');
}

// Manejar búsqueda
function handleSearch(e) {
  searchTerm = e.target.value.toLowerCase();
  renderMatriculas();
}

// Manejar clics en tabs
function handleTabClick(clickedTab) {
  tabs.forEach(tab => tab.classList.remove('active'));
  clickedTab.classList.add('active');
  currentFilter = clickedTab.dataset.status;
  renderMatriculas();
}

// Renderizar matrículas
function renderMatriculas() {
  const filteredMatriculas = matriculas.filter(matricula => {
    const matchesFilter = currentFilter === 'all' || matricula.status === currentFilter;
    const matchesSearch = !searchTerm ||
      matricula.title.toLowerCase().includes(searchTerm) ||
      (matricula.sender && matricula.sender.toLowerCase().includes(searchTerm)) ||
      (matricula.type && matricula.type.toLowerCase().includes(searchTerm));
    
    return matchesFilter && matchesSearch;
  });

  if (filteredMatriculas.length === 0) {
    documentsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No se encontraron matrículas</h3>
        <p>${searchTerm ? 'Intenta con otros términos de búsqueda.' : 'No hay matrículas en esta categoría.'}</p>
      </div>
    `;
    return;
  }

  documentsContainer.innerHTML = filteredMatriculas.map(matricula => createMatriculaCard(matricula)).join('');
}

// Crear tarjeta de matrícula HTML
function createMatriculaCard(matricula) {
  const createdDate = new Date(matricula.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const completedDate = matricula.completedAt ?
    new Date(matricula.completedAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : null;

  return `
    <div class="document-card" data-id="${matricula.id}">
      <div class="document-header">
        <div class="document-info">
          <div class="document-title">
            <i class="fas fa-id-card"></i>
            ${matricula.title}
          </div>
          <div class="document-meta">
            <span><i class="fas fa-file-alt"></i> ${matricula.type}</span>
            <span><i class="fas fa-graduation-cap"></i> ${matricula.sender}</span>
            ${matricula.email ? `<span><i class="fas fa-calendar-alt"></i> ${new Date(matricula.email).toLocaleDateString('es-ES')}</span>` : ''}
            <span><i class="fas fa-calendar"></i> Registrado: ${createdDate}</span>
            ${completedDate ? `<span><i class="fas fa-check"></i> Completado: ${completedDate}</span>` : ''}
          </div>
        </div>
        <div class="status-badge ${matricula.status === 'pending' ? 'status-pending' : 'status-completed'}">
          <i class="fas ${matricula.status === 'pending' ? 'fa-clock' : 'fa-check-circle'}"></i>
          ${matricula.status === 'pending' ? 'En Espera' : 'Realizado'}
        </div>
      </div>
      <div class="document-actions">
        ${matricula.status === 'pending' ?
          `<button class="btn btn-small btn-complete" onclick="completeMatricula('${matricula.id}')">
            <i class="fas fa-check"></i> Marcar como Realizado
          </button>` :
          `<button class="btn btn-small" onclick="reopenMatricula('${matricula.id}')">
            <i class="fas fa-undo"></i> Reabrir
          </button>`
        }
        <button class="btn btn-small btn-delete" onclick="deleteMatricula('${matricula.id}')">
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </div>
    </div>
  `;
}

// Completar matrícula
function completeMatricula(id) {
  const matriculaIndex = matriculas.findIndex(m => m.id === id);
  if (matriculaIndex !== -1) {
    matriculas[matriculaIndex].status = 'completed';
    matriculas[matriculaIndex].completedAt = new Date().toISOString();
    
    saveToLocalStorage();
    updateStats();
    renderMatriculas();
    
    showNotification('Matrícula marcada como realizada', 'success');
  }
}

// Reabrir matrícula
function reopenMatricula(id) {
  const matriculaIndex = matriculas.findIndex(m => m.id === id);
  if (matriculaIndex !== -1) {
    matriculas[matriculaIndex].status = 'pending';
    matriculas[matriculaIndex].completedAt = null;
    
    saveToLocalStorage();
    updateStats();
    renderMatriculas();
    
    showNotification('Matrícula reabierta', 'warning');
  }
}

// Eliminar matrícula
function deleteMatricula(id) {
  if (confirm('¿Estás seguro de que deseas eliminar esta matrícula?')) {
    const card = document.querySelector(`[data-id="${id}"]`);
    
    if (card) {
      card.classList.add('fade-out');
      
      setTimeout(() => {
        matriculas = matriculas.filter(m => m.id !== id);
        saveToLocalStorage();
        updateStats();
        renderMatriculas();
        showNotification('Matrícula eliminada', 'error');
      }, 500);
    }
  }
}

// Actualizar estadísticas
function updateStats() {
  const total = matriculas.length;
  const pending = matriculas.filter(m => m.status === 'pending').length;
  const completed = matriculas.filter(m => m.status === 'completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById('totalDocs').textContent = total;
  document.getElementById('pendingDocs').textContent = pending;
  document.getElementById('completedDocs').textContent = completed;
  document.getElementById('completionRate').textContent = completionRate + '%';
}

// Mostrar notificación
function showNotification(message, type = 'success') {
  notificationText.textContent = message;
  notification.className = `notification ${type}`;
  
  // Actualizar icono según el tipo
  const icon = notification.querySelector('i');
  switch(type) {
    case 'success':
      icon.className = 'fas fa-check-circle';
      break;
    case 'error':
      icon.className = 'fas fa-exclamation-circle';
      break;
    case 'warning':
      icon.className = 'fas fa-exclamation-triangle';
      break;
  }
  
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Guardar en localStorage
function saveToLocalStorage() {
  localStorage.setItem('matriculas', JSON.stringify(matriculas));
}
