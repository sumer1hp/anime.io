// /js/realtime.js — исправленная версия

let peer, conn;
let isHost = false;
const params = new URLSearchParams(window.location.hash.slice(1));
const roomId = params.get('room') || generateRoomId();

if (!params.get('room')) {
  window.location.hash = `room=${roomId}`;
  isHost = true; // Первый — хост
}

peer = new Peer(roomId, {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true
});

peer.on('error', (err) => {
  console.warn('PeerJS:', err);
  document.getElementById('shareSection').classList.add('d-none');
});

// Кто-то подключился ко мне (я — хост)
peer.on('connection', (connection) => {
  setupConnection(connection, true);
  sendCurrentData(connection); // Отправить данные новому пользователю
});

// Я подключаюсь к хосту
setTimeout(() => {
  if (!isHost) {
    const existingConn = peer.connect(roomId);
    existingConn.on('open', () => setupConnection(existingConn, false));
  }
}, 1500);

function setupConnection(connection, iAmHost) {
  conn = connection;

  // Получение данных
  conn.on('data', (data) => {
    if (data.type === 'subtitle_update') {
      window.dispatchEvent(new CustomEvent('subtitlesLoaded', { detail: { items: data.items } }));
    }
  });

  // Отправка при изменении (только хостом или всеми — по желанию)
  window.addEventListener('subtitlesChanged', () => {
    if (conn?.open) {
      const items = typeof window.getSubtitleItems === 'function' ? window.getSubtitleItems() : [];
      conn.send({ type: 'subtitle_update', items });
    }
  });
}

// Отправить текущие данные новому пользователю
function sendCurrentData(connection) {
  setTimeout(() => {
    const items = typeof window.getSubtitleItems === 'function' ? window.getSubtitleItems() : [];
    if (items.length > 0) {
      connection.send({ type: 'subtitle_update', items });
    }
  }, 500); // небольшая задержка, чтобы данные успели загрузиться
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);
}

// Показать ссылку
document.getElementById('shareLink').value = window.location.href;
document.getElementById('shareSection').classList.remove('d-none');
