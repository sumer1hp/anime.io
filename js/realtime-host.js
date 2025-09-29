// realtime-host.js
let peer;
let connections = [];

document.addEventListener('DOMContentLoaded', () => {
  // Создаем комнату с уникальным ID
  const roomId = generateRoomId();
  const shareUrl = new URL(window.location);
  shareUrl.searchParams.set('room', roomId);
  window.history.replaceState({}, '', shareUrl);

  console.log('Creating host room:', roomId);

  peer = new Peer(roomId, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true
  });

  peer.on('open', (id) => {
    console.log('Host peer opened with ID:', id);
    
    // Показываем ссылку для совместного доступа
    showShareLink(shareUrl.toString());
  });

  // Ждем подключения гостей
  peer.on('connection', (conn) => {
    console.log('Guest connected:', conn.peer);
    setupGuestConnection(conn);
  });

  peer.on('error', (err) => {
    console.error('Host PeerJS error:', err);
  });

  // Слушаем изменения субтитров и рассылаем гостям
  window.addEventListener('subtitlesChanged', () => {
    broadcastToGuests();
  });

  // Также рассылаем при загрузке новых субтитров
  window.addEventListener('subtitlesLoaded', () => {
    broadcastToGuests();
  });
});

function setupGuestConnection(conn) {
  conn.on('open', () => {
    console.log('Connection established with guest:', conn.peer);
    connections.push(conn);
    
    // Сразу отправляем текущие субтитры новому гостю
    sendSubtitlesToGuest(conn);
  });

  conn.on('data', (data) => {
    console.log('Received data from guest:', data);
    
    if (data.type === 'request_subtitles') {
      sendSubtitlesToGuest(conn);
    }
  });

  conn.on('close', () => {
    console.log('Guest disconnected:', conn.peer);
    connections = connections.filter(c => c !== conn);
  });

  conn.on('error', (err) => {
    console.error('Guest connection error:', err);
    connections = connections.filter(c => c !== conn);
  });
}

function sendSubtitlesToGuest(conn) {
  if (typeof window.getSubtitleItems === 'function') {
    const items = window.getSubtitleItems();
    console.log('Sending subtitles to guest:', items.length, 'items');
    conn.send({
      type: 'subtitles_data',
      items: items,
      timestamp: Date.now()
    });
  }
}

function broadcastToGuests() {
  if (connections.length === 0) return;
  
  if (typeof window.getSubtitleItems === 'function') {
    const items = window.getSubtitleItems();
    console.log('Broadcasting to', connections.length, 'guests:', items.length, 'items');
    
    connections.forEach(conn => {
      if (conn.open) {
        conn.send({
          type: 'subtitles_data',
          items: items,
          timestamp: Date.now()
        });
      }
    });
  }
}

function showShareLink(url) {
  const shareLink = document.getElementById('shareLink');
  const shareSection = document.getElementById('shareSection');
  
  if (shareLink && shareSection) {
    shareLink.value = url;
    shareSection.classList.remove('d-none');
    
    // Добавляем кнопку копирования
    shareSection.innerHTML = `
      <div class="alert alert-info mb-0">
        <strong>Ссылка для совместного редактирования:</strong><br>
        <div class="input-group input-group-sm mt-2">
          <input type="text" id="shareLink" class="form-control" value="${url}" readonly>
          <button class="btn btn-outline-secondary" type="button" id="copyLinkBtn">
            <i class="bi bi-clipboard"></i>
          </button>
        </div>
        <small class="text-muted">Отправьте эту ссылку другим участникам</small>
      </div>
    `;
    
    document.getElementById('copyLinkBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copyLinkBtn');
        btn.innerHTML = '<i class="bi bi-check"></i>';
        setTimeout(() => {
          btn.innerHTML = '<i class="bi bi-clipboard"></i>';
        }, 2000);
      });
    });
  }
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);
}
