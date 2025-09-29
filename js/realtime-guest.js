// realtime-guest.js
let peer;
let conn;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  
  if (!roomId) {
    console.log('No room ID found - not initializing guest mode');
    return;
  }

  console.log('Joining room as guest:', roomId);
  
  const guestId = 'guest-' + Math.random().toString(36).substring(2, 9);
  
  peer = new Peer(guestId, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true
  });

  peer.on('open', (id) => {
    console.log('Guest peer opened with ID:', id);
    showGuestIndicator();
    
    // Подключаемся к ведущему
    conn = peer.connect(roomId, { reliable: true });
    setupHostConnection(conn);
  });

  peer.on('error', (err) => {
    console.error('Guest PeerJS error:', err);
    showNotification('Ошибка подключения', 'error');
  });
});

function setupHostConnection(connection) {
  conn = connection;
  
  conn.on('open', () => {
    console.log('Connected to host successfully');
    showNotification('Подключено к ведущему', 'success');
    
    // Запрашиваем субтитры у ведущего
    conn.send({ type: 'request_subtitles' });
  });

  conn.on('data', (data) => {
    console.log('Received data from host:', data.type);
    
    if (data.type === 'subtitles_data') {
      console.log('Received subtitles from host:', data.items?.length || 0, 'items');
      
      if (data.items && data.items.length > 0) {
        // Загружаем полученные субтитры
        window.dispatchEvent(new CustomEvent('subtitlesLoaded', { 
          detail: { items: data.items } 
        }));
        
        showNotification(`Загружено ${data.items.length} субтитров от ведущего`, 'success');
      } else {
        showNotification('Ведущий еще не загрузил субтитры', 'info');
      }
    }
  });

  conn.on('close', () => {
    console.log('Connection to host closed');
    showNotification('Соединение с ведущим разорвано', 'warning');
  });

  conn.on('error', (err) => {
    console.error('Host connection error:', err);
    showNotification('Ошибка соединения с ведущим', 'error');
  });
}

function showGuestIndicator() {
  const shareSection = document.getElementById('shareSection');
  if (shareSection) {
    shareSection.innerHTML = `
      <div class="alert alert-warning mb-0">
        <i class="bi bi-people-fill"></i> 
        <strong>Режим гостя</strong> - Вы редактируете субтитры совместно с ведущим.
        <div class="mt-1">
          <small>Все изменения синхронизируются в реальном времени</small>
        </div>
      </div>
    `;
    shareSection.classList.remove('d-none');
  }
}

function showNotification(message, type = 'info') {
  // Удаляем предыдущие уведомления
  const existingNotifications = document.querySelectorAll('.temp-notification');
  existingNotifications.forEach(n => n.remove());

  const alertClass = {
    'success': 'alert-success',
    'error': 'alert-danger',
    'warning': 'alert-warning',
    'info': 'alert-info'
  }[type] || 'alert-info';

  const notification = document.createElement('div');
  notification.className = `alert ${alertClass} temp-notification position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notification.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi ${getIcon(type)} me-2"></i>
      <div>${message}</div>
      <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Автоматически скрываем через 4 секунды
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 4000);
}

function getIcon(type) {
  const icons = {
    'success': 'bi-check-circle',
    'error': 'bi-exclamation-circle',
    'warning': 'bi-exclamation-triangle',
    'info': 'bi-info-circle'
  };
  return icons[type] || 'bi-info-circle';
}
