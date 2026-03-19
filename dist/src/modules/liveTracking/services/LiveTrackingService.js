"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LiveTrackingService {
    constructor() {
        this.sessions = new Map(); // keyed by staffId
        this.tokenIndex = new Map(); // token → staffId
    }
    startSession(staffId, adminUserId) {
        // Stop any existing session for this staff first
        this.stopSession(staffId);
        const now = Date.now();
        const sessionToken = `${staffId}_${now}_${Math.random().toString(36).slice(2)}`;
        const session = {
            staffId,
            adminUserId,
            startedAt: now,
            expiresAt: now + 2 * 60 * 1000, // 2 minutes
            sessionToken,
        };
        this.sessions.set(staffId, session);
        this.tokenIndex.set(sessionToken, staffId);
        return session;
    }
    stopSession(staffId) {
        const session = this.sessions.get(staffId);
        if (session) {
            this.tokenIndex.delete(session.sessionToken);
            this.sessions.delete(staffId);
        }
    }
    getSession(staffId) {
        const session = this.sessions.get(staffId);
        if (!session)
            return null;
        if (Date.now() > session.expiresAt) {
            this.stopSession(staffId);
            return null;
        }
        return session;
    }
    isActive(staffId) {
        return this.getSession(staffId) !== null;
    }
    getRemainingMs(staffId) {
        const session = this.getSession(staffId);
        if (!session)
            return 0;
        return Math.max(0, session.expiresAt - Date.now());
    }
    getAllActiveSessions() {
        const now = Date.now();
        const active = [];
        for (const session of this.sessions.values()) {
            if (now <= session.expiresAt) {
                active.push(session);
            }
            else {
                this.stopSession(session.staffId);
            }
        }
        return active;
    }
}
exports.default = new LiveTrackingService();
