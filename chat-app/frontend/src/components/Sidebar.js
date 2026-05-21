import React, {
  useEffect,
  useState
} from "react";

import "../styles/Sidebar.css";

function Sidebar({

  user,

  selectedChat,

  onSelectChat,

  apiUrl,

  onlineUsers,

  messages,

  onLogout

}) {

  const [users,
    setUsers
  ] = useState([]);

  const [search,
    setSearch
  ] = useState("");

  // =====================
  // LOAD USERS
  // =====================
  useEffect(() => {

    const loadUsers =
    async () => {

      const res =
      await fetch(
`${apiUrl}/auth/users`
      );

      const data =
      await res.json();

      setUsers(data);
    };

    loadUsers();

  }, [apiUrl]);

  // =====================
  // FILTER
  // =====================
  const filteredUsers =
  users.filter(

    u =>

    u.username
    !== user &&

    u.username
    .toLowerCase()

    .includes(
      search
      .toLowerCase()
    )
  );

  return (

    <div className=
    "sidebar">

      <div className=
      "sidebar-header">

        <h2>
          Syncros
        </h2>

      </div>

      <div className=
      "search-box">

        <input

          placeholder=
          "Buscar chat..."

          value=
          {search}

          onChange=
          {(e)=>

          setSearch(
            e.target
            .value
          )}
        />

      </div>

      <div className=
      "chat-list">

        {filteredUsers
        .map(
          userItem => {

          const isOnline =
          onlineUsers
          .includes(

userItem.username
          );

          const lastMessage =
          [...messages]

          .reverse()

          .find(
            msg =>

            msg.from ===
            userItem
            .username ||

            msg.to ===
            userItem
            .username
          );

          return (

            <div

              key=
              {
              userItem._id
              }

              className=
              {
                selectedChat
                ===
                userItem
                .username

                ?

                "chat-item active"

                :

                "chat-item"
              }

              onClick=
              {()=>

              onSelectChat(
                userItem
                .username
              )
            }

            >

            <div
            className=
            "avatar">

              {
                userItem
                .username[0]
                .toUpperCase()
              }

              {
                isOnline &&

                <div
                className=
                "online-dot"
                />
              }

            </div>

            <div
            className=
            "chat-info">

              <div
              className=
              "chat-top">

                <h4>
                  {
                  userItem
                  .username
                  }
                </h4>

                {
                lastMessage &&

                <span>

                  {
                  new Date(
                  lastMessage
                  .timestamp
                  )

.toLocaleTimeString(
                    [],
                    {
                      hour:
                      "2-digit",

                      minute:
                      "2-digit"
                    }
                  )}
                </span>
                }

              </div>

              <p>

                {
                lastMessage
                ?.message ||

                "Sin mensajes"
                }

              </p>

            </div>

          </div>
        );
      })}
      </div>

      <div className="profile-box">

  <div>

    <strong>
      {user}
    </strong>

    <p>
      conectado
    </p>

  </div>

  <button
    className=
    "logout-btn"

    onClick=
    {onLogout}
  >
    Salir
  </button>

</div>

    </div>
  );
}

export default Sidebar;