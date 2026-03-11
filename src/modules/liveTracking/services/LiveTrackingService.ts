interface LiveSession {
  staffId: string;
  adminUserId: string;
  startedAt: number;
  expiresAt: number;
  sessionToken: string;
}

class LiveTrackingService {
  private sessions = new Map<string, LiveSession>(); // keyed by staffId
  private tokenIndex = new Map<string, string>();    // token → staffId

  startSession(staffId: string, adminUserId: string): LiveSession {
    // Stop any existing session for this staff first
    this.stopSession(staffId);

    const now = Date.now();
    const sessionToken = `${staffId}_${now}_${Math.random().toString(36).slice(2)}`;

    const session: LiveSession = {
      staffId,
      adminUserId,
      startedAt: now,
      expiresAt: now + 60 * 1000, // 1 minute
      sessionToken,
    };

    this.sessions.set(staffId, session);
    this.tokenIndex.set(sessionToken, staffId);

    return session;
  }

  stopSession(staffId: string): void {
    const session = this.sessions.get(staffId);
    if (session) {
      this.tokenIndex.delete(session.sessionToken);
      this.sessions.delete(staffId);
    }
  }

  getSession(staffId: string): LiveSession | null {
    const session = this.sessions.get(staffId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.stopSession(staffId);
      return null;
    }
    return session;
  }

  isActive(staffId: string): boolean {
    return this.getSession(staffId) !== null;
  }

  getRemainingMs(staffId: string): number {
    const session = this.getSession(staffId);
    if (!session) return 0;
    return Math.max(0, session.expiresAt - Date.now());
  }

  getAllActiveSessions(): LiveSession[] {
    const now = Date.now();
    const active: LiveSession[] = [];
    for (const session of this.sessions.values()) {
      if (now <= session.expiresAt) {
        active.push(session);
      } else {
        this.stopSession(session.staffId);
      }
    }
    return active;
  }
}

export default new LiveTrackingService();
