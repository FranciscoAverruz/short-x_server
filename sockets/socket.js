const { Server } = require("socket.io");

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("Un usuario se ha conectado");

        socket.on("message", (data) => {
            console.log("Mensaje recibido:", data);
        });

        socket.emit("welcome", "Bienvenido al servidor de WebSockets");

        socket.on("disconnect", () => {
            console.log("Un usuario se ha desconectado");
        });
    });
};

module.exports = { initSocket };
