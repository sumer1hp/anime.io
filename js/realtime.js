// realtime.js — без синтаксических ошибок, без 404

let peer;
let activeConnection = null;

const params = new URLSearchParams(window.location.hash.slice(1));
const roomId = params.get('room');
const role = params.get('role');

if (!roomId) {
  // Создаём комнату
  const newRoomId = Math.random().toString(36).substring(2, 10);
  window.location.hash = `room=${newRoomId}&role=host`;
  // Перезагружаемся после изменения hash
  window.addEventListener('hashchange', () => {
    if (!peer) location.reload();
  });
} else {
  if (role === 'host') {
    startHost(roomId);
  } else {
    startGuest(roomId);
  }
}

function startHost(roomId) {
  peer = new Peer(roomId, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true
  });

  peer.on('error', (err) => {
    if (err.type === 'unavailable-id') {
      alert('Комната занята. Перезагрузка...');
      window.location.hash = '';
      location.reload();
    }
  });

  peer.on('connection', (conn) => {
    if (activeConnection) conn.close();
    else setupConnection(conn);
    setTimeout(() => sendCurrentSubtitles(conn), 1000);
  });

  document.getElementById('shareLink').value = 
    `${location.origin}${location.pathname}#room=${roomId}&role=guest`;
  document.getElementById('shareSection').classList.remove('d-none');
}

function startGuest(roomId) {
  // Ждём немного, чтобы хост успел создать комнату
  setTimeout(() => {
    peer = new Peer(); // гость без ID
    const conn = peer.connect(roomId);
    conn.on('open', () => {
      if (!activeConnection) setupConnection(conn);
    });
    conn.on('error', (err) => {
      console.error('Guest connection error:', err);
    });
  }, 2000);
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
