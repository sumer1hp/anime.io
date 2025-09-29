// realtime.js — исправленная и стабильная версия

let peer;
let activeConnection = null;

// Получаем параметры из URL
const params = new URLSearchParams(window.location.hash.slice(1));
const roomId = params.get('room');
const role = params.get('role');

// Если комнаты нет — создаём как хост
if (!roomId) {
  const newRoomId = Math.random().toString(36).substring(2, 10);
  window.location.hash = `room=${newRoomId}&role=host`;
  // Не используем return — просто завершаем инициализацию
} else {
  // Запускаем нужную роль
  if (role === 'host') {
    initAsHost(roomId);
  } else {
    initAsGuest(roomId);
  }
}

// === ХОСТ ===
function initAsHost(roomId) {
  peer = new Peer(roomId, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true
  });

  peer.on('error', (err) => {
    console.error('Host error:', err);
    if (err.type === 'unavailable-id') {
      alert('Комната занята. Перезагрузка...');
      window.location.hash = '';
      location.reload();
    }
  });

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

// === ГОСТЬ ===
async function initAsGuest(roomId) {
  // Ждём, пока хост зарегистрируется
  const maxAttempts = 15;
  let attempts = 0;
  let hostReady = false;

  while (attempts < maxAttempts && !hostReady) {
    try {
      const res = await fetch(`https://0.peerjs.com/peerjs/id/${roomId}/token`, { method: 'HEAD' });
      if (res.status === 200 || res.status === 401) {
        hostReady = true;
        break;
      }
    } catch (e) {
      // Игнорируем
    }
    attempts++;
    await new Promise(r => setTimeout(r, 600));
  }

  if (!hostReady) {
    alert('Хост не в сети. Попросите его обновить страницу.');
    return;
  }

  // Подключаемся как гость
  peer = new Peer(); // без ID!
  peer.on('error', (err) => {
    console.error('Guest error:', err);
  });

  const conn = peer.connect(roomId);
  conn.on('open', () => {
    if (!activeConnection) setupConnection(conn);
  });
  conn.on('error', (err) => {
    console.error('Connection error:', err);
  });
}

// === Общие функции ===
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
