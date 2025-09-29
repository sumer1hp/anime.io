// room-manager.js
let currentRoomId = null;
let isHost = false;

// GitHub Personal Access Token (ограниченный токен)
const GITHUB_TOKEN = 'ghp_your_token_here'; // Замените на ваш токен

document.addEventListener('DOMContentLoaded', async () => {
  // Инициализируем GitHub Bridge
  window.githubBridge.init(GITHUB_TOKEN);
  
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

async function createRoom() {
  const roomInput = document.getElementById('roomNumberInput');
  let roomId = roomInput.value.trim();
  
  if (!roomId) {
    roomId = generateRoomId();
    roomInput.value = roomId;
  }
  
  if (!validateRoomId(roomId)) {
    showAlert('Номер комнаты должен содержать только буквы и цифры (3-15 символов)', 'error');
    return;
  }
  
  // Проверяем, не существует ли уже комната
  const roomExists = await window.githubBridge.checkRoom(roomId);
  if (roomExists) {
    showAlert('Комната с таким номером уже существует', 'error');
    return;
  }
  
  // Создаем комнату в GitHub
  const success = await window.githubBridge.createRoom(roomId, {
    userAgent: navigator.userAgent,
    created: new Date().toISOString()
  });
  
  if (!success) {
    showAlert('Ошибка создания комнаты. Проверьте подключение к интернету.', 'error');
    return;
  }
  
  currentRoomId = roomId;
  isHost = true;
  
  initializeRoom();
  bootstrap.Modal.getInstance(document.getElementById('connectModal')).hide();
  
  showAlert(`Комната "${roomId}" создана!`, 'success');
}

async function joinRoom() {
  const roomId = document.getElementById('roomNumberInput').value.trim();
  
  if (!roomId) {
    showAlert('Введите номер комнаты', 'error');
    return;
  }
  
  if (!validateRoomId(roomId)) {
    showAlert('Некорректный номер комнаты', 'error');
    return;
  }
  
  // Проверяем существование комнаты
  const roomExists = await window.githubBridge.checkRoom(roomId);
  if (!roomExists) {
    showAlert('Комната не найдена. Проверьте номер или создайте новую комнату.', 'error');
    return;
  }
  
  // Присоединяемся к комнате
  const result = await window.githubBridge.joinRoom(roomId, {
    userAgent: navigator.userAgent,
    joined: new Date().toISOString()
  });
  
  if (!result.success) {
    showAlert('Не удалось присоединиться к комнате', 'error');
    return;
  }
  
  currentRoomId = roomId;
  isHost = false;
  
  initializeRoom();
  bootstrap.Modal.getInstance(document.getElementById('connectModal')).hide();
  
  showAlert(`Успешно подключено к комнате "${roomId}"`, 'success');
  
  // Загружаем субтитры из комнаты
  const subtitles = window.githubBridge.getSubtitles(roomId);
  if (subtitles.length > 0) {
    window.dispatchEvent(new CustomEvent('subtitlesLoaded', { 
      detail: { items: subtitles } 
    }));
  }
}

function closeModal() {
  bootstrap.Modal.getInstance(document.getElementById('connectModal')).hide();
  showAlert('Режим оффлайн - изменения не синхронизируются', 'warning');
}

function initializeRoom() {
  showRoomInfo();
  loadRealtimeScript();
  startSyncInterval();
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
  } else {
    script.src = 'js/realtime-guest.js';
    script.setAttribute('data-room-id', currentRoomId);
  }
  
  document.body.appendChild(script);
}

function startSyncInterval() {
  if (isHost) {
    // Ведущий периодически сохраняет субтитры в GitHub
    setInterval(async () => {
      if (currentRoomId && typeof window.getSubtitleItems === 'function') {
        const items = window.getSubtitleItems();
        await window.githubBridge.updateSubtitles(currentRoomId, items);
      }
    }, 5000); // Синхронизация каждые 5 секунд
  } else {
    // Гость периодически проверяет обновления в GitHub
    setInterval(async () => {
      if (currentRoomId) {
        await window.githubBridge.loadRooms();
        const subtitles = window.githubBridge.getSubtitles(currentRoomId);
        const currentItems = window.getSubtitleItems ? window.getSubtitleItems() : [];
        
        if (JSON.stringify(subtitles) !== JSON.stringify(currentItems) && subtitles.length > 0) {
          window.dispatchEvent(new CustomEvent('subtitlesLoaded', { 
            detail: { items: subtitles } 
          }));
        }
      }
    }, 3000); // Проверка каждые 3 секунды
  }
}

function disconnectFromRoom() {
  currentRoomId = null;
  isHost = false;
  
  document.getElementById('roomInfo').classList.add('d-none');
  document.getElementById('connectToRoomBtn').classList.remove('d-none');
  
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

window.getCurrentRoomInfo = () => ({
  roomId: currentRoomId,
  isHost: isHost
});
