const io = require("socket.io-client");

const socket = io("http://localhost:3003");

socket.on("connect", () => {
  console.log("usuario2 conectado");

  socket.emit("join", "usuario2");
});

socket.on("receive_message", (data) => {
  console.log("usuario2 recibió:", data);
});