// realtime-guest.js
let peer, conn;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  
  if (!roomId) {
    console.log('No room ID found - not initializing guest mode');
    return;
  }

  console.log('Joining room as guest:', roomId);
  
  // Создаем уникальный ID для гостя
  const guestId = 'guest-' + Math.random().toString(36).substring(2, 9);
  
  peer = new Peer(guestId, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true
  });

  peer.on('open', () => {
    console.log('Guest peer connected with ID:', guestId);
    
    // Показываем, что мы в режиме гостя
    const shareSection = document.getElementById('shareSection');
    if (shareSection) {
      shareSection.innerHTML = `
        <div class="alert alert-warning mb-0">
          <i class="bi bi-people-fill"></i> 
          Режим гостя. Вы редактируете субтитры совместно с ведущим.
        </div>
      `;
      shareSection.classList.remove('d-none');
    }

    // Подключаемся к ведущему
    const connection = peer.connect(roomId);
    setupConnection(connection);
  });

  peer.on('error', (err) => {
    console.error('Guest PeerJS error:', err);
  });
});

function setupConnection(connection) {
  conn = connection;
  
  conn.on('open', () => {
    console.log('Connected to host');
    
    // Запрашиваем текущее состояние у ведущего
    conn.send({ type: 'request_state' });
  });

  conn.on('data', (data) => {
    switch (data.type) {
      case 'subtitle_update':
        console.log('Received subtitles from host:', data.items?.length || 0, 'items');
        
        if (window.getSubtitleItems && typeof window.getSubtitleItems === 'function') {
          const currentItems = window.getSubtitleItems();
          
          // Предотвращаем петлю обновлений только если это не начальная загрузка
          if (data.isInitial || JSON.stringify(currentItems) !== JSON.stringify(data.items)) {
            window.dispatchEvent(new CustomEvent('subtitlesLoaded', { 
              detail: { items: data.items } 
            }));
            
            // Показываем уведомление о загрузке
            if (data.isInitial && data.items.length > 0) {
              showNotification(`Загружено ${data.items.length} субтитров от ведущего`);
            }
          }
        }
        break;
    }
  });

  conn.on('error', (err) => {
    console.error('Guest connection error:', err);
    showNotification('Ошибка соединения с ведущим', 'error');
  });

  conn.on('close', () => {
    console.log('Connection to host closed');
    showNotification('Соединение с ведущим разорвано', 'warning');
  });

  // Отправляем обновления при изменении субтитров
  window.addEventListener('subtitlesChanged', () => {
    if (typeof window.getSubtitleItems === 'function' && conn?.open) {
      clearTimeout(window.guestDebounce);
      window.guestDebounce = setTimeout(() => {
        const items = window.getSubtitleItems();
        console.log('Sending updates to host:', items.length, 'items');
        conn.send({ 
          type: 'subtitle_update', 
          items: items 
        });
      }, 400);
    }
  });
}

function showNotification(message, type = 'info') {
  // Создаем временное уведомление
  const alertClass = type === 'error' ? 'alert-danger' : 
                    type === 'warning' ? 'alert-warning' : 'alert-info';
  
  const notification = document.createElement('div');
  notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(notification);
  
  // Автоматически скрываем через 3 секунды
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}
