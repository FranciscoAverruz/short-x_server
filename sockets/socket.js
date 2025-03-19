const { Server } = require("socket.io");
const { NODE_ENV, FRONTEND_URL } = require("../config/env.js")

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: NODE_ENV === "production" 
                ? FRONTEND_URL
                : "*",
            methods: ["GET", "POST"],
        },
        pingTimeout: 10000,
        pingInterval: 5000,
    });

    io.on("connection", (socket) => {
        console.log("A user has connected.");

        socket.on("message", (data) => {
            console.log("Message received:", data);
        });

        socket.emit("Welcome to the WebSocket server.");

        socket.on("disconnect", (reason) => {
            console.log(`A user has disconnected. Reason: ${reason}`);
        });

        socket.on("error", (error) => {
            console.error("Socket error:", error);
        });
    });
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io has not been initialized.");
    }
    return io;
};

module.exports = { initSocket, getIo };