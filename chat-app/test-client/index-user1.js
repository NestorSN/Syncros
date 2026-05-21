const io = require("socket.io-client");

const socket = io("http://localhost:3003");

socket.on("connect", () => {
  console.log("usuario1 conectado");

  socket.emit("join", "usuario1");

  // enviar después de un pequeño tiempo
  setTimeout(() => {
    socket.emit("send_message", {
      from: "usuario1",
      to: "usuario2",
      message: "Hola desde usuario1"
    });
  }, 1000);
});

socket.on("receive_message", (data) => {
  console.log("usuario1 recibió:", data);
});