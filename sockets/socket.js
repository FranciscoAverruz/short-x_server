const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("A user has connected.");

        socket.on("message", (data) => {
            console.log("Message received.", data);
        });

        socket.emit("Welcome to the WebSocket server.");

        socket.on("disconnect", () => {
            console.log("A user has disconnected.");
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
