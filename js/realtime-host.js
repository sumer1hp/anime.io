// realtime-host.js
let peer, conn;

document.addEventListener('DOMContentLoaded', () => {
  // Создаем комнату с уникальным ID
  const roomId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);
  const shareUrl = new URL(window.location);
  shareUrl.searchParams.set('room', roomId);
  window.history.replaceState({}, '', shareUrl);

  peer = new Peer(roomId, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true
  });

  peer.on('open', () => {
    console.log('Host peer created with ID:', roomId);
    
    // Показываем ссылку для совместного доступа
    const shareLink = document.getElementById('shareLink');
    const shareSection = document.getElementById('shareSection');
    
    if (shareLink && shareSection) {
      shareLink.value = shareUrl.toString();
      shareSection.classList.remove('d-none');
    }
  });

  // Ждем подключения гостей
  peer.on('connection', (connection) => {
    console.log('Guest connected:', connection.peer);
    setupConnection(connection);
  });

  peer.on('error', (err) => {
    console.error('Host PeerJS error:', err);
  });
});

function setupConnection(connection) {
  conn = connection;
  
  conn.on('open', () => {
    console.log('Connection with guest established');
    
    // Сразу отправляем текущее состояние субтитров гостю
    if (typeof window.getSubtitleItems === 'function') {
      const items = window.getSubtitleItems();
      conn.send({ 
        type: 'subtitle_update', 
        items: items,
        isInitial: true
      });
    }
  });

  conn.on('data', (data) => {
    switch (data.type) {
      case 'request_state':
        // Отправляем текущее состояние по запросу гостя
        if (typeof window.getSubtitleItems === 'function') {
          conn.send({ 
            type: 'subtitle_update', 
            items: window.getSubtitleItems(),
            isInitial: true
          });
        }
        break;
      case 'subtitle_update':
        // Получаем обновления от гостя и применяем их
        if (window.getSubtitleItems && typeof window.getSubtitleItems === 'function') {
          const currentItems = window.getSubtitleItems();
          if (JSON.stringify(currentItems) !== JSON.stringify(data.items)) {
            window.dispatchEvent(new CustomEvent('subtitlesLoaded', { 
              detail: { items: data.items } 
            }));
          }
        }
        break;
    }
  });

  conn.on('error', (err) => {
    console.error('Host connection error:', err);
  });

  // Отправляем обновления при изменении субтитров
  window.addEventListener('subtitlesChanged', () => {
    if (typeof window.getSubtitleItems === 'function' && conn?.open) {
      clearTimeout(window.hostDebounce);
      window.hostDebounce = setTimeout(() => {
        conn.send({ 
          type: 'subtitle_update', 
          items: window.getSubtitleItems() 
        });
      }, 300);
    }
  });
}
