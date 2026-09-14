import pool from "../config/db";

export interface OnlineUserInfo {
  userId: number;
  name: string;
}

export class OnlineUserManager {
  // Map of userId -> { name: string, socketIds: Set<string> }
  private users = new Map<number, { name: string; socketIds: Set<string> }>();
  // Map of socketId -> userId for quick reverse lookup
  private socketToUser = new Map<string, number>();

  async addUser(userId: number, socketId: string): Promise<OnlineUserInfo[]> {
    this.socketToUser.set(socketId, userId);

    const existing = this.users.get(userId);
    if (existing) {
      existing.socketIds.add(socketId);
    } else {
      let name = "Player";
      try {
        const result = await pool.query("SELECT name FROM users WHERE id = $1", [
          userId,
        ]);
        if (result.rows.length > 0 && result.rows[0].name) {
          name = result.rows[0].name;
        }
      } catch (err) {
        console.error("Failed to fetch user name for online tracking:", err);
      }

      this.users.set(userId, {
        name,
        socketIds: new Set([socketId]),
      });
    }

    return this.getOnlineUsers();
  }

  removeUser(socketId: string): {
    changed: boolean;
    onlineUsers: OnlineUserInfo[];
  } {
    const userId = this.socketToUser.get(socketId);
    this.socketToUser.delete(socketId);

    if (!userId) {
      return { changed: false, onlineUsers: this.getOnlineUsers() };
    }

    const userData = this.users.get(userId);
    if (!userData) {
      return { changed: false, onlineUsers: this.getOnlineUsers() };
    }

    userData.socketIds.delete(socketId);

    if (userData.socketIds.size === 0) {
      this.users.delete(userId);
      return { changed: true, onlineUsers: this.getOnlineUsers() };
    }

    // User still has active sockets in other tabs/windows
    return { changed: false, onlineUsers: this.getOnlineUsers() };
  }

  isUserOnline(userId: number): boolean {
    const user = this.users.get(userId);
    return !!user && user.socketIds.size > 0;
  }

  getUser(userId: number): { name: string; socketIds: Set<string> } | undefined {
    return this.users.get(userId);
  }

  getPrimarySocketId(userId: number): string | undefined {
    const user = this.users.get(userId);
    if (!user || user.socketIds.size === 0) {
      return undefined;
    }
    // Return the most recently added socket ID or first one
    return Array.from(user.socketIds)[user.socketIds.size - 1];
  }

  getUserIdBySocket(socketId: string): number | undefined {
    return this.socketToUser.get(socketId);
  }

  getOnlineUsers(): OnlineUserInfo[] {
    const list: OnlineUserInfo[] = [];
    for (const [userId, data] of this.users.entries()) {
      list.push({
        userId,
        name: data.name,
      });
    }
    return list;
  }
}
