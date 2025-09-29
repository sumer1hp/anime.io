// realtime.js
let peer, conn;
const params = new URLSearchParams(window.location.hash.slice(1));
const roomId = params.get('room') || (Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4));

if (!params.get('room')) {
  window.location.hash = `room=${roomId}`;
}

peer = new Peer(roomId, {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true
});

peer.on('connection', (connection) => {
  setupConnection(connection);
});

setTimeout(() => {
  const existingConn = peer.connect(roomId);
  existingConn.on('open', () => setupConnection(existingConn));
}, 1500);

function setupConnection(connection) {
  conn = connection;
  conn.on('data', (data) => {
    if (data.type === 'subtitle_update') {
      window.dispatchEvent(new CustomEvent('subtitlesLoaded', { detail: { items: data.items } }));
    }
  });

  window.addEventListener('subtitlesChanged', () => {
    if (typeof window.getSubtitleItems === 'function' && conn?.open) {
      conn.send({ type: 'subtitle_update', items: window.getSubtitleItems() });
    }
  });
}

document.getElementById('shareLink').value = window.location.href;
document.getElementById('shareSection').classList.remove('d-none');