// realtime.js
let peer, conn;
const params = new URLSearchParams(window.location.search);
let roomId = params.get('room');

if (!roomId) {
  roomId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);
  const newUrl = new URL(window.location);
  newUrl.searchParams.set('room', roomId);
  window.history.replaceState({}, '', newUrl);
}

document.addEventListener('DOMContentLoaded', () => {
  peer = new Peer(roomId + '-' + Date.now(), {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true
  });

  peer.on('open', () => {
    console.log('Peer connected with ID:', peer.id);
    
    // Показываем ссылку для совместного доступа
    const shareLink = document.getElementById('shareLink');
    const shareSection = document.getElementById('shareSection');
    
    if (shareLink && shareSection) {
      const shareUrl = new URL(window.location);
      shareUrl.searchParams.set('room', roomId);
      shareLink.value = shareUrl.toString();
      shareSection.classList.remove('d-none');
    }

    // Если мы не создатель комнаты, подключаемся к создателю
    if (!window.location.search.includes('room=')) {
      // Мы создатель комнаты - ждем подключений
      peer.on('connection', (connection) => {
        setupConnection(connection);
      });
    } else {
      // Мы присоединяемся - подключаемся к создателю
      setTimeout(() => {
        const connection = peer.connect(roomId);
        setupConnection(connection);
      }, 1000);
    }
  });

  peer.on('error', (err) => {
    console.error('PeerJS error:', err);
  });
});

function setupConnection(connection) {
  conn = connection;
  
  conn.on('open', () => {
    console.log('Connected to peer');
    
    // Запрашиваем текущее состояние у ведущего
    if (window.location.search.includes('room=')) {
      conn.send({ type: 'request_state' });
    }
  });

  conn.on('data', (data) => {
    switch (data.type) {
      case 'subtitle_update':
        if (window.getSubtitleItems && typeof window.getSubtitleItems === 'function') {
          const currentItems = window.getSubtitleItems();
          // Предотвращаем петлю обновлений
          if (JSON.stringify(currentItems) !== JSON.stringify(data.items)) {
            window.dispatchEvent(new CustomEvent('subtitlesLoaded', { detail: { items: data.items } }));
          }
        }
        break;
      case 'request_state':
        // Отправляем текущее состояние по запросу
        if (typeof window.getSubtitleItems === 'function' && !window.location.search.includes('room=')) {
          conn.send({ type: 'subtitle_update', items: window.getSubtitleItems() });
        }
        break;
    }
  });

  conn.on('error', (err) => {
    console.error('Connection error:', err);
  });

  // Отправляем обновления при изменении субтитров
  window.addEventListener('subtitlesChanged', () => {
    if (typeof window.getSubtitleItems === 'function' && conn?.open) {
      // Добавляем небольшую задержку чтобы избежать частых отправок
      clearTimeout(window.subtitleDebounce);
      window.subtitleDebounce = setTimeout(() => {
        conn.send({ type: 'subtitle_update', items: window.getSubtitleItems() });
      }, 300);
    }
  });
}
