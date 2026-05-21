import React, {
  useState,
  useRef,
  useEffect
} from "react";

import { io } from "socket.io-client";

import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

import "./styles/App.css";

const API_URL = "http://10.233.45.231:4000";

function App() {

  const socketRef =
    useRef(null);

  const [loggedInUser,
    setLoggedInUser
  ] = useState("");

  const [messages,
    setMessages
  ] = useState([]);

  const [target,
    setTarget
  ] = useState("");

  const [onlineUsers,
  setOnlineUsers
] = useState([]);

// =====================
// RESTORE SESSION
// =====================
useEffect(() => {

  const restoreSession =
  async () => {

    const token =
    localStorage.getItem(
      "token"
    );

    if (!token)
      return;

    try {

      const res =
      await fetch(

`${API_URL}/auth/verify-token`,

      {
        method: "POST",

        headers: {

"Content-Type":
"application/json"
        },

        body:
        JSON.stringify({

token
        })
      });

      const data =
      await res.json();

      if (
        !data.valid
      ) {

        logout();
        return;
      }

      setLoggedInUser(
        data.username
      );

      // =================
      // SOCKET
      // =================
      socketRef.current =
      io(API_URL, {

path:
"/chat/socket.io"
      });

      socketRef.current.on(
        "connect",
        () => {

socketRef.current.emit(
"join",
data.username
          );
        });

      console.log(
        "Sesión restaurada"
      );

    } catch {

      logout();
    }
  };

  restoreSession();

}, []);

// =====================
// VERIFY TOKEN
// =====================
useEffect(() => {

  if (!loggedInUser)
    return;

  const interval =
  setInterval(

  async () => {

    const token =
    localStorage.getItem(
      "token"
    );

    if (!token)
      return;

    try {

      const res =
      await fetch(

`${API_URL}/auth/verify-token`,

      {
        method:"POST",

        headers: {

"Content-Type":
"application/json"
        },

        body:
        JSON.stringify({

token
        })
      });

      const data =
      await res.json();

      if (
        !data.valid
      ) {

        alert(

"Tu sesión terminó o fue iniciada en otro dispositivo."

        );

        logout();
      }

    } catch {

      logout();
    }

  },

  15000
  );

  return () =>
  clearInterval(
    interval
  );

}, [loggedInUser]);

// =====================
// SOCKET LISTENER
// =====================
useEffect(() => {

  if (
    !socketRef.current ||
    !loggedInUser
  )
    return;

  const receiveHandler =
  (messageData) => {

    setMessages(prev => {

      const exists =
        prev.some(msg => {

          // si Mongo manda _id
          if (
            msg._id &&
            messageData._id
          ) {
            return (
              String(msg._id)
              ===
              String(
                messageData._id
              )
            );
          }

          // fallback
          return (
            msg.from ===
            messageData.from &&

            msg.to ===
            messageData.to &&

            msg.message ===
            messageData.message
          );
        });

      if (exists) {
        return prev;
      }

      return [
        ...prev,
        messageData
      ];
    });
  };

  // limpiar listener viejo
  socketRef.current.off(
    "receive_message"
  );

  // registrar UNA sola vez
  socketRef.current.on(
    "receive_message",
    receiveHandler
  );

  console.log(
    "Listener registrado"
  );

  return () => {

    socketRef.current?.off(
      "receive_message",
      receiveHandler
    );

    console.log(
      "Listener limpiado"
    );
  };

}, [loggedInUser]);

// =====================
// ONLINE USERS
// =====================
useEffect(() => {

  if (!socketRef.current)
    return;

  const onlineHandler =
  (users) => {

    console.log(
      "Online:",
      users
    );

    setOnlineUsers(
      users
    );
  };

  socketRef.current.on(
    "online_users",
    onlineHandler
  );

  return () => {

    socketRef.current?.off(
      "online_users",
      onlineHandler
    );
  };

}, [loggedInUser]);

  // =====================
  // LOGIN
  // =====================
  const handleLogin =
    async (
      username,
      password
    ) => {

      const res =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method:
            "POST",

            headers: {
              "Content-Type":
              "application/json"
            },

            body:
            JSON.stringify({
              username,
              password
            })
          }
        );

      const data =
      await res.json();

      if (data.token) {

        localStorage
        .setItem(
          "token",
          data.token
        );

        localStorage.setItem(
  "sessionId",
  data.sessionId
);

localStorage.setItem(
  "username",
  data.username
);

        setLoggedInUser(
          data.username
        );

// LIMPIAR SOCKET VIEJO
if (socketRef.current) {

  socketRef.current.removeAllListeners();

  socketRef.current.disconnect();
}

// NUEVO SOCKET
socketRef.current =
  io(API_URL, {
    path:
    "/chat/socket.io"
  });

// CONNECT
socketRef.current.on(
  "connect",
  () => {

    console.log(
      "Socket conectado"
    );

    socketRef.current.emit(
      "join",
      data.username
    );
  }
);



      } else {

        alert(
          data.error
        );
      }
  }

  // =====================
  // REGISTER
  // =====================
  const handleRegister =
  async (
    username,
    password
  ) => {

    const res =
      await fetch(
      `${API_URL}/auth/register`,
      {
        method:
        "POST",

        headers: {
          "Content-Type":
          "application/json"
        },

        body:
        JSON.stringify({
          username,
          password
        })
      });

    const data =
      await res.json();

    alert(
      data.message
      ||
      data.error
    );
  };

  // =====================
  // CARGAR HISTORIAL
  // =====================
const selectChat =
async (user) => {

  setTarget(user);

  try {

    const res =
      await fetch(

`${API_URL}/chat/messages/${loggedInUser}/${user}`

      );

    const data =
      await res.json();

    // LIMPIAR DUPLICADOS
    const uniqueMessages =
      [];

    const seen =
      new Set();

    data.forEach(
      (msg) => {

      const key =

`${msg.from}-${msg.to}-${msg.message}-${msg.timestamp || ""}`;

      if (
        !seen.has(key)
      ) {

        seen.add(key);

        uniqueMessages
        .push(msg);
      }
    });

    // REEMPLAZAR
    // NO CONCATENAR
    setMessages(
      uniqueMessages
    );

  } catch (error) {

    console.error(
      "Error cargando historial:",
      error
    );
  }
};

  // =====================
  // ENVIAR MENSAJE
  // =====================
  const sendMessage =
  (message) => {

    if (!message
      || !target)
      return;

    const data = {

      from:
      loggedInUser,

      to: target,

      message
    };

    socketRef.current
    .emit(
      "send_message",
      data
    );
  };

  // =====================
// LOGOUT
// =====================
const logout =
async () => {

  const sessionId =
  localStorage.getItem(
    "sessionId"
  );

  try {

    if (sessionId) {

      await fetch(

`${API_URL}/auth/logout`,

      {
        method:"POST",

        headers: {

"Content-Type":
"application/json"
        },

        body:
        JSON.stringify({

sessionId
        })
      });
    }

  } catch (error) {

    console.log(
      error
    );
  }

  // limpiar storage
  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "sessionId"
  );

  localStorage.removeItem(
    "username"
  );

  // socket
  if (
    socketRef.current
  ) {

    socketRef.current
    .disconnect();

    socketRef.current =
    null;
  }

  setLoggedInUser(
    ""
  );

  setMessages([]);

  setTarget("");

  setOnlineUsers([]);
};

return (

  !loggedInUser ?

  (
    <Login
      onLogin={handleLogin}
      onRegister={handleRegister}
    />
  )

  :

  (
    <div className="app">

      <Sidebar
        user={loggedInUser}
        selectedChat={target}
        onSelectChat={selectChat}
        apiUrl={API_URL}
        onlineUsers={onlineUsers}
        messages={messages}
        onLogout={logout}
      />

      <ChatWindow
        messages={messages}
        target={target}
        onSendMessage={sendMessage}
        loggedInUser={loggedInUser}
        onlineUsers={onlineUsers}
      />

    </div>
  )
);
}

export default App;