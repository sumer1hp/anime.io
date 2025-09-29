// github-bridge.js
class GitHubBridge {
  constructor() {
    this.gistId = null;
    this.token = null; // Токен для доступа к GitHub API
    this.rooms = new Map();
  }

  // Инициализация с токеном (можно получить на GitHub)
  init(token) {
    this.token = token;
    this.loadRooms();
  }

  // Создать комнату
  async createRoom(roomId, hostData = {}) {
    if (!this.token) {
      console.error('GitHub token not provided');
      return false;
    }

    const room = {
      id: roomId,
      host: hostData,
      guests: [],
      subtitles: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.rooms.set(roomId, room);
    return await this.saveToGist();
  }

  // Присоединиться к комнате
  async joinRoom(roomId, guestData = {}) {
    if (!this.rooms.has(roomId)) {
      return { success: false, error: 'Room not found' };
    }

    const room = this.rooms.get(roomId);
    room.guests.push({
      ...guestData,
      joinedAt: new Date().toISOString()
    });
    room.lastActivity = new Date().toISOString();

    await this.saveToGist();
    return { success: true, room };
  }

  // Обновить субтитры в комнате
  async updateSubtitles(roomId, subtitles) {
    if (!this.rooms.has(roomId)) {
      return false;
    }

    const room = this.rooms.get(roomId);
    room.subtitles = subtitles;
    room.lastActivity = new Date().toISOString();

    return await this.saveToGist();
  }

  // Проверить существование комнаты
  async checkRoom(roomId) {
    await this.loadRooms();
    return this.rooms.has(roomId);
  }

  // Получить субтитры из комнаты
  getSubtitles(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.subtitles : [];
  }

  // Удалить неактивные комнаты
  async cleanupInactiveRooms(maxAgeHours = 24) {
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    for (const [roomId, room] of this.rooms.entries()) {
      const lastActivity = new Date(room.lastActivity);
      if (now - lastActivity > maxAge) {
        this.rooms.delete(roomId);
      }
    }

    await this.saveToGist();
  }

  // Сохранить в Gist
  async saveToGist() {
    try {
      const response = await fetch('https://api.github.com/gists' + (this.gistId ? '/' + this.gistId : ''), {
        method: this.gistId ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Subtitle Editor Rooms Bridge',
          public: false,
          files: {
            'rooms.json': {
              content: JSON.stringify(Object.fromEntries(this.rooms), null, 2)
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      if (!this.gistId) {
        this.gistId = data.id;
      }

      return true;
    } catch (error) {
      console.error('Failed to save to Gist:', error);
      return false;
    }
  }

  // Загрузить из Gist
  async loadRooms() {
    if (!this.gistId || !this.token) return;

    try {
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        headers: {
          'Authorization': `token ${this.token}`,
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Gist не существует, создадим при следующем сохранении
          return;
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const roomsContent = data.files['rooms.json'].content;
      const roomsData = JSON.parse(roomsContent);

      this.rooms = new Map(Object.entries(roomsData));
    } catch (error) {
      console.error('Failed to load from Gist:', error);
    }
  }
}

// Создаем глобальный экземпляр
window.githubBridge = new GitHubBridge();
