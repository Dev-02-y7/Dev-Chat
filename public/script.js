console.log("Dev Chat Loaded");

const socket = io();

// DOM ELEMENTS

const joinBtn =
  document.getElementById("joinBtn");

const usernameInput =
  document.getElementById("usernameInput");

const usersList =
  document.getElementById("usersList");

const onlineCount =
  document.getElementById("onlineCount");

const activeChat =
  document.getElementById("activeChat");

const form =
  document.getElementById("messageForm");

const messageInput =
  document.getElementById("messageInput");

const messages =
  document.getElementById("messages");

const typingIndicator =
  document.getElementById("typingIndicator");

// APP STATE

let currentUser = "";

let selectedUser = "";

let conversations = {};

let unreadMessages = {};

// JOIN CHAT

joinBtn.addEventListener("click", () => {

  const username =
    usernameInput.value.trim();

  if(username === ""){

    alert("Enter username");

    return;

  }

  currentUser = username;

  socket.emit(
    "join_chat",
    username
  );

  usernameInput.disabled = true;

  joinBtn.disabled = true;

  joinBtn.innerText = "Joined";

});

// RECEIVE USERS

socket.on(
  "users_list",
  (users)=>{

    usersList.innerHTML = "";

    onlineCount.innerText =
      users.length;

    users.forEach(user=>{

      // SKIP SELF

      if(
        user.username === currentUser
      ) return;

      const li =
        document.createElement("li");

      li.classList.add("user-item");

      const initials =
  user.username
  .substring(0,2)
  .toUpperCase();

const unread =
  unreadMessages[user.username] || 0;

const lastMessage =

  conversations[user.username]
    ?.slice(-1)[0]
    ?.message || "No messages yet";

li.innerHTML = `

  <div class="user-info">

    <div class="avatar">
      ${initials}
    </div>

    <div class="user-text">

      <strong>
        ${user.username}
      </strong>

      <div class="last-message">
        ${lastMessage}
      </div>

    </div>

  </div>

  <div style="display:flex;align-items:center;gap:10px;">

    ${
      unread > 0
      ? `<div class="unread">${unread}</div>`
      : ""
    }

    <div class="online-dot"></div>

  </div>

`;

      // USER CLICK

      li.addEventListener(
        "click",
        ()=>{

          selectedUser =
            user.username;

          activeChat.innerText =
            `Chat with ${user.username}`;

          document
            .querySelectorAll(".user-item")
            .forEach(item=>
              item.classList.remove(
                "active-user"
              )
            );

          li.classList.add(
            "active-user"
          );
        
          unreadMessages[user.username] = 0;

          loadConversation(
            selectedUser
          );

        }
      );

      usersList.appendChild(li);

    });

  }
);

// SEND MESSAGE

form.addEventListener(
  "submit",
  (e)=>{

    e.preventDefault();

    if(!selectedUser){

      alert(
        "Select a user first"
      );

      return;

    }

    const message =
      messageInput.value.trim();

    if(message === "") return;

    const data = {

      sender: currentUser,

      receiver: selectedUser,

      message,

      time:
        new Date()
        .toLocaleTimeString()

    };

    socket.emit(
      "private_message",
      data
    );

    messageInput.value = "";

  }
);

// RECEIVE MESSAGE

socket.on(
  "receive_private_message",
  (data)=>{

    const otherUser =

      data.sender === currentUser

        ? data.receiver

        : data.sender;

    // CREATE CHAT

    if(!conversations[otherUser]){

      conversations[otherUser] = [];

    }

    // STORE MESSAGE

    conversations[otherUser]
      .push(data);

    if(
  otherUser !== selectedUser &&
  data.sender !== currentUser
){

  unreadMessages[otherUser] =

    (unreadMessages[otherUser] || 0) + 1;

}

    // RENDER ACTIVE CHAT

    if(otherUser === selectedUser){

      loadConversation(
        selectedUser
      );

    }

  }
);

    socket.emit(
  "join_chat",
  currentUser
);

// TYPING DETECTION

messageInput.addEventListener(
  "input",
  ()=>{

    if(!selectedUser) return;

    socket.emit(
      "typing",
      {
        sender: currentUser,
        receiver: selectedUser
      }
    );

  }
);

// RECEIVE TYPING

socket.on(
  "user_typing",
  (data)=>{

    if(
      data.receiver !== currentUser
    ) return;

    typingIndicator.innerText =
      `${data.sender} is typing...`;

    setTimeout(()=>{

      typingIndicator.innerText = "";

    },1500);

  }
);

// LOAD CHAT

function loadConversation(user){

  messages.innerHTML = "";

  const conversation =
    conversations[user] || [];

  // EMPTY CHAT

  if(conversation.length === 0){

    messages.innerHTML = `

      <div class="empty-chat">

        <h2>
          No messages yet
        </h2>

        <p>
          Start chatting with ${user}
        </p>

      </div>

    `;

    return;

  }

  // RENDER MESSAGES

  conversation.forEach(data=>{

    const div =
      document.createElement("div");

    div.classList.add("message");

    // OWN MESSAGE

    if(data.sender === currentUser){

      div.classList.add(
        "my-message"
      );

    } else {

      div.classList.add(
        "other-message"
      );

    }

    div.innerHTML = `

      <div>
        ${data.message}
      </div>

      <small>
        ${data.time}
      </small>

    `;

    messages.appendChild(div);

  });

  // AUTO SCROLL

  messages.scrollTop =
    messages.scrollHeight;

}