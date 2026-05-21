import React, {
  useState
} from "react";

import {
  motion
} from "framer-motion";

import "../styles/Login.css";

function Login({
  onLogin,
  onRegister
}) {

  const [username,
    setUsername
  ] = useState("");

  const [password,
    setPassword
  ] = useState("");

  return (

    <div className="login-page">

      <motion.div
        className="login-card"

        initial={{
          opacity: 0,
          scale: 0.9
        }}

        animate={{
          opacity: 1,
          scale: 1
        }}
      >

        <h1>
          Syncros
        </h1>

        <p>
          Conéctate y émpieza a chatear
        </p>

        <input
          placeholder="Usuario"

          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
        />

        <input
          type="password"

          placeholder="Contraseña"

          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        <button
          onClick={() =>
            onLogin(
              username,
              password
            )
          }
        >
          Login
        </button>

        <button
          className="register"

          onClick={() =>
            onRegister(
              username,
              password
            )
          }
        >
          Registrarse
        </button>

      </motion.div>

    </div>
  );
}

export default Login;