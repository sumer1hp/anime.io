// room-manager.js
let currentRoomId = null;
let isHost = false;

document.addEventListener('DOMContentLoaded', () => {
  const connectModal = new bootstrap.Modal(document.getElementById('connectModal'));
  
  // Показываем модальное окно при загрузке
  connectModal.show();

  // Обработчики кнопок
  document.getElementById('createRoomBtn').addEventListener('click', createRoom);
  document.getElementById('joinRoomBtn').addEventListener('click', joinRoom);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('connectToRoomBtn').addEventListener('click', () => connectModal.show());
  document.getElementById('disconnectBtn').addEventListener('click', disconnectFromRoom);
  document.getElementById('copyRoomIdBtn').addEventListener('click', copyRoomId);

  // Автофокус на поле ввода
  document.getElementById('roomNumberInput').focus();
});

function createRoom() {
  const roomInput = document.getElementById('roomNumberInput');
  let roomId = roomInput.value.trim();
  
  if (!roomId) {
    // Генерируем случайный номер если не введен
    roomId = generateRoomId();
    roomInput.value = roomId;
  }
  
  if (!validateRoomId(roomId)) {
    showAlert('Номер комнаты должен содержать только буквы и цифры (3-15 символов)', 'error');
    return;
  }
  
  currentRoomId = roomId;
  isHost = true;
  
  initializeRoom();
  bootstrap.Modal.getInstance(document.getElementById('connectModal')).hide();
  
  showAlert(`Комната "${roomId}" создана!`, 'success');
}

function joinRoom() {
  const roomId = document.getElementById('roomNumberInput').value.trim();
  
  if (!roomId) {
    showAlert('Введите номер комнаты', 'error');
    return;
  }
  
  if (!validateRoomId(roomId)) {
    showAlert('Некорректный номер комнаты', 'error');
    return;
  }
  
  currentRoomId = roomId;
  isHost = false;
  
  initializeRoom();
  bootstrap.Modal.getInstance(document.getElementById('connectModal')).hide();
  
  showAlert(`Подключение к комнате "${roomId}"...`, 'info');
}

function closeModal() {
  bootstrap.Modal.getInstance(document.getElementById('connectModal')).hide();
  showAlert('Режим оффлайн - изменения не синхронизируются', 'warning');
}

function initializeRoom() {
  showRoomInfo();
  loadRealtimeScript();
}

function showRoomInfo() {
  const roomInfo = document.getElementById('roomInfo');
  const roomStatus = document.getElementById('roomStatus');
  const currentRoomIdElem = document.getElementById('currentRoomId');
  const connectBtn = document.getElementById('connectToRoomBtn');
  
  roomInfo.classList.remove('d-none');
  connectBtn.classList.add('d-none');
  
  roomStatus.textContent = isHost ? 'Вы ведущий комнаты' : 'Вы участник комнаты';
  currentRoomIdElem.textContent = currentRoomId;
  
  if (isHost) {
    roomInfo.classList.remove('alert-info');
    roomInfo.classList.add('alert-success');
  } else {
    roomInfo.classList.remove('alert-success');
    roomInfo.classList.add('alert-info');
  }
}

function loadRealtimeScript() {
  const script = document.createElement('script');
  
  if (isHost) {
    script.src = 'js/realtime-host.js';
    script.setAttribute('data-room-id', currentRoomId);
    console.log('Loading host script for room:', currentRoomId);
  } else {
    script.src = 'js/realtime-guest.js';
    script.setAttribute('data-room-id', currentRoomId);
    console.log('Loading guest script for room:', currentRoomId);
  }
  
  document.body.appendChild(script);
}

function disconnectFromRoom() {
  currentRoomId = null;
  isHost = false;
  
  // Скрываем информацию о комнате
  document.getElementById('roomInfo').classList.add('d-none');
  document.getElementById('connectToRoomBtn').classList.remove('d-none');
  
  // Перезагружаем страницу чтобы очистить PeerJS соединения
  location.reload();
}

function copyRoomId() {
  navigator.clipboard.writeText(currentRoomId).then(() => {
    const btn = document.getElementById('copyRoomIdBtn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check"></i> Скопировано!';
    btn.disabled = true;
    
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }, 2000);
  });
}

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function validateRoomId(roomId) {
  return /^[A-Z0-9]{3,15}$/i.test(roomId);
}

function showAlert(message, type = 'info') {
  // Удаляем предыдущие уведомления
  const existingAlerts = document.querySelectorAll('.temp-alert');
  existingAlerts.forEach(alert => alert.remove());

  const alertClass = {
    'success': 'alert-success',
    'error': 'alert-danger',
    'warning': 'alert-warning',
    'info': 'alert-info'
  }[type] || 'alert-info';

  const alert = document.createElement('div');
  alert.className = `alert ${alertClass} temp-alert position-fixed`;
  alert.style.cssText = 'top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 300px;';
  alert.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi ${getAlertIcon(type)} me-2"></i>
      <div>${message}</div>
      <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    if (alert.parentNode) {
      alert.remove();
    }
  }, 4000);
}

function getAlertIcon(type) {
  const icons = {
    'success': 'bi-check-circle',
    'error': 'bi-exclamation-circle',
    'warning': 'bi-exclamation-triangle',
    'info': 'bi-info-circle'
  };
  return icons[type] || 'bi-info-circle';
}

// Экспортируем функции для использования в других скриптах
window.getCurrentRoomInfo = () => ({
  roomId: currentRoomId,
  isHost: isHost
});
