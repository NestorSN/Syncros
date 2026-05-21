const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const cors = require("cors");
const eurekaClient = require("./eureka-client");
const {Server} = require("socket.io");
const PORT = process.env.PORT || 3002;

// =========================
// MONGODB
// =========================
mongoose.connect(
process.env.MONGO_URI || "mongodb://localhost:27017/chat-app"
)

.then(() => {

  console.log(
    "Conectado a MongoDB"
  );
})

.catch(err => {

  console.log(err);
});

// =========================
// SCHEMA
// =========================
const messageSchema =
new mongoose.Schema({

  from: String,

  to: String,

  message: String,

  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Message =
mongoose.model(
  "Message",
  messageSchema
);

// =========================
// EXPRESS
// =========================
const app =
express();

app.use(cors());

app.use(
express.json()
);

// =========================
// SERVER
// =========================
const server =
http.createServer(app);

// =========================
// SOCKET.IO
// =========================
const io =
new Server(server, {

  cors: {
    origin: "*",
    methods: [
      "GET",
      "POST"
    ]
  }
});

// =========================
// ONLINE USERS
// =========================
const connectedUsers =
{};

// =========================
// SOCKET CONNECTION
// =========================
io.on(
"connection",
(socket) => {

  console.log(
    "Cliente conectado:",
    socket.id
  );

  // =====================
  // JOIN
  // =====================
  socket.on(
    "join",
    (username) => {

      connectedUsers[
        username
      ] = socket.id;

      socket.join(
        username
      );

      console.log(
`${username} se unió`
      );

      // enviar usuarios online
      io.emit(
        "online_users",

        Object.keys(
          connectedUsers
        )
      );
    }
  );

  // =====================
  // SEND MESSAGE
  // =====================
  socket.on(
    "send_message",

    async (data) => {

      console.log(
        "Mensaje recibido:",
        data
      );

      try {

        // guardar mongo
        const newMessage =
        new Message({

          from:
          data.from,

          to:
          data.to,

          message:
          data.message
        });

        await newMessage
        .save();

        console.log(
"Mensaje guardado"
        );

        // agregar _id
        const messageToSend =
        {
          ...data,

          _id:
          newMessage._id,

          timestamp:
          newMessage
          .timestamp
        };

        // enviar destinatario
        io.to(
          data.to
        ).emit(
          "receive_message",
          messageToSend
        );

        // devolver emisor
        socket.emit(
          "receive_message",
          messageToSend
        );

      } catch (error) {

        console.log(
          "ERROR:",
          error
        );
      }
    }
  );

  // =====================
  // DISCONNECT
  // =====================
  socket.on(
    "disconnect",
    () => {

      for (
        const username
        in connectedUsers
      ) {

        if (
          connectedUsers[
            username
          ] === socket.id
        ) {

          delete
          connectedUsers[
            username
          ];

          break;
        }
      }

      io.emit(
        "online_users",

        Object.keys(
          connectedUsers
        )
      );

      console.log(
"Cliente desconectado"
      );
    }
  );
});

// =========================
// HISTORIAL
// =========================
app.get(
"/messages/:user1/:user2",

async (req,res)=>{

  const {
    user1,
    user2
  } = req.params;

  try {

    const messages =
    await Message.find({

      $or: [

        {
          from:user1,
          to:user2
        },

        {
          from:user2,
          to:user1
        }
      ]
    })

    .sort({
      timestamp:1
    });

    res.json(
      messages
    );

  } catch (error) {

    console.log(error);

    res.status(500)
    .json({
      error:
      "Error obteniendo mensajes"
    });
  }
});

app.get("/health", (req, res) => {

  res.status(200).json({
    status: "UP"
  });

});

// =========================
// START SERVER
// =========================
server.listen(PORT, () => {

  console.log(
`Chat service running on port ${PORT}`
  );

  eurekaClient.start(error => {

    if (error) {

      console.log(
"Eureka registration failed:",
error
      );

    } else {

      console.log(
"CHAT-SERVICE registered in Eureka"
      );
    }
  });

});

process.on("SIGINT", () => {

  eurekaClient.stop(() => {

    server.close(() => {

      process.exit();
    });
  });
});
