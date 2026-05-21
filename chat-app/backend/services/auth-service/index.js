require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const eurekaClient = require("./eureka-client");
const PORT = Number(process.env.PORT) || 3001;

const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(cors());
app.use(express.json());

// =========================
// ENV
// =========================
const SECRET =
process.env.JWT_SECRET;

const JWT_EXPIRES =
process.env.JWT_EXPIRES || "10m";

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

.catch((err) => {
  console.log(
    "Error MongoDB:",
    err
  );
});

// =========================
// USER SCHEMA
// =========================
const UserSchema =
new mongoose.Schema({

  username: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  }
});

const User =
mongoose.model(
  "User",
  UserSchema
);

// =========================
// SESSION SCHEMA
// =========================
const SessionSchema =
new mongoose.Schema({

  username: {
    type: String,
    required: true
  },

  sessionId: {
    type: String,
    required: true,
    unique: true
  },

  token: {
    type: String,
    required: true
  },

  expiresAt: {
    type: Date,
    required: true
  }
});

const Session =
mongoose.model(
  "Session",
  SessionSchema
);

// =========================
// REGISTER
// =========================
app.post(
"/register",

async (req,res)=>{

  try {

    const {
      username,
      password
    } = req.body;

    if (
      !username ||
      !password
    ) {

      return res
      .status(400)
      .json({

error:
"Username y password son obligatorios"

      });
    }

    const existingUser =
    await User.findOne({
      username
    });

    if (
      existingUser
    ) {

      return res
      .status(400)
      .json({

error:
"El usuario ya existe"

      });
    }

    const hashedPassword =
    await bcrypt.hash(
      password,
      10
    );

    const user =
    new User({

      username,

      password:
      hashedPassword
    });

    await user.save();

    res.json({

message:
"Usuario registrado correctamente"

    });

  } catch (error) {

    console.log(
"ERROR REGISTER:",
      error
    );

    res.status(500)
    .json({

error:
"Error interno del servidor"

    });
  }
});

// =========================
// LOGIN
// =========================
app.post(
"/login",

async (req,res)=>{

  try {

    const {
      username,
      password
    } = req.body;

    if (
      !username ||
      !password
    ) {

      return res
      .status(400)
      .json({

error:
"Username y password requeridos"

      });
    }

    const user =
    await User.findOne({
      username
    });

    if (!user) {

      return res
      .status(400)
      .json({

error:
"Usuario no encontrado"

      });
    }

    const validPassword =
    await bcrypt.compare(

      password,

      user.password
    );

    if (
      !validPassword
    ) {

      return res
      .status(400)
      .json({

error:
"Contraseña incorrecta"

      });
    }

    // =====================
    // SINGLE SESSION
    // =====================
    await Session.deleteMany({
      username
    });

    const sessionId =
    uuidv4();

    const token =
    jwt.sign(

      {
        username,
        sessionId
      },

      SECRET,

      {
        expiresIn:
        JWT_EXPIRES
      }
    );

    const expiresAt =
    new Date(

Date.now()

+

10 * 60 * 1000
    );

    const session =
    new Session({

      username,

      sessionId,

      token,

      expiresAt
    });

    await session.save();

    res.json({

message:
"Login exitoso",

      token,

      username,

      sessionId
    });

  } catch (error) {

    console.log(
"ERROR LOGIN:",
      error
    );

    res.status(500)
    .json({

error:
"Error interno del servidor"

    });
  }
});

// =========================
// VERIFY TOKEN
// =========================
app.post(
"/verify-token",

async (req,res)=>{

  try {

    const {
      token
    } = req.body;

    if (!token) {

      return res
      .status(401)
      .json({

valid:false
      });
    }

    const decoded =
    jwt.verify(
      token,
      SECRET
    );

    const session =
    await Session.findOne({

sessionId:
decoded.sessionId
    });

    if (!session) {

      return res
      .status(401)
      .json({

valid:false,

message:
"Sesión inválida"

      });
    }

    if (
session.expiresAt
< new Date()
    ) {

      await Session
      .deleteOne({

sessionId:
decoded.sessionId
      });

      return res
      .status(401)
      .json({

valid:false,

message:
"Sesión expirada"

      });
    }

    res.json({

valid:true,

username:
decoded.username
    });

  } catch {

    res.status(401)
    .json({

valid:false
    });
  }
});

// =========================
// LOGOUT
// =========================
app.post(
"/logout",

async (req,res)=>{

  try {

    const {
      sessionId
    } = req.body;

    await Session
    .deleteOne({

sessionId
    });

    res.json({

message:
"Logout exitoso"
    });

  } catch {

    res.status(500)
    .json({

error:
"Error cerrando sesión"
    });
  }
});

// =========================
// USERS
// =========================
app.get(
"/users",

async (req,res)=>{

  try {

    const users =
    await User.find(
      {},
      "username"
    );

    res.json(
      users
    );

  } catch {

    res.status(500)
    .json({

error:
"Error obteniendo usuarios"
    });
  }
});

// =========================
// TEST
// =========================
app.get(
"/",

(req,res)=>{

  res.send(
"Auth Service funcionando"
  );
});

// =========================
// SERVER
// =========================
app.get("/health", (req, res) => {

  res.status(200).json({
    status: "UP"
  });

});

app.use((err, req, res, next) => {

  console.error(
    "Unhandled auth-service error:",
    err
  );

  res.status(500).json({
    error: "Internal auth-service error",
    details: err.message
  });
});

const server = app.listen(PORT, () => {

  console.log(
`Auth Service running on port ${PORT}`
  );

  eurekaClient.start(error => {

    if (error) {

      console.log(
"Eureka registration failed:",
error
      );

    } else {

      console.log(
"AUTH-SERVICE registered in Eureka"
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
