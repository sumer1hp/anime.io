// realtime.js — стабильная версия для GitHub Pages

let peer;
let activeConnection = null;
const ROOM_KEY = 'peer_host_room';

// Получаем room из URL
const params = new URLSearchParams(window.location.hash.slice(1));
let roomId = params.get('room');

let isHost = false;

if (!roomId) {
  // Я — хост
  roomId = Math.random().toString(36).substring(2, 10);
  window.history.replaceState(null, null, `#room=${roomId}`);
  isHost = true;
  sessionStorage.setItem(ROOM_KEY, roomId);
} else {
  // Я — клиент
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
    // Редкий случай: ID занят — перезагрузка
    alert('Комната занята. Перезагрузка...');
    sessionStorage.removeItem(ROOM_KEY);
    location.hash = '';
    location.reload();
  }
});

// === ХОСТ: только слушает подключения ===
if (isHost) {
  peer.on('connection', (conn) => {
    if (activeConnection) {
      conn.close(); // разрешаем только одно соединение
      return;
    }
    setupConnection(conn);
    setTimeout(() => sendCurrentSubtitles(conn), 800);
  });

  // Показываем ссылку
  document.getElementById('shareLink').value = `${location.origin}${location.pathname}#room=${roomId}`;
  document.getElementById('shareSection').classList.remove('d-none');
}
// === КЛИЕНТ: только подключается ===
else {
  // Ждём, пока хост инициализирует Peer
  setTimeout(() => {
    const conn = peer.connect(roomId, { reliable: true });
    conn.on('open', () => {
      if (!activeConnection) {
        setupConnection(conn);
      }
    });
    conn.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }, 1200);
}

function setupConnection(conn) {
  activeConnection = conn;

  conn.on('data', (data) => {
    if (data.type === 'subtitle_update' && Array.isArray(data.items)) {
      window.dispatchEvent(new CustomEvent('subtitlesLoaded', { detail: { items: data.items } }));
    }
  });

  // Отправка изменений
  const sendUpdate = () => {
    const items = typeof window.getSubtitleItems === 'function' ? window.getSubtitleItems() : [];
    if (activeConnection?.open) {
      activeConnection.send({ type: 'subtitle_update', items });
    }
  };

  window.addEventListener('subtitlesChanged', sendUpdate);
}

function sendCurrentSubtitles(conn) {
  const items = typeof window.getSubtitleItems === 'function' ? window.getSubtitleItems() : [];
  if (items.length > 0) {
    conn.send({ type: 'subtitle_update', items });
  }
}
