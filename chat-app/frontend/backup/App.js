import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const API_URL = "http://192.168.1.13:4000";

const socket = io(API_URL, {
  path: "/chat/socket.io"
});

socket.on("connect", () => {
  console.log("SOCKET CONECTADO:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("ERROR SOCKET:", err);
});

function App() {

  // =========================
  // AUTH
  // =========================
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedInUser, setLoggedInUser] = useState("");

  // =========================
  // CHAT
  // =========================
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // =========================
  // RECIBIR MENSAJES
  // =========================
  useEffect(() => {

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
    };

  }, []);useEffect(() => {

  const receiveHandler = (data) => {

    setMessages((prev) => {

      // evitar duplicados exactos
      const alreadyExists = prev.some(
        msg =>
          msg.from === data.from &&
          msg.to === data.to &&
          msg.message === data.message
      );

      if (alreadyExists) {
        return prev;
      }

      return [...prev, data];
    });
  };

  socket.off("receive_message");
  socket.on(
    "receive_message",
    receiveHandler
  );

  return () => {
    socket.off(
      "receive_message",
      receiveHandler
    );
  };

}, []);

  // =========================
  // REGISTER
  // =========================
  const register = async () => {

    const res = await fetch(
      `${API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          username,
          password
        })
      }
    );

    const data = await res.json();

    alert(data.message || data.error);
  };

  // =========================
  // LOGIN
  // =========================
  const login = async () => {

    const res = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          username,
          password
        })
      }
    );

    const data = await res.json();

    if (data.token) {

      localStorage.setItem("token", data.token);

      setLoggedInUser(data.username);

      socket.emit("join", data.username);

      alert("Login exitoso");

    } else {

      alert(data.error);
    }
  };

  // =========================
  // CARGAR HISTORIAL
  // =========================
  const loadMessages = async () => {

    if (!target) return;

    const res = await fetch(
      `${API_URL}/chat/messages/${loggedInUser}/${target}`
    );

    const data = await res.json();

    setMessages(data);
  };

  // =========================
  // ENVIAR MENSAJE
  // =========================
  const sendMessage = () => {

  if (!message || !target) return;

  const data = {
    from: loggedInUser,
    to: target,
    message
  };

  socket.emit(
    "send_message",
    data
  );

  setMessage("");
};

  // =========================
  // LOGIN SCREEN
  // =========================
  if (!loggedInUser) {

    return (

      <div style={{ padding: "20px" }}>

        <h2>Login</h2>

        <input
          placeholder="Usuario"
          onChange={(e) => setUsername(e.target.value)}
        />

        <br /><br />

        <input
          type="password"
          placeholder="Contraseña"
          onChange={(e) => setPassword(e.target.value)}
        />

        <br /><br />

        <button onClick={register}>
          Registrarse
        </button>

        <button onClick={login}>
          Login
        </button>

      </div>
    );
  }

  // =========================
  // CHAT SCREEN
  // =========================
  return (

    <div style={{ padding: "20px" }}>

      <h2>
        Bienvenido {loggedInUser}
      </h2>

      <input
        placeholder="Hablar con..."
        onChange={(e) => setTarget(e.target.value)}
      />

      <button onClick={loadMessages}>
        Cargar Chat
      </button>

      <br /><br />

      <input
        placeholder="Mensaje"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>
        Enviar
      </button>

      <div style={{ marginTop: "20px" }}>

        <h3>Mensajes</h3>

        {
          messages.map((msg, index) => (

            <div key={index}>
              <b>{msg.from}:</b> {msg.message}
            </div>
          ))
        }

      </div>

    </div>
  );
}

export default App;