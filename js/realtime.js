// realtime.js — с ожиданием готовности хоста

let peer;
let activeConnection = null;

const params = new URLSearchParams(window.location.hash.slice(1));
const roomId = params.get('room');
const role = params.get('role');

if (!roomId) {
  // Создаём комнату
  const newRoomId = Math.random().toString(36).substring(2, 10);
  window.location.hash = `room=${newRoomId}&role=host`;
  return;
}

if (role === 'host') {
  initAsHost(roomId);
} else {
  initAsGuest(roomId);
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
      alert('ID занят. Перезагрузка...');
      window.location.hash = '';
    }
  });

  peer.on('connection', (conn) => {
    if (activeConnection) conn.close();
    else setupConnection(conn);
    setTimeout(() => sendCurrentSubtitles(conn), 1000);
  });

  // Показываем ссылку
  const guestLink = `${location.origin}${location.pathname}#room=${roomId}&role=guest`;
  document.getElementById('shareLink').value = guestLink;
  document.getElementById('shareSection').classList.remove('d-none');
}

// === ГОСТЬ ===
async function initAsGuest(roomId) {
  // Ждём, пока хост появится (опрашиваем сервер PeerJS)
  const maxAttempts = 20;
  let attempts = 0;
  let hostReady = false;

  while (attempts < maxAttempts && !hostReady) {
    try {
      const res = await fetch(`https://0.peerjs.com/peerjs/id/${roomId}/token`);
      if (res.ok) {
        hostReady = true;
        break;
      }
    } catch (e) {
      // Игнорируем ошибки сети
    }
    attempts++;
    await new Promise(r => setTimeout(r, 500)); // ждём 0.5 сек
  }

  if (!hostReady) {
    alert('Хост не отвечает. Убедитесь, что он онлайн.');
    return;
  }

  // Подключаемся
  peer = new Peer(undefined, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true
  });

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
