"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const configs_1 = __importDefault(require("../configs/configs"));
let io = null;
const initializeSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
        transports: ["polling", "websocket"],
    });
    // JWT auth middleware for socket connections
    io.use((socket, next) => {
        var _a;
        const token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
        if (!token) {
            return next(new Error("Authentication required"));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, configs_1.default.accessTokenSecret);
            socket.user = decoded;
            next();
        }
        catch (_b) {
            next(new Error("Invalid or expired token"));
        }
    });
    io.on("connection", (socket) => {
        // Admin joins a room to receive live location of a specific staff
        socket.on("join-live-track", (staffId) => {
            socket.join(`live-track:${staffId}`);
        });
        // Admin leaves the room
        socket.on("leave-live-track", (staffId) => {
            socket.leave(`live-track:${staffId}`);
        });
        // Admin joins department-wide live tracking room
        socket.on("join-dept-track", (departmentId) => {
            socket.join(`live-dept:${departmentId}`);
        });
        // Admin leaves department-wide live tracking room
        socket.on("leave-dept-track", (departmentId) => {
            socket.leave(`live-dept:${departmentId}`);
        });
        socket.on("disconnect", () => { });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
const getIO = () => {
    if (!io)
        throw new Error("Socket.io not initialized");
    return io;
};
exports.getIO = getIO;
