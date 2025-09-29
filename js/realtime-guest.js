// realtime-guest.js
let peer;
let conn;

document.addEventListener('DOMContentLoaded', () => {
  const roomManagerScript = document.querySelector('script[src="js/realtime-guest.js"]');
  const roomId = roomManagerScript?.getAttribute('data-room-id');
  
  if (!roomId) {
    console.error('No room ID provided for guest');
    return;
  }

  console.log('Initializing guest for room:', roomId);

  const guestId = 'guest-' + generateGuestId();
  
  peer = new Peer(guestId, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true
  });

  peer.on('open', (id) => {
    console.log('Guest peer ready, ID:', id);
    showRoomStatus('Подключение к ведущему...', 'info');
    
    conn = peer.connect(roomId, { reliable: true });
    setupHostConnection(conn);
  });

  peer.on('error', (err) => {
    console.error('Guest PeerJS error:', err);
    showRoomStatus('Ошибка подключения', 'error');
  });
});

function setupHostConnection(connection) {
  conn = connection;
  
  conn.on('open', () => {
    console.log('Connected to host successfully');
    showRoomStatus('Подключено к ведущему', 'success');
    conn.send({ type: 'request_subtitles' });
  });

  conn.on('data', (data) => {
    if (data.type === 'subtitles_data') {
      console.log('Received subtitles from host:', data.items?.length || 0, 'items');
      
      if (data.items && data.items.length > 0) {
        window.dispatchEvent(new CustomEvent('subtitlesLoaded', { 
          detail: { items: data.items } 
        }));
        showRoomStatus('Синхронизировано с ведущим', 'success');
      }
    }
  });

  conn.on('close', () => {
    console.log('Connection to host closed');
    showRoomStatus('Соединение разорвано', 'warning');
  });

  conn.on('error', (err) => {
    console.error('Host connection error:', err);
    showRoomStatus('Ошибка соединения', 'error');
  });
}

function generateGuestId() {
  return Math.random().toString(36).substring(2, 9);
}

function showRoomStatus(message, type) {
  const roomStatus = document.getElementById('roomStatus');
  if (roomStatus) {
    roomStatus.textContent = message;
  }
}
