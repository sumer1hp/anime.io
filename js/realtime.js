// realtime.js — с явным разделением ролей через URL

let peer;
let activeConnection = null;

const params = new URLSearchParams(window.location.hash.slice(1));
const roomId = params.get('room');
const role = params.get('role');

let isHost = false;

if (!roomId) {
  // Создаём комнату как хост
  const newRoomId = Math.random().toString(36).substring(2, 10);
  window.location.hash = `room=${newRoomId}&role=host`;
  return; // перезагрузка через hash
}

if (role === 'host') {
  isHost = true;
} else if (role === 'guest') {
  isHost = false;
} else {
  // Без роли — считаем гостем (на случай старых ссылок)
  isHost = false;
}

// Создаём Peer
peer = new Peer(roomId, {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true
});

peer.on('error', (err) => {
  console.error('PeerJS error:', err);
  if (err.type === 'unavailable-id' && isHost) {
    alert('Комната недоступна. Создаю новую...');
    window.location.hash = '';
  }
});

// === ХОСТ: только слушает ===
if (isHost) {
  peer.on('connection', (conn) => {
    if (activeConnection) {
      conn.close();
      return;
    }
    setupConnection(conn);
    setTimeout(() => sendCurrentSubtitles(conn), 1000);
  });

  // Показываем ссылку для гостей
  const guestLink = `${location.origin}${location.pathname}#room=${roomId}&role=guest`;
  document.getElementById('shareLink').value = guestLink;
  document.getElementById('shareSection').classList.remove('d-none');
}
// === ГОСТЬ: только подключается ===
else {
  setTimeout(() => {
    const conn = peer.connect(roomId);
    conn.on('open', () => {
      if (!activeConnection) {
        setupConnection(conn);
      }
    });
    conn.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }, 1500);
}

function setupConnection(conn) {
  activeConnection = conn;

  conn.on('data', (data) => {
    if (data.type === 'subtitle_update' && Array.isArray(data.items)) {
      window.dispatchEvent(new CustomEvent('subtitlesLoaded', { detail: { items: data.items } }));
    }
  });

  window.addEventListener('subtitlesChanged', () => {
    const items = typeof window.getSubtitleItems === 'function' ? window.getSubtitleItems() : [];
    if (activeConnection?.open) {
      activeConnection.send({ type: 'subtitle_update', items });
    }
  });
}

function sendCurrentSubtitles(conn) {
  const items = typeof window.getSubtitleItems === 'function' ? window.getSubtitleItems() : [];
  if (items.length > 0) {
    conn.send({ type: 'subtitle_update', items });
  }
}
