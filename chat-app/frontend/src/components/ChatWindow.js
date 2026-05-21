import React, {
  useState,
  useEffect,
  useRef
} from "react";

import {
  IoSend
} from "react-icons/io5";

import MessageBubble
from "./MessageBubble";

import "../styles/ChatWindow.css";

function ChatWindow({

  messages,

  target,

  onSendMessage,

  loggedInUser,

  onlineUsers

}) {

  const [message,
    setMessage
  ] = useState("");

  const bottomRef =
    useRef(null);

  // ===================
  // AUTO SCROLL
  // ===================
  useEffect(() => {

    bottomRef.current
    ?.scrollIntoView({
      behavior:
      "smooth"
    });

  }, [messages]);

  // ===================
  // SEND
  // ===================
  const send = () => {

    if (
      !message.trim()
    )
      return;

    onSendMessage(
      message
    );

    setMessage("");
  };

  // ===================
  // ENTER SEND
  // ===================
  const handleKeyDown =
  (e) => {

    if (
      e.key ===
      "Enter"
    ) {
      send();
    }
  };

  // ===================
  // EMPTY STATE
  // ===================
  if (!target) {

    return (

      <div
      className=
      "empty-chat">

        <h1>
          Syncros
        </h1>

        <p>
          Selecciona un
          chat para
          comenzar
        </p>

      </div>
    );
  }

  return (

    <div
    className=
    "chat-window">

      <div
      className=
      "chat-header">

        <div>

          <h3>
            {target}
          </h3>

          <p>

{
onlineUsers?.includes(
target
)

?

"🟢 online"

:

"⚪ offline"
}

</p>

        </div>

      </div>

      <div
      className=
      "messages-container">

        {messages

          .filter(
            msg =>

            msg.from
            === target ||

            msg.to
            === target
          )

          .map(
          (msg,i)=>(

            <MessageBubble

              key={i}

              message=
              {msg}

              own=
              {
              msg.from
              ===
              loggedInUser
              }
            />
          ))}

        <div
        ref=
        {bottomRef}
        />

      </div>

      <div
      className=
      "message-input">

        <input

          value=
          {message}

          onChange=
          {(e)=>
          setMessage(
            e.target.value
          )}

          onKeyDown=
          {
          handleKeyDown
          }

          placeholder=
          "Escribe un mensaje..."
        />

        <button
          onClick=
          {send}
        >
          <IoSend />
        </button>

      </div>

    </div>
  );
}

export default ChatWindow;