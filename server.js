const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

// STATIC FILES

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

// STORE USERS

let users = {};

// SOCKET CONNECTION

io.on(
  "connection",
  (socket)=>{

    console.log(
      "Connected:",
      socket.id
    );

    // JOIN CHAT

    socket.on(
      "join_chat",
      (username)=>{

        users[socket.id] = {

          username,

          socketId: socket.id

        };

        // SEND USERS LIST

        io.emit(
          "users_list",
          Object.values(users)
        );

        console.log(users);

      }
    );

    // PRIVATE MESSAGE

    socket.on(
      "private_message",
      (data)=>{

        // FIND RECEIVER

        const receiver =
          Object.values(users)
          .find(
            user =>
              user.username ===
              data.receiver
          );

        // SEND TO RECEIVER

        if(receiver){

          io.to(receiver.socketId)
            .emit(
              "receive_private_message",
              data
            );

        }

        // SEND BACK TO SENDER

        socket.emit(
          "receive_private_message",
          data
        );

      }
    );

    // TYPING EVENT

    socket.on(
      "typing",
      (data)=>{

        const receiver =
          Object.values(users)
          .find(
            user =>
              user.username ===
              data.receiver
          );

        if(receiver){

          io.to(receiver.socketId)
            .emit(
              "user_typing",
              data
            );

        }

      }
    );

    // DISCONNECT

    socket.on(
      "disconnect",
      ()=>{

        delete users[socket.id];

        io.emit(
          "users_list",
          Object.values(users)
        );

        console.log(
          "User disconnected"
        );

      }
    );

  }
);

// START SERVER

server.listen(
  3000,
  ()=>{

    console.log(
      "Server running on port 3000"
    );

  }
);