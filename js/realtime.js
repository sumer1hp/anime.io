// /js/realtime.js — правильная реализация хост/клиент

let peer;
let conn;
let isHost = false;
const ROOM_KEY = 'subtitle_room_host';

// Получаем room ID из URL
const params = new URLSearchParams(window.location.hash.slice(1));
let roomId = params.get('room');

if (!roomId) {
  // Я — хост: создаю комнату
  roomId = Math.random().toString(36).substring(2, 10);
  window.history.replaceState(null, null, `#room=${roomId}`);
  isHost = true;
  sessionStorage.setItem(ROOM_KEY, roomId); // помечаем себя как хоста
} else {
  // Я — клиент: подключаюсь к комнате
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
    // Очень редко: ID занят — генерируем новый
    location.hash = '';
    location.reload();
  }
});

// === ХОСТ: ждём подключений ===
if (isHost) {
  peer.on('connection', (connection) => {
    setupConnection(connection);
    // Отправляем текущие субтитры
    setTimeout(() => sendCurrentSubtitles(connection), 1000);
  });
} 
// === КЛИЕНТ: подключаемся к хосту ===
else {
  setTimeout(() => {
    const connection = peer.connect(roomId);
    connection.on('open', () => {
      setupConnection(connection);
    });
    connection.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }, 1000);
}

function setupConnection(connection) {
  conn = connection;

  // Получение данных
  conn.on('data', (data) => {
    if (data.type === 'subtitle_update' && data.items) {
      window.dispatchEvent(new CustomEvent('subtitlesLoaded', { detail: { items: data.items } }));
    }
  });

  // Отправка при изменении
  const sendUpdate = () => {
    const items = typeof window.getSubtitleItems === 'function' ? window.getSubtitleItems() : [];
    if (conn?.open) {
      conn.send({ type: 'subtitle_update', items });
    }
  };

  window.addEventListener('subtitlesChanged', sendUpdate);
}

function sendCurrentSubtitles(connection) {
  const items = typeof window.getSubtitleItems === 'function' ? window.getSubtitleItems() : [];
  if (items.length > 0) {
    connection.send({ type: 'subtitle_update', items });
  }
}

// Показываем ссылку (только у хоста)
if (isHost) {
  document.getElementById('shareLink').value = `${window.location.origin}${window.location.pathname}#room=${roomId}`;
  document.getElementById('shareSection').classList.remove('d-none');
}
