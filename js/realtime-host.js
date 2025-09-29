// realtime-host.js
let peer;
let connections = [];

document.addEventListener('DOMContentLoaded', () => {
  const roomManagerScript = document.querySelector('script[src="js/realtime-host.js"]');
  const roomId = roomManagerScript?.getAttribute('data-room-id');
  
  if (!roomId) {
    console.error('No room ID provided for host');
    return;
  }

  console.log('Initializing host for room:', roomId);

  peer = new Peer(roomId, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true
  });

  peer.on('open', (id) => {
    console.log('Host peer ready, ID:', id);
    showRoomStatus('Ожидание участников...', 'success');
  });

  peer.on('connection', (conn) => {
    console.log('New guest connected:', conn.peer);
    setupGuestConnection(conn);
  });

  peer.on('error', (err) => {
    console.error('Host PeerJS error:', err);
    showRoomStatus('Ошибка подключения', 'error');
  });

  // Синхронизация субтитров
  window.addEventListener('subtitlesChanged', broadcastToGuests);
  window.addEventListener('subtitlesLoaded', broadcastToGuests);
});

function setupGuestConnection(conn) {
  conn.on('open', () => {
    console.log('Guest connection established:', conn.peer);
    connections.push(conn);
    
    showRoomStatus(`Участников: ${connections.length + 1}`, 'success');
    sendSubtitlesToGuest(conn);
  });

  conn.on('data', (data) => {
    if (data.type === 'request_subtitles') {
      sendSubtitlesToGuest(conn);
    }
  });

  conn.on('close', () => {
    console.log('Guest disconnected:', conn.peer);
    connections = connections.filter(c => c !== conn);
    showRoomStatus(`Участников: ${connections.length + 1}`, 'success');
  });

  conn.on('error', (err) => {
    console.error('Guest connection error:', err);
    connections = connections.filter(c => c !== conn);
  });
}

function sendSubtitlesToGuest(conn) {
  if (typeof window.getSubtitleItems === 'function' && conn.open) {
    const items = window.getSubtitleItems();
    console.log('Sending subtitles to guest:', items.length, 'items');
    conn.send({
      type: 'subtitles_data',
      items: items
    });
  }
}

function broadcastToGuests() {
  if (connections.length === 0) return;
  
  if (typeof window.getSubtitleItems === 'function') {
    const items = window.getSubtitleItems();
    
    connections.forEach(conn => {
      if (conn.open) {
        conn.send({
          type: 'subtitles_data',
          items: items
        });
      }
    });
  }
}

function showRoomStatus(message, type) {
  const roomStatus = document.getElementById('roomStatus');
  if (roomStatus) {
    roomStatus.textContent = message;
  }
}
