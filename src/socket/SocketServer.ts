import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import Configs from "../configs/configs";

let io: Server | null = null;

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"],
  });

  // JWT auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, Configs.accessTokenSecret as string);
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    // Admin joins a room to receive live location of a specific staff
    socket.on("join-live-track", (staffId: string) => {
      socket.join(`live-track:${staffId}`);
    });

    // Admin leaves the room
    socket.on("leave-live-track", (staffId: string) => {
      socket.leave(`live-track:${staffId}`);
    });

    // Admin joins department-wide live tracking room
    socket.on("join-dept-track", (departmentId: string) => {
      socket.join(`live-dept:${departmentId}`);
    });

    // Admin leaves department-wide live tracking room
    socket.on("leave-dept-track", (departmentId: string) => {
      socket.leave(`live-dept:${departmentId}`);
    });

    socket.on("disconnect", () => {});
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
